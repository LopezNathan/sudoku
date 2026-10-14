import type { Level } from '../engine/daily';
import { Progress } from './game';

export type ThemeSetting = 'system' | 'light' | 'dark';

interface Data {
  progress: Record<string, Progress>; // key: "YYYY-MM-DD:level"
  settings: { theme: ThemeSetting };
}

const KEY = 'sudoku:v1';

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Data>;
      return { progress: d.progress ?? {}, settings: { theme: 'system', ...d.settings } };
    }
  } catch {
    // corrupted or unavailable storage: start fresh
  }
  return { progress: {}, settings: { theme: 'system' } };
}

let data = load();

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked; in-memory state still works for this session
  }
}

const pkey = (date: string, level: Level) => `${date}:${level}`;

export function getProgress(date: string, level: Level): Progress | undefined {
  return data.progress[pkey(date, level)];
}

export function saveProgress(date: string, level: Level, p: Progress): void {
  data.progress[pkey(date, level)] = p;
  persist();
}

export function allProgress(): { date: string; level: Level; progress: Progress }[] {
  return Object.entries(data.progress).map(([k, progress]) => {
    const [date, level] = k.split(':');
    return { date, level: level as Level, progress };
  });
}

export function getTheme(): ThemeSetting {
  return data.settings.theme;
}

export function setTheme(theme: ThemeSetting): void {
  data.settings.theme = theme;
  persist();
}
