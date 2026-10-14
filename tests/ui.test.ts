// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { makeDaily } from '../src/engine/daily';
import { playView } from '../src/app/views/play';
import { archiveView } from '../src/app/views/archive';
import { statsView } from '../src/app/views/stats';
import { getProgress } from '../src/app/store';

const puzzle = makeDaily('2026-10-13', 'easy');

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('UI smoke', () => {
  it('renders the board and plays to completion with the keyboard', () => {
    const v = playView('2026-10-13', 'easy', puzzle);
    document.body.append(v.el);
    expect(v.el.querySelectorAll('.cell')).toHaveLength(81);
    expect(v.el.querySelectorAll('.digit')).toHaveLength(9);

    for (let i = 0; i < 81; i++) {
      if (puzzle.p[i] !== '.') continue;
      v.el.querySelectorAll('.cell')[i].dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: puzzle.s[i] }));
    }
    expect(document.querySelector('.overlay')).not.toBeNull();
    expect(getProgress('2026-10-13', 'easy')?.done).toBe(true);
    v.destroy();
  });

  it('renders archive and stats', () => {
    expect(archiveView('2026-10').el.querySelectorAll('.day').length).toBeGreaterThan(0);
    expect(statsView().el.querySelector('table')).not.toBeNull();
  });
});
