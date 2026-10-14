import { LEVELS } from '../../engine/daily';
import { dateKey, formatTime } from '../dates';
import { h } from '../dom';
import { LEVEL_META } from '../share';
import { allProgress } from '../store';
import { computeStats } from '../stats';
import type { View } from './play';

export function statsView(): View {
  const stats = computeStats(allProgress(), dateKey());
  const time = (ms: number | null) => (ms == null ? '–' : formatTime(ms));

  const rows: [string, (k: keyof typeof stats) => string][] = [
    ['Solved', (k) => String(stats[k].solved)],
    ['Best time', (k) => time(stats[k].best)],
    ['Average time', (k) => time(stats[k].avg)],
    ['Current streak', (k) => String(stats[k].currentStreak)],
    ['Longest streak', (k) => String(stats[k].maxStreak)],
  ];

  const table = h(
    'table',
    { class: 'stats' },
    h('thead', {}, h('tr', {}, h('th', {}), ...LEVELS.map((l) => h('th', {}, `${LEVEL_META[l].emoji} ${LEVEL_META[l].name}`)))),
    h('tbody', {}, rows.map(([label, f]) => h('tr', {}, h('th', { scope: 'row' }, label), ...LEVELS.map((l) => h('td', {}, f(l)))))),
  );

  const all = stats.all;
  const el = h(
    'section',
    { class: 'stats-view' },
    h('h1', {}, 'Stats'),
    h(
      'div',
      { class: 'summary' },
      h('div', {}, h('strong', {}, String(all.currentStreak)), h('span', { class: 'muted' }, 'Day streak')),
      h('div', {}, h('strong', {}, String(all.maxStreak)), h('span', { class: 'muted' }, 'Best streak')),
      h('div', {}, h('strong', {}, String(all.solved)), h('span', { class: 'muted' }, 'Puzzles solved')),
    ),
    table,
    h('p', { class: 'muted' }, 'Times exclude puzzles solved with hints or checks. A streak day is any day you solve a puzzle on its own date.'),
  );
  return { el, destroy() {} };
}
