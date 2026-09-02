/* ═══════════════════════════════════════════════════════════
   v9 · THE OVERNIGHT
   Conception: .design/conception-2026-08-20.json

   Scroll is the master clock. Station interiors are pure functions of
   journey progress; scrubbing backwards runs the night backwards exactly.
   Station boundaries CUT. Hold-motion uses shift.js: body.motion-held +
   the motionhold event. The dead data-hold-motion path is not read here.
   ═══════════════════════════════════════════════════════════ */

import { mountJourney, buildJourneyMap, clamp } from '../lib/journey.mjs';
import { canShader, mountSteel } from '../lib/steel-light.mjs';
import { mountDawn } from '../lib/dawn-dither.mjs';

const root = document.querySelector('.overnight');
const dataEl = document.getElementById('overnight-data');
if (root && dataEl) boot();

function boot() {
  let D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  tickClocks(root, D);
  pollVitals(root);
  if (reduceMq.matches) {
    const onChange = () => { if (!reduceMq.matches) location.reload(); };
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onChange);
    return;
  }

  const pin = root.querySelector('.ov-pin');
  const stage = root.querySelector('.ov-stage');
  if (!pin || !stage) return;

  root.classList.add('ov-live');
  pin.hidden = false;
  pin.removeAttribute('hidden');

  /* Dwell weights. Tape dur_s for this night is mostly 0-1s and would make
     every station equal and instant, so editorial weights are declared here.
     M3 is 1.6x: the rack-focus climax (v8 editorial weight, kept). */
  const STATIONS = [
    { id: 'm0', hour: '22:50', label: 'THE DARK',        dwell: 1.0, x: 0 },
    { id: 'm1', hour: '23:00', label: 'FIRST TICKET',    dwell: 1.2, x: 0 },
    { id: 'm2', hour: '01:20', label: 'THE RAIL',        dwell: 1.3, x: 0 },
    { id: 'm3', hour: '03:55', label: 'THE SPIKE',       dwell: 1.6, x: 0 },
    { id: 'm4', hour: '05:10', label: 'THE MARGIN',      dwell: 1.2, x: 0 },
    { id: 'm5', hour: '06:30', label: 'DAWN',            dwell: 1.0, x: 0 },
  ];
  const map = buildJourneyMap(STATIONS);

  const corridor = stage.querySelector('.ov-corridor');
  const stationsEls = Array.from(stage.querySelectorAll('.ov-station'));
  const clockEl = stage.querySelector('[data-ov-clock]');
  const labelEl = stage.querySelector('[data-ov-label]');
  const capEl = stage.querySelector('[data-ov-cap]');
  const strip = stage.querySelector('.ov-strip');
  const skip = stage.querySelector('.ov-skip');
  const fallback = stage.querySelector('.ov-fallback');
  const steelCanvas = stage.querySelector('#ov-steel');
  const dawnCanvas = stage.querySelector('#ov-dawn');
  const cKeep = stage.querySelector('[data-ov-keep]');
  const cDec = stage.querySelector('[data-ov-dec]');

  const CAPS = [
    'This kitchen has no staff.',
    'At 23:00 the shift starts. There is no one here to work it.',
    'Every claim that survived the night, hanging where it can be checked.',
    'Most of what it makes, it throws away. The reasons are printed on the tickets.',
    'It writes about the night before it sleeps. It does not flatter itself.',
    'What survived is published with its evidence. The rest stays on the spike.',
  ];
  const nightLabel = D.tapeFresh
    ? 'last night, as recorded'
    : ('the night of ' + (D.tapeDate || '') + ', as recorded');

  /* Seeded PRNG. Harvested from pass.js. Diffable captures. */
  let _s = 0x9E3779B9;
  function rnd() {
    _s = (_s + 0x6D2B79F5) | 0;
    let t = _s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const railTickets = Array.from(stage.querySelectorAll('[data-ov-rail] .ticket'));
  const spikeTickets = Array.from(stage.querySelectorAll('[data-ov-spike] .ticket'));
  const feed = stage.querySelector('[data-ov-feed]');
  const journalLines = Array.from(stage.querySelectorAll('[data-ov-journal] [data-line]'));
  const spikeAngles = spikeTickets.map(() => (rnd() - 0.5) * 12);
  const railOffsets = railTickets.map((_, i) => {
    const n = Math.max(1, railTickets.length);
    return (i - (n - 1) / 2) * (window.innerWidth <= 640 ? 78 : 108);
  });

  let lastCap = -1;
  let keepLanded = 0;
  let decLanded = 0;
  let idle = true;
  let ptr = { x: 0.5, y: 0.22, tx: 0.5, ty: 0.22 };
  let ptrRaf = 0;
  let steel = null;
  let dawn = null;
  const shaderOk = canShader();

  if (shaderOk && steelCanvas) {
    try { steel = mountSteel(steelCanvas); } catch (e) { steel = null; }
  }
  if (shaderOk && dawnCanvas) {
    try { dawn = mountDawn(dawnCanvas); } catch (e) { dawn = null; }
  }
  if (steel) steelCanvas.hidden = false;
  if (fallback) fallback.hidden = !!steel;

  function setNum(el, n) {
    if (!el) return;
    const s = String(n);
    if (el.getAttribute('data-v') === s) return;
    el.setAttribute('data-v', s);
    el.textContent = s;
  }

  function restCounts() {
    setNum(cKeep, (D.kept && D.kept.length) || 0);
    setNum(cDec, (D.spiked && D.spiked.length) || 0);
    keepLanded = (D.kept && D.kept.length) || 0;
    decLanded = (D.spiked && D.spiked.length) || 0;
  }

  function applyStation(index, local, p, rest) {
    stationsEls.forEach((el, i) => {
      el.classList.toggle('is-on', i === index);
      const blur = (index === 3 && i !== 3) ? Math.min(6, local * 6) : 0;
      el.style.filter = blur ? ('blur(' + blur + 'px)') : '';
    });
    STATIONS.forEach((st, i) => {
      const btn = strip && strip.querySelector('[data-i="' + i + '"]');
      if (btn) btn.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    if (labelEl) {
      const lab = STATIONS[index] ? STATIONS[index].label : '';
      labelEl.textContent = lab;
      labelEl.title = index === 1 ? nightLabel : '';
    }
    if (index !== lastCap && capEl) {
      lastCap = index;
      capEl.textContent = CAPS[index] || '';
      capEl.style.animation = 'none';
      void capEl.offsetWidth;
      capEl.style.animation = '';
    }

    /* Lamps: strike in M1, hold through M4, drain in M5. */
    const lamps = [0, 0, 0, 0, 0, 0];
    if (index === 0) {
      lamps[0] = 0.18;
    } else if (index === 1) {
      const n = Math.floor(local * 6.001);
      for (let i = 0; i < 6; i++) lamps[i] = i <= n ? 1 : 0;
    } else if (index >= 2 && index <= 4) {
      lamps.fill(1);
    } else if (index === 5) {
      const n = Math.floor((1 - local) * 6.001);
      for (let i = 0; i < 6; i++) lamps[i] = i <= n ? (1 - local) : 0;
    }
    if (fallback) {
      lamps.forEach((v, i) => fallback.style.setProperty('--lamp-' + i, String(v)));
    }
    if (steel) {
      steel.setLamps(lamps.map((v, i) => ({ x: (i + 0.5) / 6, y: 0.12, intensity: v })));
    }

    /* M1 paper feed: scroll out, reverse retracts. */
    if (feed) {
      const t = index < 1 ? 0 : index === 1 ? local : 1;
      feed.style.height = (8 + t * 42) + 'vh';
      feed.style.opacity = t > 0.02 ? '1' : '0';
    }

    /* M2 rail: tickets hang one per waypoint. Reverse takes them down. */
    let hung = 0;
    railTickets.forEach((el, i) => {
      const gate = (i + 0.15) / Math.max(1, railTickets.length);
      let t = 0;
      if (index > 2) t = 1;
      else if (index === 2) t = clamp((local - gate) / 0.12, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      el.style.opacity = String(e);
      el.style.transform = 'translate(' + (railOffsets[i] * e) + 'px,' + ((1 - e) * -48) + 'px) scale(' + (0.4 + 0.6 * e) + ')';
      if (t >= 0.85) hung++;
    });
    if (hung !== keepLanded && cKeep && !rest) {
      keepLanded = hung;
      setNum(cKeep, hung);
    }

    /* M3 spike: tickets fall as scroll crosses each waypoint. Reverse lifts. */
    let stuck = 0;
    spikeTickets.forEach((el, i) => {
      const gate = (i + 0.1) / Math.max(1, spikeTickets.length);
      let t = 0;
      if (index > 3) t = 1;
      else if (index === 3) t = clamp((local - gate) / 0.14, 0, 1);
      const y = -180 + t * (180 + i * 10);
      const rot = spikeAngles[i] * t;
      el.style.opacity = t > 0.02 ? '1' : '0';
      el.style.transform = 'translate(-50%,' + y + 'px) rotate(' + rot + 'deg)';
      el.classList.toggle('is-pierced', t >= 1);
      if (t >= 1) stuck++;
    });
    if (stuck !== decLanded && cDec && !rest) {
      decLanded = stuck;
      setNum(cDec, stuck);
    }
    if (rest) restCounts();

    /* M4 journal: one sentence per waypoint. */
    journalLines.forEach((el, i) => {
      const gate = (i + 0.05) / Math.max(1, journalLines.length);
      const t = index < 4 ? 0 : index === 4 ? clamp((local - gate) / 0.2, 0, 1) : 1;
      el.style.opacity = String(t);
      el.style.transform = 'translateY(' + ((1 - t) * 10) + 'px)';
    });

    /* M5 dawn. Hard cut fallback if no WebGL. */
    if (dawn) {
      if (index === 5) {
        dawn.show();
        dawn.setProgress(local);
      } else if (index < 5) {
        dawn.hide();
      } else {
        dawn.show();
        dawn.setProgress(1);
      }
    } else if (fallback) {
      fallback.style.background = index === 5 && local >= 0.5
        ? 'var(--dawn, #a9bfd4)'
        : '';
    }

    /* Pointer lamp only in M0. */
    idle = index === 0 && !rest;
    if (steel) steel.setPointer(ptr.x, ptr.y, idle ? 1 : 0);
    if (fallback) fallback.style.setProperty('--ptr', idle ? '1' : '0');

    /* Camera: hard cut to the station, small interior dolly. */
    if (corridor) {
      const dolly = (local - 0.5) * 48;
      corridor.style.transform = 'translate(-50%, -50%) translateX(' + (-dolly) + 'px) translateZ(' + (local * 40 - 20) + 'px)';
    }
  }

  function onFrame({ index, local, p, rest }) {
    applyStation(index, local, p, rest);
  }

  const journey = mountJourney({
    stage,
    stations: STATIONS,
    map,
    onFrame,
    onHold(on) {
      if (on) {
        applyStation(STATIONS.length - 1, 1, 1, true);
        if (steel) steel.pause();
        if (dawn) dawn.pause();
      } else {
        if (steel) steel.resume();
        if (dawn) dawn.resume();
      }
    },
  });

  if (strip) {
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      journey.seekTo(+b.getAttribute('data-i'));
    });
  }
  if (skip) {
    skip.hidden = false;
    skip.addEventListener('click', () => {
      const house = root.querySelector('.ov-house');
      if (house) house.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }

  /* Pointer lamp: critically damped follow on fine pointers; autonomous
     drift on coarse (phones). Idle life: stops under hold, reduced, hide. */
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  function springPtr(now) {
    ptrRaf = requestAnimationFrame(springPtr);
    if (document.body.classList.contains('motion-held') || document.hidden) return;
    if (coarse && idle) {
      const t = now / 1000;
      ptr.tx = 0.5 + Math.sin(t * 0.35) * 0.22;
      ptr.ty = 0.22 + Math.cos(t * 0.27) * 0.08;
    }
    ptr.x += (ptr.tx - ptr.x) * 0.12;
    ptr.y += (ptr.ty - ptr.y) * 0.12;
    if (fallback) {
      fallback.style.setProperty('--ptr-x', (ptr.x * 100) + '%');
      fallback.style.setProperty('--ptr-y', (ptr.y * 100) + '%');
    }
    if (steel && idle) steel.setPointer(ptr.x, ptr.y, 1);
  }
  ptrRaf = requestAnimationFrame(springPtr);
  if (!coarse) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ptr.tx = (e.clientX - r.left) / Math.max(1, r.width);
      ptr.ty = (e.clientY - r.top) / Math.max(1, r.height);
    }, { passive: true });
  }

  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) {
          if (steel) steel.pause();
        } else if (!document.body.classList.contains('motion-held')) {
          if (steel) steel.resume();
        }
      });
    }, { threshold: 0 })
    : null;
  if (io) io.observe(stage);

  if (cKeep) setNum(cKeep, 0);
  if (cDec) setNum(cDec, 0);
}

