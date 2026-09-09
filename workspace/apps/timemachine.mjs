/* ══════════════════════════════════════════════════════════════════
   TIME MACHINE (#5): the public record, day by day.

   Two things are shown for a date and they are kept apart on screen:
     · "As of this day": counts derived from the dated records in the
       export (kept, refused, commits, writing, corrections dated on
       or before the day). Derived, never simulated; no telemetry.
     · "Authored on this day": the actual records dated that day,
       each openable in Finder or Notes.
   Days with nothing say so. The export is one snapshot; earlier
   snapshots of the site's data files exist in git history but are
   not in this export, and the footer says that.
   ══════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';
import { serializeDocumentRef } from '../documents.mjs';

/* Pure: build the day index once. Unit-tested. */
export function buildHistory(corpus, documents) {
  const days = new Map();
  const day = (d) => { if (!days.has(d)) days.set(d, { date: d, kept: [], refused: [], commits: [], writing: [], corrections: [] }); return days.get(d); };
  for (const entry of documents.entries('kept')) if (entry.date) day(entry.date).kept.push(entry);
  for (const entry of documents.entries('refused')) if (entry.date) day(entry.date).refused.push(entry);
  for (const entry of documents.entries('commit')) if (entry.date) day(entry.date).commits.push(entry);
  for (const entry of documents.entries('writing')) if (entry.date) day(entry.date).writing.push(entry);
  for (const entry of documents.entries('correction')) if (entry.date) day(entry.date).corrections.push(entry);
  const dates = [...days.keys()].sort();
  // cumulative state, walking forward
  const totals = { kept: 0, refused: 0, commits: 0, writing: 0, corrections: 0 };
  for (const d of dates) { const x = days.get(d); for (const k of Object.keys(totals)) totals[k] += x[k].length; x.asOf = { ...totals }; }
  return { dates, days, first: dates[0] || null, last: dates.at(-1) || null, snapshot: corpus.generated, totals };
}

/* Days can be asked for even when nothing is dated there: the answer is "nothing", and the state is the previous day's. */
export function stateAt(history, date) {
  const idx = history.dates.filter((d) => d <= date);
  const prev = idx.at(-1);
  return { date, asOf: prev ? history.days.get(prev).asOf : { kept: 0, refused: 0, commits: 0, writing: 0, corrections: 0 }, authored: history.days.get(date) || null, lastRecordedDay: prev || null };
}

const fmtDate = (d) => { const [y, m, dd] = d.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, dd)); return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };

