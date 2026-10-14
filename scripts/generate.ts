/**
 * Generate frozen monthly puzzle files into public/puzzles/YYYY-MM.json.
 * Usage: npm run gen -- --from 2026-10 --months 3
 * Existing month files are never overwritten.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DailyPuzzle, LEVELS, Level, makeDaily } from '../src/engine/daily';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'puzzles');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const now = new Date();
const from = arg('from') ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const months = Number(arg('months') ?? 3);
if (!/^\d{4}-\d{2}$/.test(from) || !Number.isInteger(months) || months < 1) {
  console.error('usage: gen --from YYYY-MM --months N');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
let [year, month] = from.split('-').map(Number);

for (let m = 0; m < months; m++, month++) {
  if (month > 12) {
    month = 1;
    year++;
  }
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const file = join(outDir, `${key}.json`);
  if (existsSync(file)) {
    console.log(`${key}: exists, skipping`);
    continue;
  }
  const start = Date.now();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const out: Record<string, Record<Level, DailyPuzzle>> = {};
  for (let d = 1; d <= days; d++) {
    const date = `${key}-${String(d).padStart(2, '0')}`;
    out[date] = Object.fromEntries(LEVELS.map((l) => [l, makeDaily(date, l)])) as Record<Level, DailyPuzzle>;
  }
  writeFileSync(file, JSON.stringify(out) + '\n');
  console.log(`${key}: ${days} days in ${Date.now() - start}ms`);
}
