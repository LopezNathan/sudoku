import { BOX, COL, PEERS, ROW } from '../../engine/grid';
import { h } from '../dom';
import type { Game } from '../game';

export interface Board {
  el: HTMLElement;
  render: () => void;
}

/** 9x9 grid. Calls `onSelect` when a cell is tapped; `render()` syncs it to the game state. */
export function createBoard(game: Game, onSelect: (i: number) => void): Board {
  const cells: HTMLElement[] = [];
  const el = h('div', { class: 'board', role: 'grid', 'aria-label': 'Sudoku board' });

  for (let i = 0; i < 81; i++) {
    const cell = h('div', {
      class: 'cell',
      role: 'gridcell',
      tabindex: -1,
      onPointerDown: (e: Event) => {
        e.preventDefault();
        onSelect(i);
      },
    });
    cells.push(cell);
    el.append(cell);
  }

  function render(): void {
    const sel = game.selected;
    const selVal = sel >= 0 ? game.values[sel] : 0;
    const peers = new Set(sel >= 0 ? PEERS[sel] : []);
    const conflicts = game.conflicts();

    for (let i = 0; i < 81; i++) {
      const cell = cells[i];
      const v = game.values[i];
      const cls = ['cell'];
      if (COL(i) % 3 === 2 && COL(i) !== 8) cls.push('box-right');
      if (ROW(i) % 3 === 2 && ROW(i) !== 8) cls.push('box-bottom');
      if (game.isGiven(i)) cls.push('given');
      if (i === sel) cls.push('selected');
      else if (peers.has(i) || (sel >= 0 && BOX(i) === BOX(sel))) cls.push('peer');
      if (selVal && v === selVal && i !== sel) cls.push('same');
      if (conflicts.has(i)) cls.push('conflict');
      if (game.wrong.has(i)) cls.push('wrong');
      cell.className = cls.join(' ');
      cell.setAttribute('aria-selected', String(i === sel));

      if (v) {
        cell.textContent = String(v);
      } else if (game.notes[i]) {
        const grid = h('div', { class: 'notes' });
        for (let d = 1; d <= 9; d++) {
          grid.append(h('span', { class: selVal === d ? 'hl' : '' }, game.notes[i] & (1 << d) ? String(d) : ''));
        }
        cell.replaceChildren(grid);
      } else {
        cell.textContent = '';
      }
    }
  }

  return { el, render };
}