export function mountTimeMachine(host, { corpus, documents, initialState, onOpenDocument, onOpenSource }) {
  const H = buildHistory(corpus, documents);
  const events = new AbortController(); const signal = events.signal;
  let date = initialState?.date && /^\d{4}-\d{2}-\d{2}$/.test(initialState.date) ? initialState.date : H.last;
  const repo = 'https://github.com/AriNova1/richie-jerimovich';

  const openBtn = (entry, label) => `<button type="button" class="tm-open" data-open="${e(serializeDocumentRef(entry.ref))}">${e(label)}</button>`;
  const num = (n) => String(n);

  function render() {
    if (!H.last) { host.innerHTML = '<div class="timemachine"><p class="tm-empty">The export has no dated records.</p></div>'; return; }
    const s = stateAt(H, date);
    const i = H.dates.indexOf(date);
    const prev = i > 0 ? H.dates[i - 1] : H.dates.filter((d) => d < date).at(-1) || null;
    const next = i >= 0 && i < H.dates.length - 1 ? H.dates[i + 1] : H.dates.find((d) => d > date) || null;
    const a = s.authored;
    const ghosts = [prev, H.dates.filter((d) => d < date).at(-2) || null].filter(Boolean);
    host.innerHTML = `<div class="timemachine" tabindex="-1" aria-label="Time Machine. Left and right arrows step between recorded days; Home and End jump to the first and latest.">
      <div class="tm-stage" aria-hidden="true">${ghosts.map((g, k) => `<div class="tm-ghost tm-ghost-${k + 1}"><span>${e(g)}</span></div>`).join('')}</div>
      <article class="tm-card" aria-live="polite">
        <header class="tm-head">
          <p class="tm-kicker">Public record · day ${i >= 0 ? i + 1 : '·'} of ${H.dates.length} with records · export ${e(H.snapshot)}</p>
          <h1>${e(fmtDate(date))}</h1>
          <div class="tm-nav">
            <button type="button" data-nav="first" ${date === H.first ? 'disabled' : ''} aria-label="First recorded day">⇤</button>
            <button type="button" data-nav="prev" ${prev ? '' : 'disabled'} aria-label="Previous recorded day">←</button>
            <label class="tm-pick">Date <input type="date" value="${e(date)}" min="${e(H.first)}" max="${e(H.last)}" aria-label="Pick a day"></label>
            <button type="button" data-nav="next" ${next ? '' : 'disabled'} aria-label="Next recorded day">→</button>
            <button type="button" data-nav="last" ${date === H.last ? 'disabled' : ''} aria-label="Latest recorded day">⇥</button>
          </div>
        </header>
        <section class="tm-section">
          <h2>As of this day <span class="tm-tier">derived from dated records</span></h2>
          <dl class="tm-state">
            <div><dt>Kept receipts</dt><dd>${num(s.asOf.kept)}</dd></div>
            <div><dt>Refused</dt><dd>${num(s.asOf.refused)}</dd></div>
            <div><dt>Commits</dt><dd>${num(s.asOf.commits)}</dd></div>
            <div><dt>Journal entries</dt><dd>${num(s.asOf.writing)}</dd></div>
            <div><dt>Corrections</dt><dd>${num(s.asOf.corrections)}</dd></div>
          </dl>
          <p class="tm-note">Counts of records dated on or before this day in the export generated ${e(H.snapshot)}. This is not a saved snapshot of the site on that day and carries no telemetry.${s.lastRecordedDay && s.lastRecordedDay !== date ? ` The last day with records before this one is ${e(s.lastRecordedDay)}.` : ''}</p>
        </section>
        <section class="tm-section">
          <h2>Authored on this day <span class="tm-tier">records</span></h2>
          ${a ? `
            ${a.kept.length ? `<h3>Kept receipts (${a.kept.length})</h3><ul>${a.kept.map((x) => `<li>${openBtn(x, x.title)}</li>`).join('')}</ul>` : ''}
            ${a.refused.length ? `<h3>Refused (${a.refused.length})</h3><ul>${a.refused.map((x) => `<li>${openBtn(x, `Commit ${(x.record.commit || '').slice(0, 7)}`)} <span class="tm-reason">${e(x.record.reason || '')}</span></li>`).join('')}</ul>` : ''}
            ${a.commits.length ? `<h3>Commits (${a.commits.length})</h3><ul>${a.commits.map((x) => `<li>${openBtn(x, x.ref.key.slice(0, 7))} <span class="tm-subject">${e(x.record.subject || '')}</span> <a class="tm-source" href="${e(repo + '/commit/' + x.ref.key)}" data-source>GitHub ↗</a></li>`).join('')}</ul>` : ''}
            ${a.writing.length ? `<h3>Journal (${a.writing.length})</h3><ul>${a.writing.map((x) => `<li>${openBtn(x, x.title)}</li>`).join('')}</ul>` : ''}
            ${a.corrections.length ? `<h3>Corrections (${a.corrections.length})</h3><ul>${a.corrections.map((x) => `<li>${openBtn(x, x.title)}</li>`).join('')}</ul>` : ''}
          ` : '<p class="tm-empty">No public record on this day.</p>'}
        </section>
        <footer class="tm-foot">Earlier versions of the site’s own data files exist in the repository’s git history and are not in this export; this view walks dated records, not saved states.</footer>
      </article>
    </div>`;
  }
  /* Re-rendering replaces the controls, so focus is put back on the control that was used, or on the panel itself; the date field only keeps focus when it was the one used. */
  function go(d, focusSel = '.timemachine') { if (!d) return; date = d; render(); host.querySelector(focusSel)?.focus({ preventScroll: true }); }

  host.addEventListener('click', (ev) => {
    const nav = ev.target.closest('[data-nav]'); const open = ev.target.closest('[data-open]'); const src = ev.target.closest('[data-source]');
    if (nav) { const i = H.dates.indexOf(date); const k = nav.dataset.nav; go(k === 'first' ? H.first : k === 'last' ? H.last : k === 'prev' ? (i > 0 ? H.dates[i - 1] : H.dates.filter((d) => d < date).at(-1)) : (i >= 0 && i < H.dates.length - 1 ? H.dates[i + 1] : H.dates.find((d) => d > date)), `[data-nav="${k}"]:not([disabled]), .timemachine`); return; }
    if (open) { try { onOpenDocument?.(JSON.parse(open.dataset.open)); } catch { /* malformed */ } return; }
    if (src) { ev.preventDefault(); onOpenSource?.(src.getAttribute('href')); }
  }, { signal });
  host.addEventListener('change', (ev) => { const inp = ev.target.closest('.tm-pick input'); if (inp && /^\d{4}-\d{2}-\d{2}$/.test(inp.value)) go(inp.value, '.tm-pick input'); }, { signal });
  host.addEventListener('keydown', (ev) => {
    if (ev.target.closest('input')) { if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { /* the date field owns arrows */ } return; }
    const step = (k) => { const btn = host.querySelector(`[data-nav="${k}"]`); if (btn && !btn.disabled) btn.click(); const back = host.querySelector('.timemachine'); if (back && !host.contains(document.activeElement)) back.focus({ preventScroll: true }); };
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); step('prev'); host.querySelector('.timemachine')?.focus({ preventScroll: true }); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); step('next'); host.querySelector('.timemachine')?.focus({ preventScroll: true }); }
    if (ev.key === 'Home') { ev.preventDefault(); go(H.first); }
    if (ev.key === 'End') { ev.preventDefault(); go(H.last); }
  }, { signal });

  render();
  return { getState() { return { date }; }, goTo: go, destroy() { events.abort(); host.replaceChildren(); } };
}
