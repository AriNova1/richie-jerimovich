/* ============================================================================
   reel-engine — scroll-scrubbed film playback, ours to ship
   ----------------------------------------------------------------------------
   Zero dependencies. Framework-agnostic. Works on a plain Jekyll page, in a
   Next `useEffect`, or a Vue `onMounted`.

   WHY THIS EXISTS
   Four separate references converged on this problem in July 2026 and each one
   held a different half:

     zero-to-agent /film   REEL_MAP editorial pacing, three fallback tiers.
     oso95/scroll-world    Every phone behaviour that matters. Pacing limited to
                           a symmetric cubic about each section midpoint.
     tea-leaf-scroll-world Correct damping and seek gate, then fetched 41.8 MB
                           up front in one Promise.all with no AbortController.
     Machina's pipeline    Chain shots: the last frame of clip N is the first
                           frame of clip N+1, so continuity carries across cuts.

   This engine is the union: our time-map (strictly more expressive than a
   symmetric ease), their phone hardening, tea-leaf's bug fixed, and the
   chain-shot contract enforced rather than assumed.

   WHAT CAME BACK THE OTHER WAY, 2026-08-01
   zero-to-agent independently hardened its own /film in the same week this was
   extracted, and it ended up ahead of the engine on two counts that were not
   opinions but measured browser facts. Both are now folded in, and the fact
   that the flow reversed is the useful part: the extraction is not finished the
   day it is made, and the property it came from keeps learning.

     - Blob-always was wrong. Chromium will not decode VP9 WebM through a blob
       URL. Now a probe, not a default. See THE BYTE-RANGE INSURANCE below.
     - Owning the scroll listener was wrong for any page that already has a
       motor. Now optional. See THE EXTERNALLY-DRIVEN MODE below.

   THE PACING ARGUMENT
   A linear scroll→footage map gives the money shot exactly as much scroll as a
   transit shot, because it has no concept of a money shot. A symmetric ease
   (scroll-world's `linger`) can slow the middle of a clip but cannot hold at
   30%, cannot hold twice, and cannot be asymmetric. REEL_MAP is an arbitrary
   monotone waypoint list, so dwell goes exactly where the cut wants it:

     reelMap: [[0.00, 0], [0.32, 1.8], [0.40, 4.0], [1.00, 15.0]]
              //           ^ hold the falls        ^ trail runs quick

   USAGE
     import { mountReel } from './reel-engine.mjs';
     const reel = mountReel(document.getElementById('reel'), {
       clips: [{
         src:       '/media/reel.mp4',        // desktop master, -g 8
         srcMobile: '/media/reel-m.mp4',      // 720p, -g 4  (see encode-reel.sh)
         poster:    '/media/reel.webp',
         posterMobile: '/media/reel-9x16.webp',
         range:   [0.0, 1.0],                 // scroll window this clip owns
         reelMap: [[0, 0], [0.5, 1.8], [1, 15.0]],
       }],
       procedural: (p) => {},               // optional zero-download fallback
     });
     // reel.destroy() on unmount.

   IF THE PAGE ALREADY HAS A TIMELINE, be a passenger instead of a second motor:
     const reel = mountReel(el, { clips, externalProgress: true, damping: 1 });
     // inside the host's existing rAF loop, off its own eased progress:
     reel.setProgress(p);
   Without this the engine reads window.scrollY itself and the reel runs off a
   second, undamped progress that visibly leads the type it is cut against.

   FALLBACK TIERS, resolved once at mount, in this order:
     1. prefers-reduced-motion   -> 'still'      no video fetched at all
     2. connection.saveData      -> 'procedural' if supplied, else 'still'
     3. video error / no support -> 'procedural' if supplied, else 'still'
     4. otherwise                -> 'video'
   Tier 1 and 2 never issue a network request for footage. That is the point:
   a reduced-motion visitor should not pay 40 MB to see stills.
   ========================================================================== */

/* ------------------------------------------------------------------ math --*/

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

/**
 * Piecewise-linear interpolation over a monotone [progress, seconds] waypoint
 * list. This is the whole editorial-pacing argument in eight lines.
 *
 * Contract: `map` must be sorted by p ascending and have >= 1 entry. Progress
 * outside the map clamps to the endpoints, so a caller cannot seek past the
 * footage by overscrolling.
 */
