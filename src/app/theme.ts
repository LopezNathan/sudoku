import { ThemeSetting, getTheme, setTheme } from './store';

const ORDER: ThemeSetting[] = ['system', 'light', 'dark'];

export function applyTheme(t: ThemeSetting = getTheme()): void {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
}

export function cycleTheme(): ThemeSetting {
  const next = ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length];
  setTheme(next);
  applyTheme(next);
  return next;
}

export const themeLabel = (t: ThemeSetting): string =>
  ({ system: '🌓 Auto', light: '☀️ Light', dark: '🌙 Dark' })[t];
