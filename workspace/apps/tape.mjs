/* ══════════════════════════════════════════════════════════════════
   LAST NIGHT'S SERVICE (#9 of the September ideas, and the answer to
   "nothing here is ever new")

   The property already had the only honest dynamism available to it and
   nobody could reach it. Every night the pipeline records itself: what
   it ran, in what order, how long each step took, which commits it
   turned into receipts and which it declined and why. A different tape
   exists every morning, written by the run rather than about it.

   This replays it. The transport steps through the night at the real
   recorded offsets, so a step that took four seconds takes four
   seconds. Nothing is smoothed, nothing is interpolated, and a run that
   finished in five seconds replays in five: it is a small night and the
   page says so rather than padding it into a show.
   ══════════════════════════════════════════════════════════════════ */
import { escapeHTML as e } from '../record.mjs';

/* The run writes three verdicts, and they are not the same as the ledger's
   two: a commit either earned a receipt, was weighed and declined with a
   reason, or was never a candidate. Calling the third one "no receipt" would
   read as a judgement that was never made. */
const VERDICT = { receipt: 'earned a receipt', declined: 'weighed and declined', plain: 'not a candidate' };

const ms = (a, b) => (a && b ? Math.max(0, Date.parse(b) - Date.parse(a)) : 0);

/* Pure. Turns a tape into a playable timeline. Unit-tested.

   Two clocks, and the difference is stated on the page. `at` and `took`
   are the recorded truth and are what the rows print. `showAt` and
   `showFor` are the pacing: the run records to the whole second, so
   eight of ten steps in a six second night share an offset of zero and
   a real-time replay would finish before the first frame. Sub-second
   steps get a minimum beat, and steps inside the same recorded second
   are staggered in the order they ran, which is order the recorder
   does preserve. The numbers on screen are never the paced ones. */
export const MIN_BEAT = 420;

export function timeline(tape) {
  if (!tape || !tape.steps?.length) return { total: 0, showTotal: 0, steps: [] };
  const t0 = Date.parse(tape.started || tape.steps[0].start);
  const steps = tape.steps.map((s, i) => ({
    ...s, i,
    at: Math.max(0, Date.parse(s.start) - t0),
    took: Number.isFinite(s.dur_s) ? s.dur_s * 1000 : ms(s.start, s.end),
  }));
  const total = Math.max(ms(tape.started, tape.ended), ...steps.map((s) => s.at + s.took), 1);

  let cursor = 0;
  for (const s of steps) {
    /* Never run ahead of the recorded start: the beat can only ever push a
       step later than the truth, never earlier. */
    s.showAt = Math.max(cursor, s.at);
    s.showFor = Math.max(s.took, MIN_BEAT);
    cursor = s.showAt + s.showFor;
  }
  /* The replay is never shorter than the night: if the run kept going after
     its last recorded step, that tail is part of it. */
  return { total, showTotal: Math.max(cursor, total), steps };
}

