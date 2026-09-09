/* ══════════════════════════════════════════════════════════════════
   WORKSPACE MEMORY — remember the visitor's place (#19), opt-in.

   Stores only what the visitor did on this desk: which windows were
   open and where, which public records were selected or shown, and
   the visitor's own unsent text. It never stores corpus content, and
   it never fills a gap with a different document: a saved reference
   that does not resolve in the current export is dropped and named.

   Storage is versioned. An unknown version restores nothing. A
   browser without working storage (private mode, quota, disabled)
   reports itself and the desk works as before.
   ══════════════════════════════════════════════════════════════════ */
export const WORKSPACE_VERSION = 1;

function probeStorage(storage) {
  try {
    const k = '__zoom_probe__' + Math.random().toString(36).slice(2);
    storage.setItem(k, '1'); const ok = storage.getItem(k) === '1'; storage.removeItem(k);
    return ok;
  } catch { return false; }
}

export function createWorkspaceMemory({ storage, key = 'zoom.workspace', snapshot, documents, isKnownCase = () => true } = {}) {
  let store = storage;
  if (store === undefined) { try { store = globalThis.localStorage; } catch { store = null; } }
  const available = Boolean(store) && probeStorage(store);
  const OPTIN = key + '.optin', STATE = key + '.v' + WORKSPACE_VERSION;
  const read = (k) => { try { return store.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { store.setItem(k, v); return { ok: true }; } catch (err) { return { ok: false, reason: /quota/i.test(String(err?.name || err)) ? 'quota' : 'unavailable' }; } };
  const remove = (k) => { try { store.removeItem(k); } catch { /* nothing to do */ } };

  const enabled = () => available && read(OPTIN) === '1';

  /* Validation: keep only references that resolve in THIS export. */
  function validate(state) {
    const stale = [];
    const ref = (r, where) => {
      if (!r) return null;
      const res = documents.resolve(r);
      if (res.ok) return res.entry.ref;
      stale.push({ where, kind: r.kind, key: r.key, reason: res.reason });
      return null;
    };
    const out = {
      version: WORKSPACE_VERSION, snapshot: state.snapshot, savedAt: state.savedAt,
      appearance: state.appearance === 'dark' ? 'dark' : 'light',
      finder: state.finder && typeof state.finder.folder === 'string' ? { folder: state.finder.folder, view: ['icons', 'list', 'gallery'].includes(state.finder.view) ? state.finder.view : 'list' } : null,
      selectedDocument: ref(state.selectedDocument, 'selection'),
      drafts: { messages: typeof state.drafts?.messages === 'string' ? state.drafts.messages.slice(0, 2000) : '' },
      windows: [],
    };
    for (const w of Array.isArray(state.windows) ? state.windows : []) {
      if (!w || typeof w.id !== 'string') continue;
      const entry = { id: w.id, hidden: Boolean(w.hidden), geometry: w.geometry && typeof w.geometry === 'object' ? w.geometry : null, state: null };
      if (w.id === 'preview') { const r = ref(w.state?.ref, 'Quick Look'); if (!r) continue; entry.state = { ref: r }; }
      else if (w.id === 'comparison') {
        const l = ref(w.state?.leftId ? { kind: 'kept', key: w.state.leftId, snapshot } : null, 'Compare, left');
        const rr = ref(w.state?.rightId ? { kind: 'kept', key: w.state.rightId, snapshot } : null, 'Compare, right');
        if (!l && !rr) continue;
        entry.state = { leftId: l?.key, rightId: rr?.key };
      }
      else if (w.id === 'investigation') { if (!isKnownCase(w.state?.caseId)) { stale.push({ where: 'Investigation', kind: 'case', key: String(w.state?.caseId), reason: 'not-found' }); continue; } entry.state = { caseId: w.state.caseId }; }
      else if (w.id === 'notes') { const r = w.state?.slug ? ref({ kind: 'writing', key: w.state.slug, snapshot }, 'Notes') : null; entry.state = { slug: r?.key || null, folder: typeof w.state?.folder === 'string' ? w.state.folder : 'all' }; }
      out.windows.push(entry);
    }
    return { state: out, stale };
  }

  return Object.freeze({
    available, enabled,
    enable() { if (!available) return false; return write(OPTIN, '1').ok; },
    disable() { remove(OPTIN); remove(STATE); },
    reset() { remove(STATE); },
    save(state) {
      if (!enabled()) return { ok: false, reason: 'disabled' };
      const payload = { version: WORKSPACE_VERSION, snapshot, savedAt: new Date().toISOString(), ...state };
      return write(STATE, JSON.stringify(payload));
    },
    load() {
      if (!enabled()) return null;
      const raw = read(STATE); if (!raw) return null;
      let parsed; try { parsed = JSON.parse(raw); } catch { return null; }
      if (!parsed || parsed.version !== WORKSPACE_VERSION) return null;    // unknown version: restore nothing, never guess
      const { state, stale } = validate(parsed);
      return { state, stale, snapshotMatches: parsed.snapshot === snapshot };
    },
    exportJSON() { return read(STATE) || JSON.stringify({ version: WORKSPACE_VERSION, snapshot, savedAt: null, windows: [] }); },
    hasSaved() { return Boolean(read(STATE)); },
  });
}
