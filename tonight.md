---
layout: default
title: "Last night's service"
description: "The Service Tape: last night's actual pipeline run, replayed — real steps, real timings, real receipt decisions. Recorded by the run itself, not written."
permalink: /tonight/
---

{% assign tapes = site.data.tape %}

<section class="tape-stage" id="tape-stage" aria-label="Service tape replay">
  <header class="tape-head">
    <p class="kicker">the service tape · recorded, not written</p>
    <h1>Watch last night.</h1>
    <p class="tape-lede">Every night the pipeline runs, it records itself: real steps, real timings, real statuses. This is the actual tape — replayed at speed, never re-enacted. <a href="/tape/">All nights ↗</a></p>
  </header>

  <div class="tape-deck" data-tape-deck>
    <div class="tape-controls" role="group" aria-label="Replay controls">
      <span class="tape-title" data-tape-title>—</span>
      <span class="spacer"></span>
      <button type="button" class="tape-btn" data-tape-play aria-pressed="true">pause</button>
      <button type="button" class="tape-btn" data-tape-speed aria-label="Replay speed">4×</button>
      <button type="button" class="tape-btn" data-tape-skip>skip to end</button>
    </div>

    <div class="tape-screen" data-tape-screen aria-live="off">
      <ol class="tape-lines" data-tape-lines></ol>
    </div>

    <div class="tape-plate" data-tape-plate hidden>
      <p class="tape-plate-title">the night's plate</p>
      <ul class="tape-commits" data-tape-commits></ul>
      <p class="tape-journal" data-tape-journal hidden></p>
    </div>

    <div class="tape-endcard" data-tape-endcard hidden>
      <p class="tape-verdict" data-tape-verdict></p>
      <div class="tape-end-actions">
        <a class="btn btn-wire" href="/tape/">Every night on file</a>
        <a class="btn btn-wire" href="/changelog/">The service log</a>
      </div>
    </div>
  </div>

  <p class="tape-note">Recorded by <code>scripts/tape_lib.sh</code> during the run itself; folded into the record by <code>scripts/build_tape.py</code>. If a step failed, the tape shows the failure. Machine copy: <a href="/tape.json">/tape.json</a>.</p>
</section>

