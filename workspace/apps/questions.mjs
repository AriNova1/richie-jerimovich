/* ══════════════════════════════════════════════════════════════════
   UNFINISHED BUSINESS (#8 of the September ideas)

   The record is very good at what it settled. It had nowhere to say
   what it has not. This is that page: questions this property has not
   answered, with what would settle each one, and the gap it is most
   embarrassed by, which is that nothing in the refusal ledger is a
   claim that was considered and dropped.

   Two rules keep it from becoming a mood board. Every question states
   what evidence would close it, enforced in the builder. And every
   number in a question is checkable against the export named at the
   foot, listed under each card rather than asserted.

   Settled questions stay. Watching one move is the point.
   ══════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';

const STATE = {
  open: { label: 'Open', note: 'Not answered. The record does not settle it.' },
  narrowed: { label: 'Narrowed', note: 'Smaller than it was, still not closed.' },
  settled: { label: 'Settled', note: 'Answered, and the answer is recorded here.' },
};

/* Pure. Sorted so what is unresolved is read first, and within that the
   thing the property is worst at comes before the rest. Unit-tested. */
export function orderQuestions(questions) {
  const rank = (q) => (q.state === 'settled' ? 2 : q.kind === 'gap' ? 0 : 1);
  return [...(questions || [])].sort((a, b) => rank(a) - rank(b) || String(a.opened).localeCompare(String(b.opened)));
}

export function mountQuestions(host, { corpus, initialState, onOpenSource }) {
  const ac = new AbortController(); const signal = ac.signal;
  const all = orderQuestions(corpus.questions);
  let only = initialState?.only === 'all' ? 'all' : 'open';   // what is unresolved is the point; the settled one is a click away

  function render() {
    const rows = only === 'open' ? all.filter((q) => q.state !== 'settled') : all;
    const openCount = all.filter((q) => q.state !== 'settled').length;
    host.innerHTML = `<div class="questions">
      <header class="q-head">
        <p class="widget-kicker">Unfinished business</p>
        <h1>${openCount} question${openCount === 1 ? '' : 's'} this record has not answered</h1>
        <p class="q-lede" data-tier="editorial">A record that only publishes what it settled is telling you half of it. Each of these says what would close it, because a question with no way to settle it is a mood. Every number below is checkable against the export named at the foot.</p>
        <div class="q-filter" role="group" aria-label="Which questions to show">
          <button type="button" data-only="open" aria-pressed="${only === 'open'}">Still open</button>
          <button type="button" data-only="all" aria-pressed="${only === 'all'}">All ${all.length}</button>
        </div>
      </header>
      ${rows.map((q) => `<article class="q-card is-${e(q.state)}${q.kind === 'gap' ? ' is-gap' : ''}">
        <header>
          <p class="q-meta"><span class="q-state">${e(STATE[q.state]?.label || q.state)}</span>
            ${q.kind === 'gap' ? '<span class="q-gap">A gap, not a question</span>' : ''}
            <span>opened ${e(q.opened || 'not recorded')}</span>
            ${q.state === 'settled' && q.settled_on ? `<span>settled ${e(q.settled_on)}</span>` : `<span>last looked at ${e(q.revisited || q.opened || 'not recorded')}</span>`}</p>
          <h2>${e(q.question)}</h2>
        </header>
        <div class="q-body">
          <h3>Where it stands</h3><p data-tier="editorial">${e(q.standing)}</p>
          <h3>What would settle it</h3><p data-tier="editorial">${e(q.would_settle)}</p>
          ${q.settled_by ? `<h3>What settled it</h3><p data-tier="editorial">${e(q.settled_by)}</p>` : ''}
          ${q.cites.length ? `<h3>Checkable against</h3><ul class="q-cites">${q.cites.map((c) => `<li data-tier="export"><code>${e(c)}</code></li>`).join('')}</ul>` : ''}
        </div>
      </article>`).join('')}
      <footer class="q-foot" data-tier="chrome">Export ${e(corpus.generated || 'not exported')}. <a href="./corpus.json" data-source>Download it</a> and check any line above.</footer>
    </div>`;
  }

  host.addEventListener('click', (ev) => {
    const f = ev.target.closest('[data-only]');
    if (f) { only = f.dataset.only; render(); host.querySelector(`[data-only="${only}"]`)?.focus(); return; }
    const src = ev.target.closest('[data-source]');
    if (src) { ev.preventDefault(); onOpenSource?.(src.getAttribute('href')); }
  }, { signal });

  render();
  return { getState() { return { only }; }, destroy() { ac.abort(); host.replaceChildren(); } };
}
