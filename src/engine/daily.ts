import { countClues, stringify } from './grid';
import { generate } from './generator';
import { grade } from './grader';
import { makeRng } from './rng';

export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export interface DailyPuzzle {
  /** Puzzle, 81 chars, '.' for blanks. */
  p: string;
  /** Solution, 81 chars. */
  s: string;
  /** Grader score (higher = harder). */
  score: number;
}

const SEED_VERSION = 'v1';

interface LevelSpec {
  tier: number;
  targetClues: number;
  minClues: number;
  maxClues: number;
}

export const SPECS: Record<Level, LevelSpec> = {
  easy: { tier: 1, targetClues: 36, minClues: 34, maxClues: 40 },
  medium: { tier: 2, targetClues: 30, minClues: 28, maxClues: 35 },
  hard: { tier: 3, targetClues: 24, minClues: 22, maxClues: 30 },
};

/** Deterministic puzzle for a date ("YYYY-MM-DD") and level. */
export function makeDaily(date: string, level: Level): DailyPuzzle {
  const spec = SPECS[level];
  for (let n = 0; ; n++) {
    const seed = `${SEED_VERSION}:${date}:${level}${n ? `:${n}` : ''}`;
    const rng = makeRng(seed);
    const { puzzle, solution } = generate(rng, {
      targetClues: spec.targetClues,
      accept: (g) => {
        const r = grade(g);
        return r.solved && r.tier <= spec.tier;
      },
    });
    const clues = countClues(puzzle);
    const g = grade(puzzle);
    if (g.solved && g.tier === spec.tier && clues >= spec.minClues && clues <= spec.maxClues) {
      return { p: stringify(puzzle), s: stringify(solution), score: g.score };
    }
    if (n > 500) throw new Error(`could not generate ${level} for ${date}`);
  }
}
