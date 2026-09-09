/* ══════════════════════════════════════════════════════════════════
   F5 · WINDOW LIFECYCLE: open, close, minimize, restore.

   A separable motion layer beside the accepted drag/snap engine.

   Ownership, one owner per property:
     · the engine (motion/fable-r1.js) writes `transform`            (Finder only today)
     · desktop CSS / mac.js writes `left/top/width/height`            (every window)
     · this layer writes the CSS individual transform properties
       `translate` and `scale`, plus `opacity`, and nothing else.
   CSS composes individual properties before `transform`, so a lifted
   Finder mid-drag and a minimizing Finder never overwrite each other:
   the engine's lift lives in `transform`, the minimize in `scale`.
   No wrapper element, so z-index, focus and selectors are untouched.

   The host owns whether a window is retained or destroyed. This
   layer only moves pixels and reports whether a transition
   completed. Completion is never assumed: a promise resolves with
   { completed:false } the moment a newer intent retargets it, so a
   late callback cannot resurrect a window the host has closed.

   Springs are the F0-r1 integrator, so open/close/minimize share the
   character of drag/snap and of the room camera.
   ══════════════════════════════════════════════════════════════════ */
import { springStep } from '../motion/fable-r1.js';

export const LIFECYCLE = Object.freeze({
  open:     { omega: 24, zeta: 1.00, fromScale: 0.96 },   // ≈190 ms
  close:    { omega: 38, zeta: 1.00, toScale: 0.985 },    // ≈120 ms
  minimize: { omega: 14, zeta: 1.00, toScale: 0.10 },     // ≈330 ms; scale toward the Dock item
  restore:  { omega: 18, zeta: 1.00 },                    // ≈255 ms
  fadeLate: { omega: 9,  zeta: 1.00 },                    // opacity trails the flight so the window is seen travelling
  fallback: { omega: 22, zeta: 1.00, toScale: 0.92 },     // no Dock target: shrink in place and fade
  reduced:  { omega: 40, zeta: 1.00 },                    // ≈115 ms opacity only
  settle:   { d: 0.35, v: 25 },                           // px / px·s⁻¹ ; scale and opacity use d·0.01
});

class Axis {
  constructor(x) { this.x = x; this.v = 0; this.t = x; }
  set(x) { this.x = x; this.t = x; this.v = 0; }
  step(o, z, dt, tol) {
    if (this.x === this.t && this.v === 0) return;
    springStep(this, this.t, o, z, dt);
    if (Math.abs(this.x - this.t) < tol && Math.abs(this.v) < tol * 60) { this.x = this.t; this.v = 0; }
  }
  get settled() { return this.x === this.t && this.v === 0; }
}

/**
 * @param {HTMLElement} el      the window element
 * @param {object} host
 *   rect(): {x,y,w,h}                 the window's current laid-out rect in desktop px (before this layer's translate/scale)
 *   dockTarget(): {x,y,w,h} | null    the Dock item's rect in desktop px, or null when there is none (More, hidden, absent)
 *   reduced(): boolean
 *   onFrame?(visual)                  diagnostics
 */
