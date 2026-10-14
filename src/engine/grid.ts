export type Grid = Uint8Array;

export const ROW = (i: number) => (i / 9) | 0;
export const COL = (i: number) => i % 9;
export const BOX = (i: number) => ((ROW(i) / 3) | 0) * 3 + ((COL(i) / 3) | 0);

/** 27 units: 9 rows, 9 columns, 9 boxes, each a list of 9 cell indices. */
export const UNITS: number[][] = (() => {
  const u: number[][] = [];
  for (let r = 0; r < 9; r++) u.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const r0 = ((b / 3) | 0) * 3;
    const c0 = (b % 3) * 3;
    const cells: number[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push((r0 + r) * 9 + c0 + c);
    u.push(cells);
  }
  return u;
})();

export const ROWS = UNITS.slice(0, 9);
export const COLS = UNITS.slice(9, 18);
export const BOXES = UNITS.slice(18, 27);

/** For each cell, the 3 units (row, col, box) containing it. */
export const CELL_UNITS: number[][][] = Array.from({ length: 81 }, (_, i) => [
  ROWS[ROW(i)],
  COLS[COL(i)],
  BOXES[BOX(i)],
]);

/** For each cell, its 20 peers. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const s = new Set<number>();
  for (const unit of CELL_UNITS[i]) for (const j of unit) if (j !== i) s.add(j);
  return [...s];
});

export function parse(s: string): Grid {
  if (s.length !== 81) throw new Error(`grid must be 81 chars, got ${s.length}`);
  const g = new Uint8Array(81);
  for (let i = 0; i < 81; i++) {
    const ch = s[i];
    g[i] = ch === '.' || ch === '0' ? 0 : Number(ch);
  }
  return g;
}

export function stringify(g: Grid): string {
  let s = '';
  for (let i = 0; i < 81; i++) s += g[i] === 0 ? '.' : String(g[i]);
  return s;
}

export function countClues(g: Grid): number {
  let n = 0;
  for (let i = 0; i < 81; i++) if (g[i]) n++;
  return n;
}
