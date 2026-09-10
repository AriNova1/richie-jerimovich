/* ══════════════════════════════════════════════════════════════════════════
   THE RATE

   The front door says: "I count what I refused to claim as carefully as what
   I claimed." Underneath it are three numbers, and one of them is a ratio:
   186 refusals against 61 receipts, three to one.

   Nothing on this property checked whether that ratio held.

   It did not. On the commit calendar it runs 1.3, 2.7, 4.8, 16.5, 1.5 across
   five months. August is not a rounding difference: two receipts kept against
   thirty three refusals, in a month with sixty commits in it, which is normal
   volume. The single number on the front door is an average over a curve that
   moves by a factor of twelve, and an average presented as a habit is the same
   defect as a windowed count presented as a total.

   Why this is not a fourth history browser. Time Machine opens a date. The
   rewind scrubs the log. THE MARK shows what kind of day each day was. All
   three answer "what happened when". This one answers a different question:
   is the claim the property is built on true over time, and it can come back
   no. That is the whole reason it earns a window.

   Everything here is derived from the two ledgers and the commit log. There is
   no series in the export that only this app reads, and nothing is authored.
   ══════════════════════════════════════════════════════════════════════════ */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-08" as a person would say it. */
export function monthName(key) {
  const [y, m] = String(key).split('-');
  const i = Number(m) - 1;
  return MONTHS[i] ? `${MONTHS[i]} ${y}` : String(key);
}

/** Which day a row belongs to, resolved through the commit log so that both
    ledgers and the log are answering "when" the same way. */
const dayIndex = (corpus) => new Map((corpus?.log || []).map((c) => [c.sha, c.date]));

/**
 * Kept, refused and total commits per calendar month, oldest first.
 * A month with commits and no receipts is a real month and is kept in;
 * a month with nothing at all never existed and is left out.
 */
export function monthlyRate(corpus) {
  if (!corpus) return [];
  const when = dayIndex(corpus);
  const at = (sha, fallback) => ((sha && when.get(sha)) || fallback || '').slice(0, 7);
  const rows = new Map();
  const touch = (m) => {
    if (!m) return null;
    if (!rows.has(m)) rows.set(m, { month: m, kept: 0, refused: 0, commits: 0 });
    return rows.get(m);
  };
  for (const c of corpus.log || []) { const r = touch(String(c.date).slice(0, 7)); if (r) r.commits += 1; }
  for (const k of corpus.kept || []) { const r = touch(at(k.commit, k.date)); if (r) r.kept += 1; }
  for (const f of corpus.refused || []) { const r = touch(at(f.commit, f.commit_date || f.date)); if (r) r.refused += 1; }
  return [...rows.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ ...r, rate: r.kept ? r.refused / r.kept : null }));
}

/**
 * The spread the headline average hides. Returns null when there are fewer
 * than three months with a rate, because a range across two points is not a
 * range, it is two points.
 */
export function spread(rows) {
  const rated = (rows || []).filter((r) => r.rate != null);
  if (rated.length < 3) return null;
  const lo = rated.reduce((a, b) => (b.rate < a.rate ? b : a));
  const hi = rated.reduce((a, b) => (b.rate > a.rate ? b : a));
  const total = rows.reduce((a, r) => ({ kept: a.kept + r.kept, refused: a.refused + r.refused }), { kept: 0, refused: 0 });
  const avg = total.kept ? total.refused / total.kept : null;
  return { lo, hi, avg, factor: lo.rate ? hi.rate / lo.rate : null, ...total };
}

/**
 * Bar geometry. A column is every commit that month, in three parts: the ones
 * that earned a receipt, the ones weighed and refused one, and the ones that
 * were never candidates at all.
 *
 * The first draft drew only the first two, so a column was "commits judged"
 * while the axis label said volume. August judged 35 of its 60 commits, so a
 * quarter of the month was missing from a chart claiming to show the month.
 */
export function bars(rows) {
  const peak = Math.max(...(rows || []).map((r) => Math.max(r.commits, r.kept + r.refused)), 0);
  return (rows || []).map((r) => {
    const unjudged = Math.max(0, r.commits - r.kept - r.refused);
    return {
      ...r,
      unjudged,
      keptH: peak ? r.kept / peak : 0,
      refusedH: peak ? r.refused / peak : 0,
      unjudgedH: peak ? unjudged / peak : 0,
    };
  });
}

/**
 * A literal count, not a classification. It reports how many of a month's
 * refusal reasons contain a given word, and the caller prints it as exactly
 * that. Reading meaning out of prose with a pattern is how the corrections
 * list came to publish "a correction path outside the model" as an admission
 * of error, so this one does not try.
 */
export function reasonsContaining(corpus, month, word) {
  const when = dayIndex(corpus);
  const rows = (corpus?.refused || []).filter((r) => {
    const d = (r.commit && when.get(r.commit)) || r.commit_date || r.date || '';
    return String(d).slice(0, 7) === month;
  });
  const w = String(word).toLowerCase();
  return { total: rows.length, hits: rows.filter((r) => String(r.reason || '').toLowerCase().includes(w)).length, rows };
}

const e = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (x) => (x == null ? 'n/a' : x.toFixed(1));

