import '../styles/main.css';
import { LEVELS, Level } from '../engine/daily';
import { dateKey, addMonths, monthOf } from './dates';
import { h } from './dom';
import { getDay, loadMonth } from './puzzles';
import { getTheme } from './store';
import { applyTheme, cycleTheme, themeLabel } from './theme';
import { archiveView } from './views/archive';
import { dayView } from './views/home';
import { playView, View } from './views/play';
import { statsView } from './views/stats';

applyTheme();

const main = h('main', { id: 'app' });
const themeBtn = h('button', { class: 'theme-btn', onClick: () => (themeBtn.textContent = themeLabel(cycleTheme())) }, themeLabel(getTheme()));
const nav = h(
  'nav',
  {},
  h('a', { href: '#/', 'data-route': 'home' }, 'Today'),
  h('a', { href: '#/archive', 'data-route': 'archive' }, 'Archive'),
  h('a', { href: '#/stats', 'data-route': 'stats' }, 'Stats'),
);
document.getElementById('root')!.append(h('header', { class: 'topbar' }, h('a', { class: 'brand', href: '#/' }, 'Sudoku'), nav, themeBtn), main);

let current: View | null = null;
let navToken = 0;

function mount(view: View, route: string): void {
  current?.destroy();
  current = view;
  main.replaceChildren(view.el);
  for (const a of nav.querySelectorAll('a')) a.classList.toggle('active', a.dataset.route === route);
  window.scrollTo(0, 0);
}

function notFound(text: string): View {
  return { el: h('section', { class: 'empty' }, h('h2', {}, text), h('a', { class: 'btn', href: '#/' }, 'Home')), destroy() {} };
}

async function route(): Promise<void> {
  const token = ++navToken;
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [name, a, b] = parts;

  if (name === 'play' && /^\d{4}-\d{2}-\d{2}$/.test(a ?? '') && LEVELS.includes(b as Level)) {
    const day = await getDay(a);
    if (token !== navToken) return;
    if (!day || a > dateKey()) return mount(notFound('That puzzle isn’t available'), '');
    return mount(playView(a, b as Level, day[b as Level]), '');
  }
  if (name === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(a ?? '')) return mount(dayView(a), 'archive');
  if (name === 'archive') return mount(archiveView(/^\d{4}-\d{2}$/.test(a ?? '') ? a : monthOf(dateKey())), 'archive');
  if (name === 'stats') return mount(statsView(), 'stats');
  return mount(dayView(dateKey()), 'home');
}

window.addEventListener('hashchange', route);
route();

// Warm the cache for the current and next month so they work offline.
const thisMonth = monthOf(dateKey());
void loadMonth(thisMonth);
void loadMonth(addMonths(thisMonth, 1));
