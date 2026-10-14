import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../src/app/game';
import { computeStats, streaks } from '../src/app/stats';

describe('streaks', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const days = new Set(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(streaks(days, '2026-10-13')).toEqual({ current: 3, max: 3 });
    expect(streaks(days, '2026-10-15')).toEqual({ current: 0, max: 3 });
  });
});

describe('computeStats', () => {
  const done = (date: string, completedOn: string, elapsed: number, hints = 0) => ({
    date,
    level: 'easy' as const,
    progress: { ...emptyProgress(), done: true, completedOn, elapsed, hintsUsed: hints },
  });

  it('excludes assisted solves from times and archive solves from streaks', () => {
    const s = computeStats(
      [done('2026-10-12', '2026-10-12', 60000), done('2026-10-13', '2026-10-13', 30000, 1), done('2026-10-01', '2026-10-13', 90000)],
      '2026-10-13',
    );
    expect(s.easy.solved).toBe(3);
    expect(s.easy.best).toBe(60000);
    expect(s.easy.avg).toBe(75000);
    expect(s.easy.currentStreak).toBe(2);
    expect(s.hard.solved).toBe(0);
  });
});
