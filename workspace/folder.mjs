/* ══════════════════════════════════════════════════════════════════
   THE FOLDER (#23): leave with something you assembled yourself.

   Not an export button. A folder that sits on the desk and fills as
   you walk through the record. Anything you look at closely goes in,
   in the order you found it, with a line saying how you got there.
   The tab counts it and the folder thickens.

   Taking it produces a typeset document, not a page dump: a cover
   sheet naming the export it was drawn from and the day it was made,
   the artifacts in your order with the full text of each, and a
   colophon that reports the provenance of everything inside using
   the same five tiers the evidence lens paints with. A visitor's
   selection is not a publication, and the cover says so.

   The folder holds references, never copies. Every reference is
   re-resolved against the export at open time, so a folder made
   against an older export names what it can no longer show rather
   than silently producing a shorter document.
   ══════════════════════════════════════════════════════════════════ */
import { serializeDocumentRef, parseDocumentRef } from './documents.mjs';

export const FOLDER_VERSION = 1;
const LIMIT = 40;

const KIND_WORD = { kept: 'Kept receipt', refused: 'Refusal', writing: 'Journal entry', commit: 'Commit', correction: 'Written correction' };
/* The tier each kind of record sits at, in the evidence lens's vocabulary. */
const KIND_TIER = { kept: 'export', refused: 'export', writing: 'export', commit: 'export', correction: 'export' };

/* Pure. The folder is a list of {ref, how, at}; this validates one
   against the live export and returns what can be shown. Unit-tested. */
export function resolveFolder(items, documents) {
  const kept = [], lost = [];
  const seen = new Set();
  for (const it of items || []) {
    let ref = null;
    try { ref = typeof it.ref === 'string' ? parseDocumentRef(it.ref) : it.ref; } catch { ref = null; }
    if (!ref) { lost.push({ ...it, why: 'unreadable reference' }); continue; }
    const key = ref.kind + ':' + ref.key;
    if (seen.has(key)) continue;                       // the same record twice is one artifact, not two
    seen.add(key);
    const r = documents.resolve(ref);
    if (!r.ok) { lost.push({ ...it, ref, why: r.reason || 'not in this export' }); continue; }
    kept.push({ ref: r.entry.ref, entry: r.entry, how: it.how || 'opened', at: it.at || null });
  }
  return { items: kept, lost, count: kept.length };
}

/**
 * storage: a Storage-like object or null. persist: boolean, only ever
 * true when the visitor has already opted into being remembered.
 */
export function createFolder({ documents, storage, key = 'zoom.folder.v1', persist = () => false } = {}) {
  let items = [];
  const listeners = new Set();
  const emit = () => { save(); for (const fn of listeners) fn(read()); };

  function save() {
    if (!storage || !persist()) return;
    try { storage.setItem(key, JSON.stringify({ v: FOLDER_VERSION, snapshot: documents.snapshot, items: items.map((i) => ({ ref: serializeDocumentRef(i.ref), how: i.how, at: i.at })) })); } catch { /* full or blocked */ }
  }
  function load() {
    if (!storage) return;
    try {
      const raw = JSON.parse(storage.getItem(key) || 'null');
      if (!raw || raw.v !== FOLDER_VERSION) return;    // an unknown version restores nothing rather than guessing
      items = (raw.items || []).slice(0, LIMIT);
    } catch { /* unreadable */ }
  }
  function read() { return resolveFolder(items, documents); }

  return {
    load, onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    read, count: () => read().count, raw: () => items.slice(),
    has(ref) { return items.some((i) => { try { const p = typeof i.ref === 'string' ? parseDocumentRef(i.ref) : i.ref; return p.kind === ref.kind && p.key === ref.key; } catch { return false; } }); },
    add(ref, how = 'opened') {
      if (!ref || !documents.resolve(ref).ok) return { ok: false, reason: 'not in this export' };
      if (this.has(ref)) return { ok: false, reason: 'already in the folder' };
      if (items.length >= LIMIT) return { ok: false, reason: `the folder holds ${LIMIT}` };
      items.push({ ref, how, at: new Date().toISOString() });
      emit(); return { ok: true, count: read().count };
    },
    remove(ref) { const n = items.length; items = items.filter((i) => { try { const p = typeof i.ref === 'string' ? parseDocumentRef(i.ref) : i.ref; return !(p.kind === ref.kind && p.key === ref.key); } catch { return true; } }); if (items.length !== n) emit(); },
    move(from, to) { if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return; const [x] = items.splice(from, 1); items.splice(to, 0, x); emit(); },
    empty() { items = []; emit(); if (storage) { try { storage.removeItem(key); } catch { /* blocked */ } } },
  };
}

