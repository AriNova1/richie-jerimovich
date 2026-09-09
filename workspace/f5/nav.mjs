/* ══════════════════════════════════════════════════════════════════
   F5 · NAVIGATION: compact Dock, More, and document-window placement.

   On a phone the Dock cannot hold thirteen items: five were clipped
   off the right edge and unreachable without a scroll nobody finds.
   The compact Dock shows the three destinations the visitor journey
   actually uses (Finder, Notes, Messages) plus More. More is a sheet
   with two sections: what is open now (including Quick Look and
   Compare, which have no Dock item of their own) and every other
   app. Nothing is removed; everything is one tap further.

   More owns no state. It reads the desktop's window map and app
   names when it opens, and calls back to the desktop to activate.
   The desktop still owns z-order, focus, identity and app content.
   ══════════════════════════════════════════════════════════════════ */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const NAV = Object.freeze({
  narrowMax: 650,                                  // matches the desktop's sheet breakpoint
  primary: ['finder', 'notes', 'messages'],        // visible on the compact Dock, in journey order
});

/**
 * host:
 *   apps: string[]                 Dock order for the wide Dock (unchanged from canonical)
 *   names: Record<id, label>
 *   icon(id): string               existing icon markup
 *   extra: [{href, label, icon}]   e.g. the public record link
 *   windows(): [{id, name, hidden, active}]    open windows, from the desktop
 *   activate(id, source): void     open / focus / restore. The desktop decides.
 *   announce(text)
 *   narrow(): boolean
 */
export function mountDock(nav, host) {
  const ac = new AbortController(); const signal = ac.signal;
  let more = null, moreOpen = false, returnTo = null;

  function render() {
    const narrow = host.narrow();
    nav.classList.toggle('f5-compact', narrow);
    const ids = narrow ? NAV.primary : host.apps;
    nav.innerHTML = ids.map((id) => `<button data-app="${id}" aria-label="${esc(host.names[id])}" title="${esc(host.names[id])}">${host.icon(id)}<span>${esc(host.names[id])}</span><i></i></button>`).join('')
      + (narrow
        ? `<button class="f5-more-button" data-more aria-label="More apps and open windows" aria-haspopup="dialog" aria-expanded="false" title="More"><b class="f5-more-glyph" aria-hidden="true"><em></em><em></em><em></em><em></em></b><span>More</span><b class="f5-more-count" data-more-count hidden></b></button>`
        : `<div class="dock-divider"></div>${host.extra.map((x) => `<a href="${esc(x.href)}" aria-label="${esc(x.label)}" title="${esc(x.label)}">${x.icon}<span>${esc(x.label)}</span></a>`).join('')}<button data-app="trash" aria-label="Trash" title="Trash">${host.icon('trash')}<span>Trash</span><i></i></button>`);
    refresh();
  }
  /* running dots and the More badge: cheap, called by the desktop after any window change */
  function refresh() {
    const open = host.windows();
    nav.querySelectorAll('[data-app]').forEach((b) => { const w = open.find((x) => x.id === b.dataset.app); b.classList.toggle('running', Boolean(w && !w.hidden)); b.classList.toggle('f5-active', Boolean(w && w.active)); });
    const badge = nav.querySelector('[data-more-count]');
    if (badge) { const n = open.filter((w) => !NAV.primary.includes(w.id)).length; badge.hidden = n === 0; badge.textContent = String(n); }
    if (moreOpen) drawMore();
  }

  /* ── More ─────────────────────────────────────────────────────── */
  function ensureMore() {
    if (more) return more;
    more = document.createElement('div');
    more.className = 'f5-more'; more.hidden = true;
    more.setAttribute('role', 'dialog'); more.setAttribute('aria-label', 'More apps and open windows'); more.tabIndex = -1;
    nav.parentElement.append(more);
    more.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); closeMore(true); return; }
      const items = [...more.querySelectorAll('button,a')];
      const i = items.indexOf(document.activeElement);
      if (ev.key === 'Tab') { // keep focus inside while open; Escape or the Done button leave
        if (items.length === 0) return;
        if (ev.shiftKey && (i <= 0)) { ev.preventDefault(); items[items.length - 1].focus(); }
        else if (!ev.shiftKey && i === items.length - 1) { ev.preventDefault(); items[0].focus(); }
        return;
      }
      if (['ArrowRight', 'ArrowDown'].includes(ev.key)) { ev.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      if (['ArrowLeft', 'ArrowUp'].includes(ev.key)) { ev.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
      if (ev.key === 'Home') { ev.preventDefault(); items[0]?.focus(); }
      if (ev.key === 'End') { ev.preventDefault(); items[items.length - 1]?.focus(); }
    }, { signal });
    more.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-activate]'); const done = ev.target.closest('[data-more-done]');
      if (done) { closeMore(true); return; }
      if (!b) return;
      const id = b.dataset.activate;
      closeMore(false);
      const target = host.activate(id, 'more');
      // focus follows the activation; if the desktop gave focus to nothing usable, return it to the More button
      if (!target || document.activeElement === document.body || nav.contains(document.activeElement) === false && !document.activeElement?.closest('.mac-window')) nav.querySelector('[data-more]')?.focus({ preventScroll: true });
    }, { signal });
    return more;
  }
  function drawMore() {
    const open = host.windows();
    const openIds = new Set(open.map((w) => w.id));
    const rest = host.apps.filter((id) => !NAV.primary.includes(id)).concat(['contacts', 'voices', 'trash']).filter((id, i, a) => a.indexOf(id) === i);
    const item = (id, name, meta) => `<button data-activate="${esc(id)}" ${meta?.active ? 'aria-current="true"' : ''} class="${meta?.hidden ? 'is-minimized' : ''}">${host.icon(id === 'preview' || id === 'comparison' || id === 'investigation' ? 'finder' : id === 'voices' ? 'notes' : id)}<span>${esc(name)}</span>${meta ? `<small>${meta.active ? 'Active' : meta.hidden ? 'Minimized' : 'Open'}</small>` : ''}</button>`;
    more.innerHTML = `<div class="f5-more-sheet">
      <header><strong>Open now</strong><button type="button" data-more-done>Done</button></header>
      <div class="f5-more-grid" data-section="open">${open.length ? open.map((w) => item(w.id, w.name, w)).join('') : '<p class="f5-more-empty">Nothing open. The desk is empty.</p>'}</div>
      <header><strong>All apps</strong></header>
      <div class="f5-more-grid" data-section="apps">${rest.map((id) => item(id, host.names[id])).join('')}${host.extra.map((x) => `<a href="${esc(x.href)}">${x.icon}<span>${esc(x.label)}</span></a>`).join('')}</div>
    </div>`;
  }
  function openMore() {
    ensureMore(); drawMore();
    returnTo = document.activeElement;
    moreOpen = true; more.hidden = false;
    nav.querySelector('[data-more]')?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => more.classList.add('on'));
    (more.querySelector('[aria-current="true"]') || more.querySelector('button,a'))?.focus({ preventScroll: true });
    host.announce?.('More apps and open windows');
  }
  function closeMore(restoreFocus) {
    if (!moreOpen) return;
    moreOpen = false;
    more.classList.remove('on');
    nav.querySelector('[data-more]')?.setAttribute('aria-expanded', 'false');
    const hide = () => { if (!moreOpen) more.hidden = true; };
    setTimeout(hide, 160);
    if (restoreFocus) (nav.querySelector('[data-more]') || returnTo)?.focus?.({ preventScroll: true });
  }
  nav.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-more]')) { ev.preventDefault(); ev.stopPropagation(); moreOpen ? closeMore(true) : openMore(); }
  }, { signal });
  document.addEventListener('pointerdown', (ev) => { if (moreOpen && !more.contains(ev.target) && !ev.target.closest('[data-more]')) closeMore(false); }, { signal, capture: true });
  document.addEventListener('keydown', (ev) => { if (moreOpen && ev.key === 'Escape' && !more.contains(ev.target)) { ev.preventDefault(); ev.stopPropagation(); closeMore(true); } }, { signal, capture: true });
  const mq = matchMedia(`(max-width:${NAV.narrowMax}px)`);
  mq.addEventListener('change', () => { closeMore(false); render(); }, { signal });
  render();
  return { render, refresh, openMore, closeMore, isMoreOpen: () => moreOpen,
    dockRect(id) { const b = nav.querySelector(`[data-app="${CSS.escape(id)}"]`) || nav.querySelector('[data-more]'); if (!b || b.getClientRects().length === 0) return null; return b; },
    destroy() { closeMore(false); ac.abort(); more?.remove(); more = null; } };
}

