// Document identity belongs to the saved public export, never to a DOM position.
const specs = Object.freeze({
  kept: { field: 'kept', folder: 'kept', key: r => r.id },
  writing: { field: 'writing', folder: 'writing', key: r => r.slug || r.file },
  commit: { field: 'log', folder: 'log', key: r => r.sha },
  refused: { field: 'refused', folder: 'refused', key: (_r, i) => `refused:${i}` },
  correction: { field: 'wrong', folder: 'wrong', key: (_r, i) => `correction:${i}` },
});
export const documentKindForFolder = folder => Object.keys(specs).find(k => specs[k].folder === folder) || null;
const validString = s => typeof s === 'string' && s.length > 0 && s.length <= 4096;
export function isDocumentRef(ref) {
  return ref !== null && typeof ref === 'object' && !Array.isArray(ref) &&
    Object.hasOwn(specs, ref.kind) && validString(ref.key) && validString(ref.snapshot);
}
export function serializeDocumentRef(ref) {
  if (!isDocumentRef(ref)) throw new TypeError('Invalid document reference');
  return JSON.stringify({ kind: ref.kind, key: ref.key, snapshot: ref.snapshot });
}
export function parseDocumentRef(value) {
  if (typeof value !== 'string' || value.length > 12000) return null;
  try { const ref = JSON.parse(value); return isDocumentRef(ref) ? Object.freeze({kind:ref.kind,key:ref.key,snapshot:ref.snapshot}) : null; }
  catch { return null; }
}
export function documentHash(ref) { return '#document=' + encodeURIComponent(serializeDocumentRef(ref)); }
export function parseDocumentHash(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#document=')) return null;
  try { return parseDocumentRef(decodeURIComponent(hash.slice(10))); } catch { return null; }
}
export function createDocumentLibrary(corpus) {
  if (!validString(corpus?.generated)) throw new TypeError('A dated public export is required');
  const snapshot = corpus.generated;
  const byKind = new Map(), all = [];
  for (const [kind, spec] of Object.entries(specs)) {
    const lookup = new Map(), entries = [];
    for (const [index, record] of (corpus[spec.field] || []).entries()) {
      const key = spec.key(record, index);
      if (!validString(key)) continue; // A record without identity is not silently assigned a stable ID.
      const ref = Object.freeze({kind, key, snapshot});
      const entry = Object.freeze({ref, record, index, field: spec.field, folder: spec.folder,
        title: record.title || record.reason || record.subject || record.sentence || key,
        date: record.date || null});
      entries.push(entry); all.push(entry);
      // Preserve ambiguity instead of choosing whichever duplicate happened to arrive last.
      if (lookup.has(key)) lookup.set(key, null); else lookup.set(key, entry);
    }
    byKind.set(kind, {lookup, entries: Object.freeze(entries)});
  }
  function resolve(ref) {
    if (!isDocumentRef(ref)) return {ok:false, reason:'invalid-reference'};
    if (ref.snapshot !== snapshot) return {ok:false, reason:'snapshot-mismatch'};
    const lookup = byKind.get(ref.kind).lookup;
    if (!lookup.has(ref.key)) return {ok:false, reason:'not-found'};
    if (lookup.get(ref.key) === null) return {ok:false, reason:'ambiguous-reference'};
    return {ok:true, entry:lookup.get(ref.key)};
  }
  return Object.freeze({snapshot, resolve,
    entries: kind => kind ? (byKind.get(kind)?.entries || Object.freeze([])) : Object.freeze([...all]),
  });
}
