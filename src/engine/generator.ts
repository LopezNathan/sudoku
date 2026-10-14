import { Grid, countClues } from './grid';
import { Rng, shuffle } from './rng';
import { countSolutions, randomFullGrid } from './solver';

export interface GenerateOptions {
  /** Stop removing once this many clues remain. */
  targetClues: number;
  /** Extra acceptance test applied to each candidate puzzle (e.g. difficulty cap). */
  accept?: (puzzle: Grid) => boolean;
}

/**
 * Build a puzzle from a seeded full grid by removing clues in 180°-rotationally
 * symmetric pairs, keeping the solution unique and `accept` satisfied.
 */
export function generate(rng: Rng, opts: GenerateOptions): { puzzle: Grid; solution: Grid } {
  const solution = randomFullGrid(rng);
  const puzzle = Uint8Array.from(solution);

  const order: number[] = [];
  for (let i = 0; i <= 40; i++) order.push(i);
  shuffle(order, rng);

  for (const i of order) {
    if (countClues(puzzle) <= opts.targetClues) break;
    const j = 80 - i;
    const a = puzzle[i];
    const b = puzzle[j];
    puzzle[i] = 0;
    puzzle[j] = 0;
    if (countSolutions(puzzle, 2) === 1 && (!opts.accept || opts.accept(puzzle))) continue;
    puzzle[i] = a;
    puzzle[j] = b;
  }
  return { puzzle, solution };
}
