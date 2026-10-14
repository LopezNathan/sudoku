import { BOX, COL, COLS, Grid, PEERS, ROW, ROWS, UNITS, BOXES } from './grid';

export interface Grade {
  /** True if solved using only the techniques below (no guessing). */
  solved: boolean;
  /** Hardest tier needed: 1 = singles, 2 = pairs/pointing/claiming, 3 = triples/fish/XY-wing. */
  tier: number;
  score: number;
}

interface Technique {
  name: string;
  tier: number;
  weight: number;
  apply: (s: State) => boolean;
}

class State {
  cand = new Int32Array(81);
  val: Uint8Array;
  constructor(grid: Grid) {
    this.val = Uint8Array.from(grid);
    for (let i = 0; i < 81; i++) this.cand[i] = grid[i] ? 0 : 0x3fe;
    for (let i = 0; i < 81; i++) {
      if (!grid[i]) continue;
      for (const p of PEERS[i]) this.cand[p] &= ~(1 << grid[i]);
    }
  }
  place(i: number, d: number): void {
    this.val[i] = d;
    this.cand[i] = 0;
    for (const p of PEERS[i]) this.cand[p] &= ~(1 << d);
  }
  get solved(): boolean {
    return this.val.every((v) => v !== 0);
  }
  get broken(): boolean {
    for (let i = 0; i < 81; i++) if (!this.val[i] && !this.cand[i]) return true;
    return false;
  }
}

const popcount = (x: number): number => {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
};

function* combos<T>(arr: T[], k: number, start = 0, cur: T[] = []): Generator<T[]> {
  if (cur.length === k) {
    yield cur.slice();
    return;
  }
  for (let i = start; i < arr.length; i++) {
    cur.push(arr[i]);
    yield* combos(arr, k, i + 1, cur);
    cur.pop();
  }
}

const nakedSingle = (s: State): boolean => {
  for (let i = 0; i < 81; i++) {
    const c = s.cand[i];
    if (c && (c & (c - 1)) === 0) {
      s.place(i, Math.log2(c));
      return true;
    }
  }
  return false;
};

const hiddenSingle = (s: State): boolean => {
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      let only = -1;
      let n = 0;
      for (const i of unit) {
        if (s.cand[i] & (1 << d)) {
          only = i;
          n++;
        }
      }
      if (n === 1) {
        s.place(only, d);
        return true;
      }
    }
  }
  return false;
};

