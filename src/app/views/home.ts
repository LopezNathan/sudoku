import { LEVELS } from '../../engine/daily';
import { dateKey, formatLong, formatTime } from '../dates';
import { h } from '../dom';
import { getDay } from '../puzzles';
import { LEVEL_META } from '../share';
import { getProgress, allProgress } from '../store';
import { computeStats } from '../stats';
import type { View } from './play';

/** Cards for the three puzzles of `date` (used for today and for archive days). */
export function dayView(date: string): View {
  const today = dateKey();
  const isToday = date === today;
  const el = h('section', { class: 'home' });

  const cards = h('div', { class: 'cards' });
  el.append(h('h1', {}, isToday ? 'Today' : formatLong(date)));
  if (isToday) el.append(h('p', { class: 'muted' }, formatLong(date)));
  el.append(cards);

  if (isToday) {
    const s = computeStats(allProgress(), today).all;
    if (s.currentStreak > 0) el.prepend(h('div', { class: 'streak' }, `🔥 ${s.currentStreak}-day streak`));
  }

  cards.append(h('p', { class: 'muted' }, 'Loading…'));
  getDay(date).then((day) => {
    cards.replaceChildren();
    if (!day) {
      cards.append(
        h('div', { class: 'empty' }, h('h2', {}, 'Come back soon'), h('p', { class: 'muted' }, "Today's puzzles aren't available yet — or you may be offline.")),
      );
      return;
    }
    for (const level of LEVELS) {
      const { emoji, name } = LEVEL_META[level];
      const p = getProgress(date, level);
      const started = !!p && (p.elapsed > 0 || p.values.some(Boolean));
      const status = p?.done
        ? h('span', { class: 'status done' }, `✓ ${formatTime(p.elapsed)}${p.hintsUsed || p.checked ? ' 💡' : ''}`)
        : started
          ? h('span', { class: 'status progress' }, `In progress · ${formatTime(p!.elapsed)}`)
          : h('span', { class: 'status' }, 'Not started');
      cards.append(
        h('a', { class: `card ${level}`, href: `#/play/${date}/${level}` }, h('span', { class: 'card-emoji' }, emoji), h('span', { class: 'card-name' }, name), status),
      );
    }
  });

  return { el, destroy() {} };
}