export function mountRate(host, { corpus, onOpenSource }) {
  const ac = new AbortController(); const { signal } = ac;
  const rows = monthlyRate(corpus);
  const sp = spread(rows);
  const b = bars(rows);
  let open = sp ? sp.hi.month : null;

  const monthList = () => {
    if (!open) return '';
    const { total, hits, rows: refs } = reasonsContaining(corpus, open, 'journal');
    return `<section class="rt-open">
      <h3>${e(monthName(open))}, every refusal</h3>
      <p class="rt-note" data-tier="derived">${total} commits weighed and declined. <strong>${hits} of the ${total} reasons contain the word &ldquo;journal&rdquo;</strong>, which is a count of a word and not a reading of them. They are all here; read them yourself.</p>
      <ol class="rt-reasons">${refs.map((r) => `<li><code data-tier="export">${e(r.commit)}</code><span data-tier="export">${e(r.reason)}</span></li>`).join('')}</ol>
    </section>`;
  };

  function render() {
    host.innerHTML = `<div class="rate">
      <header class="rt-head">
        <p class="widget-kicker">The rate</p>
        <h1>${sp ? 'Three to one is an average, not a habit.' : 'Not enough months to say.'}</h1>
        <p class="rt-lede" data-tier="editorial">The front door says he counts what he refused to claim as carefully as what he claimed, and prints one ratio underneath. Nothing on this property ever checked whether that ratio held. It does not. This is the only window here that can tell you the headline is hiding something, which is the reason it exists.</p>
      </header>

      ${sp ? `
      <dl class="rt-nums">
        <div><dt>Refusals per receipt, all of it</dt><dd data-tier="derived">${n1(sp.avg)}</dd></div>
        <div><dt>Quietest month</dt><dd data-tier="derived">${n1(sp.lo.rate)}<small> ${e(monthName(sp.lo.month))}</small></dd></div>
        <div><dt>Strictest month</dt><dd data-tier="derived" class="is-peak">${n1(sp.hi.rate)}<small> ${e(monthName(sp.hi.month))}</small></dd></div>
      </dl>
      <p class="rt-spread" data-tier="derived">A factor of <strong>${n1(sp.factor)}</strong> between them. The single number on the front door is the average of that.</p>

      <section class="rt-chart">
        <h2>Every commit, every month</h2>
        <div class="rt-bars">${b.map((r) => `
          <div class="rt-col${r.month === sp.hi.month ? ' is-peak' : ''}">
            <div class="rt-stack" title="${e(monthName(r.month))}: ${r.commits} commits, ${r.kept} kept a receipt, ${r.refused} weighed and refused, ${r.unjudged} never candidates">
              <div class="rt-fill" style="height:${((r.unjudgedH + r.refusedH + r.keptH) * 100).toFixed(1)}%">
                <span class="rt-un" style="flex:${r.unjudged}"></span>
                <span class="rt-ref" style="flex:${r.refused}"></span>
                <span class="rt-kept" style="flex:${r.kept}"></span>
              </div>
            </div>
            <p class="rt-rate" data-tier="derived">${r.rate == null ? '&mdash;' : n1(r.rate)}</p>
            <p class="rt-month">${e(monthName(r.month).split(' ')[0])}</p>
          </div>`).join('')}</div>
        <p class="rt-key"><span class="rt-swatch rt-swatch-kept"></span>kept a receipt<span class="rt-swatch rt-swatch-ref"></span>weighed and refused one<span class="rt-swatch rt-swatch-un"></span>never a candidate<span class="rt-key-rate">Column height is every commit that month. The number under it is refusals per receipt, and only the first two bands go into that.</span></p>
      </section>

      <p class="rt-say" data-tier="derived">In ${e(monthName(sp.hi.month))} he committed <strong>${sp.hi.commits}</strong> times, which is ordinary for this machine, and kept <strong>${sp.hi.kept}</strong> receipt${sp.hi.kept === 1 ? '' : 's'}.</p>
      ${monthList()}

      <p class="rt-why" data-tier="editorial"><strong>Which calendar this uses.</strong> Every row here is filed under the date of the commit it concerns, read from the public log. Until 2026-09-09 a refusal was filed under the day its judgment was written instead, which lags the commit by up to eight days, and that put nineteen refusals in the wrong month and nine days of THE MARK in the wrong state. Both ledgers now share one clock, which is the one you can check.</p>
      <p class="rt-why" data-tier="editorial"><strong>What this cannot tell you.</strong> Whether a strict month was strict because the work was thin or because the judgment was harsh. The ledgers record what was decided, not what it felt like to decide it. The reasons above are the closest thing to an answer and they are his own words, written at the time.</p>
      ` : `<p class="record-note" data-tier="chrome">Fewer than three months with receipts in them. A rate across two points is two points.</p>`}

      <footer class="rt-foot" data-tier="chrome">Derived on the fly from the receipt ledger, the refusal ledger and the commit log in this export. <button type="button" class="terminal-link" data-app="proof">Run the proof</button> checks the same three against each other.</footer>
    </div>`;
  }

  host.addEventListener('click', (ev) => {
    const src = ev.target.closest('[data-source]');
    if (src) { ev.preventDefault(); onOpenSource?.(new URL(src.getAttribute('href'), location.origin).href); }
  }, { signal });

  render();
  return { getState() { return { month: open }; }, destroy() { ac.abort(); host.replaceChildren(); } };
}
