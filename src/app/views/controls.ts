import { h } from '../dom';
import type { Game } from '../game';

export interface ControlActions {
  digit: (d: number) => void;
  erase: () => void;
  undo: () => void;
  notes: () => void;
  hint: () => void;
  check: () => void;
}

export interface Controls {
  el: HTMLElement;
  render: () => void;
}

export function createControls(game: Game, a: ControlActions): Controls {
  const digitBtns: HTMLButtonElement[] = [];
  const remainEls: HTMLElement[] = [];

  const pad = h('div', { class: 'numpad' });
  for (let d = 1; d <= 9; d++) {
    const remain = h('span', { class: 'remain' });
    const btn = h('button', { class: 'digit', 'aria-label': `Enter ${d}`, onClick: () => a.digit(d) }, String(d), remain);
    digitBtns.push(btn);
    remainEls.push(remain);
    pad.append(btn);
  }

  const mk = (label: string, icon: string, fn: () => void) =>
    h('button', { class: 'action', onClick: fn }, h('span', { class: 'icon', 'aria-hidden': 'true' }, icon), label);

  const undo = mk('Undo', '↩️', a.undo);
  const erase = mk('Erase', '⌫', a.erase);
  const notes = mk('Notes', '✏️', a.notes);
  const hint = mk('Hint', '💡', a.hint);
  const check = mk('Check', '✔️', a.check);
  const actions = h('div', { class: 'actions' }, undo, erase, notes, hint, check);

  const el = h('div', { class: 'controls' }, actions, pad);

  function render(): void {
    const remaining = game.remaining();
    digitBtns.forEach((b, i) => {
      b.disabled = game.done || remaining[i + 1] <= 0;
      remainEls[i].textContent = String(Math.max(0, remaining[i + 1]));
    });
    undo.disabled = !game.canUndo;
    for (const b of [erase, notes, hint, check]) b.disabled = game.done;
    notes.classList.toggle('on', game.notesMode);
    notes.setAttribute('aria-pressed', String(game.notesMode));
  }

  return { el, render };
}
