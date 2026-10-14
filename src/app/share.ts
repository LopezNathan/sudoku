import { LEVELS, Level } from '../engine/daily';
import { formatShort, formatTime } from './dates';
import { getProgress } from './store';
import { isAssisted } from './game';

export const LEVEL_META: Record<Level, { emoji: string; name: string }> = {
  easy: { emoji: '🟢', name: 'Easy' },
  medium: { emoji: '🟡', name: 'Medium' },
  hard: { emoji: '🔴', name: 'Hard' },
};

/** "Sudoku Oct 13 🟢 Easy 3:12 ✅ 🟡 Medium 7:45 ✅ 🔴 Hard 18:02 💡1" */
export function shareText(date: string): string {
  const parts = LEVELS.flatMap((level) => {
    const p = getProgress(date, level);
    if (!p?.done) return [];
    const { emoji, name } = LEVEL_META[level];
    const mark = isAssisted(p) ? `💡${p.hintsUsed || ''}` : '✅';
    return [`${emoji} ${name} ${formatTime(p.elapsed)} ${mark}`];
  });
  return [`Sudoku ${formatShort(date)}`, ...parts].join(' ');
}

/** Share via the native sheet when available, else copy. Returns a user-facing status. */
export async function share(text: string): Promise<string> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'Shared!';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return '';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'Copied to clipboard!';
  } catch {
    return 'Could not share';
  }
}