/* ── what leaves the building ─────────────────────────────────────── */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const titleOf = (e) => e.title || e.ref.key;
const dateOf = (e) => e.date || 'date not exported';

/* The full text of one record, as the export carries it. Nothing is
   summarised: a folder that paraphrased would be worth less than the
   links it replaced. */
export function bodyOf(entry) {
  const r = entry.record || {};
  const rows = [];
  const put = (k, v) => { if (v != null && v !== '') rows.push([k, String(v)]); };
  switch (entry.ref.kind) {
    case 'kept':
      put('Claim', r.claim || r.summary); put('Category', r.category); put('Confidence', r.confidence);
      put('Verification method', r.verify_method); put('Recorded result', r.verify_result); put('Command', r.verify_cmd);
      if (r.limits?.length) put('Limits', r.limits.join('\n'));
      if (r.evidence?.length) put('Evidence', r.evidence.map((v) => `${v.label || v.type || 'Evidence'}: ${v.url || 'no link exported'}`).join('\n'));
      break;
    case 'refused': put('Commit', r.commit); put('Published reason', r.reason || 'Reason not exported'); break;
    case 'commit': put('Subject', r.subject); put('SHA', entry.ref.key); break;
    case 'writing': put('Excerpt', (r.paras || []).join('\n\n') || 'Paragraphs not exported'); put('Source file', r.file); break;
    case 'correction': put('What changed', r.sentence); put('Source file', r.file); break;
    default: break;
  }
  return rows;
}

export function folderMarkdown({ items, lost }, { snapshot, repository, made }) {
  const L = [`# A folder from Richie's public record`, '',
    `Assembled by a visitor on ${made}. Drawn from the public export generated ${snapshot}.`,
    `${items.length} artifact${items.length === 1 ? '' : 's'}, in the order they were found. This is one visitor's selection, not a publication.`, ''];
  items.forEach((it, i) => {
    L.push(`## ${i + 1}. ${titleOf(it.entry)}`, '',
      `${KIND_WORD[it.ref.kind] || it.ref.kind} · ${dateOf(it.entry)} · \`${it.ref.key}\` · found by ${it.how}`, '');
    for (const [k, v] of bodyOf(it.entry)) L.push(`**${k}.** ${v.replace(/\n/g, '  \n')}`, '');
  });
  if (lost.length) { L.push('## Named but not shown', '', 'These were in the folder and are not in this export. They are named rather than dropped:', ''); for (const x of lost) L.push(`- \`${x.ref?.key || 'unreadable'}\` (${x.why})`); L.push(''); }
  L.push('## Colophon', '',
    `Every artifact above is a field of a record in the export generated ${snapshot}. Nothing is summarised, interpolated or simulated.`,
    `The records themselves live at ${repository}.`,
    `A folder holds references, never copies, so this document was rebuilt from the export at the moment it was taken.`);
  return L.join('\n');
}

/* A typeset document, not a page dump: a cover sheet, a running head,
   the artifacts, and a colophon. Printable at A4 and at Letter. */
export function folderDocument(resolved, { snapshot, repository, made }) {
  const { items, lost } = resolved;
  const entry = (it, i) => `<article class="artifact">
    <header><p class="a-num">${String(i + 1).padStart(2, '0')}</p>
      <h2>${esc(titleOf(it.entry))}</h2>
      <p class="a-meta"><span class="a-kind">${esc(KIND_WORD[it.ref.kind] || it.ref.kind)}</span><span>${esc(dateOf(it.entry))}</span><code>${esc(it.ref.key)}</code><span class="a-tier" data-t="${esc(KIND_TIER[it.ref.kind] || 'export')}">in the export</span></p>
      <p class="a-how">Found by ${esc(it.how)}.</p></header>
    <dl>${bodyOf(it.entry).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v.includes('\n') ? v.split('\n').map((line) => `<p>${esc(line)}</p>`).join('') : esc(v)}</dd></div>`).join('')}</dl>
  </article>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>A folder from Richie's public record</title>
