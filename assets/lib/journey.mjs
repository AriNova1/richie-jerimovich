/* ============================================================================
   journey: scroll engine for THE OVERNIGHT
   ----------------------------------------------------------------------------
   Composes reel-engine.mjs. Does not fork it.

   Scroll is the master clock. Station interiors are continuous functions of
   journey progress in both directions. Station boundaries CUT: the camera
   jumps, it does not crossfade.

   Zero layout reads in the scroll handler. Heights and the stage top are
   cached on mount and on width-gated resize / orientationchange.
   ========================================================================== */

import { reelTime, validateReelMap, clamp } from './reel-engine.mjs';

export { reelTime, validateReelMap, clamp };

/**
 * Dwell weights -> monotone [progress, time] waypoints, validated by
 * validateReelMap at mount. A non-monotone edit aborts loudly.
 *
 * `time` here is cumulative dwell, not footage seconds. reelTime still
 * interpolates it, which is what seekTo and the service strip need.
 */
export function buildJourneyMap(stations) {
  const list = Array.isArray(stations) ? stations : [];
  const total = list.reduce((s, st) => s + (Number(st.dwell) || 0), 0);
  if (!(total > 0)) {
    throw new Error('buildJourneyMap: dwell weights must sum to > 0');
  }
  const map = [];
  let p = 0;
  let t = 0;
  list.forEach((st, i) => {
    const d = Number(st.dwell) || 0;
    st.p0 = p;
    st.t0 = t;
    map.push([+p.toFixed(6), +t.toFixed(4)]);
    p += d / total;
    t += d;
    st.p1 = i === list.length - 1 ? 1 : p;
    st.t1 = t;
  });
  map.push([1, +t.toFixed(4)]);
  const last = list[list.length - 1];
  if (last) last.p1 = 1;
  return map;
}

function stationAt(stations, p) {
  const x = clamp(p, 0, 1);
  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    if (x < st.p1 || i === stations.length - 1) {
      const span = st.p1 - st.p0;
      const local = span <= 0 ? 1 : clamp((x - st.p0) / span, 0, 1);
      return { station: st, index: i, local, p: x };
    }
  }
  const last = stations[stations.length - 1];
  return { station: last, index: stations.length - 1, local: 1, p: x };
}

/**
 * Mount the scrub edition. Callers that hit prefers-reduced-motion or a
 * failed capability probe should not call this: the still edition stands.
 *
 * Hold-motion contract (shift.js): listens for `motionhold` and checks
 * `body.motion-held` at mount. On hold: jump to rest state, idle life stopped.
 */
export function mountJourney({ stage, stations, map, onFrame, onStation, onHold: onHoldCb } = {}) {
  if (!stage) throw new Error('mountJourney: stage is required');
  const list = Array.isArray(stations) ? stations : [];
  const waypoints = map || buildJourneyMap(list);
  const errs = validateReelMap(waypoints, 'journey.map');
  if (errs.length) throw new Error('journey map invalid:\n  ' + errs.join('\n  '));

  const pin = stage.closest('.ov-pin') || stage.parentElement;
  const layout = { top: 0, height: 1, pinTop: 0, pinHeight: 1, width: 0 };

  const cacheLayout = () => {
    const r = stage.getBoundingClientRect();
    const pr = pin ? pin.getBoundingClientRect() : r;
    const sy = window.scrollY || window.pageYOffset || 0;
    layout.top = r.top + sy;
    layout.height = stage.offsetHeight || window.innerHeight || 1;
    layout.pinTop = pr.top + sy;
    layout.pinHeight = (pin && pin.offsetHeight) || layout.height;
    layout.width = window.innerWidth;
  };

  let lastIndex = -1;
  let held = typeof document !== 'undefined'
    && document.body
    && document.body.classList.contains('motion-held');
  let ticking = false;
  let lastP = 0;

  const progressFromScroll = () => {
    const sy = window.scrollY || window.pageYOffset || 0;
    const travel = Math.max(1, layout.pinHeight - layout.height);
    return clamp((sy - layout.pinTop) / travel, 0, 1);
  };

  const emit = (p, rest) => {
    lastP = p;
    const hit = stationAt(list, p);
    const t = reelTime(waypoints, p);
    if (typeof onFrame === 'function') {
      onFrame({ p, t, local: hit.local, index: hit.index, station: hit.station, rest: !!rest, held });
    }
    if (hit.index !== lastIndex) {
      lastIndex = hit.index;
      if (typeof onStation === 'function') onStation(hit);
    }
  };

  const frame = () => {
    ticking = false;
    if (held) return;
    emit(progressFromScroll(), false);
  };

  const onScroll = () => {
    if (held) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };

  const onResize = () => {
    if (Math.abs(window.innerWidth - layout.width) < 2) return;
    cacheLayout();
    emit(held ? 1 : progressFromScroll(), held);
  };

  const onOrient = () => {
    cacheLayout();
    emit(held ? 1 : progressFromScroll(), held);
  };

  const onHold = (e) => {
    held = !!(e && e.detail && e.detail.held);
    if (held) {
      emit(1, true);
      if (typeof onHoldCb === 'function') onHoldCb(true);
    } else {
      emit(progressFromScroll(), false);
      if (typeof onHoldCb === 'function') onHoldCb(false);
    }
  };

  const reduceMq = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  let unstick = null;
  const onReduce = () => {
    if (reduceMq && reduceMq.matches && typeof unstick === 'function') unstick();
  };

  cacheLayout();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onOrient);
  document.addEventListener('motionhold', onHold);
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduce);
    else if (reduceMq.addListener) reduceMq.addListener(onReduce);
  }

  if (held) emit(1, true);
  else emit(progressFromScroll(), false);

  const api = {
    seekTo(i) {
      const st = list[i];
      if (!st) return;
      const travel = Math.max(1, layout.pinHeight - layout.height);
      const y = layout.pinTop + st.p0 * travel;
      window.scrollTo(0, y);
      emit(st.p0, false);
    },
    progress() { return lastP; },
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      document.removeEventListener('motionhold', onHold);
      if (reduceMq) {
        if (reduceMq.removeEventListener) reduceMq.removeEventListener('change', onReduce);
        else if (reduceMq.removeListener) reduceMq.removeListener(onReduce);
      }
    },
  };

  unstick = () => {
    api.destroy();
  };

  return api;
}