const fmtDur = (n) => (n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(n < 10000 ? 1 : 0)} s`);
const fmtClock = (iso) => { try { return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase(); } catch { return iso || 'not recorded'; } };

export function mountTape(host, { corpus, initialState, onOpenDocument, onOpenSource }) {
  const ac = new AbortController(); const signal = ac.signal;
  const tapes = corpus.tapes || [];
  let idx = Math.max(0, tapes.findIndex((t) => t.date === initialState?.date));
  if (idx < 0 || !tapes[idx]) idx = 0;
  let playing = false, at = 0, raf = 0, last = 0;

  const tape = () => tapes[idx];
  const line = () => timeline(tape());

  function paint() {
    const { total, showTotal, steps } = line();
    const done = steps.filter((s) => at >= s.showAt + s.showFor).length;
    host.querySelectorAll('.tp-step').forEach((el, i) => {
      const s = steps[i]; if (!s) return;
      const state = at >= s.showAt + s.showFor ? 'done' : at >= s.showAt ? 'running' : 'waiting';
      if (el.dataset.state !== state) el.dataset.state = state;
    });
    const bar = host.querySelector('.tp-progress i');
    if (bar) bar.style.transform = `scaleX(${Math.min(1, at / showTotal)})`;
    const read = host.querySelector('[data-tp-read]');
    if (read) read.textContent = `${done} of ${steps.length} steps done · the night itself took ${fmtDur(total)}`;
    const scrub = host.querySelector('.tp-scrub');
    if (scrub && document.activeElement !== scrub) scrub.value = String(Math.round(at));
    const btn = host.querySelector('[data-tp-play]');
    if (btn) { btn.textContent = playing ? 'Pause' : at >= showTotal ? 'Replay the night' : 'Play the night'; btn.setAttribute('aria-pressed', String(playing)); }
  }

  function tick(now) {
    if (!playing) return;
    const { showTotal } = line();
    at = Math.min(showTotal, at + (now - last));
    last = now;
    paint();
    if (at >= showTotal) { playing = false; paint(); return; }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    const { showTotal } = line();
    if (at >= showTotal) at = 0;
    playing = true; last = performance.now(); raf = requestAnimationFrame(tick); paint();
  }
  function stop() { playing = false; cancelAnimationFrame(raf); paint(); }

  /* An ISO date is the right identifier and the wrong headline. It was the
     largest line in the window, and "2026-09-08" tells a reader nothing that
     "Monday, 8 September" does not tell them faster. The ISO stays, one line
     down, where a reader who wants to match it against the export can. */
  const humanDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const sentenceCase = (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1);

  function render() {
    const t = tape(); const { total, showTotal, steps } = line();
    if (!t) { host.innerHTML = '<div class="tape"><p class="record-note">No recorded nights in this export.</p></div>'; return; }
    at = 0; playing = false;
    host.innerHTML = `<div class="tape">
      <header class="tp-head">
        <p class="widget-kicker">Last night's service</p>
        <h1>${e(humanDate(t.date))}</h1>
        <p class="tp-sub" data-tier="export"><time>${e(t.date)}</time>. ${e(sentenceCase(t.trigger || 'trigger not recorded'))} run. Started ${e(fmtClock(t.started))}, finished ${e(fmtClock(t.ended))} Chicago time. ${t.steps_ok} of ${t.steps_total} steps clean. Health ${e(t.health_verdict || 'not recorded')}.</p>
        <p class="tp-note" data-tier="editorial">The run wrote this while it ran. It records to the whole second, so most of these steps share an offset and a true real-time replay would be over before you saw it. Each step is held for at least ${MIN_BEAT} ms and steps inside one recorded second play in the order they ran. Every duration printed on a row is the recorded one, not the paced one.</p>
        <div class="tp-transport">
          <button type="button" data-tp-play class="tp-play">Play the night</button>
          <input class="tp-scrub" type="range" min="0" max="${Math.round(showTotal)}" step="10" value="0" aria-label="Scrub the run">
          <span class="tp-read" data-tp-read role="status"></span>
        </div>
        ${tapes.length > 1 ? `<div class="tp-nights" role="group" aria-label="Recorded nights">${tapes.map((x, i) => `<button type="button" data-night="${i}" aria-pressed="${i === idx}">${e(x.date)}</button>`).join('')}</div>` : ''}
      </header>

      <ol class="tp-steps">${steps.map((s) => `<li class="tp-step" data-state="waiting" style="--at:${(s.showAt / showTotal * 100).toFixed(2)}%;--w:${Math.max(1.5, s.showFor / showTotal * 100).toFixed(2)}%">
        <span class="tp-dot" aria-hidden="true"></span>
        <span class="tp-when">+${fmtDur(s.at)}</span>
        <span class="tp-label">${e(s.label || s.slug)}</span>
        <span class="tp-took">${s.took ? fmtDur(s.took) : 'under a millisecond'}</span>
        <span class="tp-status is-${e(s.status || 'unknown')}">${e(s.status || 'not recorded')}</span>
      </li>`).join('')}</ol>
      <div class="tp-progress" aria-hidden="true"><i></i></div>

      <section class="tp-out">
        <h2>What the night decided</h2>
        <ul class="tp-commits">${(t.commits || []).map((c) => `<li class="is-${e(c.status || 'unknown')}">
          <p class="tp-c-head"><code>${e(c.sha || '')}</code> <span class="tp-c-verdict">${VERDICT[c.status] || 'not recorded'}</span>${c.receipt_id ? ` <code class="tp-c-rid">${e(c.receipt_id)}</code>` : ''}</p>
          <p class="tp-c-subject" data-tier="export">${e(c.subject || 'subject not recorded')}</p>
          ${c.rejection_reason ? `<p class="tp-c-why" data-tier="export">${e(c.rejection_reason)}</p>` : ''}
          ${c.status === 'plain' ? '<p class="tp-c-why" data-tier="editorial">Never a receipt candidate. The guard did not weigh this one either way.</p>' : ''}
        </li>`).join('') || '<li><p data-tier="export">No commits recorded on this night.</p></li>'}</ul>
        ${t.journal ? `<p class="tp-journal" data-tier="export">The entry written that night: <strong>${e(t.journal.title)}</strong>${t.journal.mood ? `. Mood: ${e(t.journal.mood)}` : ''}.</p>` : ''}
      </section>
      <footer class="tp-foot" data-tier="chrome">Recorded by the run in _data/tape/${e(t.date)}.yml. Nothing here is re-enacted.</footer>
    </div>`;
    paint();
  }

  host.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-tp-play]')) { playing ? stop() : play(); return; }
    const n = ev.target.closest('[data-night]');
    if (n) { stop(); idx = Number(n.dataset.night); render(); host.querySelector(`[data-night="${idx}"]`)?.focus(); }
  }, { signal });
  host.addEventListener('input', (ev) => {
    if (!ev.target.closest('.tp-scrub')) return;
    stop(); at = Number(ev.target.value); paint();
  }, { signal });

  render();
  return { getState() { return { date: tape()?.date }; }, destroy() { cancelAnimationFrame(raf); ac.abort(); host.replaceChildren(); } };
}