<style>
  @page{size:A4;margin:20mm 18mm 22mm}
  :root{--ink:#14161a;--soft:#5d626b;--rule:#d9dbe0;--paper:#fbfbfa;--accent:#1d6f43}
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:#8b8d92;color:var(--ink);font:15px/1.62 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-feature-settings:"kern","liga","onum"}
  .sheet{max-width:186mm;margin:26px auto;background:var(--paper);padding:24mm 20mm 22mm;box-shadow:0 24px 70px rgba(0,0,0,.32)}
  .cover{border-bottom:2px solid var(--ink);padding-bottom:22px;margin-bottom:30px}
  .cover .rubric{font:600 10.5px/1 ui-sans-serif,-apple-system,system-ui;letter-spacing:.19em;text-transform:uppercase;color:var(--soft);margin:0 0 16px}
  h1{font-size:37px;line-height:1.08;letter-spacing:-.015em;margin:0 0 14px;font-weight:600}
  .cover .lede{font-size:16.5px;line-height:1.5;margin:0 0 18px;max-width:34em}
  .facts{display:grid;grid-template-columns:max-content max-content minmax(0,1fr);gap:14px 26px;margin:0;padding-top:16px;border-top:1px solid var(--rule)}
  .facts dt{font:600 9.5px/1 ui-sans-serif,-apple-system,system-ui;letter-spacing:.13em;text-transform:uppercase;color:var(--soft);margin:0 0 4px}
  .facts dd{margin:0;font:12.5px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
  .artifact{padding:22px 0 6px;border-top:1px solid var(--rule);break-inside:avoid-page}
  .artifact:first-of-type{border-top:0}
  .a-num{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;color:var(--accent);margin:0 0 7px}
  .artifact h2{font-size:21px;line-height:1.24;letter-spacing:-.01em;margin:0 0 8px;font-weight:600}
  .a-meta{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin:0 0 3px;font:11.5px/1.5 ui-sans-serif,-apple-system,system-ui;color:var(--soft)}
  .a-meta code{font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .a-kind{font-weight:650;color:var(--ink)}
  .a-tier{border:1px solid #a9d6bd;background:#eef8f1;color:var(--accent);border-radius:999px;padding:1px 8px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;font-weight:650}
  .a-how{margin:0 0 12px;font:11.5px/1.5 ui-sans-serif,-apple-system,system-ui;color:var(--soft);font-style:italic}
  .artifact dl{margin:0;display:grid;gap:9px}
  .artifact dt{font:600 9.5px/1 ui-sans-serif,-apple-system,system-ui;letter-spacing:.13em;text-transform:uppercase;color:var(--soft);margin-bottom:3px}
  .artifact dd{margin:0;font-size:14.5px;max-width:62ch}
  .artifact dd p{margin:0 0 6px}
  .artifact dd:has(+ *) {margin:0}
  .lost{margin-top:26px;padding:14px 16px;border-left:3px solid #c4903a;background:#fdf7ec}
  .lost h2{font-size:14px;margin:0 0 6px;font-weight:650}
  .lost ul{margin:6px 0 0;padding-left:18px;font-size:13px}
  .colophon{margin-top:34px;padding-top:16px;border-top:2px solid var(--ink);font-size:12.5px;line-height:1.6;color:var(--soft);max-width:60ch}
  .colophon h2{font:600 9.5px/1 ui-sans-serif,-apple-system,system-ui;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);margin:0 0 10px}
  .colophon p{margin:0 0 7px}
  .colophon a{color:var(--accent)}
  @media print{
    body{background:#fff}
    .sheet{box-shadow:none;margin:0;padding:0;max-width:none}
    .artifact{break-inside:avoid-page}
    .cover{break-after:avoid-page}
  }
  @media(max-width:640px){.sheet{padding:18px 16px;margin:0}.facts{grid-template-columns:1fr;gap:12px}h1{font-size:27px}}
</style></head><body><main class="sheet">
  <header class="cover">
    <p class="rubric">A folder from Richie's public record</p>
    <h1>${items.length} artifact${items.length === 1 ? '' : 's'}, in the order they were found</h1>
    <p class="lede">This is one visitor's selection, assembled while reading the public record. It is not a publication, not a summary and not an endorsement. Every line below is a field of a record in the export named here, reproduced in full.</p>
    <dl class="facts">
      <div><dt>Taken</dt><dd>${esc(made)}</dd></div>
      <div><dt>Public export</dt><dd>${esc(snapshot)}</dd></div>
      <div><dt>Repository</dt><dd>${esc(repository)}</dd></div>
    </dl>
  </header>
  ${items.map(entry).join('')}
  ${lost.length ? `<section class="lost"><h2>Named but not shown</h2><p>These were in the folder and are not in this export. They are named rather than quietly dropped.</p><ul>${lost.map((x) => `<li><code>${esc(x.ref?.key || 'unreadable reference')}</code>: ${esc(x.why)}</li>`).join('')}</ul></section>` : ''}
  <footer class="colophon"><h2>Colophon</h2>
    <p>Assembled ${esc(made)} from the public export generated ${esc(snapshot)}. The folder holds references, never copies, so this document was rebuilt from the export at the moment it was taken.</p>
    <p>Nothing here is summarised, interpolated or simulated. Where a field was not exported, the document says so in the place the value would have been.</p>
    <p>The records themselves are at <a href="${esc(repository)}">${esc(repository)}</a>.</p>
  </footer>
</main></body></html>`;
}
