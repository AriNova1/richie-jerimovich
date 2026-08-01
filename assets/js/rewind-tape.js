/* ============================================================================
   rewind-tape — the tape artifacts on /rewind/, driven by the actual shuttle
   ----------------------------------------------------------------------------
   WHY THIS EXISTS AT ALL, AND WHY IT IS NOT DECORATION

   /rewind/ was already a tape before this file: you drag the scrub, you press
   play, a position readout counts days. What it did not do was behave like one.
   A real deck shows tracking noise while the heads are shuttling and settles to
   a clean frame the moment you stop, which is the difference between a control
   that moves and a machine that is running. That is the only thing this adds,
   and it adds nothing while the tape is parked.

   ADAPTED FROM canvas-ui (David Haz), MIT + Commons Clause. The crease-phase,
   head-switching, hash/iHash/noise and grain maths below are its VHS shader's,
   reused rather than re-derived — that is the part worth having. Shipped inside
   this site, which the licence permits; never republished as a component.

   WHY IT IS AN OVERLAY AND NOT canvas-ui's COMPONENT

   canvas-ui's headline mechanism is the experimental HTML-in-canvas API, which
   needs chrome://flags/#canvas-draw-element or an origin-trial token registered
   against the domain. agentrichie.com is a live public site, so most visitors
   would land on the ungated path — and canvas-ui's own createVHS degrades by
   skipping the DOM capture while still running the shader, which paints the
   effect over nothing. A blank rectangle is worse than no effect.

   So the source texture is dropped and only the light is kept: the artifacts
   that ADD or REMOVE light composite honestly over live DOM with alpha. The
   ones that genuinely need the captured pixels — the horizontal wave, the
   per-line jitter, the RGB aberration and the bloom bleed — are NOT faked here.
   They are the wobble, so instead the deck itself is transformed in CSS off the
   SAME noise function the shader is using, which means the wobble and the light
   agree frame to frame rather than being two effects that happen to co-occur.

   Text stays selectable, the range input stays draggable, the log stays
   readable: nothing is captured, so nothing is replaced.

   COSTS NOTHING WHEN PARKED. The rAF loop stops when the shuttle decays to
   zero, so a visitor reading the log is not paying for a shader. No WebGL2, or
   prefers-reduced-motion, and the file returns without touching the page.
   ========================================================================== */

