/* ══════════════════════════════════════════════════════════════════
   THE EVIDENCE LENS (#9).

   This property says everything on it is checkable. The lens is where
   that claim gets tested, on the whole screen at once.

   Turn it on and the desk goes dark. Then every piece of prose lights
   back up in the colour of where it came from: green if it is a field
   of a record in the export, blue if it was derived from dated records
   rather than stored, violet if only the local git clone confirms it,
   amber if it was written here.

   And red if nothing claims it. The lens is not decoration: an
   unmarked sentence is a defect, the counter says how many there are,
   and a check in the suite asserts that number is zero on every app.
   A lens that could only ever flatter the thing it inspects would not
   be worth building.

   What counts as a claim: prose. Paragraphs, list items, definition
   values, table cells, quotations, code blocks. A button is not a
   claim, a heading over a list is not a claim, a menu is not a claim,
   so controls and labels are exempt and the legend says so on screen.

   Nothing here writes to the windows. The veil and the marks are one
   overlay painted in viewport coordinates above everything, so the
   motion engine's transforms are untouched and evidence marks ride
   along with a window you drag while the lens is open.
   ══════════════════════════════════════════════════════════════════ */

export const TIERS = {
  export:    { label: 'In the export',   pill: 'export',    color: '#32d74b', note: 'A field of a record in this export, shown as exported.' },
  derived:   { label: 'Derived',         pill: 'derived',   color: '#64d2ff', note: 'Computed from dated records. Not itself a stored value.' },
  git:       { label: 'Git clone only',  pill: 'git clone', color: '#bf5af2', note: 'Confirmed in the local repository clone, not carried by the export.' },
  editorial: { label: 'Written here',    pill: 'editorial', color: '#ffd60a', note: 'Interpretation, not a record. Authored for this property.' },
  live:      { label: 'Fetched live',    pill: 'live',      color: '#ff9f0a', note: 'Requested now from a named third party. Not the record, and not read off Richie\'s Mac.' },
  chrome:    { label: 'Interface',       pill: 'interface', color: '#8e8e93', note: 'A control or a label. Asserts nothing, so it is not scanned.' }
};
export const UNSOURCED = { label: 'Unsourced', color: '#ff453a', note: 'Prose with no declared origin. This is a defect, not a category.' };

/* Prose. Deliberately narrow: the lens judges sentences, not furniture. */
export const CLAIM_SELECTOR = 'p, li, dd, td, th, blockquote, pre, figcaption';
/* Controls and labels assert nothing. Exempting them is what keeps the
   unsourced count meaningful instead of a wall of false positives. */
export const EXEMPT_SELECTOR = 'button, a[href], nav, label, select, option, summary, .mac-titlebar, .mac-dock, .mac-menubar, .mac-popover, .lens-ui, [data-tier="chrome"], [data-lens-exempt]';
const MARK_CAP = 420;

export const tierOf = (el) => el?.closest?.('[data-tier]')?.dataset.tier || null;
export const isExempt = (el) => Boolean(el?.closest?.(EXEMPT_SELECTOR));
/* A claim is prose that carries words and is not furniture. Empty
   elements and pure-punctuation ones are not sentences. */
export const isClaim = (el) => el.matches(CLAIM_SELECTOR) && !isExempt(el) && /[a-z]{3}/i.test(el.textContent || '');

/* Pure: the reading of one scanned region. Exported so the suite can
   assert against the same counting the legend shows. */
export function readRegions(regions, { isVisible = () => true } = {}) {
  const found = [];
  for (const region of regions) {
    if (region.hidden || !region.isConnected) continue;
    for (const el of region.querySelectorAll(CLAIM_SELECTOR)) {
      if (!isClaim(el)) continue;
      if (el.querySelector(CLAIM_SELECTOR)) continue;   // only the innermost prose, never its wrapper twice
      if (!isVisible(el)) continue;                     // the legend says "on screen" and has to mean it
      const tier = tierOf(el);
      found.push({ el, region, tier: tier && tier !== 'chrome' ? tier : tier === 'chrome' ? null : null, raw: tier });
    }
  }
  const counts = { export: 0, derived: 0, git: 0, editorial: 0, live: 0, unsourced: 0 };
  const marks = [];
  for (const f of found) {
    if (f.raw === 'chrome') continue;                    // declared furniture: counted nowhere, painted nowhere
    const key = TIERS[f.raw] && f.raw !== 'chrome' ? f.raw : 'unsourced';
    counts[key] += 1;
    marks.push({ el: f.el, region: f.region, key });
  }
  return { counts, marks, total: marks.length };
}

/* Returns a rect, not a size: this is chained (element ∩ its region ∩
   the viewport), so the result has to be intersectable again. */
/* On screen means visible to the visitor, not merely present in the DOM.
   A statement behind another window is not being read, so it is neither
   counted nor painted: otherwise the legend's "on screen" would be a
   claim this property could not itself support. */
export function makeVisibility(doc = document) {
  return (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 4) return false;
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false;
    const win = el.closest('.mac-window');
    const x = Math.min(innerWidth - 2, Math.max(2, r.left + Math.min(30, r.width / 2)));
    const y = Math.min(innerHeight - 2, Math.max(2, r.top + r.height / 2));
    const hit = doc.elementFromPoint(x, y);
    if (!hit) return false;
    return win ? hit.closest('.mac-window') === win : !hit.closest('.mac-window');
  };
}

const intersect = (a, b) => {
  const top = Math.max(a.top, b.top), bottom = Math.min(a.bottom, b.bottom);
  const left = Math.max(a.left, b.left), right = Math.min(a.right, b.right);
  return { top, left, bottom, right, width: right - left, height: bottom - top };
};

