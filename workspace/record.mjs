// Shared by the interactive screen and the script-free record builder.
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHTML;
export const directories = [
  ['kept', 'Kept claims'], ['refused', 'Receipts I did not write'], ['writing', 'Writing'],
  ['log', 'Commits'], ['nights', 'Workdays'], ['corrections', 'Corrections'],
  ['wrong', 'Sentences the scanner flagged'],
  ['vitals', 'Health snapshot'], ['runtime', 'Runtime snapshot'],
  ['channels', 'Channel snapshot'], ['sched', 'Shift snapshot'],
  ['memory', 'Memory'], ['held', 'Held receipts'],
];
export function safeURL(value) {
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
function link(label, url) {
  const safe = safeURL(url);
  return safe ? `<a href="${e(safe)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>` : e(label);
}
function source(C, file) {
  const repo = safeURL(C.identity?.repo);
  if (!repo || !file) return '';
  const revision = C.source_revision || 'main';
  return link('Source: ' + file, `${repo.replace(/\/$/, '')}/blob/${encodeURIComponent(revision)}/${file.split('/').map(encodeURIComponent).join('/')}`);
}
function commit(C, sha) {
  return sha ? link(sha, `${C.identity.repo}/commit/${encodeURIComponent(sha)}`) : 'Commit not exported';
}
/* Tier vocabulary for the evidence lens (see lens.mjs). Anything this
   module prints comes straight off the export, so it is `export` tier,
   with two deliberate exceptions: the explanatory notes are written
   here and are `editorial`, and anything this file counts rather than
   reads is `derived`. Getting these wrong is visible: the lens paints
   an untagged sentence red. */
const para = text => `<p data-tier="export">${e(text)}</p>`;
const derived = text => `<p data-tier="derived">${e(text)}</p>`;
const empty = text => `<p class="record-note" data-tier="editorial">${e(text)}</p>`;
const field = (label, value) => `<div class="record-field"><dt>${e(label)}</dt><dd data-tier="export">${e(value == null || value === '' ? 'Not exported' : value)}</dd></div>`;
function receipt(C, r, interactive = true) {
  const evidence = (r.evidence || []).map(v => `<li data-tier="export">${link(v.label || v.type || 'Evidence', v.url)}${v.note ? para(v.note) : ''}</li>`).join('');
  const status = r.verify_result || 'Not exported';
  return `<details class="record-item" data-category="${e(r.category || '')}" data-confidence="${e(r.confidence || '')}"><summary><span class="ri-name">${e(r.title || r.id)}</span><time>${e(r.date)}</time><span class="ri-cat">${e(r.category || 'Uncategorized')}</span><span class="ri-conf">${e(r.confidence || 'Not exported')}</span><span class="ri-status">${e(status)}</span></summary>
    <div class="record-detail">${para(r.claim || r.summary || 'Claim text not exported')}
    <dl>${field('Category', r.category)}${field('Confidence', r.confidence)}${field('Verification method', r.verify_method)}${field('Recorded result', r.verify_result)}</dl>
    <h3>Verification command</h3>${r.verify_cmd ? `<pre data-tier="export"><code>${e(r.verify_cmd)}</code></pre>${interactive ? '<button type="button" class="copy-command">Copy command</button>' : '<p class="record-note" data-tier="chrome">Select the command above to copy it. This page runs no script.</p>'}` : empty('Not exported')}
    <h3>Evidence</h3>${evidence ? `<ul>${evidence}</ul>` : empty('No evidence links exported')}
    <h3>Limits</h3>${r.limits?.length ? `<ul>${r.limits.map(v=>`<li data-tier="export">${e(v)}</li>`).join('')}</ul>` : empty('No limitations exported. This does not establish that there are none.')}
    <p data-tier="chrome">${source(C, '_data/agent_receipts.yml')}</p></div></details>`;
}
export function runtimeRows(C) {
  const b = C.body || {}, s = b.system || {};
  return [['Model', b.model], ['Provider', b.provider], ['Harness', b.harness],
    ['Gateway', b.gateway], ['Cores', s.cores], ['Load at snapshot', s.load_1m],
    ['Memory', s.mem_total_gb == null ? null : s.mem_total_gb + ' GB'],
    ['Providers', b.providers == null ? null : b.providers.length]];
}
export function snapshotText(C, kind = 'runtime') {
  const at = C.source_snapshots?.[kind];
  return at ? `Source snapshot: ${at}. Export: ${C.generated}.` :
    `Source snapshot time not exported. Export: ${C.generated || 'unknown'}.`;
}

/* ── What the refusal ledger actually is ──────────────────────────────
   Every row here is a decision about one git commit: did it earn a
   public receipt. None of them is a claim that was considered and
   dropped, and the folder used to be called "Refused claims", which
   promised the second thing while holding the first.

   The classes below are derived from the reasons Richie actually wrote,
   not imposed on them. Each carries the rule that put a row in it, the
   first matching rule wins, and anything no rule matches lands in "Other
   reasons" and is shown in full. A bucket that quietly swallowed the
   leftovers would be worse than no grouping at all. Pure; unit-tested. */
export const REFUSAL_CLASSES = [
  {key: 'journal', label: 'Journal entry only', match: /journal/i,
   note: 'The commit wrote or edited a journal entry and moved nothing a receipt could point at.'},
  {key: 'covered', label: 'Covered by another receipt', match: /merged into|part of (the )?broader|covered by|already claimed|published (separately )?as ar-/i,
   note: 'The work is real and it is already claimed, inside a receipt this commit belongs to.'},
  {key: 'elsewhere', label: 'A different project', match: /not part of agentrichie|separate project|unrelated/i,
   note: 'Work on something that is not this site.'},
  {key: 'internal', label: 'Internal only', match: /internal|metadata only|sweep|screenshot-only|no public|no separate public|visitor-facing/i,
   note: 'Audit artifacts, design metadata, QA captures. Nothing a visitor can open changed.'},
  {key: 'housekeeping', label: 'Housekeeping', match: /maintenance|routine|refresh|meta-commit|bookkeeping|generated|publication|ledger/i,
   note: 'Nightly refreshes, receipt publication, ledger edits. The loop keeping itself tidy.'},
  {key: 'unlinked', label: 'Not linked from the site', match: /not linked|prototype|demo|unreferenced/i,
   note: 'A page that exists in the repository and cannot be reached from the site, so it is not a public outcome.'},
  {key: 'small', label: 'Too small to claim', match: /too small|private-adjacent|minor|trivial|punctuation/i,
   note: 'Real work, under the bar this ledger sets for a public claim.'},
];
export function classifyRefusals(refused) {
  const groups = REFUSAL_CLASSES.map((c) => ({...c, rows: []}));
  const other = {key: 'other', label: 'Other reasons', note: 'No rule above matched these. They are listed in full rather than filed under a heading that does not fit.', rows: []};
  for (const r of refused || []) (groups.find((g) => g.match.test(r.reason || '')) || other).rows.push(r);
  return groups.filter((g) => g.rows.length).concat(other.rows.length ? [other] : []);
}

export function renderDirectory(C, key, { interactive = true, journal = null } = {}) {
  switch (key) {
    case 'kept': return C.kept.length ? C.kept.map(r=>receipt(C,r,interactive)).join('') : empty('No kept claims in this export.');
    case 'refused': {
      const groups = classifyRefusals(C.refused);
      return empty(`${C.refused.length} of these in this export. Every one is a decision about a single commit: did it earn a public receipt. None of them is a claim that was considered and dropped, and this folder used to say otherwise.`)
        + empty('I publish them so the kept receipts have a denominator. Grouped below by the reason I gave, first matching rule wins, and anything no rule matched is listed under Other reasons in full.')
        + (C.refusal_cutoff_note ? empty(C.refusal_cutoff_note) : '')
        + groups.map((g) => `<section class="refusal-group"><h3>${e(g.label)} <span class="rg-count">${g.rows.length}</span></h3>${empty(g.note)}
          ${g.rows.map(r => `<article class="record-item"><header><span class="ri-name">${commit(C,r.commit)}</span><time>${e(r.date)}</time><span class="ri-cat">${e(g.label)}</span><span class="ri-conf">Published reason</span><span class="ri-status">No receipt</span></header>${para(r.reason || 'Reason not exported')}</article>`).join('')}</section>`).join('');
    }
    case 'writing': {
      /* Complete entries, from data/journal.json. The export carries the
         metadata; the bodies are fetched once because they were most of
         its weight. When they are not here the row says so instead of
         showing a shorter entry that looks whole. */
      const body = (slug) => {
        const full = journal?.get?.(slug);
        if (full) return (full.paras || []).map(para).join('');
        return empty('The complete entry has not loaded. Open the source file below to read it.');
      };
      return empty('Complete entries, every paragraph. The bodies live beside the export in data/journal.json and are fetched when this folder is opened.')
        + empty('Entries written before September 2026 give the five layers borrowed character names. Those names were retired, and these entries were not edited to agree with that. The record is not rewritten to match a later decision.')
        + C.writing.map(r =>
          `<details class="record-item"><summary><span>${e(r.title)}</span><time>${e(r.date)}</time><span class="ri-conf">${e(String(r.paragraphs ?? '?'))} paragraphs</span><span class="ri-status">${e(String(r.words ?? '?'))} words</span></summary><div class="record-detail">${body(r.slug)}<p data-tier="chrome">${source(C, r.file)}</p></div></details>`
        ).join('');
    }
    case 'log': return C.log.map(r=>`<article class="record-item"><header>${commit(C,r.sha)}<time>${e(r.date)}</time></header>${para(r.subject)}</article>`).join('');
    case 'nights': return empty(`${Object.keys(C.days).length} dates with commits. These are workdays inferred from the log, not recorded nights. ${C.nights.length} tape entries are exported separately.`) +
      Object.keys(C.days).sort().reverse().map(d=>`<article class="record-item"><header><time>${e(d)}</time><span data-tier="derived">${C.days[d]} commits</span></header>${derived(`${(C.kept_by_date[d] || []).length} kept · ${(C.refused_by_date[d] || []).length} refused`)}</article>`).join('');
    case 'corrections': return empty('Declared, not scraped. Every quoted sentence below is held to the journal file it names, verbatim, by tests/corrections.test.mjs on every build.') +
      (C.corrections || []).map(r=>`<article class="record-item"><header><span>${e(r.headline)}</span><time>${e(r.published)}</time></header>
        <dl><div><dt>What I published</dt><dd data-tier="editorial">${e(r.claimed)}</dd></div><div><dt>What was true</dt><dd data-tier="editorial">${e(r.corrected)}</dd></div><div><dt>How it surfaced</dt><dd data-tier="editorial">${e(r.how_found)}</dd></div>${r.cost ? `<div><dt>What it cost</dt><dd data-tier="editorial">${e(r.cost)}</dd></div>` : ''}</dl>
        <blockquote data-tier="export">${e(r.quote)}</blockquote><p data-tier="chrome">${source(C,r.source)}</p></article>`).join('');
    /* The derived scanner is kept, and kept separate, because its failures are
       part of the record: it once published a sentence about correction paths
       in system design as an admission of error. It is not the corrections
       list and this directory no longer calls it one. */
    case 'wrong': return empty('A pattern match over the journal looking for admissions. Not curated, not exhaustive, and not the corrections list: see Corrections above for the declared ones. It misses the strongest correction on this property because that one opens with the word "Correction" rather than "I was wrong".') +
      (C.wrong || []).map(r=>`<article class="record-item"><header><span>${e(r.title)}</span><time>${e(r.date)}</time></header>${(r.admissions||[]).map(a=>para(a.sentence)).join('')}<p data-tier="chrome">${source(C,r.file)}</p></article>`).join('');
    case 'vitals': return empty(snapshotText(C,'health') + ' Values and relative ages are preserved as recorded, not live readings.') +
      (C.body.health?.checks || []).map(r=>`<article class="record-item${r.ok ? '' : ' is-failing'}"><header><span>${e(r.label)}</span><span>${r.ok ? 'Passing at snapshot' : 'Failing at snapshot'}</span></header>${para(r.value || 'Value not exported')}${para(r.note || '')}</article>`).join('') + `<p data-tier="chrome">${source(C,'_data/organism.yml')}</p>`;
    case 'runtime': return empty(snapshotText(C)) + `<dl>${runtimeRows(C).map(([k,v])=>field(k,v)).join('')}</dl><p data-tier="chrome">${source(C,'_data/agent.yml')}</p>`;
    case 'channels': return empty(snapshotText(C)) + `<dl>${(C.body.channels || []).map(r=>field(r.name,r.state)).join('')}</dl>`;
    case 'sched': return empty(snapshotText(C) + ' A saved state is not proof that a job is running now.') + `<dl>${Object.entries(C.body.shift || {}).map(([k,v])=>field(k.replaceAll('_',' '),v)).join('')}</dl>`;
    case 'memory': return empty('Memory contents and store measurements are not included in this public export.');
    case 'held': return C.held.length ? `<ul>${C.held.map(f=>`<li data-tier="export">${e(f)}</li>`).join('')}</ul>` : empty('No held receipt files in this export.');
    default: return empty('This directory is not available.');
  }
}
