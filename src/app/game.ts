import { CELL_UNITS, PEERS, parse } from '../engine/grid';
import type { DailyPuzzle } from '../engine/daily';

export interface Progress {
  values: number[]; // 81 user entries (0 = empty); givens are not stored here
  notes: number[]; // 81 bitmasks (bit d = digit d)
  elapsed: number; // ms
  hintsUsed: number;
  checked: boolean;
  done: boolean;
  /** Local date (YYYY-MM-DD) on which the puzzle was completed. */
  completedOn?: string;
}

export const emptyProgress = (): Progress => ({
  values: Array(81).fill(0),
  notes: Array(81).fill(0),
  elapsed: 0,
  hintsUsed: 0,
  checked: false,
  done: false,
});

export const isAssisted = (p: Progress): boolean => p.hintsUsed > 0 || p.checked;

interface Snapshot {
  values: number[];
  notes: number[];
}

/** Pure game logic for one puzzle; no DOM. Call `onChange` hooks after every mutation. */
export class Game {
  readonly givens: Uint8Array;
  readonly solution: Uint8Array;
  values: Uint8Array; // givens + user entries
  notes: Uint16Array;
  selected = -1;
  notesMode = false;
  wrong = new Set<number>(); // cells flagged by the last "check"
  hintsUsed: number;
  checked: boolean;
  done: boolean;
  completedOn?: string;
  elapsed: number;
  private undoStack: Snapshot[] = [];

  constructor(puzzle: DailyPuzzle, saved?: Progress) {
    this.givens = parse(puzzle.p);
    this.solution = parse(puzzle.s);
    this.values = Uint8Array.from(this.givens);
    this.notes = new Uint16Array(81);
    this.hintsUsed = saved?.hintsUsed ?? 0;
    this.checked = saved?.checked ?? false;
    this.done = saved?.done ?? false;
    this.completedOn = saved?.completedOn;
    this.elapsed = saved?.elapsed ?? 0;
    if (saved) {
      for (let i = 0; i < 81; i++) {
        if (!this.givens[i]) this.values[i] = saved.values[i];
        this.notes[i] = saved.notes[i];
      }
    }
  }

  isGiven(i: number): boolean {
    return this.givens[i] !== 0;
  }

  toProgress(): Progress {
    return {
      values: this.values.map((v, i) => (this.givens[i] ? 0 : v)) as unknown as number[],
      notes: Array.from(this.notes),
      elapsed: this.elapsed,
      hintsUsed: this.hintsUsed,
      checked: this.checked,
      done: this.done,
      completedOn: this.completedOn,
    };
  }

  private snapshot(): void {
    this.undoStack.push({ values: Array.from(this.values), notes: Array.from(this.notes) });
    if (this.undoStack.length > 500) this.undoStack.shift();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0 && !this.done;
  }

  undo(): void {
    const s = this.undoStack.pop();
    if (!s || this.done) return;
    this.values = Uint8Array.from(s.values);
    this.notes = Uint16Array.from(s.notes);
    this.wrong.clear();
  }

  select(i: number): void {
    this.selected = i;
  }

  move(dr: number, dc: number): void {
    const cur = this.selected < 0 ? 40 : this.selected;
    const r = Math.min(8, Math.max(0, ((cur / 9) | 0) + dr));
    const c = Math.min(8, Math.max(0, (cur % 9) + dc));
    this.selected = r * 9 + c;
  }

  /** Enter digit `d` in the selected cell (or toggle a note in notes mode). */
  input(d: number): void {
    const i = this.selected;
    if (i < 0 || this.done || this.isGiven(i)) return;
    this.wrong.clear();
    if (this.notesMode) {
      if (this.values[i]) return;
      this.snapshot();
      this.notes[i] ^= 1 << d;
      return;
    }
    if (this.values[i] === d) return;
    this.snapshot();
    this.values[i] = d;
    this.notes[i] = 0;
    for (const p of PEERS[i]) this.notes[p] &= ~(1 << d);
    this.checkComplete();
  }

  erase(): void {
    const i = this.selected;
    if (i < 0 || this.done || this.isGiven(i)) return;
    if (!this.values[i] && !this.notes[i]) return;
    this.snapshot();
    this.values[i] = 0;
    this.notes[i] = 0;
    this.wrong.clear();
  }

  private checkComplete(): void {
    for (let i = 0; i < 81; i++) if (this.values[i] !== this.solution[i]) return;
    this.done = true;
  }

  /** Cells whose value matches a peer's value. */
  conflicts(): Set<number> {
    const out = new Set<number>();
    for (let i = 0; i < 81; i++) {
      const v = this.values[i];
      if (!v) continue;
      for (const p of PEERS[i]) {
        if (this.values[p] === v) {
          out.add(i);
          break;
        }
      }
    }
    return out;
  }

  /** Flag wrong cells (compared with the solution). Marks the result as assisted. */
  check(): number {
    if (this.done) return 0;
    this.checked = true;
    this.wrong = new Set();
    for (let i = 0; i < 81; i++) {
      if (this.values[i] && this.values[i] !== this.solution[i]) this.wrong.add(i);
    }
    return this.wrong.size;
  }

  /**
   * Reveal one cell, preferring one that is currently a single (naked or hidden) given
   * the correct entries so far. Wrong entries are overwritten if they're the target.
   */
  hint(): number {
    if (this.done) return -1;
    const known = new Uint8Array(81);
    for (let i = 0; i < 81; i++) known[i] = this.values[i] === this.solution[i] ? this.values[i] : 0;

    const empty: number[] = [];
    for (let i = 0; i < 81; i++) if (!known[i]) empty.push(i);
    if (!empty.length) return -1;

    const candidates = (i: number): number => {
      let m = 0x3fe;
      for (const p of PEERS[i]) if (known[p]) m &= ~(1 << known[p]);
      return m;
    };
    const single = (i: number): boolean => {
      const c = candidates(i);
      if ((c & (c - 1)) === 0) return true;
      // hidden single in any of its units: only cell in unit that can hold the solution digit
      const d = this.solution[i];
      for (const unit of CELL_UNITS[i]) {
        if (unit.every((p) => p === i || known[p] || !(candidates(p) & (1 << d)))) return true;
      }
      return false;
    };

    const target =
      this.selected >= 0 && empty.includes(this.selected)
        ? this.selected
        : (empty.find(single) ?? empty[0]);
    this.snapshot();
    this.values[target] = this.solution[target];
    this.notes[target] = 0;
    for (const p of PEERS[target]) this.notes[p] &= ~(1 << this.solution[target]);
    this.hintsUsed++;
    this.selected = target;
    this.wrong.clear();
    this.checkComplete();
    return target;
  }

  /** Digits' placed counts, for the number pad. */
  remaining(): number[] {
    const r = Array(10).fill(9);
    r[0] = 0;
    for (let i = 0; i < 81; i++) if (this.values[i]) r[this.values[i]]--;
    return r;
  }
}