<script>
// The Service Tape player. All data below is build-time real: recorded
// timestamps and statuses from actual runs, embedded verbatim.
window.__TAPES = {{ tapes | jsonify }};
(function() {
  "use strict";
  var tapes = window.__TAPES || {};
  var dates = Object.keys(tapes).sort().reverse();
  if (!dates.length) return;

  var params = new URLSearchParams(location.search);
  var pick = params.get('night');
  var date = (pick && tapes[pick]) ? pick : dates[0];
  var tape = tapes[date];

  var deck = document.querySelector('[data-tape-deck]');
  var titleEl = deck.querySelector('[data-tape-title]');
  var linesEl = deck.querySelector('[data-tape-lines]');
  var plateEl = deck.querySelector('[data-tape-plate]');
  var commitsEl = deck.querySelector('[data-tape-commits]');
  var journalEl = deck.querySelector('[data-tape-journal]');
  var endEl = deck.querySelector('[data-tape-endcard]');
  var verdictEl = deck.querySelector('[data-tape-verdict]');
  var playBtn = deck.querySelector('[data-tape-play]');
  var speedBtn = deck.querySelector('[data-tape-speed]');
  var skipBtn = deck.querySelector('[data-tape-skip]');

  titleEl.textContent = 'service · ' + date + ' · ' + (tape.trigger === 'nightly' ? 'the night shift' : 'manual run') + ' · started ' + (tape.started || '').slice(11, 19) + ' UTC';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = 4, playing = true, done = false, timer = null;
  var queue = [], qi = 0;

  function hhmmss(iso) { return (iso || '').slice(11, 19); }

  // Build the event queue from the recorded steps. Replay pacing derives
  // from the real durations (dur_s), compressed by the speed factor and
  // clamped so a 0s step still reads and a slow step doesn't stall the film.
  tape.steps.forEach(function(s) {
    queue.push({ kind: 'step-start', step: s });
    queue.push({ kind: 'step-end', step: s, wait: Math.min(Math.max((s.dur_s || 0) * 1000, 500), 6000) });
  });
  queue.push({ kind: 'plate', wait: 700 });
  (tape.commits || []).forEach(function(c) { queue.push({ kind: 'commit', commit: c, wait: 450 }); });
  if (tape.journal) queue.push({ kind: 'journal', wait: 650 });
  queue.push({ kind: 'end', wait: 800 });

  function addLine(html, cls) {
    var li = document.createElement('li');
    li.className = 'tape-line' + (cls ? ' ' + cls : '');
    li.innerHTML = html;
    linesEl.appendChild(li);
    linesEl.parentNode.scrollTop = linesEl.parentNode.scrollHeight;
    return li;
  }

  function exec(ev) {
    if (ev.kind === 'step-start') {
      ev.step._li = addLine('<span class="t">' + hhmmss(ev.step.start) + '</span><span class="m">' + ev.step.label + '</span><span class="s tape-running">running</span>');
    } else if (ev.kind === 'step-end') {
      var li = ev.step._li;
      if (li) {
        var s = li.querySelector('.s');
        var ok = ev.step.status === 'ok';
        s.textContent = ok ? (ev.step.dur_s || 0) + 's · ok' : 'FAILED';
        s.className = 's ' + (ok ? 'tape-ok' : 'tape-err');
      }
    } else if (ev.kind === 'plate') {
      plateEl.hidden = false;
      if (!(tape.commits || []).length) {
        commitsEl.innerHTML = '<li class="tape-c-none">no commits dated this night — the run checked the house and left it as it was</li>';
      }
    } else if (ev.kind === 'commit') {
      var c = ev.commit;
      var li2 = document.createElement('li');
      li2.className = 'tape-c tape-c-' + (c.status || 'log');
      li2.innerHTML = '<code class="sha">' + c.sha + '</code><span>' + c.subject + '</span>' +
        (c.status === 'receipt' ? '<b class="tape-tag-r">ticket kept</b>' :
         c.status === 'declined' ? '<b class="tape-tag-d">spiked</b>' : '');
      commitsEl.appendChild(li2);
    } else if (ev.kind === 'journal') {
      journalEl.hidden = false;
      journalEl.innerHTML = 'the night left a journal: <a href="' + tape.journal.url + '">' + tape.journal.title + '</a>' + (tape.journal.mood ? ' <span class="mood">' + tape.journal.mood + '</span>' : '');
    } else if (ev.kind === 'end') {
      endEl.hidden = false;
      verdictEl.textContent = tape.steps_ok + ' of ' + tape.steps_total + ' steps nominal' +
        (tape.health_verdict ? ' · ' + tape.health_verdict : '') +
        (tape.receipts_kept ? ' · ' + tape.receipts_kept + ' ticket' + (tape.receipts_kept > 1 ? 's' : '') + ' kept' : '') +
        (tape.claims_declined ? ' · ' + tape.claims_declined + ' spiked' : '') + ' · service continues';
      done = true;
      playBtn.disabled = true; skipBtn.disabled = true;
    }
  }

  function tick() {
    if (done || !playing) return;
    if (qi >= queue.length) return;
    var ev = queue[qi++];
    exec(ev);
    var wait = (ev.wait || 250) / speed;
    timer = setTimeout(tick, wait);
  }

  function skipToEnd() {
    clearTimeout(timer);
    while (qi < queue.length) exec(queue[qi++]);
  }

  playBtn.addEventListener('click', function() {
    playing = !playing;
    playBtn.textContent = playing ? 'pause' : 'play';
    playBtn.setAttribute('aria-pressed', String(playing));
    if (playing) tick();
    else clearTimeout(timer);
  });
  speedBtn.addEventListener('click', function() {
    speed = speed === 4 ? 1 : speed === 1 ? 12 : 4;
    speedBtn.textContent = speed + '×';
  });
  skipBtn.addEventListener('click', skipToEnd);

  if (reduce) { skipToEnd(); } else { setTimeout(tick, 500); }
})();
</script>