export function attachLifecycle(el, host) {
  const tx = new Axis(0), ty = new Axis(0), s = new Axis(1), o = new Axis(1);
  let state = 'open', pending = null, raf = 0, last = 0, alive = true, tune = LIFECYCLE.open, oTune = LIFECYCLE.open, usedFallback = false;
  const trace = [];

  function paint() {
    const st = el.style;
    st.translate = (tx.x === 0 && ty.x === 0) ? '' : `${tx.x.toFixed(2)}px ${ty.x.toFixed(2)}px`;
    st.scale = s.x === 1 ? '' : s.x.toFixed(4);
    st.opacity = o.x === 1 ? '' : o.x.toFixed(3);
    el.dataset.lifecycle = state;
    host.onFrame?.(visual());
  }
  const visual = () => ({ state, tx: tx.x, ty: ty.x, scale: s.x, opacity: o.x, moving: !(tx.settled && ty.settled && s.settled && o.settled), fallback: usedFallback });

  function tick(t) {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60; last = t;
    const T = LIFECYCLE.settle;
    tx.step(tune.omega, tune.zeta, dt, T.d); ty.step(tune.omega, tune.zeta, dt, T.d);
    s.step(tune.omega, tune.zeta, dt, T.d * 0.01); o.step(oTune.omega, oTune.zeta, dt, T.d * 0.01);
    paint();
    trace.push({ t, ...visual() }); if (trace.length > 600) trace.splice(0, trace.length - 600);
    if (visual().moving) raf = requestAnimationFrame(tick);
    else settle();
  }
  function wake() { if (alive && !raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function settle() {
    const p = pending; pending = null;
    p?.resolve({ state, completed: true, fallback: usedFallback });
  }
  function retarget() {
    // a newer intent: the previous promise resolves false, from the CURRENT displayed values
    const p = pending; pending = null;
    p?.resolve({ state: p.state, completed: false, fallback: usedFallback });
  }
  const dockDelta = () => {
    const d = host.dockTarget(); const r = host.rect();
    if (!d || !r || !(r.w > 0 && r.h > 0)) return null;
    // scaling about the window centre (transform-origin 50% 50%), the translate that puts the centre on the Dock item's centre
    return { dx: (d.x + d.w / 2) - (r.x + r.w / 2), dy: (d.y + d.h / 2) - (r.y + r.h / 2), scale: Math.max(0.06, Math.min(LIFECYCLE.minimize.toScale, d.w / r.w)) };
  };

  /**
   * transitionTo(next, opts)
   *   next: 'open' | 'closed' | 'minimized'
   *   opts.from: 'dock' | 'fresh' | undefined   where an 'open' should start when the element is not yet visible
   * Resolves { state, completed, fallback }. completed=false means a newer intent superseded this one.
   */
  function transitionTo(next, opts = {}) {
    if (!alive) return Promise.resolve({ state: next, completed: false, fallback: false });
    retarget();
    const reduced = host.reduced();
    state = next;
    usedFallback = false;
    if (next === 'open') {
      if (opts.from === 'fresh') { s.set(reduced ? 1 : LIFECYCLE.open.fromScale); o.set(0); tx.set(0); ty.set(0); }
      else if (opts.from === 'dock') {
        const d = dockDelta();
        if (d && !reduced) { tx.set(d.dx); ty.set(d.dy); s.set(d.scale); o.set(0); }
        else { tx.set(0); ty.set(0); s.set(reduced ? 1 : LIFECYCLE.fallback.toScale); o.set(0); usedFallback = !d; }
      }
      tune = opts.from === 'dock' ? LIFECYCLE.restore : LIFECYCLE.open; oTune = LIFECYCLE.open;
      tx.t = 0; ty.t = 0; s.t = 1; o.t = 1;
    } else if (next === 'closed') {
      tune = LIFECYCLE.close; oTune = LIFECYCLE.close;
      s.t = reduced ? s.x : LIFECYCLE.close.toScale; o.t = 0;
    } else if (next === 'minimized') {
      const d = dockDelta();
      if (d && !reduced) { tune = LIFECYCLE.minimize; oTune = LIFECYCLE.fadeLate; tx.t = d.dx; ty.t = d.dy; s.t = d.scale; o.t = 0; }
      else { tune = LIFECYCLE.fallback; oTune = LIFECYCLE.fallback; tx.t = tx.x; ty.t = ty.x; s.t = reduced ? s.x : LIFECYCLE.fallback.toScale; o.t = 0; usedFallback = !d; }
    } else throw new Error('unknown lifecycle state ' + next);
    if (reduced) { tune = LIFECYCLE.reduced; oTune = LIFECYCLE.reduced; tx.set(tx.t); ty.set(ty.t); s.set(s.t); }
    return new Promise((resolve) => { pending = { state: next, resolve }; paint(); wake(); });
  }
  function cancel() { retarget(); tune = LIFECYCLE.open; oTune = LIFECYCLE.open; state = 'open'; tx.t = 0; ty.t = 0; s.t = 1; o.t = 1; return new Promise((resolve) => { pending = { state: 'open', resolve }; wake(); }); }
  function destroy() {
    if (!alive) return;
    alive = false;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    retarget();
  }
  paint();
  return { transitionTo, cancel, destroy, get state() { return state; }, get visual() { return visual(); }, trace: () => trace.slice(), get alive() { return alive; } };
}

/* A closing window that the host has already destroyed keeps a static
   stand-in for the 120 ms exit. The stand-in lives in a closed shadow root:
   document queries cannot find it (no duplicate `.window-<id>`, no
   duplicate app content for a remount check to count), `inert` on the
   host covers it, and the page's stylesheets are adopted so it keeps
   the window's full look. Nothing live remains in it: no listeners,
   no app instance, no tab stops, no media. */
let ghostSheets = null;
function ghostStyles() {
  if (ghostSheets) return ghostSheets;
  ghostSheets = [];
  for (const sheet of document.styleSheets) {
    try { const s = new CSSStyleSheet(); s.replaceSync([...sheet.cssRules].map((r) => r.cssText).join('\n')); ghostSheets.push(s); } catch { /* cross-origin sheet: skip */ }
  }
  return ghostSheets;
}
export function ghostOf(el, container = el.offsetParent || document.body) {
  const rr = container.getBoundingClientRect(), r = el.getBoundingClientRect();
  const sx = container.clientWidth / (rr.width || 1), sy = container.clientHeight / (rr.height || 1);
  const host = document.createElement('div');
  host.className = 'lc-ghost'; host.inert = true; host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, { position: 'absolute', left: ((r.left - rr.left) * sx).toFixed(2) + 'px', top: ((r.top - rr.top) * sy).toFixed(2) + 'px', width: (r.width * sx).toFixed(2) + 'px', height: (r.height * sy).toFixed(2) + 'px', zIndex: getComputedStyle(el).zIndex, pointerEvents: 'none', transformOrigin: '50% 50%' });
  const shadow = host.attachShadow({ mode: 'closed' });   // closed: neither document queries nor test drivers that pierce open roots can find the clone
  shadow.adoptedStyleSheets = ghostStyles();
  const g = el.cloneNode(true);
  g.removeAttribute('tabindex'); g.removeAttribute('data-app-id'); g.removeAttribute('data-phase');
  g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  g.querySelectorAll('input,textarea,select,button,a,[tabindex]').forEach((n) => { n.setAttribute('tabindex', '-1'); n.removeAttribute('autofocus'); });
  g.querySelectorAll('iframe,video,audio,script').forEach((n) => n.remove());
  // the clone fills the host exactly; its own positioning, transform and lift are neutralised
  const imp = (k, v) => g.style.setProperty(k, v, 'important');
  imp('position', 'absolute'); imp('left', '0px'); imp('top', '0px'); imp('right', 'auto'); imp('bottom', 'auto'); imp('margin', '0');
  imp('width', '100%'); imp('height', '100%'); imp('transform', 'none'); imp('translate', 'none'); imp('scale', 'none'); imp('opacity', '1');
  shadow.append(g);
  return host;
}
