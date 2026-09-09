/* ══════════════════════════════════════════════════════════════════
   DOCUMENT DRAG AND DROP (#6): a record travels as its reference.

   What moves is a DocumentRef, serialized, under a private MIME type,
   plus a text/plain fallback carrying the record's document link so
   a drop outside the desk (a text field, another app) still yields
   something true. Nothing else is in the payload: no title, no body,
   no index. The receiver resolves the reference against the export
   and decides; an unresolvable reference is refused out loud.

   Drop targets declare what they accept. The desk owns which targets
   exist; this module only owns the wire format and the hover states.
   ══════════════════════════════════════════════════════════════════ */
import { serializeDocumentRef, parseDocumentRef, documentHash } from './documents.mjs';

export const DOCUMENT_MIME = 'application/x-zoom-document';

/* Attach to any element that represents a record. `getRef` runs at drag start. */
export function makeDraggable(el, getRef, { label = () => '', root = document.body } = {}) {
  el.draggable = true;
  el.addEventListener('dragstart', (ev) => {
    const ref = getRef();
    if (!ref) { ev.preventDefault(); return; }
    const key = serializeDocumentRef(ref);
    ev.dataTransfer.setData(DOCUMENT_MIME, key);
    const url = new URL('./desktop.html', location.href); url.hash = documentHash(ref);
    ev.dataTransfer.setData('text/plain', url.href);
    ev.dataTransfer.effectAllowed = 'copy';
    // a small chip as the drag image: the title, not the whole row
    const chip = document.createElement('div');
    chip.className = 'doc-drag-chip'; chip.textContent = label() || ref.key;
    chip.style.cssText = 'position:fixed;top:-1000px;left:-1000px;padding:6px 10px;border-radius:8px;background:#f6f6f7;color:#1d1d1f;font:13px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    document.body.append(chip);
    try { ev.dataTransfer.setDragImage(chip, 12, 16); } catch { /* not supported: browser default */ }
    setTimeout(() => chip.remove(), 0);
    root.classList.add('dragging-document');
    root.dataset.draggingKind = ref.kind;
  });
  el.addEventListener('dragend', () => { root.classList.remove('dragging-document'); delete root.dataset.draggingKind; });
}

/* Attach to any element that can receive a record.
   accepts(ref) → true | false | string(reason). onDrop(ref, ev). */
export function makeDropTarget(el, { accepts, onDrop, hoverClass = 'doc-drop-over', announce }) {
  let depth = 0;
  const refFrom = (ev) => { const raw = ev.dataTransfer?.getData(DOCUMENT_MIME); return raw ? parseDocumentRef(raw) : null; };
  const hasDocument = (ev) => [...(ev.dataTransfer?.types || [])].includes(DOCUMENT_MIME);
  el.addEventListener('dragenter', (ev) => { if (!hasDocument(ev)) return; ev.preventDefault(); depth++; el.classList.add(hoverClass); });
  el.addEventListener('dragover', (ev) => { if (!hasDocument(ev)) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
  el.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (depth === 0) el.classList.remove(hoverClass); });
  el.addEventListener('drop', (ev) => {
    if (!hasDocument(ev)) return;
    ev.preventDefault(); ev.stopPropagation(); depth = 0; el.classList.remove(hoverClass);
    const ref = refFrom(ev);
    if (!ref) { announce?.('That was not a public record.'); return; }
    const ok = accepts(ref);
    if (ok !== true) { announce?.(typeof ok === 'string' ? ok : 'This window does not take that kind of record.'); return; }
    onDrop(ref, ev);
  });
  return { destroy() { el.classList.remove(hoverClass); } };
}
