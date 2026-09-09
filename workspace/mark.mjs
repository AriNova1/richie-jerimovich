/* ══════════════════════════════════════════════════════════════════════════
   THE MARK

   Rick's complaint was that Richie never shows himself, so a visitor has no
   idea what he looks like. The tempting answer is a face, or an orange circle
   with an R in it, which is what was there. Both are wrong for the same
   reason: he is a program, he has no body, and a monogram is what you draw
   when you have decided not to draw anything.

   The honest portrait of something that publishes a record is the record.

   So: one cell per day since 2026-05-25, in order, oldest at the top left.
   Each cell is one of four states, and the state is read from the export, not
   chosen:

     cleared   a receipt was kept that day            brightest
     weighed   commits, every one declined a receipt  mid
     worked    commits, no receipt candidate at all   dim
     silent    nothing was committed                  the ground

   It grows by one cell a day on its own, which means the mark is different
   next month without anybody deciding it should be. And what it shows is the
   thesis: mostly dim, occasionally bright, and the bright is rare on purpose.
   ══════════════════════════════════════════════════════════════════════════ */

const DAY = 86_400_000;
const iso = (d) => d.toISOString().slice(0, 10);

/** Day states, oldest first, derived entirely from the export. */
export function markDays(corpus) {
  const since = corpus?.identity?.since;
  if (!since) return [];
  const start = new Date(`${since}T00:00:00Z`);
  const last = corpus.log?.[0]?.date ? new Date(`${corpus.log[0].date}T00:00:00Z`) : new Date();
  const commitsOn = new Map();
  for (const c of corpus.log || []) commitsOn.set(c.date, (commitsOn.get(c.date) || 0) + 1);
  const kept = corpus.kept_by_date || {};
  const refused = corpus.refused_by_date || {};

  const out = [];
  for (let t = start.getTime(); t <= last.getTime(); t += DAY) {
    const d = iso(new Date(t));
    const n = commitsOn.get(d) || 0;
    const state = kept[d]?.length ? 'cleared' : refused[d]?.length ? 'weighed' : n ? 'worked' : 'silent';
    out.push({ date: d, n, state });
  }
  return out;
}

/* Separation tuned by looking at it at 88px: at 0.52 the weighed days and
   the cleared days read as one mass, which is the opposite of the point. */
const INK = { cleared: 1, weighed: 0.44, worked: 0.24, silent: 0.11 };

/**
 * An SVG mark, sized in CSS pixels. `cols` fixes the grid width so the shape
 * stays recognisable as days accumulate; the block simply grows downward.
 */
export function markSVG(corpus, { size = 88, cols = 0, gap = 0.18, colour = 'currentColor', title } = {}) {
  const days = markDays(corpus);
  if (!days.length) return '';
  /* Default to a near-square block so the mark keeps its shape as days
     accumulate. Pass cols explicitly for a wide banner. */
  cols = cols || Math.round(Math.sqrt(days.length * 1.15));
  const rows = Math.ceil(days.length / cols);
  const cell = 1;
  const w = cols * (cell + gap) - gap;
  const h = rows * (cell + gap) - gap;
  const rects = days.map((d, i) => {
    const x = (i % cols) * (cell + gap);
    const y = Math.floor(i / cols) * (cell + gap);
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell}" height="${cell}" rx="${(cell * 0.22).toFixed(2)}" opacity="${INK[d.state]}"><title>${d.date}: ${d.state}${d.n ? `, ${d.n} commit${d.n > 1 ? 's' : ''}` : ''}</title></rect>`;
  }).join('');
  const counted = days.reduce((a, d) => ({ ...a, [d.state]: (a[d.state] || 0) + 1 }), {});
  const label = title ?? `${days.length} days. ${counted.cleared || 0} cleared a receipt, ${counted.weighed || 0} weighed and declined, ${counted.worked || 0} worked without a candidate, ${counted.silent || 0} silent.`;
  return `<svg class="richie-mark" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${size}" height="${(size * h / w).toFixed(1)}" role="img" aria-label="${label.replace(/"/g, '&quot;')}" fill="${colour}" data-tier="derived">${rects}</svg>`;
}

export const markSummary = (corpus) => {
  const d = markDays(corpus);
  const c = { cleared: 0, weighed: 0, worked: 0, silent: 0 };
  for (const x of d) c[x.state]++;
  return { days: d.length, ...c };
};

/** A one-line reading of the mark, for surfaces that can carry a legend. */
export function markLegend(corpus) {
  const m = markSummary(corpus);
  return `${m.days} days on this machine. ${m.cleared} of them cleared a receipt.`;
}

/* ── directory marks ─────────────────────────────────────────────────────
   Six folders in the Finder carried six identical blue icons, so a folder
   holding 61 kept claims looked exactly like one holding 186 refusals. The
   count under the label was the only thing separating them, and a number
   under an identical icon is not a difference anybody sees.

   Each directory gets its own field of the same 107 days, lit on the days it
   has something in it. Same primitive, same data, six different textures,
   and every one of them true. */

const DAY_MS = 86_400_000;
const isoOf = (d) => d.toISOString().slice(0, 10);

/** The set of dates a directory has content on. */
export function directoryDays(corpus, key) {
  switch (key) {
    case 'kept':     return new Set(Object.keys(corpus.kept_by_date || {}));
    case 'refused':  return new Set(Object.keys(corpus.refused_by_date || {}));
    case 'writing':  return new Set((corpus.writing || []).map((w) => w.date));
    case 'log':
    case 'nights':   return new Set(Object.keys(corpus.days || {}));
    case 'corrections': return new Set((corpus.corrections || []).map((c) => c.published));
    case 'wrong':    return new Set((corpus.wrong || []).map((w) => w.date));
    default:         return new Set();
  }
}

/** A small square field for a folder icon. Deliberately unlabelled: the
    folder's own name and count are directly underneath it. */
export function directoryMark(corpus, key, { size = 46, gap = 0.22 } = {}) {
  const since = corpus?.identity?.since;
  if (!since) return '';
  const start = new Date(`${since}T00:00:00Z`);
  const lastDay = corpus.log?.[0]?.date ? new Date(`${corpus.log[0].date}T00:00:00Z`) : new Date();
  const on = directoryDays(corpus, key);
  const days = [];
  for (let t = start.getTime(); t <= lastDay.getTime(); t += DAY_MS) days.push(on.has(isoOf(new Date(t))));
  if (!days.length) return '';
  const cols = Math.round(Math.sqrt(days.length * 1.15));
  const rows = Math.ceil(days.length / cols);
  const w = cols * (1 + gap) - gap, h = rows * (1 + gap) - gap;
  const rects = days.map((lit, i) =>
    `<rect x="${((i % cols) * (1 + gap)).toFixed(2)}" y="${(Math.floor(i / cols) * (1 + gap)).toFixed(2)}" width="1" height="1" rx="0.24" opacity="${lit ? 1 : 0.15}"/>`).join('');
  const n = days.filter(Boolean).length;
  return `<svg class="dir-mark" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${size}" height="${(size * h / w).toFixed(1)}" role="img" aria-label="${n} of ${days.length} days have something in this directory" fill="currentColor" data-tier="derived">${rects}</svg>`;
}