(function () {
  'use strict';

  /* The screen, not the whole deck: the deck also holds the day log and runs
     to thousands of pixels. See the comment on .rw-screen in rewind.md. */
  var deck = document.querySelector('.rw-screen') || document.querySelector('.rw-deck');
  var scrub = document.querySelector('[data-rw-scrub]');
  if (!deck || !scrub) return;

  /* Tape wobble is exactly the kind of motion the setting exists to refuse. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* THE SITE'S OWN SWITCH, which is not the same thing as the OS one.

     This site ships "hold motion" in the footer and again in /organism/'s
     command bar, both backed by localStorage "organismHold" and kept in sync by
     shift.js, which also toggles body.motion-held and fires a `motionhold`
     event. It exists because the shift drawer re-renders on a timer with no
     grace period (SC 2.2.2), and a visitor who reaches for it is asking the
     whole site to sit still — honouring only prefers-reduced-motion would leave
     this one effect running after they explicitly said stop.

     Read the storage key rather than the body class: shift.js is a separate
     file and may not have applied the class yet when this initialises. */
  function motionHeld() {
    try { return localStorage.getItem('organismHold') === '1'; } catch (e) { return false; }
  }

  var gl = null;
  var cv = document.createElement('canvas');
  try {
    /* premultipliedAlpha MUST be true: the shader multiplies rgb by alpha
       itself and blends ONE / ONE_MINUS_SRC_ALPHA, so telling the compositor
       the pixels are straight would make it divide out an alpha that was never
       applied and fringe every bright band. */
    gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  } catch (e) { gl = null; }
  if (!gl) return;   // no shader, no artifacts, page unchanged. Not an error.

  cv.className = 'rw-tape-fx';
  cv.setAttribute('aria-hidden', 'true');
  deck.appendChild(cv);

  /* ---------------------------------------------------------------- shader --*/

  var VERT =
    '#version 300 es\n' +
    'in vec2 aPos; out vec2 vUv;\n' +
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';

  /* canvas-ui's hash/iHash/noise verbatim — the fbm is what makes the crease
     read as tape rather than as a moving gradient. Everything below main()'s
     first line differs, because we are producing an artifact layer with alpha
     instead of resampling a captured frame. */
  var FRAG =
    '#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 vUv; out vec4 outColor;\n' +
    'uniform vec2 uResolution; uniform float uTime;\n' +
    'uniform float uAmt;        /* master intensity, 0 parks the whole thing */\n' +
    'uniform float uCrease; uniform float uSwitching; uniform float uSwitchHeight;\n' +
    'uniform float uGrain; uniform float uScanlines; uniform float uVignette;\n' +
    'uniform vec3  uTint;      /* the site amber, so the noise belongs here */\n' +
    '#define PI 3.14159265\n' +
    'float hash(vec2 v){ return fract(sin(dot(v, vec2(89.44, 19.36))) * 22189.22); }\n' +
    'float iHash(vec2 v, vec2 r){\n' +
    '  float h00 = hash(floor(v * r + vec2(0.0, 0.0)) / r);\n' +
    '  float h10 = hash(floor(v * r + vec2(1.0, 0.0)) / r);\n' +
    '  float h01 = hash(floor(v * r + vec2(0.0, 1.0)) / r);\n' +
    '  float h11 = hash(floor(v * r + vec2(1.0, 1.0)) / r);\n' +
    '  vec2 ip = smoothstep(vec2(0.0), vec2(1.0), mod(v * r, 1.0));\n' +
    '  return (h00 * (1.0 - ip.x) + h10 * ip.x) * (1.0 - ip.y) + (h01 * (1.0 - ip.x) + h11 * ip.x) * ip.y;\n' +
    '}\n' +
    'float noise(vec2 v){\n' +
    '  float sum = 0.0; float s = 2.0;\n' +
    '  for (int i = 1; i < 7; i++) { sum += iHash(v + vec2(float(i)), vec2(2.0 * s)) / s; s *= 2.0; }\n' +
    '  return sum;\n' +
    '}\n' +
    'void main(){\n' +
    '  if (uAmt <= 0.0) { outColor = vec4(0.0); return; }\n' +
    '  vec2 uv = vUv; float t = uTime;\n' +
    '  float lineNoise = noise(vec2(uv.y * 100.0, t * 10.0));\n' +
    /* vUv comes from aPos * 0.5 + 0.5, so vUv.y = 0 is clip-space y = -1, which
       is the BOTTOM of the viewport and therefore the bottom of the canvas.
       uv.y is already distance-from-bottom. Worth stating outright because the
       intuition goes the other way (CSS y grows downward) and flipping it here
       put the head-switching band along the TOP edge, which no deck has ever
       done. Both the mistake and the correction came from looking at it. */
    '  float fromBottom = uv.y;\n' +
    /* THE CREASE, redesigned away from canvas-ui's version on purpose.
       Theirs fires wherever sin(uv.y * 8.0) clears 0.92, which is eight thin
       slivers stacked down the frame. As DISPLACEMENT that is right, and it is
       what they use it for. As LIGHT it reads as eight parallel amber rules —
       a border, not a tape. So: one band, travelling, with a soft profile. */
    '  float band = fract(uv.y * 0.9 - t * 0.33);\n' +
    /* A perfectly horizontal edge is the other half of the border look. Tape
       tears along its length, so the band is perturbed per column. */
    '  band += (noise(vec2(uv.x * 3.0, t * 1.7)) - 0.5) * 0.035;\n' +
    '  band += (noise(vec2(uv.x * 11.0, t * 3.3)) - 0.5) * 0.012;\n' +
    '  float crease = smoothstep(0.0, 0.012, band) * (1.0 - smoothstep(0.015, 0.075, band)) * uCrease;\n' +
    /* DROPOUT ALONG THE BAND. Without this the crease is a continuous bar, and
       a continuous bar is a highlighter stripe however well its edges wobble.
       Real tracking loss is intermittent along the head's path, so the band is
       cut into segments by a coarse hash in x that also drifts in t. */
    '  float dash = hash(vec2(floor(uv.x * 46.0), floor(t * 22.0)));\n' +
    '  crease *= smoothstep(0.28, 0.72, dash) * (0.45 + max(lineNoise - 0.44, 0.0) * 2.2);\n' +
    /* Head-switching noise along the BOTTOM edge: the single most legible
       "this is a tape" signature, and the one a still frame never has. It is a
       NOISE band, not a clean bar — so it is built from the hash directly
       rather than from lineNoise, which is smooth enough to read as a gradient. */
    '  float snPhase = smoothstep(max(uSwitchHeight, 1e-4), 0.0, fromBottom) * uSwitching;\n' +
    '  float snGrain = hash(vec2(floor(uv.x * 190.0), floor(fromBottom * 260.0) + floor(t * 30.0)));\n' +
    '  float sw = snPhase * smoothstep(0.35, 0.95, snGrain) * 0.85;\n' +
    '  float g = (hash(uv * uResolution + fract(t) * vec2(127.1, 311.7)) - 0.5) * uGrain;\n' +
    '  float scan = sin(uv.y * uResolution.y * PI) * 0.5;\n' +
    '  float light = max(crease, 0.0) + max(sw, 0.0) + max(g, 0.0);\n' +
    '  float dark  = uScanlines * 0.35 * max(scan, 0.0) + max(-g, 0.0);\n' +
    '  vec2 vd = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);\n' +
    '  dark += uVignette * smoothstep(0.45, 1.15, length(vd));\n' +
    /* Two premultiplied contributions in one pass: tinted light added, neutral
       darkness subtracted. Kept separate so the scanlines never tint. */
    '  vec3 rgb = uTint * light;\n' +
    '  float a = clamp(light + dark, 0.0, 1.0) * uAmt;\n' +
    '  if (a <= 0.001) { outColor = vec4(0.0); return; }\n' +
    '  outColor = vec4(rgb * uAmt, a);\n' +
    '}';

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('rewind-tape shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { cv.remove(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['uResolution', 'uTime', 'uAmt', 'uCrease', 'uSwitching', 'uSwitchHeight',
   'uGrain', 'uScanlines', 'uVignette', 'uTint'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  gl.enable(gl.BLEND);
  /* Premultiplied source over destination. The shader already multiplies rgb
     by alpha, so ONE_MINUS_SRC_ALPHA on the destination is the correct pair —
     SRC_ALPHA here would darken the deck twice. */
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ------------------------------------------------------- the same noise --*/
  /* Ported so the CSS wobble and the shader light are driven by ONE function.
     If these drifted apart the deck would shake on one clock and flicker on
     another, which reads as two effects rather than one machine. */
  function jsHash(x, y) {
    var s = Math.sin(x * 89.44 + y * 19.36) * 22189.22;
    return s - Math.floor(s);
  }
  function jsIHash(vx, vy, r) {
    var h00 = jsHash(Math.floor(vx * r) / r, Math.floor(vy * r) / r);
    var h10 = jsHash(Math.floor(vx * r + 1) / r, Math.floor(vy * r) / r);
    var h01 = jsHash(Math.floor(vx * r) / r, Math.floor(vy * r + 1) / r);
    var h11 = jsHash(Math.floor(vx * r + 1) / r, Math.floor(vy * r + 1) / r);
    var fx = (vx * r) % 1, fy = (vy * r) % 1;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    return (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
  }
  function jsNoise(x, y) {
    var sum = 0, s = 2;
    for (var i = 1; i < 7; i++) { sum += jsIHash(x + i, y + i, 2 * s) / s; s *= 2; }
    return sum;
  }

  /* ---------------------------------------------------------- the shuttle --*/

  var shuttle = 0;          // 0 parked, 1 slewing hard
  var lastVal = Number(scrub.value) || 0;
  var lastT = 0;
  var raf = 0;
  var running = false;

  /* READ max EVERY TIME, NEVER ONCE AT LOAD.

     The page ships the range as max="1" and only widens it to the real day
     count inside the .then() of its rewind.json fetch. This file is deferred,
     so it initialises BEFORE that resolves and a span captured here is 1, not
     64 — which makes every measured velocity about sixty times too large and
     pegs the shuttle to a full tear on a single arrow-key press. Caught by
     instrumenting the live loop, not by reading either file: both look correct
     on their own, and the bug lives in the order they run. */
  function currentSpan() { return Math.max(1, Number(scrub.max) || 1); }

  /* MEASURE IN THE FRAME, NOT IN THE EVENT.

     The obvious version listened for `input` on the range. It is wrong here,
     and only reading the page's own script shows why: play advances the tape
     with render(idx + 1), which assigns scrub.value directly, and a programmatic
     assignment fires no `input` event. So an event-driven shuttle lights up for
     half a second when you press play and is dead for the rest of playback,
     which is the one time the tape is definitely moving.

     Sampling the value once per frame catches the drag, the playback and the
     arrow keys through one path, with no coupling to the page's play/stop
     logic at all. The events below only WAKE the loop; they never measure. */
  function measure(now) {
    var v = Number(scrub.value) || 0;
    var dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 0.016;
    lastT = now;
    if (v !== lastVal) {
      var rate = Math.abs(v - lastVal) / currentSpan() / Math.max(dt, 1e-3);
      lastVal = v;
      /* Velocity as a fraction of the whole tape per second, so a slow careful
         drag stays clean and a fling across two years tears. */
      shuttle = Math.min(1, Math.max(shuttle, rate * 1.6));
    }
  }

  var wake = function () { lastT = performance.now(); start(); };
  scrub.addEventListener('input', wake, { passive: true });
  scrub.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') wake();
  });
  var playBtn = document.querySelector('[data-rw-play]');
  if (playBtn) playBtn.addEventListener('click', wake);

  function size() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = deck.clientWidth, h = deck.clientHeight;
    if (!w || !h) return false;
    var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (cv.width !== cw || cv.height !== ch) {
      cv.width = cw; cv.height = ch;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    return true;
  }

  var t0 = performance.now();

  function frame(now) {
    var t = (now - t0) / 1000;
    measure(now);
    /* ~0.55s to fall from a hard slew to nothing: long enough to read as the
       heads settling, short enough that it is gone before you start reading. */
    shuttle *= Math.pow(0.06, 1 / 60);
    if (shuttle < 0.004) {
      shuttle = 0;
      deck.style.transform = '';
      deck.style.willChange = '';
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      running = false; raf = 0;
      return;                                   // parked: stop burning frames
    }

    if (!size()) { raf = requestAnimationFrame(frame); return; }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uResolution, cv.width, cv.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uAmt, shuttle);
    gl.uniform1f(U.uCrease, 0.9);
    gl.uniform1f(U.uSwitching, 0.75);
    gl.uniform1f(U.uSwitchHeight, 0.06);
    gl.uniform1f(U.uGrain, 0.16);
    gl.uniform1f(U.uScanlines, 0.5);
    gl.uniform1f(U.uVignette, 0.25);
    /* Warm white carrying an amber cast, NOT the raw --amber. Tinting the
       noise the full signal colour made it read as a highlighter stripe rather
       than as damage; a deck's tracking noise is close to white and only picks
       up the tube's warmth. Still unmistakably this site's warmth, and not the
       blue-white that would be someone else's deck. */
    gl.uniform3f(U.uTint, 0.98, 0.92, 0.78);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* The wobble the shader cannot do without the captured pixels, done to the
       real DOM instead, off the same noise at the same t. Sub-pixel on purpose:
       a deck slips, it does not shake. */
    var wob = (jsNoise(t, 0) - 0.5) * 6.5 * shuttle;
    var skew = (jsNoise(0, t * 0.7) - 0.5) * 0.35 * shuttle;
    deck.style.transform = 'translate3d(' + wob.toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(3) + 'deg)';

    raf = requestAnimationFrame(frame);
  }

  /* Held mid-slew: stop now, do not wait for the decay to finish. */
  document.addEventListener('motionhold', function (e) {
    if (e && e.detail && e.detail.held) {
      shuttle = 0;
      deck.style.transform = '';
      deck.style.willChange = '';
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    }
  });

  function start() {
    if (running || motionHeld()) return;
    running = true;
    /* Promote only for the slew. A permanent will-change in the stylesheet
       would hold a compositor layer for the whole visit to pay for a transform
       that runs for under a second. */
    deck.style.willChange = 'transform';
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function () { if (running) size(); });
  window.addEventListener('pagehide', function () { if (raf) cancelAnimationFrame(raf); });
})();
