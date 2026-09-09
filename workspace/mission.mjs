/* ══════════════════════════════════════════════════════════════════
   MISSION CONTROL (#14) and CURATED EDITIONS (#24).

   One overlay, two rows. "Open now" shows every live window as a
   thumbnail: a static, inert copy in a closed shadow root (the same
   ghost the close animation uses), scaled to fit. Clicking one
   focuses that window. "Editions" shows explicit manifests from
   data/editions.json; opening one arranges the desk through the
   engine's tile zones. Nothing opens on its own, the default desk
   stays empty, and every reference is resolved against the export
   before it is offered.
   ══════════════════════════════════════════════════════════════════ */
import { ghostOf } from './f5/lifecycle.mjs';
import { serializeDocumentRef } from './documents.mjs';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Validate one edition against the export. Returns the edition with
   `artifacts[i].ok`, `missing` (count) and a boolean `openable` (the
   arrangement's references all resolve). Pure; unit-tested. */
export function validateEdition(edition, documents, { isKnownCase = () => true } = {}) {
  const check = (ref) => Boolean(ref) && documents.resolve(ref).ok;
  const artifacts = (edition.artifacts || []).map((a) => ({ ...a, ok: check(a.ref) }));
  const arrangement = (edition.arrangement || []).map((step) => {
    let ok = true;
    if (step.app === 'finder') ok = !step.select || check(step.select);
    else if (step.app === 'preview') ok = check(step.ref);
    else if (step.app === 'notes') ok = !step.slug || check({ kind: 'writing', key: step.slug, snapshot: edition.snapshot || documents.snapshot });
    else if (step.app === 'comparison') ok = check({ kind: 'kept', key: step.leftId, snapshot: documents.snapshot }) && check({ kind: 'kept', key: step.rightId, snapshot: documents.snapshot });
    else if (step.app === 'investigation') ok = isKnownCase(step.caseId);
    return { ...step, ok };
  });
  const takeaway = edition.takeaway ? { ...edition.takeaway, ok: edition.takeaway.kind === 'investigation' ? isKnownCase(edition.takeaway.caseId) : edition.takeaway.kind === 'compare' ? check({ kind: 'kept', key: edition.takeaway.leftId, snapshot: documents.snapshot }) && check({ kind: 'kept', key: edition.takeaway.rightId, snapshot: documents.snapshot }) : true } : null;
  return { ...edition, artifacts, arrangement, takeaway, missing: artifacts.filter((a) => !a.ok).length, openable: arrangement.length > 0 && arrangement.every((s) => s.ok) };
}

/**
 * host:
 *   root: HTMLElement                       the desktop root
 *   windows(): [{id, name, el}]             live windows, bottom to top
 *   focusWindow(id): void
 *   editions(): validated editions (or null while loading)
 *   openEdition(edition): void              the desktop arranges
 *   openDocument(ref): void
 *   announce(text): void
 */
export function createMissionControl(host) {
  const ac = new AbortController(); const signal = ac.signal;
  const el = document.createElement('section');
  el.className = 'mission'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Mission Control'); el.tabIndex = -1;
  let open = false, returnTo = null, ghosts = [];   // the overlay is appended on first show: the desktop replaces its own markup after creating this

  function thumb(w) {
    const r = w.el.getBoundingClientRect();
    const g = ghostOf(w.el, host.root);
    const cell = document.createElement('button');
    cell.type = 'button'; cell.className = 'mission-thumb'; cell.dataset.window = w.id; cell.setAttribute('aria-label', `Go to ${w.name}`);
    const scale = Math.min(280 / Math.max(1, r.width), 180 / Math.max(1, r.height), 0.5);
    g.style.position = 'absolute'; g.style.left = '0'; g.style.top = '0'; g.style.transformOrigin = '0 0'; g.style.transform = `scale(${scale})`; g.style.width = r.width + 'px'; g.style.height = r.height + 'px'; g.style.zIndex = '';
    const frame = document.createElement('div'); frame.className = 'mission-frame'; frame.style.width = Math.round(r.width * scale) + 'px'; frame.style.height = Math.round(r.height * scale) + 'px';
    frame.append(g); cell.append(frame, Object.assign(document.createElement('span'), { textContent: w.name }));
    ghosts.push(g);
    return cell;
  }

  function render() {
    ghosts = [];
    const windows = host.windows().filter((w) => !w.el.hidden);
    const editions = host.editions();
    el.innerHTML = `<div class="mission-inner">
      <header class="mission-head"><h1>Mission Control</h1><button type="button" class="mission-close" data-mission-close aria-label="Close Mission Control">Done</button></header>
      <section class="mission-row"><h2>Open now</h2><div class="mission-grid" data-section="windows">${windows.length ? '' : '<p class="mission-empty">Nothing is open. The desk is empty until you choose something.</p>'}</div></section>
      <section class="mission-row"><h2>Editions</h2><p class="mission-note">A curated arrangement of the public record. Each opens a set of real documents side by side; nothing is opened until you choose.</p>
        <div class="mission-editions">${editions === null ? '<p class="mission-empty">Loading the editions…</p>' : editions.length ? editions.map((e) => `<article class="mission-edition ${e.openable ? '' : 'is-blocked'}">
          <p class="mission-kicker">${esc(e.date)} · ${e.artifacts.length} artifact${e.artifacts.length === 1 ? '' : 's'}${e.missing ? ` · ${e.missing} not in this export` : ''}</p>
          <h3>${esc(e.title)}</h3>
          <p class="mission-opening">${esc(e.opening)}</p>
          <ol class="mission-artifacts">${e.artifacts.map((a) => `<li class="${a.ok ? '' : 'is-missing'}"><span class="mission-role">${esc(a.role)}</span>${a.ok ? `<button type="button" class="mission-artifact" data-open-document="${esc(serializeDocumentRef(a.ref))}">${esc(a.line)}</button>` : `<span class="mission-artifact-missing">${esc(a.line)} (not in this export)</span>`}</li>`).join('')}</ol>
          <p class="mission-why">${esc(e.why)}</p>
          <div class="mission-actions"><button type="button" class="mission-open" data-open-edition="${esc(e.id)}" ${e.openable ? '' : 'disabled'}>${e.openable ? 'Open this edition' : 'Cannot open: a document is missing'}</button>${e.takeaway?.ok ? `<span class="mission-takeaway">Takeaway: ${esc(e.takeaway.label)}</span>` : ''}</div>
        </article>`).join('') : '<p class="mission-empty">No editions in this export.</p>'}</div></section>
    </div>`;
    const grid = el.querySelector('[data-section="windows"]');
    windows.forEach((w) => grid.append(thumb(w)));
  }

  function show() {
    if (open) return;
    if (!el.isConnected) host.root.append(el);
    returnTo = document.activeElement;
    render();
    open = true; el.hidden = false; host.root.classList.add('mission-on');
    requestAnimationFrame(() => el.classList.add('on'));
    (el.querySelector('.mission-thumb') || el.querySelector('.mission-open:not([disabled])') || el.querySelector('[data-mission-close]')).focus({ preventScroll: true });
    host.announce?.('Mission Control');
  }
  function hide(restoreFocus = true) {
    if (!open) return;
    open = false; el.classList.remove('on'); host.root.classList.remove('mission-on');
    setTimeout(() => { if (!open) { el.hidden = true; el.replaceChildren(); ghosts = []; } }, 180);
    if (restoreFocus && returnTo?.isConnected) returnTo.focus?.({ preventScroll: true });
  }
  el.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-window],[data-open-edition],[data-open-document],[data-mission-close]');
    if (!t) { if (ev.target === el || ev.target.classList.contains('mission-inner')) hide(); return; }
    if (t.hasAttribute('data-mission-close')) { hide(); return; }
    if (t.dataset.window) { hide(false); host.focusWindow(t.dataset.window); return; }
    if (t.dataset.openDocument) { hide(false); try { host.openDocument(JSON.parse(t.dataset.openDocument)); } catch { /* malformed */ } return; }
    if (t.dataset.openEdition) { const e = (host.editions() || []).find((x) => x.id === t.dataset.openEdition); if (e?.openable) { hide(false); host.openEdition(e); } }
  }, { signal });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); hide(); return; }
    if (ev.key === 'Tab') { const items = [...el.querySelectorAll('button:not([disabled])')]; if (!items.length) return; const i = items.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); items.at(-1).focus(); } else if (!ev.shiftKey && i === items.length - 1) { ev.preventDefault(); items[0].focus(); } }
  }, { signal });
  return { show, hide, toggle() { open ? hide() : show(); }, isOpen: () => open, destroy() { ac.abort(); el.remove(); } };
}