const nakedSubset = (k: number) => (s: State): boolean => {
  for (const unit of UNITS) {
    const cells = unit.filter((i) => {
      const n = popcount(s.cand[i]);
      return n >= 2 && n <= k;
    });
    for (const combo of combos(cells, k)) {
      let union = 0;
      for (const i of combo) union |= s.cand[i];
      if (popcount(union) !== k) continue;
      let changed = false;
      for (const i of unit) {
        if (combo.includes(i) || !(s.cand[i] & union)) continue;
        s.cand[i] &= ~union;
        changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
};

const hiddenSubset = (k: number) => (s: State): boolean => {
  for (const unit of UNITS) {
    const where: number[] = Array(10).fill(0); // digit -> bitmask over unit positions
    for (let d = 1; d <= 9; d++) {
      unit.forEach((i, p) => {
        if (s.cand[i] & (1 << d)) where[d] |= 1 << p;
      });
    }
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      const n = popcount(where[d]);
      if (n >= 2 && n <= k) digits.push(d);
    }
    for (const combo of combos(digits, k)) {
      let pos = 0;
      for (const d of combo) pos |= where[d];
      if (popcount(pos) !== k) continue;
      const keep = combo.reduce((m, d) => m | (1 << d), 0);
      let changed = false;
      unit.forEach((i, p) => {
        if (!(pos & (1 << p))) return;
        const next = s.cand[i] & keep;
        if (next !== s.cand[i]) {
          s.cand[i] = next;
          changed = true;
        }
      });
      if (changed) return true;
    }
  }
  return false;
};

const pointing = (s: State): boolean => {
  for (const box of BOXES) {
    for (let d = 1; d <= 9; d++) {
      const cells = box.filter((i) => s.cand[i] & (1 << d));
      if (cells.length < 2) continue;
      const sameRow = cells.every((i) => ROW(i) === ROW(cells[0]));
      const sameCol = cells.every((i) => COL(i) === COL(cells[0]));
      const line = sameRow ? ROWS[ROW(cells[0])] : sameCol ? COLS[COL(cells[0])] : null;
      if (!line) continue;
      let changed = false;
      for (const i of line) {
        if (BOX(i) === BOX(cells[0]) || !(s.cand[i] & (1 << d))) continue;
        s.cand[i] &= ~(1 << d);
        changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
};

const claiming = (s: State): boolean => {
  for (const line of [...ROWS, ...COLS]) {
    for (let d = 1; d <= 9; d++) {
      const cells = line.filter((i) => s.cand[i] & (1 << d));
      if (cells.length < 2) continue;
      const b = BOX(cells[0]);
      if (!cells.every((i) => BOX(i) === b)) continue;
      let changed = false;
      for (const i of BOXES[b]) {
        if (line.includes(i) || !(s.cand[i] & (1 << d))) continue;
        s.cand[i] &= ~(1 << d);
        changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
};

/** X-wing (k=2) and Swordfish (k=3), row- and column-based. */
const fish = (k: number) => (s: State): boolean => {
  for (const byRow of [true, false]) {
    const lines = byRow ? ROWS : COLS;
    const cross = byRow ? COL : ROW;
    const crossLines = byRow ? COLS : ROWS;
    for (let d = 1; d <= 9; d++) {
      const base: number[] = []; // line indices with 2..k positions for d
      const posMask: number[] = [];
      lines.forEach((line, li) => {
        let m = 0;
        for (const i of line) if (s.cand[i] & (1 << d)) m |= 1 << cross(i);
        const n = popcount(m);
        if (n >= 2 && n <= k) {
          base.push(li);
          posMask.push(m);
        }
      });
      for (const combo of combos(base.map((_, idx) => idx), k)) {
        let union = 0;
        for (const idx of combo) union |= posMask[idx];
        if (popcount(union) !== k) continue;
        const used = combo.map((idx) => base[idx]);
        let changed = false;
        for (let c = 0; c < 9; c++) {
          if (!(union & (1 << c))) continue;
          for (const i of crossLines[c]) {
            const li = byRow ? ROW(i) : COL(i);
            if (used.includes(li) || !(s.cand[i] & (1 << d))) continue;
            s.cand[i] &= ~(1 << d);
            changed = true;
          }
        }
        if (changed) return true;
      }
    }
  }
  return false;
};

const xyWing = (s: State): boolean => {
  for (let p = 0; p < 81; p++) {
    const pc = s.cand[p];
    if (popcount(pc) !== 2) continue;
    const bi = PEERS[p].filter((i) => popcount(s.cand[i]) === 2);
    for (const [w1, w2] of combos(bi, 2)) {
      const c1 = s.cand[w1];
      const c2 = s.cand[w2];
      if (c1 === pc || c2 === pc || c1 === c2) continue;
      // Each wing shares exactly one digit with pivot; the other digit is common to both wings.
      if (popcount(c1 & pc) !== 1 || popcount(c2 & pc) !== 1) continue;
      if ((c1 & pc) === (c2 & pc)) continue;
      const z = c1 & c2;
      if (popcount(z) !== 1 || z & pc) continue;
      let changed = false;
      for (const i of PEERS[w1]) {
        if (i === p || i === w2 || !(s.cand[i] & z) || !PEERS[w2].includes(i)) continue;
        s.cand[i] &= ~z;
        changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
};

const TECHNIQUES: Technique[] = [
  { name: 'naked single', tier: 1, weight: 1, apply: nakedSingle },
  { name: 'hidden single', tier: 1, weight: 2, apply: hiddenSingle },
  { name: 'pointing', tier: 2, weight: 8, apply: pointing },
  { name: 'claiming', tier: 2, weight: 8, apply: claiming },
  { name: 'naked pair', tier: 2, weight: 10, apply: nakedSubset(2) },
  { name: 'hidden pair', tier: 2, weight: 12, apply: hiddenSubset(2) },
  { name: 'naked triple', tier: 3, weight: 25, apply: nakedSubset(3) },
  { name: 'hidden triple', tier: 3, weight: 28, apply: hiddenSubset(3) },
  { name: 'x-wing', tier: 3, weight: 30, apply: fish(2) },
  { name: 'xy-wing', tier: 3, weight: 35, apply: xyWing },
  { name: 'swordfish', tier: 3, weight: 45, apply: fish(3) },
];

/** Solve with human techniques only, always preferring the simplest available. */
export function grade(grid: Grid): Grade {
  const s = new State(grid);
  let tier = 1;
  let score = 0;
  while (!s.solved) {
    let progressed = false;
    for (const t of TECHNIQUES) {
      if (t.apply(s)) {
        tier = Math.max(tier, t.tier);
        score += t.weight;
        progressed = true;
        break;
      }
    }
    if (!progressed || s.broken) return { solved: false, tier, score };
  }
  return { solved: true, tier, score };
}
