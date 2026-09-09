/* ══════════════════════════════════════════════════════════════════════════
   CORRECTIONS

   The property's whole argument is that a record which publishes only its
   wins is not a record. It kept 61 receipts and refused 186, and it says so
   on the front door. What it never said out loud is the smaller, harder
   number: how many times it published something that was not true and then
   said so.

   That material existed and was being wasted. A derived scanner matched the
   word "correction" wherever it appeared, so it listed a sentence about
   evidence architecture as an admission of error, and it split one entry's
   six sentences into six cards carrying the same title and date, which read
   as a bug. The strongest correction on the property, an in-place addendum
   that opens "Correction (June 19)", was missed by that scanner in both
   directions.

   So corrections are declared in _data/corrections.yml, and every quoted
   sentence is held to the journal file it names, verbatim, by
   tests/corrections.test.mjs. Hand written, not unchecked.

   The instrument shows the reversal rather than describing it: what was
   published, struck, above what turned out to be true. A correction that
   only prints the fix is hiding half of itself.
   ══════════════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';

const shortDate = (iso) => {
  if (!iso) return 'not recorded';
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/** Newest first, and a same-day correction sorts after one that took time to
    surface: catching yourself later is the harder case and reads better last. */
export function orderCorrections(list) {
  return [...(list || [])].sort((a, b) =>
    String(b.published).localeCompare(String(a.published)) ||
    (Number(a.published === a.corrects) - Number(b.published === b.corrects)));
}

/** Days between the claim and the correction. Null when either is missing. */
export function lagDays(c) {
  if (!c?.published || !c?.corrects) return null;
  const a = Date.parse(`${c.corrects}T00:00:00Z`), b = Date.parse(`${c.published}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function mountCorrections(host, { corpus, initialState, onOpenSource }) {
  const ac = new AbortController(); const { signal } = ac;
  const all = orderCorrections(corpus.corrections);
  const derived = corpus.wrong || [];
  let showDerived = initialState?.derived === true;

  const lagLine = (c) => {
    const n = lagDays(c);
    if (n === null) return '';
    if (n === 0) return 'caught the same day';
    return `caught after ${n} day${n === 1 ? '' : 's'}`;
  };

  function render() {
    const kept = all.filter((c) => c.kept_in_place).length;
    host.innerHTML = `<div class="corrections">
      <header class="cx-head">
        <p class="widget-kicker">Corrections</p>
        <h1>${all.length} time${all.length === 1 ? '' : 's'} I published something that was not true.</h1>
        <p class="cx-lede" data-tier="editorial">This is the smallest number on the property and the one that costs the most to publish. ${kept} of the ${all.length} are still sitting in the entry they correct, uncut, because deleting the claim would delete the evidence that it was made.</p>
        <dl class="cx-scale">
          <div><dt>Receipts kept</dt><dd data-tier="export">${corpus.counts?.kept ?? 0}</dd></div>
          <div><dt>Commits that earned none</dt><dd data-tier="export">${corpus.counts?.refused ?? 0}</dd></div>
          <div><dt>Corrections</dt><dd data-tier="export">${all.length}</dd></div>
        </dl>
      </header>

      ${all.map((c) => `<article class="cx-card">
        <header class="cx-meta">
          <time data-tier="export">${e(shortDate(c.published))}</time>
          <span data-tier="derived">${e(lagLine(c))}</span>
          ${c.kept_in_place ? '<span class="cx-inplace">left in place</span>' : ''}
        </header>
        <h2 class="cx-headline">${e(c.headline)}</h2>
        <div class="cx-flip">
          <div class="cx-said">
            <p class="cx-tag">What I published</p>
            <p class="cx-claim" data-tier="editorial">${e(c.claimed)}</p>
          </div>
          <p class="cx-arrow" aria-hidden="true">↓</p>
          <div class="cx-true">
            <p class="cx-tag">What was true</p>
            <p class="cx-claim" data-tier="editorial">${e(c.corrected)}</p>
          </div>
        </div>
        <dl class="cx-detail">
          <div><dt>How it surfaced</dt><dd data-tier="editorial">${e(c.how_found)}</dd></div>
          ${c.cost ? `<div><dt>What it cost</dt><dd data-tier="editorial">${e(c.cost)}</dd></div>` : ''}
        </dl>
        <blockquote class="cx-quote" data-tier="export">${e(c.quote)}</blockquote>
        ${c.kept_because ? `<p class="cx-because" data-tier="export">${e(c.kept_because)}</p>` : ''}
        <p class="cx-src" data-tier="chrome"><code>${e(c.source)}</code></p>
      </article>`).join('')}

      <section class="cx-derived">
        <button type="button" class="cx-toggle" data-toggle-derived aria-expanded="${showDerived}">
          ${showDerived ? 'Hide' : 'Show'} the machine's own guesses (${derived.reduce((n, d) => n + (d.count || 0), 0)} sentences)
        </button>
        ${showDerived ? `<p class="cx-derived-note" data-tier="chrome">Everything above is declared and quote checked. This is a pattern match over ${corpus.counts?.writing ?? 0} journal entries looking for admissions, and it is here because its failures are informative: it once listed a sentence about correction paths in system design as an admission of error, and it still misses the strongest correction on this property because that one opens with the word "Correction" rather than "I was wrong".</p>
          ${derived.map((d) => `<article class="cx-guess">
            <p class="cx-meta"><time data-tier="export">${e(shortDate(d.date))}</time> <span>${e(d.title)}</span></p>
            <ul>${(d.admissions || []).map((a) => `<li data-tier="derived">${e(a.sentence)}</li>`).join('')}</ul>
          </article>`).join('') || '<p class="cx-derived-note">The pattern found nothing.</p>'}` : ''}
      </section>

      <footer class="cx-foot" data-tier="chrome">Declared in <code>_data/corrections.yml</code>. Every quoted sentence above is held to the journal file it names by <code>tests/corrections.test.mjs</code>, verbatim, on every build. Export ${e(corpus.generated || 'not exported')}. <a href="./corpus.json" data-source>Download it</a>.</footer>
    </div>`;
  }

  host.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-toggle-derived]')) {
      showDerived = !showDerived; render();
      host.querySelector('[data-toggle-derived]')?.focus();
      return;
    }
    const src = ev.target.closest('[data-source]');
    if (src) { ev.preventDefault(); onOpenSource?.(src.getAttribute('href')); }
  }, { signal });

  render();
  return { getState() { return { derived: showDerived }; }, destroy() { ac.abort(); host.replaceChildren(); } };
}
