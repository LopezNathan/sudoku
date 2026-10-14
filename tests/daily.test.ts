import { describe, expect, it } from 'vitest';
import { makeDaily } from '../src/engine/daily';

describe('makeDaily', () => {
  it('is deterministic', () => {
    expect(makeDaily('2026-10-13', 'hard')).toEqual(makeDaily('2026-10-13', 'hard'));
  });

  it('differs by date and level', () => {
    expect(makeDaily('2026-10-13', 'easy').p).not.toBe(makeDaily('2026-10-14', 'easy').p);
    expect(makeDaily('2026-10-13', 'easy').p).not.toBe(makeDaily('2026-10-13', 'medium').p);
  });

  it('is frozen: known seed produces a known puzzle', () => {
    // Guards the v1 seed contract; changing the generator requires bumping the seed version.
    expect(makeDaily('2026-10-13', 'easy').p).toMatchSnapshot();
  });
});
