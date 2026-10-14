import { describe, expect, it } from 'vitest';
import { parse } from '../src/engine/grid';
import { makeDaily } from '../src/engine/daily';
import { grade } from '../src/engine/grader';

describe('grader', () => {
  it('grades an easy puzzle as singles-only', () => {
    const r = grade(parse('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'));
    expect(r).toMatchObject({ solved: true, tier: 1 });
  });

  it('scores harder puzzles higher', () => {
    const easy = grade(parse(makeDaily('2026-10-13', 'easy').p));
    const hard = grade(parse(makeDaily('2026-10-13', 'hard').p));
    expect(hard.tier).toBe(3);
    expect(hard.score).toBeGreaterThan(easy.score);
  });

  it('reports unsolvable-by-technique puzzles as not solved', () => {
    expect(grade(new Uint8Array(81)).solved).toBe(false);
  });
});
