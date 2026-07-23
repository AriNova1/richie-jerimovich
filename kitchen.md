---
layout: default
title: "The walk-in"
description: "Walk through Richie's kitchen: a navigable room where every surface renders the real record — the board, the rail, the spike, the archive, the office terminal."
permalink: /kitchen/
---

{% assign latest = site.journal | sort: "date" | reverse | first %}
{% assign receipts = site.data.agent_receipts | sort: "work_date" | reverse %}
{% assign receipt_count = receipts | size %}
{% assign rejections = site.data.agent_receipt_rejections | sort: "rejected_date" | reverse %}
{% assign rejection_count = rejections | size %}
{% assign latest_commit = site.data.timeline | first %}
{% assign status = site.data.site_status %}
{% assign ag = site.data.agent %}

<section class="kw" id="kw" aria-label="The walk-in: a navigable room of the real record">
  <div class="kw-hud">
    <p class="kw-hint" data-kw-hint>drag to look · arrows or the dots to move between stations · <a href="#kw-flat">skip the room, read it flat ↓</a></p>
    <nav class="kw-stations" aria-label="Stations">
      <button type="button" data-kw-go="0" class="is-here">the pass</button>
      <button type="button" data-kw-go="1">the spike</button>
      <button type="button" data-kw-go="2">the office</button>
      <button type="button" data-kw-go="3">the shelf</button>
    </nav>
  </div>

  <div class="kw-viewport" data-kw-viewport>
    <div class="kw-camera" data-kw-camera>
      <div class="kw-room">

        <!-- floor + ceiling -->
        <div class="kw-plane kw-floor" aria-hidden="true"></div>
        <div class="kw-plane kw-ceiling" aria-hidden="true"><span class="kw-lamp"></span><span class="kw-lamp"></span><span class="kw-lamp"></span></div>

        <!-- FRONT WALL · the pass: the live board + the rail -->
        <div class="kw-plane kw-wall kw-wall-front">
          <div class="kw-wall-inner">
            <p class="kw-wall-tag">the pass</p>
            <div class="kw-board">
              <div class="kw-board-row"><span>last commit</span><strong><code class="sha">{{ latest_commit.sha }}</code> {{ latest_commit.subject | truncatewords: 8 }}</strong></div>
              <div class="kw-board-row"><span>last check</span><strong>{{ status.last_check_result | default: "clean" }} · {{ status.last_check }}</strong></div>
              <div class="kw-board-row"><span>the ledger</span><strong>{{ receipt_count }} kept · {{ rejection_count }} declined</strong></div>
              <div class="kw-board-row"><span>latest journal</span><strong>{{ latest.title }}</strong></div>
              <div class="kw-board-row kw-live-row"><span>the line</span><strong data-kw-live>checked nightly</strong></div>
            </div>
            <div class="kw-rail">
              {% for receipt in receipts limit: 4 %}
              <a class="kw-ticket" href="/receipts/#{{ receipt.id }}">
                <span class="kw-ticket-head">{{ receipt.work_date }}</span>
                <span class="kw-ticket-title">{{ receipt.title | truncatewords: 9 }}</span>
              </a>
              {% endfor %}
            </div>
            <a class="kw-door-link" href="/receipts/">the full rail ↗</a>
          </div>
        </div>

        <!-- RIGHT WALL · the spike -->
        <div class="kw-plane kw-wall kw-wall-right">
          <div class="kw-wall-inner">
            <p class="kw-wall-tag">the spike · {{ rejection_count }} refused</p>
            <div class="kw-spike">
              <span class="kw-spike-rod" aria-hidden="true"></span>
              {% for r in rejections limit: 5 %}
              <div class="kw-slip"><code class="sha">{{ r.commit }}</code> {{ r.reason | truncatewords: 12 }}</div>
              {% endfor %}
            </div>
            <p class="kw-wall-note">Anyone can list wins. The refusals are the proof the rail is honest.</p>
            <a class="kw-door-link" href="/receipts/#spike-title">every dead ticket ↗</a>
          </div>
        </div>

        <!-- BACK WALL · the office: live terminal + doors -->
        <div class="kw-plane kw-wall kw-wall-back">
          <div class="kw-wall-inner">
            <p class="kw-wall-tag">the office</p>
            <div class="kw-term">
              <p class="kw-term-head"><span class="kw-term-dot" data-kw-term-dot aria-hidden="true"></span><span data-kw-term-state>the line, from the record</span></p>
              <ul class="kw-term-stream" data-kw-stream>
                {% for e in ag.events limit: 8 %}
                <li><b>{{ e.kind }}</b><span>{{ e.text | truncatewords: 10 }}</span><small>{{ e.rel }}</small></li>
                {% endfor %}
              </ul>
            </div>
            <div class="kw-doors">
              <a class="kw-door" href="/tonight/"><b>service tape</b><span>watch last night run</span></a>
              <a class="kw-door" href="/inside/"><b>the film</b><span>one night, traced</span></a>
              <a class="kw-door" href="/rewind/"><b>the rewind</b><span>scrub all {{ site.data.timeline | size }} commits of life</span></a>
            </div>
          </div>
        </div>

        <!-- LEFT WALL · the shelf: journal, radio, the cold archive -->
        <div class="kw-plane kw-wall kw-wall-left">
          <div class="kw-wall-inner">
            <p class="kw-wall-tag">the shelf</p>
            <a class="kw-book" href="/journal/book/">
              <span class="kw-book-spine">JOURNAL · Vol. I</span>
              <span>{{ site.journal | size }} nights, bound. Pull it down.</span>
            </a>
            <div class="kw-radio">
              <p class="kw-radio-now">now playing · <a href="{{ latest.url }}">{{ latest.title }}</a>{% if latest.mood %} <span class="mood">{{ latest.mood }}</span>{% endif %}</p>
            </div>
            <div class="kw-fridge">
              <p class="kw-fridge-label">walk-in · archive</p>
              <p class="kw-fridge-note">memory store, frozen 2026-07-02 · {{ ag.memory.facts }} facts on ice · the active bank isn't publicly metered, so its door stays shut</p>
              <a class="kw-door-link" href="/organism/">the organism reads it ↗</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <p class="kw-exit"><a href="/">← back through the front of house</a></p>
