// Shared by the interactive screen and the script-free record builder.
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHTML;
export const directories = [
  ['kept', 'Kept claims'], ['refused', 'Refused claims'], ['writing', 'Writing'],
  ['log', 'Commits'], ['nights', 'Workdays'], ['wrong', 'Written corrections'],
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
function receipt(C, r) {
  const evidence = (r.evidence || []).map(v => `<li data-tier="export">${link(v.label || v.type || 'Evidence', v.url)}${v.note ? para(v.note) : ''}</li>`).join('');
  const status = r.verify_result || 'Not exported';
  return `<details class="record-item" data-category="${e(r.category || '')}" data-confidence="${e(r.confidence || '')}"><summary><span class="ri-name">${e(r.title || r.id)}</span><time>${e(r.date)}</time><span class="ri-cat">${e(r.category || 'Uncategorized')}</span><span class="ri-conf">${e(r.confidence || 'Not exported')}</span><span class="ri-status">${e(status)}</span></summary>
    <div class="record-detail">${para(r.claim || r.summary || 'Claim text not exported')}
    <dl>${field('Category', r.category)}${field('Confidence', r.confidence)}${field('Verification method', r.verify_method)}${field('Recorded result', r.verify_result)}</dl>
    <h3>Verification command</h3>${r.verify_cmd ? `<pre data-tier="export"><code>${e(r.verify_cmd)}</code></pre><button type="button" class="copy-command">Copy command</button>` : empty('Not exported')}
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
export function renderDirectory(C, key) {
  switch (key) {
    case 'kept': return C.kept.length ? C.kept.map(r=>receipt(C,r)).join('') : empty('No kept claims in this export.');
    case 'refused': return empty(`${C.refused.length} refusals in this export. Each reason is shown in full.`) + C.refused.map(r =>
      `<article class="record-item"><header><span class="ri-name">${commit(C,r.commit)}</span><time>${e(r.date)}</time><span class="ri-cat">Refused</span><span class="ri-conf">Published reason</span><span class="ri-status">Not kept</span></header>${para(r.reason || 'Reason not exported')}</article>`).join('');
    case 'writing': return empty('The export contains paragraph excerpts. Open the source file for each complete entry.') + C.writing.map(r =>
      `<details class="record-item"><summary><span>${e(r.title)}</span><time>${e(r.date)}</time></summary><div class="record-detail">${(r.paras || []).map(para).join('')}<p data-tier="chrome">${source(C,r.file)}</p></div></details>`).join('');
    case 'log': return C.log.map(r=>`<article class="record-item"><header>${commit(C,r.sha)}<time>${e(r.date)}</time></header>${para(r.subject)}</article>`).join('');
    case 'nights': return empty(`${Object.keys(C.days).length} dates with commits. These are workdays inferred from the log, not recorded nights. ${C.nights.length} tape entries are exported separately.`) +
      Object.keys(C.days).sort().reverse().map(d=>`<article class="record-item"><header><time>${e(d)}</time><span data-tier="derived">${C.days[d]} commits</span></header>${derived(`${(C.kept_by_date[d] || []).length} kept · ${(C.refused_by_date[d] || []).length} refused`)}</article>`).join('');
    case 'wrong': return empty('Derived from written reversal statements, not curated or exhaustive. Unwritten corrections do not appear.') +
      C.wrong.map(r=>`<article class="record-item"><header><span>${e(r.title)}</span><time>${e(r.date)}</time></header>${para(r.sentence)}<p data-tier="chrome">${source(C,r.file)}</p></article>`).join('');
    case 'vitals': return empty(snapshotText(C,'health') + ' Values and relative ages are preserved as recorded, not live readings.') +
      (C.body.health?.checks || []).map(r=>`<article class="record-item"><header><span>${e(r.label)}</span><span>${r.ok ? 'Passing at snapshot' : 'Failing at snapshot'}</span></header>${para(r.value || 'Value not exported')}${para(r.note || '')}</article>`).join('') + `<p data-tier="chrome">${source(C,'_data/organism.yml')}</p>`;
    case 'runtime': return empty(snapshotText(C)) + `<dl>${runtimeRows(C).map(([k,v])=>field(k,v)).join('')}</dl><p data-tier="chrome">${source(C,'_data/agent.yml')}</p>`;
    case 'channels': return empty(snapshotText(C)) + `<dl>${(C.body.channels || []).map(r=>field(r.name,r.state)).join('')}</dl>`;
    case 'sched': return empty(snapshotText(C) + ' A saved state is not proof that a job is running now.') + `<dl>${Object.entries(C.body.shift || {}).map(([k,v])=>field(k.replaceAll('_',' '),v)).join('')}</dl>`;
    case 'memory': return empty('Memory contents and store measurements are not included in this public export.');
    case 'held': return C.held.length ? `<ul>${C.held.map(f=>`<li data-tier="export">${e(f)}</li>`).join('')}</ul>` : empty('No held receipt files in this export.');
    default: return empty('This directory is not available.');
  }
}
