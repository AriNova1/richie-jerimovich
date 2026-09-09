/* ══════════════════════════════════════════════════════════════════
   INVESTIGATION — a refusal or a correction, read against its sources.

   Ambitions #10 (investigate a real refusal), #9 (evidence lens) and
   #23 (leave with a useful artifact), on the C0 app boundary.

   The reader has one rule: every sentence a visitor can act on names
   its source tier. The export carries dates, reasons and quotes; the
   git clone carries author times and subjects; the editorial section
   is labelled editorial and is nobody's private thought. Nothing here
   is simulated: the refusal reasons are the ledger's own words, and
   every "Open in Finder" resolves a real document reference or says
   plainly that it cannot.

   Export (#23) writes exactly what is on screen, with the same
   labels, as Markdown. It never adds a fact the reader did not show.
   ══════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';
import { serializeDocumentRef } from '../documents.mjs';

const TIER = {
  export: 'export',              // corpus.json, generated at the snapshot
  git: 'git clone',              // author dates and subjects from the local clone of the public repository
  editorial: 'editorial',
};
const fmtTime = (iso) => {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  return `${m[1]} ${m[2]}:${m[3]}:${m[4]} (UTC${m[5]}:${m[6]})`;
};

export function mountInvestigation(host, { corpus, documents, cases, initialState, onOpenDocument, onOpenSource }) {
  const events = new AbortController();
  const signal = events.signal;
  const all = cases?.cases || [];
  let current = all.find((c) => c.id === initialState?.caseId) || all[0] || null;

  function refFor(sp) {
    // a dossier source pointer → a resolvable DocumentRef, or null when the export has no identity for it
    if (!sp) return null;
    if (sp.kind === 'commit') { const r = (corpus.log || []).find((x) => x.sha === sp.key || x.sha?.startsWith(sp.key)); return r ? { kind: 'commit', key: r.sha, snapshot: cases.snapshot } : null; }
    if (['kept', 'refused', 'writing'].includes(sp.kind)) return { kind: sp.kind, key: sp.key, snapshot: sp.snapshot || cases.snapshot };
    return null;
  }
  const resolved = (sp) => { const ref = refFor(sp); if (!ref) return { ref: null, ok: false }; const r = documents.resolve(ref); return { ref, ok: r.ok, entry: r.ok ? r.entry : null, reason: r.ok ? null : r.reason }; };
  const commitUrl = (sha) => `${cases.repository}/commit/${sha}`;

  function tier(label, kind) { return `<span class="inv-tier inv-tier-${kind}" title="${kind === 'export' ? 'From the public export generated ' + e(cases.snapshot) : kind === 'git' ? 'Author time and subject from the local git clone of the public repository; the export carries the date only' : 'Editorial interpretation, labelled as such. Not Richie’s private thought.'}">${e(label)}</span>`; }

  function render() {
    if (!current) { host.innerHTML = `<div class="investigation"><h1>No investigation is available</h1><p>The dossier file has no cases.</p></div>`; return; }
    const c = current;
    const refused = c.refs.filter((s) => s.kind === 'refused');
    const kept = c.refs.filter((s) => s.kind === 'kept');
    const writing = c.refs.filter((s) => s.kind === 'writing');
    const openBtn = (sp, label = 'Open in Finder') => { const r = resolved(sp); return r.ok ? `<button type="button" class="inv-open" data-open="${e(serializeDocumentRef(r.ref))}">${e(label)}</button>` : `<span class="inv-unavailable" title="${e(r.reason || 'no identity in the export')}">Not in this export</span>`; };

    host.innerHTML = `<article class="investigation" data-case="${e(c.id)}">
      <header class="inv-head">
        <p class="inv-kicker">Investigation · ${c.kind === 'refusal' ? 'a refusal' : 'a correction'} · export ${e(cases.snapshot)}</p>
        <h1>${e(c.title)}</h1>
        <p class="inv-intro">${e(c.introduction)}</p>
        <div class="inv-actions">
          ${all.length > 1 ? `<label class="inv-switch">Case <select data-case-switch>${all.map((x) => `<option value="${e(x.id)}" ${x.id === c.id ? 'selected' : ''}>${e(x.title)}</option>`).join('')}</select></label>` : ''}
          <button type="button" data-export="markdown">Export as Markdown</button>
          <button type="button" data-export="print">Print view</button>
          <button type="button" data-export="copy">Copy Markdown</button>
          <span role="status" class="inv-status" data-export-status></span>
        </div>
      </header>

      <section class="inv-section">
        <h2>What the ledger says ${tier(TIER.export, 'export')}</h2>
        <ul class="inv-refusals">${refused.map((sp) => `<li>
          <p class="inv-quote">“${e(sp.quoteOrSummary)}”</p>
          <p class="inv-meta"><code>${e(sp.key)}</code> · commit <code>${e(sp.commit)}</code> · rejected ${e(sp.date)} ${openBtn(sp)} <a class="inv-source" href="${e(commitUrl(sp.commit))}" data-source>Commit on GitHub ↗</a></p>
        </li>`).join('')}</ul>
        ${kept.map((sp) => `<p class="inv-kept">Kept that day: <strong>${e(sp.title)}</strong> <code>${e(sp.key)}</code> ${openBtn(sp)}</p>`).join('')}
      </section>

      <section class="inv-section">
        <h2>Chronology ${tier(TIER.git, 'git')}</h2>
        <p class="inv-note">Times are author times from the git clone. The export and the refusal ledger carry dates only, so no refusal has a time of day.</p>
        <ol class="inv-timeline">${c.chronology.map((ev) => `<li>
          <time datetime="${e(ev.time)}">${e(fmtTime(ev.time))}</time>
          <div><p class="inv-event">${e(ev.event)}</p><p class="inv-meta"><code>${e(ev.commit)}</code> ${e(ev.subject)} ${openBtn({ kind: 'commit', key: ev.commit })} <a class="inv-source" href="${e(commitUrl(ev.commit))}" data-source>GitHub ↗</a> <span class="inv-tiersrc">${e(ev.timeSource)}</span></p></div>
        </li>`).join('')}</ol>
      </section>

      <section class="inv-section">
        <h2>What Richie wrote that day ${tier(TIER.export, 'export')}</h2>
        ${writing.map((sp) => `<blockquote class="inv-writing"><p>“${e(sp.quoteOrSummary)}”</p><footer><code>${e(sp.file)}</code> ${openBtn(sp, 'Open in Notes')}</footer></blockquote>`).join('') || '<p class="inv-note">No journal entry is cited.</p>'}
      </section>

      <section class="inv-section">
        <h2>Questions to take into the record</h2>
        <ol class="inv-questions">${(c.questions || []).map((q) => `<li>${e(q)}</li>`).join('')}</ol>
      </section>

      <section class="inv-section">
        <h2>Recorded outcome ${tier(TIER.export, 'export')}</h2>
        <p class="inv-outcome">${e(c.outcome)}</p>
        <h3>What is missing</h3>
        <p class="inv-note">${e(c.missing)}</p>
      </section>

      <section class="inv-section inv-editorial">
        <h2>Interpretation ${tier(TIER.editorial, 'editorial')}</h2>
        <p class="inv-reading">${e(String(c.editorial).replace(/^Editorial Interpretation:\s*/, ''))}</p>
        ${c.corrections?.length ? `<h3>Corrections made to the dossier before publication</h3><ul class="inv-corrections">${c.corrections.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
      </section>
      <footer class="inv-foot">Public export ${e(cases.snapshot)} · repository ${e(cases.repository)} · nothing here is simulated</footer>
    </article>`;
  }

  /* ── export: exactly what is on screen, as Markdown ────────────── */
  function markdown() {
    const c = current; if (!c) return '';
    const L = [];
    L.push(`# ${c.title}`, '', `Investigation · ${c.kind === 'refusal' ? 'a refusal' : 'a correction'} · public export ${cases.snapshot}`, '', c.introduction, '');
    L.push(`## What the ledger says (source: export)`, '');
    for (const sp of c.refs.filter((s) => s.kind === 'refused')) L.push(`- “${sp.quoteOrSummary}”  `, `  ${sp.key} · commit ${sp.commit} · rejected ${sp.date} · ${commitUrl(sp.commit)}`);
    for (const sp of c.refs.filter((s) => s.kind === 'kept')) L.push(`- Kept that day: **${sp.title}** (${sp.key})`);
    L.push('', `## Chronology (source: git clone author times; the export carries dates only)`, '');
    for (const ev of c.chronology) L.push(`- ${fmtTime(ev.time)} · ${ev.commit} · ${ev.subject}  `, `  ${ev.event}  `, `  ${commitUrl(ev.commit)}`);
    L.push('', `## What Richie wrote that day (source: export)`, '');
    for (const sp of c.refs.filter((s) => s.kind === 'writing')) L.push(`> ${sp.quoteOrSummary}`, `> ${sp.file}`, '');
    L.push(`## Questions to take into the record`, '');
    (c.questions || []).forEach((q, i) => L.push(`${i + 1}. ${q}`));
    L.push('', `## Recorded outcome (source: export)`, '', c.outcome, '', `### What is missing`, '', c.missing, '');
    L.push(`## Interpretation (editorial, labelled; not Richie’s private thought)`, '', String(c.editorial).replace(/^Editorial Interpretation:\s*/, ''), '');
    if (c.corrections?.length) { L.push(`### Corrections made to the dossier before publication`, ''); c.corrections.forEach((x) => L.push(`- ${x}`)); L.push(''); }
    L.push(`---`, `Exported from Richie’s public workspace. Public export ${cases.snapshot}. Repository ${cases.repository}. Nothing here is simulated.`, '');
    return L.join('\n');
  }
  function printView() {
    const md = markdown();
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${e(current.title)}</title><style>body{font:15px/1.55 -apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;color:#1d1d1f;max-width:720px;margin:48px auto;padding:0 24px}h1{font-size:28px;letter-spacing:-.02em;line-height:1.15}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#6e6e73;margin-top:32px}h3{font-size:14px;margin-top:20px}blockquote{margin:12px 0;padding-left:14px;border-left:2px solid #ddd;color:#3a3a3c}code{font:12.5px ui-monospace,Menlo,monospace;background:#f0f0f2;padding:1px 4px;border-radius:3px}li{margin:6px 0}a{color:#0066cc;word-break:break-all}hr{border:0;border-top:1px solid #ddd;margin:32px 0}@media print{body{margin:0;max-width:none}a{color:inherit;text-decoration:none}}</style></head><body>${mdToHtml(md)}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const w = window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return Boolean(w);
  }
  /* a deliberately small Markdown subset: headings, lists, quotes, bold, code, links, paragraphs; enough for the export we wrote */
  function mdToHtml(md) {
    const inline = (t) => e(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>');
    const out = []; let list = null, quote = [];
    const flush = () => { if (list) { out.push(`</${list}>`); list = null; } if (quote.length) { out.push(`<blockquote>${quote.map((q) => `<p>${inline(q)}</p>`).join('')}</blockquote>`); quote = []; } };
    for (const raw of md.split('\n')) {
      const line = raw.replace(/\s+$/, '');
      if (/^# /.test(line)) { flush(); out.push(`<h1>${inline(line.slice(2))}</h1>`); }
      else if (/^## /.test(line)) { flush(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
      else if (/^### /.test(line)) { flush(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
      else if (/^> ?/.test(line)) { if (list) { out.push(`</${list}>`); list = null; } quote.push(line.replace(/^> ?/, '')); }
      else if (/^- /.test(line)) { if (quote.length) flush(); if (list !== 'ul') { if (list) out.push(`</${list}>`); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(line.slice(2))}</li>`); }
      else if (/^\d+\. /.test(line)) { if (quote.length) flush(); if (list !== 'ol') { if (list) out.push(`</${list}>`); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`); }
      else if (/^  \S/.test(raw) && list) { out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, `<br>${inline(raw.trim())}</li>`); }
      else if (line === '---') { flush(); out.push('<hr>'); }
      else if (line === '') { flush(); }
      else { flush(); out.push(`<p>${inline(line)}</p>`); }
    }
    flush();
    return out.join('\n');
  }

  host.addEventListener('click', async (ev) => {
    const open = ev.target.closest('[data-open]'); const src = ev.target.closest('[data-source]'); const ex = ev.target.closest('[data-export]');
    if (open) { ev.preventDefault(); try { onOpenDocument?.(JSON.parse(open.dataset.open)); } catch { /* malformed ref: ignore */ } return; }
    if (src) { ev.preventDefault(); onOpenSource?.(src.getAttribute('href')); return; }
    if (ex) {
      const status = host.querySelector('[data-export-status]');
      const kind = ex.dataset.export;
      try {
        if (kind === 'copy') { await navigator.clipboard.writeText(markdown()); status.textContent = 'Markdown copied'; }
        else if (kind === 'markdown') {
          const url = URL.createObjectURL(new Blob([markdown()], { type: 'text/markdown' }));
          const a = document.createElement('a'); a.href = url; a.download = `${current.id}.md`; a.rel = 'noopener'; host.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 10000); status.textContent = `Saved ${current.id}.md`;
        }
        else if (kind === 'print') { status.textContent = printView() ? 'Print view opened in a new tab' : 'The browser blocked the print view; allow pop-ups for this page.'; }
      } catch { status.textContent = 'Export is unavailable in this browser.'; }
    }
  }, { signal });
  host.addEventListener('change', (ev) => { const s = ev.target.closest('[data-case-switch]'); if (!s) return; current = all.find((c) => c.id === s.value) || current; render(); }, { signal });

  render();
  return {
    getState() { return { caseId: current?.id || null }; },
    markdown,
    destroy() { events.abort(); host.replaceChildren(); },
  };
}

/* Which case, if any, covers a document reference? Used by the desktop to offer "Investigate" only where a dossier exists. */
export function caseForRef(cases, ref) {
  if (!ref || !cases?.cases) return null;
  return cases.cases.find((c) => c.refs.some((sp) => (sp.kind === ref.kind && sp.key === ref.key) || (ref.kind === 'commit' && sp.kind === 'commit' && ref.key.startsWith(sp.key)))) || null;
}
