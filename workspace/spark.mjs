/* ══════════════════════════════════════════════════════════════════════════
   SPARKLINES

   Activity Monitor was the least interesting window on the property: a list
   of rows with a value each and no yesterday. Twenty eight daily snapshots of
   what this machine holds and does were sitting in _data/organism_history.yml,
   read only by a page nobody could reach until this morning.

   Deliberately not a chart library. Four hundred bytes of path data per line,
   no dependency, no canvas, and the axis it does not draw is the axis it
   would have to lie about: the snapshots are irregular (28 rows across 82
   days), so the x positions are index, not time, and the label says so.
   ══════════════════════════════════════════════════════════════════════════ */

/** Oldest first, only rows where the field is a real number. */
export function series(history, field) {
  return [...(history || [])]
    .filter((r) => typeof r?.[field] === 'number' && Number.isFinite(r[field]))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((r) => ({ date: r.date, v: r[field] }));
}

/** A change a reader can check: first, last, difference, and over how long. */
export function delta(points) {
  if (!points.length) return null;
  const first = points[0], last = points.at(-1);
  const days = Math.round((Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${first.date}T00:00:00Z`)) / 86_400_000);
  return { from: first.v, to: last.v, change: last.v - first.v, days, samples: points.length, first: first.date, last: last.date };
}

/**
 * A path across the sample index. Flat series get a flat line rather than a
 * divide-by-zero, and a single sample gets a dot, not an invented trend.
 */
export function sparkPath(points, { w = 200, h = 34, pad = 2 } = {}) {
  if (!points.length) return '';
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const span = hi - lo;
  const x = (i) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v) => (span === 0 ? h / 2 : h - pad - ((v - lo) * (h - pad * 2)) / span);
  return points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
}

export function sparkSVG(points, opts = {}) {
  const { w = 200, h = 34 } = opts;
  const d = sparkPath(points, opts);
  if (!d) return '';
  const last = points.at(-1);
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const cx = points.length === 1 ? w / 2 : w - (opts.pad ?? 2);
  const cy = hi === lo ? h / 2 : h - (opts.pad ?? 2) - ((last.v - lo) * (h - (opts.pad ?? 2) * 2)) / (hi - lo);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="currentColor"/>
  </svg>`;
}