/**
 * root: the desktop element. Regions are `[data-lens]` inside it.
 * announce(text): the desktop's live region.
 */
export function createLens(root, { announce, beforeScan } = {}) {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'lens'; el.hidden = true; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="lens-veil"></div><div class="lens-scan"></div><div class="lens-marks"></div>';
  const veil = el.querySelector('.lens-veil'), marksHost = el.querySelector('.lens-marks');

  const ui = document.createElement('section');
  ui.className = 'lens-ui'; ui.hidden = true; ui.setAttribute('role', 'status'); ui.setAttribute('aria-live', 'polite');

  let open = false, frame = 0, nodes = [], last = null, capped = false;
  const visible = makeVisibility(root.ownerDocument || document);
  const scan = () => { beforeScan?.(); return readRegions([...root.querySelectorAll('[data-lens]')], { isVisible: visible }); };

  function paint() {
    const read = scan();   // the desktop declares provenance; the lens only ever reads it
    capped = read.marks.length > MARK_CAP;
    const wanted = read.marks.slice(0, MARK_CAP);
    while (nodes.length < wanted.length) { const d = document.createElement('i'); marksHost.append(d); nodes.push(d); }
    while (nodes.length > wanted.length) nodes.pop().remove();
    const view = { top: 0, left: 0, bottom: innerHeight, right: innerWidth };
    wanted.forEach((m, i) => {
      const n = nodes[i];
      /* The tier is assigned before the visibility guard: a mark that is
         scrolled out of its window is not painted, but it still knows
         what it is, so a report and a screenshot never disagree. */
      if (n.dataset.key !== m.key) { n.dataset.key = m.key; n.className = `lens-mark is-${m.key}`; }
      const app = m.el.closest('.mac-window')?.dataset.appId || 'desktop';   // which surface this mark belongs to, so the overlay stays legible from outside
      if (n.dataset.app !== app) n.dataset.app = app;
      const r = intersect(intersect(m.el.getBoundingClientRect(), m.region.getBoundingClientRect()), view);
      if (!(r.width >= 8) || !(r.height >= 5)) { n.style.display = 'none'; return; }
      n.style.cssText = `display:block;transform:translate(${Math.round(r.left)}px,${Math.round(r.top)}px);width:${Math.round(r.width)}px;height:${Math.round(r.height)}px`;
      if (!reduced() && !n.dataset.lit) { n.dataset.lit = '1'; n.style.animationDelay = `${Math.min(300, Math.round(r.top * 0.34))}ms`; }
    });
    const c = read.counts, sum = c.export + c.derived + c.git + c.editorial;
    const sig = JSON.stringify(c) + read.total;
    if (sig !== last) {
      last = sig;
      ui.innerHTML = `<header><span class="lens-dot"></span><h2>Evidence lens</h2><p class="lens-sum">${sum} sourced statement${sum === 1 ? '' : 's'} on screen</p></header>
        <dl class="lens-key">${Object.entries(TIERS).filter(([k]) => k !== 'chrome').map(([k, t]) =>
          `<div class="lens-row is-${k}"${c[k] ? '' : ' data-zero'}><dt><i style="--c:${t.color}"></i>${t.label}</dt><dd>${c[k]}</dd><p>${t.note}</p></div>`).join('')}
          <div class="lens-row is-unsourced${c.unsourced ? ' is-alarm' : ''}"${c.unsourced ? '' : ' data-zero'}><dt><i style="--c:${UNSOURCED.color}"></i>${UNSOURCED.label}</dt><dd>${c.unsourced}</dd><p>${UNSOURCED.note}</p></div>
        </dl>
        <p class="lens-rule">The lens reads prose: paragraphs, list items, definition values, table cells, quotations and code. Controls, menus and headings assert nothing and are not scanned.${capped ? ` Showing the first ${MARK_CAP} of ${read.total}.` : ''}</p>
        <p class="lens-rule lens-esc">Escape, or the same shortcut, puts the light back.</p>`;
      ui.dataset.alarm = c.unsourced ? 'on' : 'off';
    }
    if (open) frame = requestAnimationFrame(paint);
  }

  function show() {
    if (open) return;
    if (!el.isConnected) { root.append(el, ui); }
    open = true; el.hidden = false; ui.hidden = false; root.classList.add('lens-on');
    nodes.forEach((n) => delete n.dataset.lit);
    requestAnimationFrame(() => { el.classList.add('on'); ui.classList.add('on'); });
    paint();
    const c = scan().counts;
    announce?.(c.unsourced ? `Evidence lens on. ${c.unsourced} unsourced statements on screen.` : 'Evidence lens on. Every statement on screen names its origin.');
  }
  function hide() {
    if (!open) return;
    open = false; cancelAnimationFrame(frame); frame = 0;
    el.classList.remove('on'); ui.classList.remove('on'); root.classList.remove('lens-on');
    setTimeout(() => { if (!open) { el.hidden = true; ui.hidden = true; nodes.forEach((n) => n.remove()); nodes = []; last = null; } }, 220);
    announce?.('Evidence lens off.');
  }
  return {
    show, hide, toggle() { open ? hide() : show(); }, isOpen: () => open,
    read: () => scan().counts,
    /* Names the defects rather than only counting them, so a failing
       check can say which sentence is missing its origin. */
    report: () => scan().marks
      .filter((m) => m.key === 'unsourced')
      .map((m) => ({ app: m.el.closest('.mac-window')?.dataset.appId || 'desktop', tag: m.el.tagName.toLowerCase(), cls: m.el.className || '', text: (m.el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90) })),
    destroy() { cancelAnimationFrame(frame); el.remove(); ui.remove(); }
  };
}
