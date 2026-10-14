import { LEVELS, Level } from '../engine/daily';
import { addDays } from './dates';
import { isAssisted, Progress } from './game';

export interface Entry {
  date: string;
  level: Level;
  progress: Progress;
}

export interface LevelStats {
  solved: number;
  best: number | null; // ms, unassisted only
  avg: number | null; // ms, unassisted only
  currentStreak: number;
  maxStreak: number;
}

/** Days on which a puzzle was solved on its own date (archive solves don't count). */
function streakDays(entries: Entry[]): Set<string> {
  return new Set(entries.filter((e) => e.progress.done && e.progress.completedOn === e.date).map((e) => e.date));
}

export function streaks(days: Set<string>, today: string): { current: number; max: number } {
  let current = 0;
  // a streak is still alive if today isn't solved yet but yesterday was
  let d = days.has(today) ? today : addDays(today, -1);
  while (days.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  let max = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // not the start of a run
    let n = 0;
    for (let x = day; days.has(x); x = addDays(x, 1)) n++;
    max = Math.max(max, n);
  }
  return { current, max };
}

export function computeStats(entries: Entry[], today: string): Record<Level | 'all', LevelStats> {
  const build = (subset: Entry[]): LevelStats => {
    const done = subset.filter((e) => e.progress.done);
    const clean = done.filter((e) => !isAssisted(e.progress)).map((e) => e.progress.elapsed);
    const { current, max } = streaks(streakDays(subset), today);
    return {
      solved: done.length,
      best: clean.length ? Math.min(...clean) : null,
      avg: clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null,
      currentStreak: current,
      maxStreak: max,
    };
  };
  const out = { all: build(entries) } as Record<Level | 'all', LevelStats>;
  for (const l of LEVELS) out[l] = build(entries.filter((e) => e.level === l));
  return out;
}
