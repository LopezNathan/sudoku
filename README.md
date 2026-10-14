# Daily Sudoku

A new Sudoku every day — **Easy, Medium and Hard** — as an installable, offline-capable PWA. Hosted free on GitHub Pages; all progress is stored locally in your browser (no backend, no accounts).

## Features

- Three puzzles per day, plus an archive calendar of past days
- Notes, undo, hints, and error check (hints/checks mark a solve as *assisted*)
- Streaks, best/average times, per-level stats
- Share results (`Sudoku Oct 13 🟢 Easy 3:12 ✅ 🟡 Medium 7:45 ✅ 🔴 Hard 18:02 💡1`)
- Light/dark/auto theme, keyboard play (1–9, arrows, Backspace, `N` notes, `U` undo)
- Installable and works offline for already-loaded months

## Development

```sh
npm install
npm run dev       # dev server at http://localhost:5173/sudoku/
npm test          # vitest
npm run build     # typecheck + production build into dist/
npm run preview   # serve the production build
```

Requires Node 20+ (CI uses 24).

## How puzzles work

The generator in `src/engine/` is deterministic and seeded (`v1:YYYY-MM-DD:level`):

| Module | Role |
| --- | --- |
| `rng.ts` | cyrb53 string hash → mulberry32 PRNG |
| `solver.ts` | bitmask backtracking solver; counts solutions to guarantee uniqueness |
| `generator.ts` | seeded full grid, then symmetric clue removal keeping a unique solution |
| `grader.ts` | human-technique solver (singles, pairs, pointing/claiming, triples, X-wing, XY-wing, Swordfish) |
| `daily.ts` | retries seeds until the grade matches the level (Easy = singles only, Medium = needs pairs/pointing, Hard = needs triples/fish/XY-wing) |

Every puzzle is solvable by logic alone — no guessing.

Puzzles are **frozen** into `public/puzzles/YYYY-MM.json` and committed, so later generator changes never alter published puzzles. To add months:

```sh
npm run gen -- --from 2027-01 --months 3   # existing month files are never overwritten
```

If you change generation logic, bump `SEED_VERSION` in `src/engine/daily.ts`.

## Deployment

- `.github/workflows/deploy.yml` — on push to `main`: install, test, build, deploy to GitHub Pages.
- `.github/workflows/puzzles.yml` — monthly (and manual): keeps the current month plus two ahead generated and commits any new files.

One-time setup: **Settings → Pages → Source: GitHub Actions**. The site is served from `/sudoku/` (`base` in `vite.config.ts`; change it if you rename the repo).

## Project layout

```
src/engine/   pure TS puzzle engine (shared by browser and Node)
src/app/      game logic, storage, router, views
src/styles/   theme and layout CSS
scripts/      generate.ts — puzzle file generator
public/       puzzle JSON and PWA icons
tests/        vitest (engine, game, stats, UI smoke tests)
```