export function reelTime(map, p) {
  if (!map || !map.length) return 0;
  if (p <= map[0][0]) return map[0][1];
  for (let i = 1; i < map.length; i++) {
    if (p <= map[i][0]) {
      const span = map[i][0] - map[i - 1][0];
      // A zero-width span is a hard cut in the map: jump, don't divide by zero.
      if (span <= 0) return map[i][1];
      const k = (p - map[i - 1][0]) / span;
      return map[i - 1][1] + k * (map[i][1] - map[i - 1][1]);
    }
  }
  return map[map.length - 1][1];
}

/**
 * Validate a REEL_MAP before it silently misbehaves. A non-monotone map makes
 * the reel run backwards mid-scroll, which reads as a rewind — the same defect
 * scroll-world documents for velocity reversal across a seam. Fail loudly.
 */
export function validateReelMap(map, label = 'reelMap') {
  const errs = [];
  if (!Array.isArray(map) || !map.length) {
    errs.push(`${label}: must be a non-empty array of [progress, seconds]`);
    return errs;
  }
  for (let i = 0; i < map.length; i++) {
    const pt = map[i];
    if (!Array.isArray(pt) || pt.length !== 2 || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
      errs.push(`${label}[${i}]: expected [progress, seconds], got ${JSON.stringify(pt)}`);
      continue;
    }
    if (pt[0] < 0 || pt[0] > 1) errs.push(`${label}[${i}]: progress ${pt[0]} outside 0..1`);
    if (pt[1] < 0) errs.push(`${label}[${i}]: seconds ${pt[1]} is negative`);
    if (i > 0 && Array.isArray(map[i - 1])) {
      if (pt[0] < map[i - 1][0]) errs.push(`${label}[${i}]: progress ${pt[0]} < previous ${map[i - 1][0]} (must ascend)`);
      if (pt[1] < map[i - 1][1]) errs.push(`${label}[${i}]: seconds ${pt[1]} < previous ${map[i - 1][1]} (footage must not run backwards)`);
    }
  }
  return errs;
}

/**
 * Chain-shot continuity check. Machina and scroll-world state the same law
 * independently: the last frame of clip N must be the first frame of clip N+1,
 * or the seam pops. We cannot compare pixels here, but we can enforce that the
 * author declared the pairing — an undeclared seam is the common failure.
 */
export function validateChain(clips) {
  const errs = [];
  for (let i = 1; i < clips.length; i++) {
    const prev = clips[i - 1], cur = clips[i];
    if (cur.chainFrom === undefined) continue;         // opt-in
    if (cur.chainFrom !== prev.endFrame) {
      errs.push(
        `clips[${i}].chainFrom (${cur.chainFrom}) does not match clips[${i - 1}].endFrame (${prev.endFrame}). ` +
        `Chain shots require the previous clip's ACTUAL last frame as this clip's first.`,
      );
    }
  }
  return errs;
}

/* --------------------------------------------------------------- runtime --*/

const mql = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false });

/**
 * Read live rather than caching: DevTools resizing and a real rotate should
 * both switch sources. scroll-world caches the poster once but keeps clips
 * live; we do the same, because swapping a poster mid-scroll flashes.
 */
export function makeIsMobile(breakpoint = 860) {
  const coarse = mql('(pointer: coarse)').matches;
  const small = mql(`(max-width: ${breakpoint}px)`);
  return () => coarse || small.matches;
}

export function resolveTier({ hasProcedural = false, reduce, saveData } = {}) {
  const r = reduce !== undefined ? reduce : mql('(prefers-reduced-motion: reduce)').matches;
  if (r) return 'still';
  const sd = saveData !== undefined
    ? saveData
    : Boolean(typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData);
  if (sd) return hasProcedural ? 'procedural' : 'still';
  return 'video';
}

