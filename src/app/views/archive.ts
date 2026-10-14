import { LEVELS } from '../../engine/daily';
import { addMonths, dateKey, formatMonth, monthOf, pad, parseDate } from '../dates';
import { h } from '../dom';
import { getProgress } from '../store';
import type { View } from './play';

/** First month with published puzzles. */
export const FIRST_MONTH = '2026-10';

export function archiveView(month: string): View {
  const today = dateKey();
  const thisMonth = monthOf(today);
  if (month > thisMonth) month = thisMonth;
  if (month < FIRST_MONTH) month = FIRST_MONTH;

  const first = parseDate(`${month}-01`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday-first

  const grid = h('div', { class: 'calendar' });
  for (const d of ['M', 'T', 'W', 'T', 'F', 'S', 'S']) grid.append(h('div', { class: 'dow' }, d));
  for (let i = 0; i < offset; i++) grid.append(h('div'));
  for (let d = 1; d <= days; d++) {
    const date = `${month}-${pad(d)}`;
    if (date > today) {
      grid.append(h('div', { class: 'day future' }, h('span', {}, String(d))));
      continue;
    }
    const dots = h('span', { class: 'dots' }, LEVELS.map((l) => h('i', { class: `dot ${l} ${getProgress(date, l)?.done ? 'on' : ''}` })));
    grid.append(h('a', { class: `day${date === today ? ' today' : ''}`, href: `#/day/${date}`, 'aria-label': date }, h('span', {}, String(d)), dots));
  }

  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const el = h(
    'section',
    { class: 'archive' },
    h(
      'div',
      { class: 'month-nav' },
      month > FIRST_MONTH ? h('a', { class: 'btn', href: `#/archive/${prev}`, 'aria-label': 'Previous month' }, '‹') : h('span', { class: 'btn disabled' }, '‹'),
      h('h1', {}, formatMonth(month)),
      month < thisMonth ? h('a', { class: 'btn', href: `#/archive/${next}`, 'aria-label': 'Next month' }, '›') : h('span', { class: 'btn disabled' }, '›'),
    ),
    grid,
    h('p', { class: 'legend' },
      h('span', { class: 'muted' }, 'Dots: '),
      h('i', { class: 'dot easy on' }),
      ' easy · ',
      h('i', { class: 'dot medium on' }),
      ' medium · ',
      h('i', { class: 'dot hard on' }),
      ' hard',
      h('span', { class: 'muted' }, ' Archive solves don\u2019t count toward streaks'),
    ),
  );
  return { el, destroy() {} };
}