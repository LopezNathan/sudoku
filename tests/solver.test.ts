import { describe, expect, it } from 'vitest';
import { parse, stringify } from '../src/engine/grid';
import { countSolutions, solve } from '../src/engine/solver';
import { makeRng } from '../src/engine/rng';
import { randomFullGrid } from '../src/engine/solver';

const PUZZLE = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

describe('solver', () => {
  it('solves a known puzzle', () => {
    expect(stringify(solve(parse(PUZZLE))!)).toBe(SOLUTION);
    expect(countSolutions(parse(PUZZLE))).toBe(1);
  });

  it('detects multiple solutions', () => {
    expect(countSolutions(new Uint8Array(81), 2)).toBe(2);
  });

  it('detects no solution', () => {
    const bad = parse(PUZZLE);
    bad[2] = 5; // duplicate 5 in row 0
    expect(countSolutions(bad)).toBe(0);
  });

  it('random full grids are valid and deterministic per seed', () => {
    const a = randomFullGrid(makeRng('abc'));
    const b = randomFullGrid(makeRng('abc'));
    const c = randomFullGrid(makeRng('abd'));
    expect(stringify(a)).toBe(stringify(b));
    expect(stringify(a)).not.toBe(stringify(c));
    expect(countSolutions(a)).toBe(1);
  });
});
