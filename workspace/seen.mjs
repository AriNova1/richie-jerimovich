/* The door counter, browser side.

   Everything else on this property is a number with a receipt behind it. This
   one has none, and that is not an oversight: making it checkable would mean
   keeping enough about each reader to tell them apart, which is the thing the
   privacy page promises not to do. So the honest move is to count the cheapest
   thing that is still true, say exactly what it counts, and let the surface
   that prints it admit what it cannot prove.

   What this file decides, before any request exists:
     - a reader sending Do Not Track or Global Privacy Control is never counted,
       and the server never learns that somebody opted out, because the request
       is not made
     - a tab counts once, however many times it is reloaded or however many
       rooms of the workspace it walks through
     - nothing is written to the browser that outlives the tab

   sessionStorage, not localStorage and not a cookie: it dies when the tab does. */

export const KEY = 'richie.seen.v1';
export const ENDPOINT = 'https://vitals.agentrichie.com/seen';
export const READ = 'https://vitals.agentrichie.com/seen.json';

/** Does this reader get counted? Pure, so the rule itself is testable. */
export function shouldCount(win) {
  if (!win) return false;
  const nav = win.navigator || {};
  if (nav.globalPrivacyControl === true) return false;
  for (const v of [nav.doNotTrack, win.doNotTrack, nav.msDoNotTrack]) {
    if (v === '1' || v === 'yes' || v === 1 || v === true) return false;
  }
  let store;
  try { store = win.sessionStorage; } catch { return false; }
  if (!store) return false;
  try { if (store.getItem(KEY)) return false; } catch { return false; }
  return true;
}

/** Mark this tab as counted. Returns whether the mark stuck. */
export function mark(win) {
  try { win.sessionStorage.setItem(KEY, '1'); return true; } catch { return false; }
}

/** Count this open, at most once per tab, and never when asked not to. */
export function count(win = globalThis, fetcher = globalThis.fetch) {
  if (!shouldCount(win)) return Promise.resolve(false);
  mark(win);
  try {
    return Promise.resolve(fetcher(ENDPOINT, { method: 'POST', mode: 'cors', cache: 'no-store', keepalive: true }))
      .then(() => true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

/** Read the published totals. Returns null rather than inventing a number. */
export async function readSeen(fetcher = globalThis.fetch) {
  try {
    const r = await fetcher(READ, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || d.available !== true) return null;
    if (typeof d.total !== 'number' || typeof d.today !== 'number') return null;
    return d;
  } catch {
    return null;
  }
}

/** The last n days as [{date, count}], oldest first, gaps filled with zero so
    a quiet day reads as a quiet day and not as a missing one. */
export function lastDays(payload, n = 14, today = new Date()) {
  if (!payload || !Array.isArray(payload.days)) return [];
  const have = new Map(payload.days.map((d) => [d.date, d.count]));
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ date: key, count: have.get(key) || 0 });
  }
  return out;
}