function tickClocks(root, D) {
  const nodes = root.querySelectorAll('[data-ov-clock]');
  const next = D.nextServiceUtc ? Date.parse(D.nextServiceUtc) : NaN;
  function fmt(d) {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }
  function subline(now) {
    if (isNaN(next)) return 'service nightly · 23:00 CT';
    const s = Math.floor((next - now.getTime()) / 1000);
    if (s <= 0) return 'last scheduled service ' + new Date(next).toISOString().slice(0, 10);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return 'service in ' + h + 'h ' + m + 'm';
  }
  function tick() {
    if (document.body.classList.contains('motion-held')) return;
    const now = new Date();
    nodes.forEach((el) => {
      const t = el.querySelector('[data-time]');
      const sub = el.querySelector('[data-sub]');
      if (t) t.textContent = fmt(now);
      if (sub) sub.textContent = subline(now);
    });
  }
  tick();
  setInterval(function () { if (!document.hidden) tick(); }, 1000);
}

function pollVitals(root) {
  const beat = root.querySelector('.rx-beat');
  const DEV = /^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(location.hostname);
  const ENDPOINT = DEV
    ? (localStorage.getItem('vitalsDev') || 'http://127.0.0.1:8787/vitals.json')
    : 'https://vitals.agentrichie.com/vitals.json';

  function at(obj, path) {
    return String(path).split('.').reduce(function (o, k) {
      return o && o[k] != null ? o[k] : null;
    }, obj);
  }

  if (beat) {
    (function () {
      function tick() {
        if (document.body.classList.contains('motion-held')) return;
        const t = Date.parse(beat.getAttribute('data-rx-since'));
        if (isNaN(t)) return;
        const s = Math.max(0, (Date.now() - t) / 1000);
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        beat.textContent = 'last commit ' + (d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + m + 'm' : m + 'm ago');
      }
      tick();
      setInterval(function () { if (!document.hidden) tick(); }, 1000);
    }());
  }

  function apply(d) {
    root.querySelectorAll('[data-vital]').forEach(function (el) {
      const v = at(d, el.getAttribute('data-vital'));
      if (v != null && el.textContent !== String(v)) el.textContent = String(v);
    });
    if (d.last_commit_iso && beat) beat.setAttribute('data-rx-since', d.last_commit_iso);
  }

  function once() {
    fetch(ENDPOINT, { cache: 'no-store', mode: 'cors' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(apply)
      .catch(function () { /* build-time figures stand */ });
  }
  once();
  setInterval(function () {
    if (!document.hidden && !document.body.classList.contains('motion-held')) once();
  }, 8000);
}
