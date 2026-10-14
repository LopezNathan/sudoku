import type { Level } from '../../engine/daily';
import { formatLong, formatTime } from '../dates';
import { h } from '../dom';
import { isAssisted, Progress } from '../game';
import { LEVEL_META, share, shareText } from '../share';

/** Completion modal with share button. Returns a function that closes it. */
export function showComplete(date: string, level: Level, p: Progress): () => void {
  const meta = LEVEL_META[level];
  const status = h('p', { class: 'share-status', 'aria-live': 'polite' });
  const close = () => overlay.remove();

  const shareBtn = h(
    'button',
    {
      class: 'primary',
      onClick: async () => {
        status.textContent = await share(shareText(date));
      },
    },
    'Share results',
  );

  const overlay = h(
    'div',
    { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Puzzle complete', onClick: (e: Event) => e.target === overlay && close() },
    h(
      'div',
      { class: 'modal' },
      h('div', { class: 'big-emoji' }, '🎉'),
      h('h2', {}, 'Solved!'),
      h('p', { class: 'muted' }, `${meta.emoji} ${meta.name} · ${formatLong(date)}`),
      h('div', { class: 'result-time' }, formatTime(p.elapsed)),
      isAssisted(p) && h('p', { class: 'muted' }, `💡 Assisted${p.hintsUsed ? ` · ${p.hintsUsed} hint${p.hintsUsed > 1 ? 's' : ''}` : ' · checked'}`),
      shareBtn,
      status,
      h('div', { class: 'row' }, h('a', { class: 'btn', href: '#/' }, 'Home'), h('button', { onClick: close }, 'View board')),
    ),
  );
  document.body.append(overlay);
  shareBtn.focus();
  return close;
}
