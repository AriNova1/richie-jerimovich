/* ══════════════════════════════════════════════════════════════════
   THE JOURNAL, COMPLETE

   The export used to carry the first fourteen paragraphs of every
   entry and say nothing about the rest, and those excerpts were 449 KB
   of a 631 KB file that every visitor downloaded to read three counts
   on the front door. The bodies now live here and are fetched once,
   the first time somebody opens something that needs them.

   Nothing is truncated any more. If the fetch fails the caller is told
   that, rather than being handed a shorter entry that looks whole.
   ══════════════════════════════════════════════════════════════════ */
let cache = null, inflight = null;

export function loadedJournal() { return cache; }

export async function loadJournal(base = './data/journal.json') {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch(base);
      if (!r.ok) throw new Error('journal http ' + r.status);
      const j = await r.json();
      const bySlug = new Map((j.entries || []).map((e) => [e.slug, e]));
      cache = { ok: true, generated: j.generated, count: j.count, bySlug };
    } catch (err) {
      cache = { ok: false, reason: String(err.message || err), bySlug: new Map() };
    }
    inflight = null;
    return cache;
  })();
  return inflight;
}

/* What a caller should show when the bodies are not here yet or did not
   arrive. Never a silent excerpt. */
export function journalBody(slug) {
  if (!cache) return { state: 'loading', paras: [] };
  if (!cache.ok) return { state: 'failed', paras: [], reason: cache.reason };
  const e = cache.bySlug.get(slug);
  if (!e) return { state: 'missing', paras: [] };
  return { state: 'ready', paras: e.paras || [], words: e.words, file: e.file };
}
