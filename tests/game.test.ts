import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/game';
import { makeDaily } from '../src/engine/daily';

const puzzle = makeDaily('2026-10-13', 'easy');

const blank = (g: Game) => [...g.values].findIndex((v, i) => !v && !g.isGiven(i));

describe('Game', () => {
  it('places digits, clears peer notes, and undoes', () => {
    const g = new Game(puzzle);
    const i = blank(g);
    g.select(i);
    g.notesMode = true;
    g.input(g.solution[i]);
    expect(g.notes[i]).toBeGreaterThan(0);
    g.notesMode = false;
    g.input(g.solution[i]);
    expect(g.values[i]).toBe(g.solution[i]);
    expect(g.notes[i]).toBe(0);
    g.undo();
    expect(g.values[i]).toBe(0);
    expect(g.notes[i]).toBeGreaterThan(0);
  });

  it('ignores edits to givens', () => {
    const g = new Game(puzzle);
    const i = [...g.values].findIndex((v) => v);
    const before = g.values[i];
    g.select(i);
    g.input(before === 9 ? 1 : before + 1);
    g.erase();
    expect(g.values[i]).toBe(before);
  });

  it('completes when all cells match the solution', () => {
    const g = new Game(puzzle);
    for (let i = 0; i < 81; i++) {
      g.select(i);
      g.input(g.solution[i]);
    }
    expect(g.done).toBe(true);
  });

  it('check flags wrong cells and marks assisted; hint reveals the solution digit', () => {
    const g = new Game(puzzle);
    const i = blank(g);
    g.select(i);
    g.input(g.solution[i] === 1 ? 2 : 1);
    expect(g.check()).toBe(1);
    expect(g.checked).toBe(true);
    const h = g.hint();
    expect(g.values[h]).toBe(g.solution[h]);
    expect(g.hintsUsed).toBe(1);
  });

  it('round-trips through saved progress', () => {
    const g = new Game(puzzle);
    const i = blank(g);
    g.select(i);
    g.input(g.solution[i]);
    g.elapsed = 1234;
    const g2 = new Game(puzzle, JSON.parse(JSON.stringify(g.toProgress())));
    expect(g2.values[i]).toBe(g.solution[i]);
    expect(g2.elapsed).toBe(1234);
  });
});