export function mountReel(container, config = {}) {
  const clips = config.clips || [];
  const breakpoint = config.breakpoint ?? 860;
  const damping = config.damping ?? 0.18;
  const onTier = config.onTier || (() => {});

  /* Fail loudly at mount, not visually at scroll time. */
  const errs = [];
  clips.forEach((c, i) => { if (c.reelMap) errs.push(...validateReelMap(c.reelMap, `clips[${i}].reelMap`)); });
  errs.push(...validateChain(clips));
  if (errs.length) throw new Error('reel-engine config invalid:\n  ' + errs.join('\n  '));

  const isMobile = makeIsMobile(breakpoint);
  const reduce = mql('(prefers-reduced-motion: reduce)').matches;
  let tier = resolveTier({ hasProcedural: Boolean(config.procedural) });

  const state = clips.map((c) => ({
    cfg: c, video: null, cur: 0, target: 0, ready: false, visible: true,
  }));

  /* THE BYTE-RANGE INSURANCE, and why it is a PROBE and not a blob-always.

     tea-leaf's bug was fetching every clip as a blob up front with no way to
     cancel, and the first version of this engine over-corrected: it kept the
     blob path but made it abortable and per-clip. Blob-ALWAYS was still the
     wrong shape, and zero-to-agent proved it in a real browser rather than by
     reading the code. Same file, same bytes, measured in the pane:

       direct src        ok, duration 15.00, seekable 15.00
       blob from fetch   error 4  (MEDIA_ERR_SRC_NOT_SUPPORTED)
       blob, re-typed    error 4

     Chromium 148 will not decode VP9 WebM through a blob URL even though it
     decodes the identical bytes over HTTP — and encode-reel.sh --vp9 is our own
     recommended encode. So the engine as shipped would have served a reel that
     does not play at all, to protect against a hosting misconfiguration most
     hosts do not have. It also forces the whole file down before the first
     frame, which is exactly the cellular cost srcMobile exists to avoid.

     The failure the blob genuinely protects against is real: a host that will
     not serve byte ranges answers seekable=[0,0] and the video sticks on frame
     0 forever while every currentTime write is silently discarded.

     So: stream the direct src, and on loadedmetadata ask whether ranges
     actually came back. If they did — the normal path — do nothing. If they did
     not, swap to a blob then. Same protection, no cost when it is not needed.
     Adopted from zero-to-agent's /film, 2026-08-01. */
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const objectUrls = [];

  const srcFor = (s) => (isMobile() && s.cfg.srcMobile) || s.cfg.src;

  function applyUrl(s) {
    if (!s.video || !s.url || s.video.src === s.url) return;
    s.video.src = s.url;
    s.video.load();
    if (userReady) primeVideo(s.video);   // late arrivals prime themselves
  }

  /* The normal path: hand the element the real URL and let it stream. */
  function attachSource(s) {
    if (tier !== 'video' || !s.video || s.sourced || s.url) return;
    const src = srcFor(s);
    if (!src) return;
    s.sourced = true;
    s.video.src = src;
    s.video.load();
    if (userReady) primeVideo(s.video);
  }

  /* The probe. Only a range-less host reaches loadViaBlob. */
  function onMeta(s) {
    if (s.url || s.loading) return;                    // already on a blob
    const v = s.video;
    if (!v) return;
    const ranged = v.seekable && v.seekable.length > 0 && v.seekable.end(0) > 0;
    if (ranged) { s.ready = true; return; }            // nothing to do
    loadViaBlob(s);
  }

  async function loadViaBlob(s) {
    if (tier !== 'video' || s.url || s.loading) return;
    s.loading = true;
    const src = srcFor(s);
    if (!src || typeof fetch !== 'function') { s.loading = false; return; }
    try {
      const res = await fetch(src, abort ? { signal: abort.signal } : undefined);
      if (!res.ok) throw new Error(`${res.status} ${src}`);
      const url = URL.createObjectURL(await res.blob());
      objectUrls.push(url);
      /* Hold the url on state, not only on the element. The blob can land while
         s.video is still null (the caller has not run attachVideo yet), so
         storing it lets attachVideo apply a blob that already arrived —
         otherwise the fetch succeeds, ready flips true, and the element is
         never given a src. Caught by running the demo harness, not by reading
         the code. */
      s.url = url;
      if (s.video) applyUrl(s);
      s.ready = true;
    } catch (e) {
      if (!(e && e.name === 'AbortError')) {
        tier = config.procedural ? 'procedural' : 'still';
        onTier(tier, e);
      }
    } finally {
      s.loading = false;
    }
  }

  /* iOS Safari will not paint a seeked frame on a muted video that has never
     played. Prime on the first gesture; keep the still up until the clip paints. */
  let userReady = false;
  function primeVideo(v) {
    if (!isMobile() || !v) return;
    try {
      const p = v.play();
      if (p && p.then) p.then(() => { try { v.pause(); } catch {} }).catch(() => {});
    } catch {}
  }
  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    state.forEach((s) => primeVideo(s.video));
  }

  function progressFor(s, p) {
    const [a, b] = s.cfg.range || [0, 1];
    return b > a ? clamp((p - a) / (b - a)) : 0;
  }

  /* THE EXTERNALLY-DRIVEN MODE, and why it had to exist.

     The engine originally owned the scroll listener and read window.scrollY
     itself. That is right for a page whose only motor is the reel, and wrong
     for every page that already has one. zero-to-agent's /film runs a single
     rAF projector that damps raw scroll into a master timeline and drives the
     canvas, the type, the set pieces, the chrome AND the reel off that one
     eased `p` — so every consumer moves together. An engine that reads scrollY
     on its own would run the reel off a SECOND, undamped, differently-phased
     progress and the reel would visibly lead the type it is cut against.

     So the engine can be a passenger: pass `externalProgress: true` and drive
     it with reel.setProgress(p) from whatever timeline the host already owns.
     Set `damping: 1` with it — the host has damped already, and damping twice
     reintroduces exactly the lag this mode exists to remove. */
  let lastP = 0;

  function read(pExternal) {
    let p;
    if (config.externalProgress) {
      p = clamp(pExternal !== undefined ? pExternal : lastP);
    } else {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      p = max > 0 ? clamp(window.scrollY / max) : 0;
    }
    lastP = p;
    for (const s of state) {
      const local = progressFor(s, p);
      const dur = (s.video && s.video.duration) || 0;
      const secs = s.cfg.reelMap ? reelTime(s.cfg.reelMap, local) : local * dur;
      s.target = dur > 0 ? clamp(secs / dur) : 0;
      s.visible = local > -0.02 && local < 1.02;
    }
    if (config.procedural && tier === 'procedural') config.procedural(p);
    document.documentElement.style.setProperty('--reel-progress', p.toFixed(4));
    /* Source only what is on screen, and only when bytes are genuinely wanted.
       The two zero-download tiers never get here at all. */
    if (tier === 'video') for (const s of state) if (s.visible) attachSource(s);
  }

  /* `read` is also an event listener, and an Event is not a progress value.
     Wrap it, or orientationchange hands us a MouseEvent to clamp. */
  const onScroll = () => read();

  let raf = 0;
  function frame() {
    /* A COARSER seek step on phones, not a finer one — every seek is a decode,
       and a phone decoder is the bottleneck. scroll-world's numbers. */
    const eps = isMobile() ? 0.02 : 0.008;
    for (const s of state) {
      const v = s.video;
      if (!v || !s.ready || !Number.isFinite(v.duration) || !v.duration) continue;
      /* Never queue a seek while the decoder is still resolving the last one.
         A fast flick otherwise piles seeks up and freezes the clip. `cur` keeps
         lerping meanwhile, so we snap to the newest target the moment it frees. */
      if (v.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : damping);
      const t = clamp(s.cur, 0, 0.999) * v.duration;
      if (Math.abs(v.currentTime - t) > eps) { try { v.currentTime = t; } catch {} }
    }
    raf = requestAnimationFrame(frame);
  }

  /* The mobile URL bar fires `resize` on show/hide. Re-running layout there
     jumps the page mid-scroll. Gate on width; keep orientationchange for a
     real rotate. */
  let laidOutW = typeof window !== 'undefined' ? window.innerWidth : 0;
  function onResize() {
    if (window.innerWidth === laidOutW) return;
    laidOutW = window.innerWidth;
    read();
  }

  if (typeof window !== 'undefined') {
    /* In externalProgress mode the host owns the scroll listener. Attaching our
       own would compute a second, undamped p and fight it. */
    if (!config.externalProgress) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('orientationchange', onScroll);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
    onTier(tier, null);
    read();
    if (tier === 'video') raf = requestAnimationFrame(frame);
  }

  return {
    get tier() { return tier; },
    state,
    read,
    /* Drive the reel from a timeline the host already owns. No-op unless
       externalProgress was set, so a caller cannot half-adopt the mode and end
       up with two progress sources silently competing. */
    setProgress(p) {
      if (!config.externalProgress) {
        throw new Error('reel-engine: setProgress requires { externalProgress: true }');
      }
      read(p);
    },
    attachVideo(i, el) {
      const s = state[i];
      s.video = el;
      el.addEventListener('error', () => {
        tier = config.procedural ? 'procedural' : 'still';
        onTier(tier, new Error('video element error'));
      });
      el.addEventListener('loadedmetadata', () => onMeta(s));
      if (s.url) applyUrl(s);              // a blob that landed before we existed
      else if (s.visible) attachSource(s);
    },
    destroy() {
      cancelAnimationFrame(raf);
      if (abort) abort.abort();
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
      /* Must be the same reference we added. Removing `read` here while
         `onScroll` was what got attached leaks the listener for the life of
         the page — the classic remove-the-wrong-function bug. */
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onScroll);
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    },
  };
}
