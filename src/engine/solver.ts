import { Grid, PEERS } from './grid';
import type { Rng } from './rng';
import { shuffle } from './rng';

const ALL = 0x3fe; // bits 1..9

function popcount(x: number): number {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

/**
 * Bitmask backtracking search. Picks the cell with fewest candidates (MRV).
 * Stops once `limit` solutions are found. If `rng` is given, candidate order is
 * randomized (used to build random full grids). Returns the first solution found.
 */
function search(
  grid: Grid,
  limit: number,
  rng?: Rng,
): { count: number; solution: Grid | null } {
  const g = Uint8Array.from(grid);
  const rowMask = new Int32Array(9);
  const colMask = new Int32Array(9);
  const boxMask = new Int32Array(9);
  const boxOf = (i: number) => (((i / 27) | 0) * 3) + (((i % 9) / 3) | 0);

  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (!v) continue;
    const bit = 1 << v;
    const r = (i / 9) | 0;
    const c = i % 9;
    const b = boxOf(i);
    if ((rowMask[r] | colMask[c] | boxMask[b]) & bit) return { count: 0, solution: null };
    rowMask[r] |= bit;
    colMask[c] |= bit;
    boxMask[b] |= bit;
  }

  let count = 0;
  let solution: Grid | null = null;

  const recurse = (): void => {
    let best = -1;
    let bestCands = 0;
    let bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const cands = ALL & ~(rowMask[(i / 9) | 0] | colMask[i % 9] | boxMask[boxOf(i)]);
      const n = popcount(cands);
      if (n < bestN) {
        best = i;
        bestN = n;
        bestCands = cands;
        if (n <= 1) break;
      }
    }
    if (best === -1) {
      count++;
      if (!solution) solution = Uint8Array.from(g);
      return;
    }
    if (bestN === 0) return;
    const r = (best / 9) | 0;
    const c = best % 9;
    const b = boxOf(best);
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) if (bestCands & (1 << d)) digits.push(d);
    if (rng) shuffle(digits, rng);
    for (const d of digits) {
      const bit = 1 << d;
      g[best] = d;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
      recurse();
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;
      g[best] = 0;
      if (count >= limit) return;
    }
  };

  recurse();
  return { count, solution };
}

export function countSolutions(grid: Grid, limit = 2): number {
  return search(grid, limit).count;
}

export function solve(grid: Grid): Grid | null {
  return search(grid, 1).solution;
}

/** A random complete valid grid, deterministic for a given rng. */
export function randomFullGrid(rng: Rng): Grid {
  const sol = search(new Uint8Array(81), 1, rng).solution;
  if (!sol) throw new Error('failed to build full grid');
  return sol;
}

/** True if no filled cell conflicts with a peer. */
export function isConsistent(g: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    if (!g[i]) continue;
    for (const p of PEERS[i]) if (g[p] === g[i]) return false;
  }
  return true;
}