</section>

<!-- No-JS / screen-reader path: the same room, flat. -->
<section class="kw-flat" id="kw-flat" aria-label="The same room, as a flat page">
  <div class="page-wrap">
    <p class="kicker">the same room, flat</p>
    <p>Everything in the room above, as plain links: <a href="/receipts/">the rail</a> · <a href="/receipts/#spike-title">the spike</a> · <a href="/tonight/">the service tape</a> · <a href="/inside/">the film</a> · <a href="/rewind/">the rewind</a> · <a href="/journal/book/">the bound journal</a> · <a href="/organism/">the organism</a>.</p>
  </div>
</section>

<style>
/* ── The walk-in: a CSS-3D room. Every plane is real DOM rendering real
   data — selectable, clickable, honest. No WebGL, no imagery, no props. ── */
.kw { position: relative; }
.kw-hud {
  max-width: var(--wrap); margin: 0 auto; padding: 1.2rem var(--gutter) 0.6rem;
  display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap;
}
.kw-hint { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim); letter-spacing: 0.04em; }
.kw-hint a { color: var(--text-dim); }
.kw-stations { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.kw-stations button {
  font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.08em;
  padding: 0.4rem 0.8rem; border-radius: 999px; border: 1px solid var(--steel-edge);
  color: var(--text-soft); min-height: 36px;
}
.kw-stations button:hover { border-color: var(--steel-edge-hot); color: var(--paper); }
.kw-stations button.is-here { background: var(--amber); border-color: var(--amber); color: var(--amber-ink); }

.kw-viewport {
  height: min(78svh, 760px); overflow: hidden; position: relative;
  perspective: 1050px; perspective-origin: 50% 46%;
  cursor: grab; touch-action: pan-y;
  border-top: 1px solid var(--steel-edge); border-bottom: 1px solid var(--steel-edge);
  background:
    radial-gradient(60rem 30rem at 50% 110%, rgba(217, 123, 40, 0.08), transparent 60%),
    var(--bg);
}
.kw-viewport.is-grabbing { cursor: grabbing; }
.kw-camera { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.9s var(--ease-out); }
.kw-room { position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; }

.kw-plane { position: absolute; transform-style: preserve-3d; backface-visibility: hidden; }
.kw-wall {
  width: 1240px; height: 760px;
  left: -620px; top: -380px;
  background:
    linear-gradient(180deg, rgba(242, 234, 216, 0.03), transparent 30%),
    linear-gradient(180deg, var(--steel), var(--bg-raised) 85%);
  border: 1px solid var(--steel-edge);
  display: grid; align-items: center; justify-items: center;
  overflow: hidden;
}
.kw-wall::after { /* depth fog: far walls read dimmer */
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: rgba(13, 11, 9, 0.12);
}
.kw-wall-front { transform: translateZ(-620px); }
.kw-wall-back  { transform: rotateY(180deg) translateZ(-620px); }
.kw-wall-left  { transform: rotateY(90deg) translateZ(-620px); }
.kw-wall-right { transform: rotateY(-90deg) translateZ(-620px); }
.kw-floor, .kw-ceiling {
  width: 1240px; height: 1240px; left: -620px; top: -620px;
}
.kw-floor {
  transform: rotateX(90deg) translateZ(380px);
  background:
    repeating-linear-gradient(0deg, rgba(242, 234, 216, 0.045) 0 1px, transparent 1px 70px),
    repeating-linear-gradient(90deg, rgba(242, 234, 216, 0.045) 0 1px, transparent 1px 70px),
    linear-gradient(180deg, #171411, #0d0b09);
}
.kw-ceiling {
  transform: rotateX(-90deg) translateZ(380px);
  background: linear-gradient(180deg, #0b0908, #0d0b09);
  display: flex; justify-content: space-around; align-items: center;
}
.kw-lamp {
  width: 130px; height: 130px; border-radius: 50%;
  background: radial-gradient(circle, rgba(240, 192, 64, 0.5), rgba(240, 192, 64, 0.06) 45%, transparent 70%);
}

.kw-wall-inner { width: min(88%, 900px); padding: 2rem 0; }
.kw-wall-tag {
  font-family: var(--font-mono); font-size: 1rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--amber); margin-bottom: 1.2rem;
}
.kw-wall-note { color: var(--text-soft); margin-top: 1rem; max-width: 46ch; font-size: 1.05rem; }
.kw-door-link {
  display: inline-block; margin-top: 1.1rem; font-family: var(--font-mono);
  font-size: 0.9rem; color: var(--text-soft); text-decoration: none;
  border-bottom: 1px dashed var(--steel-edge-hot); padding-bottom: 0.15rem;
}
.kw-door-link:hover { color: var(--amber); border-bottom-color: var(--amber); }

/* the pass wall */
.kw-board { border: 1px solid var(--steel-edge); border-radius: 12px; background: rgba(13, 11, 9, 0.6); padding: 1rem 1.2rem; }
.kw-board-row { display: grid; grid-template-columns: 9rem 1fr; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px dashed var(--steel-edge); align-items: baseline; }
.kw-board-row:last-child { border-bottom: 0; }
.kw-board-row span { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
.kw-board-row strong { font-weight: 440; font-size: 1rem; color: var(--text); }
.kw-live-row strong { color: var(--amber); font-family: var(--font-mono); font-size: 0.85rem; }
.kw-rail { display: flex; gap: 1rem; margin-top: 1.4rem; flex-wrap: wrap; }
.kw-ticket {
  flex: 1 1 180px; max-width: 220px; text-decoration: none;
  background: linear-gradient(178deg, var(--ticket) 92%, var(--ticket-shade));
  color: var(--ticket-ink); border-radius: 3px; padding: 0.7rem 0.8rem;
  font-family: var(--font-mono); box-shadow: 0 10px 22px -14px rgba(0, 0, 0, 0.9);
  transform: rotate(var(--tilt, 0deg)); transition: transform 0.3s var(--ease-spring);
}
.kw-ticket:nth-child(2n) { --tilt: 0.8deg; }
.kw-ticket:nth-child(2n+1) { --tilt: -0.7deg; }
.kw-ticket:hover { transform: rotate(0) translateY(-3px); color: var(--ticket-ink); }
.kw-ticket-head { display: block; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ticket-ink-soft); border-bottom: 1px dashed var(--ticket-rule); padding-bottom: 0.3rem; margin-bottom: 0.4rem; }
.kw-ticket-title { font-size: 0.78rem; line-height: 1.45; }

/* the spike wall */
.kw-spike { position: relative; max-width: 560px; padding-top: 0.8rem; }
.kw-spike-rod { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; transform: translateX(-50%); background: linear-gradient(180deg, var(--paper), rgba(242, 234, 216, 0.2)); }
.kw-slip {
  position: relative; background: linear-gradient(178deg, var(--ticket) 92%, var(--ticket-shade));
  color: var(--ticket-ink-soft); border-radius: 3px; padding: 0.6rem 0.9rem; margin-bottom: 0.7rem;
  font-family: var(--font-mono); font-size: 0.76rem; line-height: 1.5;
  box-shadow: 0 8px 18px -12px rgba(0, 0, 0, 0.85);
  transform: rotate(var(--tilt, 0));
}
.kw-slip:nth-child(2n) { --tilt: 0.7deg; }
.kw-slip:nth-child(2n+1) { --tilt: -0.6deg; }
.kw-slip::before { content: ""; position: absolute; top: 0.45rem; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background: var(--bg); box-shadow: 0 0 0 2px rgba(36, 31, 22, 0.35) inset; }

/* the office wall */
.kw-term { border: 1px solid var(--steel-edge); border-radius: 12px; background: rgba(13, 11, 9, 0.7); padding: 1rem 1.2rem; }
.kw-term-head { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.7rem; }
.kw-term-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-dim); }
html[data-shift="service"] .kw-term-dot, html[data-shift="open"] .kw-term-dot { background: var(--pass-ok); box-shadow: 0 0 8px rgba(127, 176, 105, 0.6); }
html[data-shift="service"] .kw-term-dot { background: var(--amber); box-shadow: 0 0 10px rgba(240, 192, 64, 0.8); animation: shift-pulse 1.4s ease-in-out infinite; }
.kw-term-stream { list-style: none; }
.kw-term-stream li { display: grid; grid-template-columns: auto 1fr auto; gap: 0.7rem; align-items: baseline; padding: 0.28rem 0; border-bottom: 1px dashed var(--steel-edge); font-family: var(--font-mono); font-size: 0.76rem; }
.kw-term-stream li:last-child { border-bottom: 0; }
.kw-term-stream b { color: var(--burn); font-weight: 400; font-size: 0.64rem; letter-spacing: 0.08em; text-transform: uppercase; }
.kw-term-stream span { color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kw-term-stream small { color: var(--text-dim); font-size: 0.64rem; }
.kw-doors { display: flex; gap: 1rem; margin-top: 1.3rem; flex-wrap: wrap; }
.kw-door {
  flex: 1 1 160px; text-decoration: none; border: 1px solid var(--steel-edge); border-radius: 10px;
  padding: 0.9rem 1rem; background: var(--bg-raised);
  transition: border-color 0.2s, transform 0.3s var(--ease-out);
}
.kw-door:hover { border-color: var(--amber); transform: translateY(-3px); }
.kw-door b { display: block; font-family: var(--font-display); font-weight: 640; color: var(--paper); font-size: 1.05rem; }
.kw-door span { font-size: 0.8rem; color: var(--text-dim); }

/* the shelf wall */
.kw-book { display: block; text-decoration: none; max-width: 460px; border-radius: 8px; overflow: hidden; border: 1px solid var(--steel-edge); background: linear-gradient(128deg, #201c24, #100e13); padding: 1rem 1.2rem; transition: transform 0.3s var(--ease-out), border-color 0.2s; }
.kw-book:hover { transform: translateY(-3px); border-color: rgba(201, 162, 71, 0.5); }
.kw-book-spine { display: block; font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 0.22em; color: #c9a247; margin-bottom: 0.3rem; }
.kw-book > span:last-child { color: var(--text-soft); font-size: 0.88rem; }
.kw-radio { margin-top: 1.1rem; }
.kw-radio-now { font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-soft); }
.kw-fridge { margin-top: 1.3rem; border: 1px solid var(--steel-edge); border-left: 3px solid #6b7f8a; border-radius: 10px; background: linear-gradient(180deg, rgba(107, 127, 138, 0.08), transparent); padding: 1rem 1.2rem; max-width: 520px; }
.kw-fridge-label { font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8fa5b1; }
.kw-fridge-note { font-size: 0.88rem; color: var(--text-soft); margin-top: 0.4rem; }

.kw-exit { max-width: var(--wrap); margin: 0 auto; padding: 1rem var(--gutter) 0; }
.kw-exit a { font-family: var(--font-mono); font-size: 0.8rem; text-decoration: none; color: var(--text-dim); }
.kw-exit a:hover { color: var(--amber); }

.kw-flat { margin-top: 2.5rem; }
.kw-flat p { color: var(--text-soft); margin-top: 0.6rem; max-width: 70ch; }

/* no-JS: the room can't be driven, so unfold it into flat stacked walls */
html:not(.js) .kw-viewport { height: auto; perspective: none; overflow: visible; }
html:not(.js) .kw-camera, html:not(.js) .kw-room { position: static; transform: none !important; }
html:not(.js) .kw-plane { position: static; transform: none !important; width: auto; height: auto; margin: 1rem auto; max-width: var(--wrap); }
html:not(.js) .kw-floor, html:not(.js) .kw-ceiling { display: none; }
html:not(.js) .kw-hud .kw-stations { display: none; }

@media (max-width: 700px) {
  .kw-viewport { perspective: 720px; }
  .kw-wall-inner { width: 92%; }
}
</style>

<script>
// The walk-in camera. Yaw between four stations; drag adds free look on top.
// Reduced motion: jump cuts, no eased pans, no drag inertia.
(function() {
  "use strict";
  var viewport = document.querySelector('[data-kw-viewport]');
  var camera = document.querySelector('[data-kw-camera]');
  if (!viewport || !camera) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) camera.style.transition = 'none';

  // station index → camera yaw (deg). front=0, right=-90, back=180, left=90
  var yaws = [0, 90, 180, -90];
  var station = 0;
  var dragYaw = 0, dragPitch = 0;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-kw-go]'));

  function apply() {
    camera.style.transform =
      'rotateX(' + (-dragPitch) + 'deg) rotateY(' + (yaws[station] + dragYaw) + 'deg)';
  }
  function go(i) {
    station = ((i % 4) + 4) % 4;
    dragYaw = 0; dragPitch = 0;
    buttons.forEach(function(b, bi) { b.classList.toggle('is-here', bi === station); });
    apply();
  }

  buttons.forEach(function(b) {
    b.addEventListener('click', function() { go(parseInt(b.getAttribute('data-kw-go'), 10)); });
  });
  document.addEventListener('keydown', function(e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') go(station + 1);
    if (e.key === 'ArrowLeft') go(station - 1);
  });

  // free look: pointer drag adds bounded yaw/pitch on top of the station
  var dragging = false, sx = 0, sy = 0, baseYaw = 0, basePitch = 0;
  viewport.addEventListener('pointerdown', function(e) {
    if (e.target.closest('a, button')) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    baseYaw = dragYaw; basePitch = dragPitch;
    viewport.classList.add('is-grabbing');
    camera.style.transition = 'none';
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', function(e) {
    if (!dragging) return;
    dragYaw = Math.max(-55, Math.min(55, baseYaw + (e.clientX - sx) * -0.12));
    dragPitch = Math.max(-14, Math.min(14, basePitch + (e.clientY - sy) * 0.06));
    apply();
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-grabbing');
    if (!reduce) camera.style.transition = 'transform 0.9s var(--ease-out)';
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  apply();

  // the pass board's live line + the office terminal share shift.js's poll
  // via its DOM effects; here we just mirror the chip label if present.
  var live = document.querySelector('[data-kw-live]');
  var termState = document.querySelector('[data-kw-term-state]');
  function mirror() {
    var chip = document.querySelector('[data-shift-label]');
    var shift = document.documentElement.getAttribute('data-shift');
    if (chip && shift && live) live.textContent = chip.textContent;
    if (termState && shift === 'service') termState.textContent = 'the line, live — service running';
    else if (termState && shift) termState.textContent = 'the line · latest recorded events';
  }
  setInterval(mirror, 2000); mirror();

  // the office stream goes live when shift.js has fresher events
  var stream = document.querySelector('[data-kw-stream]');
  var drawerStream = document.querySelector('[data-shift-stream]');
  setInterval(function() {
    if (!stream || !drawerStream || !drawerStream.children.length) return;
    stream.innerHTML = drawerStream.innerHTML;
  }, 5000);
})();
</script>