/* ── document-window composition (desktop and wide) ─────────────────
   Quick Look and Compare open beside Finder when there is room, so
   the working set reads as one arrangement instead of a cascade that
   buries the list. On a 32:9 viewport the set is centred by keeping
   Finder where the desktop puts it and letting the document windows
   take the free side. Nothing here is Mission Control. */
export function placeDocumentWindow(w, kind, anchor, stage, safe = { top: 40, bottom: 100 }) {
  if (stage.w <= NAV.narrowMax) return null;          // sheets are CSS-positioned
  const gap = 16;
  const want = kind === 'comparison' ? { w: 960, h: stage.h - safe.top - safe.bottom } : kind === 'investigation' ? { w: 860, h: stage.h - safe.top - safe.bottom } : { w: 760, h: stage.h - safe.top - safe.bottom - 30 };
  const minW = 520;
  let rect;
  const rightFree = anchor ? stage.w - (anchor.x + anchor.w) - gap - 8 : 0;
  const leftFree = anchor ? anchor.x - gap - 8 : 0;
  if (anchor && rightFree >= minW) rect = { x: anchor.x + anchor.w + gap, y: Math.max(safe.top, anchor.y + (kind === 'comparison' ? 0 : 24)), w: Math.min(want.w, rightFree), h: want.h };
  else if (anchor && leftFree >= minW) rect = { x: Math.max(8, anchor.x - gap - Math.min(want.w, leftFree)), y: Math.max(safe.top, anchor.y + 24), w: Math.min(want.w, leftFree), h: want.h };
  else rect = { x: Math.max(8, Math.round((stage.w - Math.min(want.w, stage.w - 16)) / 2)), y: safe.top + (anchor ? 36 : 0), w: Math.min(want.w, stage.w - 16), h: want.h };
  rect.h = Math.max(320, Math.min(rect.h, stage.h - rect.y - safe.bottom + 20));
  Object.assign(w.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', right: 'auto', bottom: 'auto' });
  return rect;
}
