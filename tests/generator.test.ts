import { describe, expect, it } from 'vitest';
import { parse, countClues } from '../src/engine/grid';
import { countSolutions, solve } from '../src/engine/solver';
import { grade } from '../src/engine/grader';
import { LEVELS, SPECS, makeDaily } from '../src/engine/daily';

describe('generated puzzles', () => {
  for (const level of LEVELS) {
    it(`${level}: unique solution, matching tier, clue range`, () => {
      for (let d = 1; d <= 5; d++) {
        const date = `2026-11-0${d}`;
        const { p, s } = makeDaily(date, level);
        const g = parse(p);
        expect(countSolutions(g, 2)).toBe(1);
        expect(solve(g)!.join('')).toBe(parse(s).join(''));
        const r = grade(g);
        expect(r.solved).toBe(true);
        expect(r.tier).toBe(SPECS[level].tier);
        const clues = countClues(g);
        expect(clues).toBeGreaterThanOrEqual(SPECS[level].minClues);
        expect(clues).toBeLessThanOrEqual(SPECS[level].maxClues);
      }
    });
  }
});
