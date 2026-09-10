/* ══════════════════════════════════════════════════════════════════════════
   RUN THE PROOF

   The property's whole claim is that a stranger can check it. Every receipt
   carries a verification command, the record says "download the export and
   check any line above", and none of that was ever anything a visitor could
   actually do while standing here. They could read an assertion that the
   assertion was checkable.

   These checks run in the reader's own browser, on the same files the site
   was built from, in front of them. Nothing is precomputed and nothing is
   staged: each one fetches, computes and reports, and each one can fail. A
   check that cannot fail is a decoration, so several of them are the same
   guards the build runs, pointed at the shipped artefact rather than the
   source.

   No third-party request. The one check that would need GitHub is offered
   behind a button that says so, because /privacy/ promises this site contacts
   nothing but the Mac it runs on, and a promise with an exception the reader
   did not choose is not a promise.
   ══════════════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';
import { markDays } from '../mark.mjs';

const GH_COMMIT = 'https://api.github.com/repos/AriNova1/richie-jerimovich/commits/';

/** A check is a name, a question, a method a reader can repeat, and a run. */
export function buildChecks({ corpus, corpusText, statedHash }) {
  return [
    {
      id: 'hash',
      name: 'The export has not been edited since it was published',
      question: 'Does the file this page reads still hash to what the record says it does?',
      method: 'SHA-256 of corpus.json, computed here, against the digest printed in record.html.',
      async run() {
        if (!statedHash) return { ok: false, detail: 'record.html did not carry a digest to compare against.' };
        const buf = new TextEncoder().encode(corpusText);
        const digest = await crypto.subtle.digest('SHA-256', buf);
        const got = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
        return { ok: got === statedHash, detail: got === statedHash
          ? `Both are ${got.slice(0, 16)}…`
          : `Computed ${got.slice(0, 16)}… but the record says ${statedHash.slice(0, 16)}…` };
      },
    },
    {
      id: 'counts',
      name: 'The counts on the front door are counted, not typed',
      question: 'Do the three figures match the length of the lists they claim to describe?',
      method: 'Recount corpus.kept, corpus.refused and corpus.log; compare to corpus.counts.',
      async run() {
        const rows = [
          ['kept', corpus.kept.length, corpus.counts.kept],
          ['refused', corpus.refused.length, corpus.counts.refused],
          ['commits', corpus.log.length, corpus.counts.commits],
          ['writing', corpus.writing.length, corpus.counts.writing],
        ];
        const bad = rows.filter(([, a, b]) => a !== b);
        return { ok: !bad.length, detail: bad.length
          ? bad.map(([k, a, b]) => `${k}: ${a} rows but counts says ${b}`).join('; ')
          : rows.map(([k, a]) => `${k} ${a}`).join(' · ') };
      },
    },
    {
      id: 'corrections',
      name: 'Every quoted correction is verbatim in the entry it names',
      question: 'Did the sentences in Corrections actually get written on those days, in those files?',
      method: 'Fetch data/journal.json and look for each quoted sentence in the entry it cites.',
      async run() {
        const list = corpus.corrections || [];
        if (!list.length) return { ok: false, detail: 'No declared corrections to check.' };
        const j = await (await fetch('data/journal.json', { cache: 'no-store' })).json();
        const bySlug = new Map(j.entries.map((x) => [x.slug, (x.paras || []).join(' ')]));
        const bad = [];
        let checked = 0;
        for (const c of list) {
          const slug = String(c.source || '').replace(/^_journal\//, '').replace(/\.md$/, '');
          const body = (bySlug.get(slug) || '').replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
          for (const sentence of String(c.quote).split(/(?<=[.!?])\s+/)) {
            const want = sentence.trim().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
            if (want.length < 13) continue;
            checked++;
            if (!body.includes(want)) bad.push(`${c.id}: "${want.slice(0, 48)}…"`);
          }
        }
        return { ok: !bad.length, detail: bad.length ? bad.join(' | ') : `${checked} sentences, all found in the files they name.` };
      },
    },
    {
      id: 'evidence',
      name: 'No kept claim is published without evidence attached',
      question: 'Does every receipt carry at least one piece of evidence and a way to verify it?',
      method: 'Walk corpus.kept and report any row with an empty evidence list or no verify method.',
      async run() {
        const noEvidence = corpus.kept.filter((r) => !(r.evidence || []).length);
        const noMethod = corpus.kept.filter((r) => !String(r.verify_method || '').trim());
        const ok = !noEvidence.length && !noMethod.length;
        return { ok, detail: ok
          ? `${corpus.kept.length} receipts, every one with evidence and a verification method.`
          : `${noEvidence.length} without evidence, ${noMethod.length} without a method.` };
      },
    },
    {
      id: 'refusals',
      name: 'Every refusal names the commit it refused',
      question: 'Can each declined claim be traced back to a specific commit and a stated reason?',
      method: 'Walk corpus.refused for a commit hash and a non-empty reason on every row.',
      async run() {
        const bad = corpus.refused.filter((r) => !/^[0-9a-f]{7,40}$/.test(String(r.commit || '')) || !String(r.reason || '').trim());
        return { ok: !bad.length, detail: bad.length
          ? `${bad.length} of ${corpus.refused.length} rows are missing a commit or a reason.`
          : `${corpus.refused.length} refusals, each naming a commit and a reason.` };
      },
    },
    {
      id: 'mark',
      name: 'The account picture is drawn from the record, not decorated',
      question: 'Do the days lit in the mark correspond to days the ledgers actually have entries on?',
      method: 'Rebuild the day states from the receipt and refusal rows and check every square against them.',
      async run() {
        /* Built from the kept and refused LISTS, not from kept_by_date, which
           is what the mark itself reads. Comparing a derived index against the
           same derived index passes whatever you do to it: emptying
           kept_by_date moved both sides together and the check stayed green.
           workspace/tests/proof.test.mjs caught that, which is the whole
           reason the falsification tests exist.

           On 2026-09-09 this check failed on nine squares, correctly. Both
           ledgers were put on the commit clock, and this check was still
           reading each refusal's `date`, which is the day the judgment was
           written rather than the day of the commit it concerns. It now reads
           `commit_date` for the same reason the mark does, and stays on the
           row rather than the index. Its results before that date were
           measured against a calendar the mark no longer uses. */
        const days = markDays(corpus);
        /* Both sides resolved through the commit log, so the check and the
           mark are answering "which day" the same way. */
        const when = new Map((corpus.log || []).map((c) => [c.sha, c.date]));
        const dayOf = (sha, fallback) => (sha && when.get(sha)) || fallback;
        const kept = new Set((corpus.kept || []).map((k) => dayOf(k.commit, k.date)));
        const refused = new Set((corpus.refused || []).map((r) => dayOf(r.commit, r.commit_date || r.date)));
        const wrong = days.filter((d) =>
          (d.state === 'cleared') !== kept.has(d.date) ||
          (d.state === 'weighed') !== (!kept.has(d.date) && refused.has(d.date)));
        const cleared = days.filter((d) => d.state === 'cleared').length;
        return { ok: !wrong.length, detail: wrong.length
          ? `${wrong.length} of ${days.length} squares do not match the ledger.`
          : `${days.length} days, ${cleared} of them lit, every one backed by a dated row.` };
      },
    },
    {
      id: 'sources',
      name: 'Every journal entry names the file it came from',
      question: 'Can a reader open the source of any entry the record shows them?',
      method: 'Walk corpus.writing for a file path on every row, and check the shape of the path.',
      async run() {
        const bad = corpus.writing.filter((w) => !/^_journal\/.+\.md$/.test(String(w.file || '')));
        return { ok: !bad.length, detail: bad.length
          ? `${bad.length} of ${corpus.writing.length} entries have no usable source path.`
          : `${corpus.writing.length} entries, each naming a file in _journal/.` };
      },
    },
  ];
}

/** The one check that leaves this site. Offered, never run without asking. */
export function githubCheck(corpus) {
  const latest = corpus.log?.[0];
  return {
    id: 'github',
    name: `Commit ${latest?.sha || 'unknown'} exists in the public repository`,
    question: 'Is the newest commit this record claims real, with that subject, on that day?',
    method: `GET ${GH_COMMIT}${latest?.sha || ''}`,
    external: true,
    async run() {
      if (!latest?.sha) return { ok: false, detail: 'The export names no commit to check.' };
      const r = await fetch(GH_COMMIT + latest.sha, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) return { ok: false, detail: `GitHub answered ${r.status}.` };
      const j = await r.json();
      const subject = String(j.commit?.message || '').split('\n')[0];
      const day = String(j.commit?.committer?.date || '').slice(0, 10);
      const same = subject === latest.subject && day === latest.date;
      return { ok: same, detail: same
        ? `GitHub returns the same subject and the same day: "${subject.slice(0, 56)}"`
        : `GitHub says "${subject.slice(0, 48)}" on ${day}; the export says "${String(latest.subject).slice(0, 48)}" on ${latest.date}.` };
    },
  };
}

/* ── the app ───────────────────────────────────────────────────────────── */

const STATE = { idle: 'not run', running: 'running', pass: 'passed', fail: 'FAILED' };

export function mountProof(host, { corpus, onOpenSource }) {
  const ac = new AbortController(); const { signal } = ac;
  let checks = [];
  let results = new Map();
  let running = false;
  let externalOffered = false;

  async function load() {
    const res = await fetch('corpus.json', { cache: 'no-store', signal });
    const corpusText = await res.text();
    let statedHash = document.querySelector('meta[name="corpus-sha256"]')?.content || null;
    if (!statedHash) {
      try {
        const rec = await fetch('record.html', { cache: 'no-store', signal }).then((r) => r.text());
        statedHash = /name="corpus-sha256" content="([a-f0-9]{64})"/.exec(rec)?.[1] || null;
      } catch { statedHash = null; }
    }
    checks = buildChecks({ corpus: JSON.parse(corpusText), corpusText, statedHash });
    render();
  }

  async function runAll() {
    if (running) return;
    running = true; results = new Map(); render();
    for (const c of checks) {
      results.set(c.id, { state: 'running' }); render();
      const t0 = performance.now();
      try {
        const r = await c.run();
        results.set(c.id, { ...r, ms: Math.round(performance.now() - t0) });
      } catch (err) {
        results.set(c.id, { ok: false, detail: `The check threw: ${String(err).slice(0, 120)}`, ms: Math.round(performance.now() - t0) });
      }
      render();
      await new Promise((r) => setTimeout(r, 90));   // a run you can watch, not a flash
    }
    running = false; render();
  }

  async function runExternal() {
    const c = githubCheck(corpus);
    if (!checks.some((x) => x.id === 'github')) checks = [...checks, c];
    results.set('github', { state: 'running' }); render();
    const t0 = performance.now();
    try { results.set('github', { ...(await c.run()), ms: Math.round(performance.now() - t0) }); }
    catch (err) { results.set('github', { ok: false, detail: `The request failed: ${String(err).slice(0, 110)}`, ms: Math.round(performance.now() - t0) }); }
    render();
  }

  function row(c) {
    const r = results.get(c.id);
    const state = !r ? 'idle' : r.state === 'running' ? 'running' : r.ok ? 'pass' : 'fail';
    return `<article class="pf-check is-${state}${c.external ? ' is-external' : ''}">
      <header>
        <span class="pf-state" aria-label="${STATE[state]}">${state === 'pass' ? '✓' : state === 'fail' ? '✕' : state === 'running' ? '…' : '·'}</span>
        <h2>${e(c.name)}</h2>
        ${r?.ms != null ? `<span class="pf-ms" data-tier="live">${r.ms} ms</span>` : ''}
      </header>
      <p class="pf-q">${e(c.question)}</p>
      <p class="pf-method"><span>Method</span> <code>${e(c.method)}</code></p>
      ${r && r.state !== 'running' ? `<p class="pf-detail" data-tier="live">${e(r.detail || '')}</p>` : ''}
    </article>`;
  }

  function render() {
    const done = [...results.values()].filter((r) => r.state !== 'running');
    const failed = done.filter((r) => !r.ok).length;
    host.innerHTML = `<div class="proof">
      <header class="pf-head">
        <p class="widget-kicker">Run the proof</p>
        <h1>Check it yourself, here, now.</h1>
        <p class="pf-lede" data-tier="editorial">Every receipt on this site carries a command you could run, and the record tells you to download the export and check any line. None of that was ever something you could do while standing here. These run in your browser, on the files this page was built from, and every one of them can fail.</p>
        <div class="pf-run">
          <button type="button" data-run class="pf-go" ${running ? 'disabled' : ''}>${running ? 'Running…' : done.length ? 'Run them again' : `Run ${checks.length} checks`}</button>
          ${done.length ? `<p class="pf-score" data-tier="live" role="status">${done.length - failed} of ${done.length} passed${failed ? `, ${failed} failed` : ''}.</p>` : ''}
        </div>
      </header>

      <div class="pf-list">${checks.map(row).join('')}</div>

      <section class="pf-external">
        <h2>One check has to leave this site</h2>
        <p data-tier="editorial">Everything above ran against files served from this domain. Confirming that a commit exists in the public repository means asking GitHub, and <a href="/privacy/" data-source>privacy</a> says this site contacts nothing but the Mac it runs on. A promise with an exception you did not choose is not a promise, so it is your button.</p>
        <button type="button" data-external ${externalOffered ? 'disabled' : ''}>${externalOffered ? 'Asked GitHub' : 'Ask GitHub about the newest commit'}</button>
      </section>

      <footer class="pf-foot" data-tier="chrome">These are the same guards the build runs, pointed at what shipped rather than at the source. If one of them ever goes red on this page, the record is wrong and this is where you would find out. <a href="./corpus.json" data-source>The export</a>.</footer>
    </div>`;
  }

  host.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-run]')) { runAll(); return; }
    if (ev.target.closest('[data-external]')) { externalOffered = true; runExternal(); return; }
    const src = ev.target.closest('[data-source]');
    if (src) { ev.preventDefault(); onOpenSource?.(new URL(src.getAttribute('href'), location.href).href); }
  }, { signal });

  render();
  load();
  return { getState() { return {}; }, destroy() { ac.abort(); host.replaceChildren(); } };
}
