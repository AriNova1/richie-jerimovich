import {escapeHTML as e, renderDirectory} from '../record.mjs';
import {documentHash} from '../documents.mjs';
export function mountDocumentPreview(host, {corpus, documents, initialState, onOpenDocument, onCompareDocument, onInvestigate, hasCase, onSendToMessages}) {
  const result = documents.resolve(initialState?.ref);
  const events = new AbortController();
  let alive = true;
  if (!result.ok) {
    host.innerHTML='<div class="document-preview"><h1>Document unavailable</h1><p>This reference does not resolve in the current saved record.</p></div>';
  } else {
    const {entry} = result;
    const content = renderDirectory({...corpus, [entry.field]: [entry.record]}, entry.folder);
    host.innerHTML=`<article class="document-preview"><div class="document-preview-actions"><button data-reveal-document>Open in Finder</button>${entry.ref.kind==='kept'?'<button data-preview-compare>Compare…</button>':''}${hasCase?.(entry.ref)?'<button data-preview-investigate>Investigate…</button>':''}${onSendToMessages?'<button data-preview-send>Ask Richie about this</button>':''}<button data-copy-document-link>Copy document link</button><span role="status" data-copy-status></span></div><header><p>${e(entry.folder)} · ${e(entry.date || 'Date unavailable')}</p><h1>${e(entry.title)}</h1></header><div class="document-preview-content">${content}</div><footer>Saved export: ${e(entry.ref.snapshot)}</footer></article>`;
    // renderDirectory's refusal count describes a collection, not a one-document preview.
    if (entry.ref.kind === 'refused') host.querySelector('.document-preview-content > .record-note')?.remove();
    for (const d of host.querySelectorAll('details')) d.open=true;
    host.querySelector('[data-reveal-document]').addEventListener('click',()=>onOpenDocument?.(entry.ref),{signal:events.signal});
    host.querySelector('[data-preview-compare]')?.addEventListener('click',()=>onCompareDocument?.(entry.ref),{signal:events.signal});
    host.querySelector('[data-preview-investigate]')?.addEventListener('click',()=>onInvestigate?.(entry.ref),{signal:events.signal});   // C4
    host.querySelector('[data-preview-send]')?.addEventListener('click',()=>onSendToMessages?.(entry.ref),{signal:events.signal});   // C6
    host.querySelector('[data-copy-document-link]').addEventListener('click',async()=>{
      const status=host.querySelector('[data-copy-status]');
      const url=new URL('./desktop.html',location.href);url.hash=documentHash(entry.ref);
      try { await navigator.clipboard.writeText(url.href); if(alive) status.textContent='Link copied'; }
      catch { if(alive) status.textContent='Copy is unavailable in this browser.'; }
    },{signal:events.signal});
  }
  return {getState(){return {ref:initialState?.ref};}, destroy(){alive=false;events.abort();host.replaceChildren();}};
}
