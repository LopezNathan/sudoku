import type { DailyPuzzle, Level } from '../engine/daily';
import { monthOf } from './dates';

export type DayPuzzles = Record<Level, DailyPuzzle>;
type Month = Record<string, DayPuzzles>;

const cache = new Map<string, Promise<Month | null>>();

/** Fetch (and memoize) a month file; null if it doesn't exist. */
export function loadMonth(month: string): Promise<Month | null> {
  let p = cache.get(month);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}puzzles/${month}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Month>) : null))
      .catch(() => null)
      .then((m) => {
        if (!m) cache.delete(month); // allow a retry (e.g. after coming back online)
        return m;
      });
    cache.set(month, p);
  }
  return p;
}

export async function getDay(date: string): Promise<DayPuzzles | null> {
  const m = await loadMonth(monthOf(date));
  return m?.[date] ?? null;
}
