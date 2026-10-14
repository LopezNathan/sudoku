import type { DailyPuzzle, Level } from '../../engine/daily';
import { formatLong, formatTime, dateKey } from '../dates';
import { h } from '../dom';
import { Game } from '../game';
import { LEVEL_META } from '../share';
import { getProgress, saveProgress } from '../store';
import { createBoard } from './board';
import { showComplete } from './complete';
import { createControls } from './controls';

export interface View {
  el: HTMLElement;
  destroy: () => void;
}

export function playView(date: string, level: Level, puzzle: DailyPuzzle): View {
  const game = new Game(puzzle, getProgress(date, level));
  const meta = LEVEL_META[level];
  let closeModal: (() => void) | null = null;

  const timerEl = h('div', { class: 'timer', role: 'timer', 'aria-label': 'Elapsed time' });
  const message = h('div', { class: 'message', 'aria-live': 'polite' });
  const pauseBtn = h('button', { class: 'pause-btn', 'aria-label': 'Pause', onClick: () => setPaused(!paused) }, '⏸');

  const board = createBoard(game, (i) => {
    game.select(i);
    refresh(false);
  });

  const controls = createControls(game, {
    digit: (d) => act(() => game.input(d)),
    erase: () => act(() => game.erase()),
    undo: () => act(() => game.undo()),
    notes: () => {
      game.notesMode = !game.notesMode;
      refresh(false);
    },
    hint: () => {
      act(() => game.hint());
      flash('💡 Hint used — this solve is marked assisted');
    },
    check: () => {
      let wrong = 0;
      act(() => (wrong = game.check()));
      flash(wrong ? `${wrong} cell${wrong > 1 ? 's are' : ' is'} wrong` : 'Everything so far looks right!');
    },
  });

  let flashTimer: number | undefined;
  function flash(text: string): void {
    message.textContent = text;
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => (message.textContent = ''), 3000);
  }

  function save(): void {
    saveProgress(date, level, game.toProgress());
  }

  function act(fn: () => void): void {
    const wasDone = game.done;
    fn();
    if (game.done && !wasDone) {
      game.completedOn = dateKey();
      stopTimer();
      save();
      refresh(false);
      closeModal = showComplete(date, level, game.toProgress());
      return;
    }
    save();
    refresh(false);
  }

  function refresh(tick: boolean): void {
    timerEl.textContent = formatTime(game.elapsed);
    if (tick) return;
    board.render();
    controls.render();
  }

  // --- timer: runs only while the page is visible and the puzzle is unfinished ---
  let last = 0;
  let interval: number | undefined;
  const startTimer = () => {
    if (interval !== undefined || game.done || document.hidden) return;
    last = performance.now();
    interval = window.setInterval(() => {
      const now = performance.now();
      game.elapsed += now - last;
      last = now;
      refresh(true);
    }, 500);
  };
  function stopTimer(): void {
    if (interval === undefined) return;
    game.elapsed += performance.now() - last;
    window.clearInterval(interval);
    interval = undefined;
  }
  let paused = false;
  function setPaused(value: boolean): void {
    if (game.done) return;
    paused = value;
    el.classList.toggle('paused', paused);
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    if (paused) {
      stopTimer();
      save();
    } else startTimer();
  }
  const onVisibility = () => {
    if (document.hidden) {
      stopTimer();
      save();
    } else if (!paused) startTimer();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onVisibility);

  // --- keyboard ---
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.overlay')) return;
    if (e.key === 'p' || e.key === 'P') {
      setPaused(!paused);
      return;
    }
    if (paused) return;
    if (/^[1-9]$/.test(e.key)) act(() => game.input(Number(e.key)));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') act(() => game.erase());
    else if (e.key === 'n' || e.key === 'N') {
      game.notesMode = !game.notesMode;
      refresh(false);
    } else if (e.key === 'u' || e.key === 'z') act(() => game.undo());
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key] ?? [0, 0];
      game.move(dr, dc);
      refresh(false);
    }
  };
  document.addEventListener('keydown', onKey);

  const el = h(
    'section',
    { class: 'play' },
    h(
      'div',
      { class: 'play-head' },
      h('a', { class: 'back', href: '#/', 'aria-label': 'Back' }, '←'),
      h('div', { class: 'play-title' }, h('strong', {}, `${meta.emoji} ${meta.name}`), h('span', { class: 'muted' }, formatLong(date))),
      timerEl,
      pauseBtn,
    ),
    board.el,
    message,
    controls.el,
    h('div', { class: 'pause-overlay' }, h('button', { onClick: () => setPaused(false) }, '▶ Resume')),
    game.done &&
      h('button', { class: 'results-btn', onClick: () => (closeModal = showComplete(date, level, game.toProgress())) }, 'View results'),
  );

  refresh(false);
  startTimer();

  return {
    el,
    destroy() {
      stopTimer();
      save();
      closeModal?.();
      window.clearTimeout(flashTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
      document.removeEventListener('keydown', onKey);
    },
  };
}
