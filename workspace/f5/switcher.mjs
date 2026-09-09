/* ══════════════════════════════════════════════════════════════════
   THE SWITCHER (#22): a phone cannot have windows, so stop pretending.

   On a narrow screen every open app is a sheet, and sheets stack on
   top of each other with no way to see what is underneath. The
   switcher is that missing view: a swipe up from the home bar, or the
   More sheet's own control, fans the open apps into a card deck you
   thumb through. Each card is a live, inert copy of the real window
   (the same closed-shadow-root ghost the close animation uses), so it
   shows the actual record you left open, not an icon.

   Flick sideways to move through the deck, tap to go to that app,
   flick a card up to close it. Every one of those has a keyboard and
   a button equivalent, because a gesture that is the only way to do
   something is not a feature.

   The deck follows the finger: no snap-back animation is played while
   a drag is in progress, and the whole thing is inert under reduced
   motion, where it becomes a plain list.
   ══════════════════════════════════════════════════════════════════ */
import { ghostOf } from './lifecycle.mjs';

const CARD = 0.62;          // card width as a share of the viewport
const CLOSE_LIFT = 90;      // px upward before a card is thrown away

export function createSwitcher(root, { windows, focusWindow, closeWindow, announce, narrow }) {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('section');
  el.className = 'switcher'; el.hidden = true;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Open apps'); el.tabIndex = -1;
  let open = false, cards = [], index = 0, returnTo = null;
  let drag = null;

  const step = () => (innerWidth * CARD) + 14;

  function layout(animate = true) {
    const mid = innerWidth / 2, w = innerWidth * CARD;
    cards.forEach((c, i) => {
      const offset = (i - index) * step() + (drag?.axis === 'x' ? drag.dx : 0);
      const lift = (drag?.axis === 'y' && drag.i === i) ? drag.dy : 0;
      const away = Math.min(1, Math.abs(offset) / (step() * 1.35));
      c.el.style.transition = animate && !drag && !reduced() ? 'transform .34s cubic-bezier(.32,.72,0,1),opacity .2s' : 'none';
      c.el.style.transform = `translate(${Math.round(mid - w / 2 + offset)}px,${Math.round(lift)}px) scale(${(1 - away * 0.12).toFixed(3)})`;
      c.el.style.opacity = String(Math.max(0, 1 - away * 0.85 - Math.max(0, -lift) / 260));
      c.el.setAttribute('aria-current', String(i === index));
      c.el.tabIndex = i === index ? 0 : -1;
    });
    const label = cards[index]?.name;
    el.querySelector('.sw-name').textContent = label || 'Nothing is open';
    el.querySelector('.sw-pos').textContent = cards.length ? `${index + 1} of ${cards.length}` : '';
    el.querySelectorAll('.sw-dot').forEach((d, i) => d.classList.toggle('on', i === index));
  }

  function build() {
    const list = windows().filter((w) => !w.el.hidden);
    el.innerHTML = `<div class="sw-scrim"></div>
      <header class="sw-head"><p class="sw-name"></p><p class="sw-pos"></p></header>
      <div class="sw-deck"></div>
      <div class="sw-dots" aria-hidden="true">${list.map(() => '<i class="sw-dot"></i>').join('')}</div>
      <div class="sw-bar">
        <button type="button" data-sw="prev" aria-label="Previous app">‹</button>
        <button type="button" data-sw="go" class="sw-go">Go to app</button>
        <button type="button" data-sw="close" class="sw-close" aria-label="Close this app">Close app</button>
        <button type="button" data-sw="next" aria-label="Next app">›</button>
      </div>
      <button type="button" class="sw-done" data-sw="done">Done</button>`;
    const deck = el.querySelector('.sw-deck');
    cards = list.map((w) => {
      const card = document.createElement('div');
      card.className = 'sw-card'; card.dataset.win = w.id; card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Go to ${w.name}`);
      const r = w.el.getBoundingClientRect();
      const frame = document.createElement('div'); frame.className = 'sw-frame';
      const g = ghostOf(w.el, root);
      const scale = Math.min((innerWidth * CARD) / Math.max(1, r.width), (innerHeight * 0.52) / Math.max(1, r.height));
      Object.assign(g.style, { position: 'absolute', left: '0', top: '0', width: r.width + 'px', height: r.height + 'px', transformOrigin: '0 0', transform: `scale(${scale})`, zIndex: '' });
      frame.style.width = Math.round(r.width * scale) + 'px';
      frame.style.height = Math.round(r.height * scale) + 'px';
      frame.append(g);
      const cap = document.createElement('span'); cap.className = 'sw-cap'; cap.textContent = w.name;
      card.append(frame, cap); deck.append(card);
      return { el: card, id: w.id, name: w.name };
    });
    index = Math.max(0, cards.findIndex((c) => list.find((w) => w.id === c.id)?.active));
    layout(false);
  }

  const go = (i) => { index = Math.max(0, Math.min(cards.length - 1, i)); layout(); announce?.(cards[index] ? `${cards[index].name}, ${index + 1} of ${cards.length}` : 'Nothing is open'); };
  function dismiss(i = index) {
    const c = cards[i]; if (!c) return;
    closeWindow(c.id);
    cards.splice(i, 1); c.el.remove();
    el.querySelector('.sw-dots')?.lastElementChild?.remove();
    if (!cards.length) { hide(); return; }
    index = Math.min(index, cards.length - 1); layout();
    announce?.(`${c.name} closed. ${cards.length} open.`);
  }

  function show() {
    if (open || !narrow()) return;
    if (!el.isConnected) root.append(el);
    returnTo = document.activeElement;
    build();
    if (!cards.length) { announce?.('Nothing is open.'); return; }
    open = true; el.hidden = false; root.classList.add('switcher-on');
    requestAnimationFrame(() => el.classList.add('on'));
    el.focus({ preventScroll: true });
    announce?.(`Open apps. ${cards.length} open. ${cards[index]?.name} is in front.`);
  }
  function hide(restore = true) {
    if (!open) return;
    open = false; el.classList.remove('on'); root.classList.remove('switcher-on');
    setTimeout(() => { if (!open) { el.hidden = true; el.replaceChildren(); cards = []; } }, 200);
    if (restore && returnTo?.isConnected) returnTo.focus?.({ preventScroll: true });
  }

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-sw]');
    if (b) {
      const k = b.dataset.sw;
      if (k === 'prev') go(index - 1);
      else if (k === 'next') go(index + 1);
      else if (k === 'close') dismiss();
      else if (k === 'go') { const c = cards[index]; hide(false); if (c) focusWindow(c.id); }
      else hide();
      return;
    }
    const card = ev.target.closest('.sw-card');
    if (card && !drag?.moved) { const i = cards.findIndex((c) => c.el === card); if (i === index) { hide(false); focusWindow(card.dataset.win); } else go(i); }
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); hide(); return; }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(index - 1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); go(index + 1); }
    if (ev.key === 'Home') { ev.preventDefault(); go(0); }
    if (ev.key === 'End') { ev.preventDefault(); go(cards.length - 1); }
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); const c = cards[index]; hide(false); if (c) focusWindow(c.id); }
    if (ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); dismiss(); }
  });

  /* The deck follows the finger; the axis is decided once, on the first
     few pixels, so a horizontal browse never turns into a close. */
  el.addEventListener('pointerdown', (ev) => {
    const card = ev.target.closest('.sw-card'); if (!card || reduced()) return;
    const i = cards.findIndex((c) => c.el === card);
    drag = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, dx: 0, dy: 0, axis: null, i, moved: false };
    el.setPointerCapture?.(ev.pointerId);
  });
  el.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
    if (!drag.axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
    drag.moved = true; drag.dx = dx; drag.dy = Math.min(0, dy);
    if (drag.axis === 'x' && drag.i !== index) { drag.axis = null; drag = null; return; }
    layout(false);
  });
  const release = (ev) => {
    if (!drag || (ev && ev.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (d.axis === 'x' && Math.abs(d.dx) > step() * 0.28) go(index + (d.dx < 0 ? 1 : -1));
    else if (d.axis === 'y' && -d.dy > CLOSE_LIFT) dismiss(d.i);
    else layout();
    setTimeout(() => { if (d.moved) d.moved = false; }, 0);
  };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);

  return { show, hide, toggle() { open ? hide() : show(); }, isOpen: () => open, count: () => cards.length,
    destroy() { el.remove(); cards = []; } };
}
