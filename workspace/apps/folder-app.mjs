/* The folder, opened: what you have gathered, in your order. */
import { escapeHTML as e } from '../record.mjs';
import { serializeDocumentRef, parseDocumentRef } from '../documents.mjs';
import { bodyOf } from '../folder.mjs';

const KIND_WORD = { kept: 'Kept receipt', refused: 'Refusal', writing: 'Journal entry', commit: 'Commit', correction: 'Written correction' };

export function mountFolderApp(host, { folder, onOpenDocument, onTake, onCopy, announce }) {
  const ac = new AbortController(); const signal = ac.signal;
  let status = '';

  function render() {
    const { items, lost } = folder.read();
    host.innerHTML = `<div class="folderapp">
      <header class="fa-head">
        <p class="widget-kicker">The folder</p>
        <h1>${items.length ? `${items.length} artifact${items.length === 1 ? '' : 's'}, in the order you found them` : 'Nothing in it yet'}</h1>
        <p class="fa-lede" data-tier="editorial">${items.length
          ? 'Drag to reorder. What leaves is a typeset document with the full text of each record, a cover sheet naming the export it came from, and a colophon. It holds references, not copies, so it is rebuilt from the export at the moment you take it.'
          : 'Open a receipt, a refusal or a journal entry and it drops in here, in the order you found it. Then take the whole thing with you as a document you can print or keep.'}</p>
        <div class="fa-actions">
          <button type="button" data-take ${items.length ? '' : 'disabled'}>Take the folder</button>
          <button type="button" data-copy ${items.length ? '' : 'disabled'}>Copy as Markdown</button>
          <button type="button" data-empty class="fa-quiet" ${items.length ? '' : 'disabled'}>Empty it</button>
          <span role="status" class="fa-status">${e(status)}</span>
        </div>
      </header>
      ${items.length ? `<ol class="fa-list">${items.map((it, i) => `<li draggable="true" data-i="${i}" data-ref="${e(serializeDocumentRef(it.ref))}">
        <span class="fa-grip" aria-hidden="true"></span>
        <span class="fa-n">${String(i + 1).padStart(2, '0')}</span>
        <div class="fa-body">
          <button type="button" class="fa-open" data-open="${e(serializeDocumentRef(it.ref))}">${e(it.entry.title || it.ref.key)}</button>
          <p class="fa-meta" data-tier="export">${e(KIND_WORD[it.ref.kind] || it.ref.kind)} · ${e(it.entry.date || 'date not exported')} · <code>${e(it.ref.key)}</code></p>
          <p class="fa-how" data-tier="editorial">Found by ${e(it.how)}. ${bodyOf(it.entry).length} exported field${bodyOf(it.entry).length === 1 ? '' : 's'} will travel with it.</p>
        </div>
        <div class="fa-move"><button type="button" data-move="up" ${i === 0 ? 'disabled' : ''} aria-label="Move ${e(it.entry.title || it.ref.key)} up">↑</button><button type="button" data-move="down" ${i === items.length - 1 ? 'disabled' : ''} aria-label="Move ${e(it.entry.title || it.ref.key)} down">↓</button><button type="button" data-remove aria-label="Take ${e(it.entry.title || it.ref.key)} out of the folder">×</button></div>
      </li>`).join('')}</ol>` : ''}
      ${lost.length ? `<section class="fa-lost"><h2>Named but not shown</h2><p data-tier="editorial">These are in the folder and not in this export. They travel with the document as names rather than being dropped.</p><ul>${lost.map((x) => `<li data-tier="export"><code>${e(x.ref?.key || 'unreadable reference')}</code>: ${e(x.why)}</li>`).join('')}</ul></section>` : ''}
    </div>`;
  }

  const refOf = (el) => { try { return parseDocumentRef(el.closest('[data-ref]').dataset.ref); } catch { return null; } };
  const say = (t) => { status = t; render(); announce?.(t); };

  host.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('[data-open]')) { try { onOpenDocument?.(JSON.parse(t.closest('[data-open]').dataset.open)); } catch { /* malformed */ } return; }
    if (t.closest('[data-remove]')) { const r = refOf(t); if (r) { folder.remove(r); say('Taken out of the folder.'); } return; }
    const mv = t.closest('[data-move]');
    if (mv) { const i = Number(mv.closest('[data-i]').dataset.i); folder.move(i, mv.dataset.move === 'up' ? i - 1 : i + 1); render(); host.querySelectorAll('[data-move]')[0]?.focus?.(); return; }
    if (t.closest('[data-take]')) { onTake?.(); return; }
    if (t.closest('[data-copy]')) { onCopy?.().then((ok) => say(ok ? 'Markdown copied.' : 'This browser refused the clipboard. Take the folder instead.')); return; }
    if (t.closest('[data-empty]')) { folder.empty(); say('The folder is empty.'); }
  }, { signal });

  /* Reordering by drag, with the keyboard buttons as the equal path. */
  let from = null;
  host.addEventListener('dragstart', (ev) => { const li = ev.target.closest('li[data-i]'); if (!li) return; from = Number(li.dataset.i); li.classList.add('is-lifting'); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', li.dataset.ref); }, { signal });
  host.addEventListener('dragover', (ev) => { const li = ev.target.closest('li[data-i]'); if (li && from !== null) { ev.preventDefault(); li.classList.add('is-over'); } }, { signal });
  host.addEventListener('dragleave', (ev) => ev.target.closest('li[data-i]')?.classList.remove('is-over'), { signal });
  host.addEventListener('drop', (ev) => { const li = ev.target.closest('li[data-i]'); if (li && from !== null) { ev.preventDefault(); folder.move(from, Number(li.dataset.i)); } from = null; render(); }, { signal });
  host.addEventListener('dragend', () => { from = null; render(); }, { signal });

  const off = folder.onChange(() => render());
  render();
  return { getState() { return {}; }, refresh: render, destroy() { off(); ac.abort(); host.replaceChildren(); } };
}
