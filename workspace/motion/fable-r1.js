/* ══════════════════════════════════════════════════════════════════
   WINDOW MOTION, revision 1 (F0-r1).

   Same engine as F0 with the interruption state made explicit.
   Codex's review reproduced two defects in F0:
     1. a window grabbed mid-flight kept resizing under a still hand;
     2. cancelling after an interrupted snap restored a tile identity
        onto a floating rect, and a later relayout re-tiled it.
   Both came from the same cause: the engine tracked a rect and a
   tile name separately, and an interruption only froze half of it.

   Revision 1 has one rule: **the engine always knows one semantic
   state**, `{ rect, tiled, zoomed }`, either settled or as a flight
   with a `from` and a `to`. A grab freezes all four axes and their
   targets. Releasing a grab that never moved, or cancelling it,
   behaves as if the press never happened: the interrupted flight
   resumes. Dragging past the tear-off threshold is the only way an
   interrupted window changes size, and a release after any drag
   completes that size so no half-size window is ever left behind.

   One spring, two worlds: this is the same implicit damped spring
   the room camera uses (camera.js).
   ══════════════════════════════════════════════════════════════════ */

export const MOTION = Object.freeze({
  lift:    { omega: 30, zeta: 1.00 },
  drop:    { omega: 26, zeta: 1.00 },
  snap:    { omega: 21, zeta: 0.92 },
  restore: { omega: 21, zeta: 0.92 },
  tear:    { omega: 24, zeta: 0.95 },
  zoom:    { omega: 18, zeta: 0.92 },
  cancel:  { omega: 21, zeta: 0.86 },
  nudge:   { omega: 24, zeta: 1.00 },

  liftScale: 1.012,
  dragSlop: 4,
  tearOff: 24,

  zone: { edge: 12, top: 10, corner: 64, leave: 40, dwellMs: 90 },
  tile: { gap: 8 },
  reduced: { fadeMs: 120 },
  settle: { pos: 0.6, vel: 40 },
  maxOmega: 30,                          // for the trace bound: no spring here is stiffer
});

export function springStep(s, target, omega, zeta, dt) {
  if (dt > 0.1) dt = 0.1;
  const f = 1 + 2 * dt * zeta * omega;
  const oo = omega * omega;
  const hoo = dt * oo;
  const hhoo = dt * hoo;
  const det = 1 / (f + hhoo);
  const x = (f * s.x + dt * s.v + hhoo * target) * det;
  const v = (s.v + hoo * (target - s.x)) * det;
  s.x = x; s.v = v;
  return s;
}

class Axis {
  constructor(x) { this.x = x; this.v = 0; this.t = x; }
  set(x) { this.x = x; this.t = x; this.v = 0; }
  hold() { this.t = this.x; this.v = 0; }                    // freeze exactly where it is
  step(o, z, dt) {
    if (this.x === this.t && this.v === 0) return;
    springStep(this, this.t, o, z, dt);
    if (Math.abs(this.x - this.t) < 1e-4 && Math.abs(this.v) < 1e-3) { this.x = this.t; this.v = 0; }
  }
  get settled() { return Math.abs(this.x - this.t) < MOTION.settle.pos && Math.abs(this.v) < MOTION.settle.vel; }
}

/* ── snap geometry ──────────────────────────────────────────────── */
export function zoneRect(zone, stage, safe, opts = {}) {
  const g = MOTION.tile.gap;
  const x0 = g, y0 = safe.top + g;
  const W = stage.w - 2 * g, H = stage.h - safe.top - safe.bottom - 2 * g;
  const cols = opts.thirds ? 3 : 2;
  const colW = (W - g * (cols - 1)) / cols;
  const halfH = (H - g) / 2;
  switch (zone) {
    case 'fill':  return { x: x0, y: y0, w: W, h: H };
    case 'left':  return { x: x0, y: y0, w: colW, h: H };
    case 'right': return { x: x0 + W - colW, y: y0, w: colW, h: H };
    case 'centre':return cols === 3 ? { x: x0 + colW + g, y: y0, w: colW, h: H } : null;
    case 'tl':    return { x: x0, y: y0, w: colW, h: halfH };
    case 'tr':    return { x: x0 + W - colW, y: y0, w: colW, h: halfH };
    case 'bl':    return { x: x0, y: y0 + halfH + g, w: colW, h: halfH };
    case 'br':    return { x: x0 + W - colW, y: y0 + halfH + g, w: colW, h: halfH };
    default: return null;
  }
}

export function zoneAt(px, py, stage, current) {
  const Z = MOTION.zone;
  const nearL = px <= Z.edge, nearR = px >= stage.w - Z.edge, nearT = py <= Z.top;
  const inTop = py <= Z.corner, inBot = py >= stage.h - Z.corner;
  let z = null;
  if (nearT) z = 'fill';
  else if (nearL) z = inTop ? 'tl' : inBot ? 'bl' : 'left';
  else if (nearR) z = inTop ? 'tr' : inBot ? 'br' : 'right';
  if (z) return z;
  if (current) {
    const stillL = px <= Z.leave, stillR = px >= stage.w - Z.leave, stillT = py <= Z.leave;
    if (current === 'fill' && stillT) return current;
    if ((current === 'left' || current === 'tl' || current === 'bl') && stillL) return current;
    if ((current === 'right' || current === 'tr' || current === 'br') && stillR) return current;
  }
  return null;
}

const rectOf = (r) => ({ x: r.x, y: r.y, w: r.w, h: r.h });
const PHASE = { snap: 'snapping', restore: 'restoring', zoom: 'zooming', cancel: 'cancelling', nudge: 'nudging', settle: 'settling' };

/* ══ the controller ═════════════════════════════════════════════ */
export class WindowMotion {
  constructor(el, host, rect) {
    this.el = el; this.host = host;
    this.x = new Axis(rect.x); this.y = new Axis(rect.y);
    this.w = new Axis(rect.w); this.h = new Axis(rect.h);
    this.s = new Axis(1);
    this.phase = 'rest';
    /* ONE semantic state. `settled` is where the window is when
       nothing is happening. `flight` is a move in progress, with the
       state it left (`from`) and the state it is going to (`to`).
       Both carry rect + tiled + zoomed together; they cannot drift
       apart because nothing else stores a tile name. */
    this.settled = { rect: rectOf(rect), tiled: null, zoomed: false };
    this.flight = null;                   // { kind, from, to }
    this.floating = rectOf(rect);         // last untiled, unzoomed rect: what restore and tear-off return to
    this.zone = null; this.zoneSince = 0; this.previewShown = false;
    this._press = null;
    this._tune = MOTION.drop; this._sizeTune = MOTION.drop;
    this.trace = []; this._prevFrame = null; this._wasMoving = false;
    this._paint(); this._reflectClasses();
  }

  /* ── reads ─────────────────────────────────────────────────── */
  get rect() { return { x: this.x.x, y: this.y.x, w: this.w.x, h: this.h.x }; }
  get target() { return { x: this.x.t, y: this.y.t, w: this.w.t, h: this.h.t }; }
  get moving() { return !(this.x.settled && this.y.settled && this.w.settled && this.h.settled && this.s.settled); }
  get velocity() { return Math.hypot(this.x.v, this.y.v); }
  get tiled() { return (this.flight ? this.flight.to : this.settled).tiled; }
  get zoomed() { return (this.flight ? this.flight.to : this.settled).zoomed; }
  get grabbed() { return Boolean(this._press); }
  get state() { return { phase: this.phase, rect: this.rect, target: this.target, tiled: this.tiled, zoomed: this.zoomed, flight: this.flight ? this.flight.kind : null, grabbed: this.grabbed, floating: rectOf(this.floating) }; }

  _phase(p) { if (this.phase === p) return; this.phase = p; this.el.dataset.phase = p; this.host.onPhase?.(p, this); }
  _reflectClasses() {
    this.el.classList.toggle('is-tiled', Boolean(this.tiled));
    this.el.classList.toggle('is-zoomed', Boolean(this.zoomed));
  }

  /* ── press: the lift, and the freeze ──────────────────────────── */
  press(px, py) {
    this.host.raise?.(this);
    const r = this.rect;
    const interrupted = this.flight && this.flight.kind !== 'settle' ? this.flight : null;
    /* Freeze all four axes where they are, targets included. A hand
       has infinite damping. F0 froze x/y only, and a grabbed window
       went on resizing under a still pointer. */
    this.x.hold(); this.y.hold(); this.w.hold(); this.h.hold();
    this._press = {
      px, py, x: r.x, y: r.y, w: r.w, h: r.h, moved: false, tore: false,
      fracX: (px - r.x) / r.w, fracY: (py - r.y) / r.h,
      /* If a flight was interrupted, the grab holds an intermediate
         state that is nobody's intent. Its "home" is the flight
         itself: a tap or a cancel resumes it. Otherwise home is the
         settled state, rect and identity together. */
      interrupted,
      home: interrupted ? null : { rect: rectOf(this.flight ? this.flight.to.rect : this.settled.rect), tiled: this.tiled, zoomed: this.zoomed },
    };
    // while grabbed the window is floating; its identity returns only by resume or cancel
    this.flight = null;
    this.settled = { rect: r, tiled: null, zoomed: false };
    this._reflectClasses();
    this._clearZone();
    this._tune = MOTION.lift;
    this.s.t = this.host.reduced() ? 1 : MOTION.liftScale;
    this._phase('lifted');
    this.el.classList.add('is-lifted');
  }

  /* ── move: the drag ────────────────────────────────────────────── */
  move(px, py, dt) {
    const P = this._press; if (!P) return;
    const dx = px - P.px, dy = py - P.py;
    if (!P.moved) {
      if (dx * dx + dy * dy < MOTION.dragSlop * MOTION.dragSlop) return;
      P.moved = true;
      this._phase('dragging');
    }
    /* Tear-off: the one deliberate size change during a grab. A
       window that was tiled, zoomed, or caught mid-flight returns to
       its floating size once the drag is clearly a drag, keeping the
       pointer at the same fraction across the title bar. */
    const hadShape = P.interrupted || P.home?.tiled || P.home?.zoomed;
    if (hadShape && !P.tore && Math.hypot(dx, dy) > MOTION.tearOff) {
      P.tore = true;
      this.w.t = this.floating.w; this.h.t = this.floating.h;
      this._sizeTune = MOTION.tear;
      if (this.host.reduced()) { this.w.set(this.floating.w); this.h.set(this.floating.h); }
      P.fracX = Math.min(0.9, Math.max(0.1, P.fracX));
      P.fracY = Math.min(0.25, P.fracY);
    }
    const w = P.tore ? this.w.t : P.w, h = P.tore ? this.h.t : P.h;
    const nx = P.tore ? px - P.fracX * w : P.x + dx;
    const ny = P.tore ? py - P.fracY * h : P.y + dy;
    const st = this.host.stage(), safe = this.host.safe();
    const cx = Math.max(-(w - 80), Math.min(st.w - 80, nx));
    const cy = Math.max(safe.top, Math.min(st.h - 40, ny));
    if (dt > 0) { this.x.v = (cx - this.x.x) / dt; this.y.v = (cy - this.y.x) / dt; }
    this.x.x = cx; this.x.t = cx; this.y.x = cy; this.y.t = cy;
    const z = zoneAt(px, py, st, this.zone);
    if (z !== this.zone) { this.zone = z; this.zoneSince = performance.now(); this._preview(null); }
  }

  /* ── release ───────────────────────────────────────────────────── */
  release() {
    const P = this._press; if (!P) return;
    this._press = null;
    this.el.classList.remove('is-lifted');
    this.s.t = 1;
    const zone = P.moved ? this.zone : null;
    this._clearZone();
    if (zone) { this.snap(zone); return; }
    if (!P.moved) {
      /* A tap. If it interrupted a flight, the press expressed no
         intent: resume as if it never happened. Otherwise the window
         keeps its settled identity (a tap on a tiled window leaves it
         tiled). */
      if (P.interrupted) { this._resume(P.interrupted); return; }
      this.settled = P.home;
      this._reflectClasses();
      this._tune = MOTION.drop;
      this._phase('settling');
      return;
    }
    /* A drag ended off any zone: set down here, floating. If the size
       never tore off (a short drag from a tile or a mid-flight grab),
       complete the tear-off now so no half-size window is left. */
    this.x.hold(); this.y.hold();
    const to = { rect: this.target, tiled: null, zoomed: false };
    if (!P.tore && (P.interrupted || P.home?.tiled || P.home?.zoomed)) { to.rect.w = this.floating.w; to.rect.h = this.floating.h; }
    this._fly('settle', to, MOTION.tear);
    this._tune = MOTION.drop;
  }

  /* ── cancel: as if the gesture never happened ──────────────────── */
  cancel() {
    const P = this._press;
    if (P) {
      this._press = null;
      this.el.classList.remove('is-lifted');
      this.s.t = 1;
      this._clearZone();
      if (P.interrupted) { this._resume(P.interrupted, MOTION.cancel); this.host.announce?.('Grab cancelled'); return true; }
      this._fly('cancel', P.home, MOTION.cancel);
      this.host.announce?.('Move cancelled');
      return true;
    }
    if (this.flight && this.flight.kind !== 'settle') {
      // a flight with no hand on it: reverse to where it came from, identity included
      this._fly('cancel', this.flight.from, MOTION.cancel);
      this.host.announce?.('Move cancelled');
      return true;
    }
    return false;
  }

  /* ── snap / restore / zoom ─────────────────────────────────────── */
  snap(zone) {
    const rect = zoneRect(zone, this.host.stage(), this.host.safe(), { thirds: this.host.thirds() });
    if (!rect) return false;
    this._rememberFloating();
    this._fly('snap', { rect, tiled: zone, zoomed: false }, MOTION.snap);
    this.host.announce?.(`Window tiled ${zoneLabel(zone)}`);
    return true;
  }
  restore() {
    if (!this.tiled && !this.zoomed) return false;
    this._fly('restore', { rect: rectOf(this.floating), tiled: null, zoomed: false }, MOTION.restore);
    this.host.announce?.('Window restored');
    return true;
  }
  zoom() {
    if (this.zoomed) return this.restore();
    this._rememberFloating();
    this._fly('zoom', { rect: zoneRect('fill', this.host.stage(), this.host.safe()), tiled: null, zoomed: true }, MOTION.zoom);
    this.host.announce?.('Window enlarged');
    return true;
  }
  nudge(dx, dy) {
    if (this._press) return;
    const st = this.host.stage(), safe = this.host.safe();
    const t = this.target;
    const rect = { x: Math.max(-(t.w - 80), Math.min(st.w - 80, t.x + dx)), y: Math.max(safe.top, Math.min(st.h - 40, t.y + dy)), w: t.w, h: t.h };
    this._fly('nudge', { rect, tiled: null, zoomed: false }, MOTION.nudge);
  }

  /* Re-solve a tiled or zoomed window when the stage changes size.
     Only a state that HAS a tile or zoom identity is re-solved; a
     floating window, grabbed or not, is left alone. */
  relayout() {
    if (this._press) return;
    const to = this.flight ? this.flight.to : this.settled;
    if (to.tiled) {
      const rect = zoneRect(to.tiled, this.host.stage(), this.host.safe(), { thirds: this.host.thirds() });
      if (rect) this._fly(this.flight?.kind || 'snap', { rect, tiled: to.tiled, zoomed: false }, MOTION.snap);
    } else if (to.zoomed) {
      this._fly(this.flight?.kind || 'zoom', { rect: zoneRect('fill', this.host.stage(), this.host.safe()), tiled: null, zoomed: true }, MOTION.zoom);
    }
  }

  setRect(rect) {
    this.x.set(rect.x); this.y.set(rect.y); this.w.set(rect.w); this.h.set(rect.h);
    this.flight = null; this.settled = { rect: rectOf(rect), tiled: null, zoomed: false }; this.floating = rectOf(rect);
    this._reflectClasses(); this._paint();
  }

  /* ── internals ─────────────────────────────────────────────────── */
  _rememberFloating() { const cur = this.flight ? this.flight.to : this.settled; if (!cur.tiled && !cur.zoomed) this.floating = rectOf(cur.rect); }
  _fly(kind, to, tune, from) {
    from = from || (this.flight ? this.flight.from : { rect: rectOf(this.settled.rect), tiled: this.settled.tiled, zoomed: this.settled.zoomed });
    this.flight = { kind, from, to: { rect: rectOf(to.rect), tiled: to.tiled ?? null, zoomed: Boolean(to.zoomed) } };
    this._tune = tune; this._sizeTune = tune;
    const r = to.rect;
    this.x.t = r.x; this.y.t = r.y; this.w.t = r.w; this.h.t = r.h;
    if (this.host.reduced()) { this.x.set(r.x); this.y.set(r.y); this.w.set(r.w); this.h.set(r.h); }
    this._reflectClasses();
    this._phase(PHASE[kind] || 'settling');
  }
  _resume(flight, tune) {
    // continue the interrupted flight to its own target, from wherever the hand left the window
    this._fly(flight.kind, flight.to, tune || MOTION[flight.kind] || MOTION.snap, flight.from);
  }
  _land() {
    const f = this.flight;
    this.x.set(this.x.t); this.y.set(this.y.t); this.w.set(this.w.t); this.h.set(this.h.t);
    this.settled = f ? { rect: rectOf(f.to.rect), tiled: f.to.tiled, zoomed: f.to.zoomed } : { rect: this.rect, tiled: this.settled.tiled, zoomed: this.settled.zoomed };
    if (!this.settled.tiled && !this.settled.zoomed) this.floating = rectOf(this.settled.rect);
    this.flight = null;
    this._reflectClasses();
    this._phase('rest');
    this.host.onSettle?.(this);
  }
  _preview(zone) {
    const rect = zone ? zoneRect(zone, this.host.stage(), this.host.safe(), { thirds: this.host.thirds() }) : null;
    this.previewShown = Boolean(zone && rect);
    this.host.onPreview?.(this.previewShown ? zone : null, rect);
  }
  _clearZone() { this.zone = null; this.previewShown = false; this.host.onPreview?.(null, null); }

  /* ── per frame ─────────────────────────────────────────────────── */
  step(dt) {
    const dragging = Boolean(this._press) && this.phase === 'dragging';
    if (dragging && this.zone && !this.previewShown && performance.now() - this.zoneSince >= MOTION.zone.dwellMs) this._preview(this.zone);
    const T = this._tune, Sz = this._sizeTune;
    if (!dragging) { this.x.step(T.omega, T.zeta, dt); this.y.step(T.omega, T.zeta, dt); }
    this.w.step(Sz.omega, Sz.zeta, dt); this.h.step(Sz.omega, Sz.zeta, dt);
    this.s.step(MOTION.lift.omega, MOTION.lift.zeta, dt);
    const wasMoving = this._wasMoving;
    const moving = this.moving;
    this._wasMoving = moving;
    if (!moving && !this._press && this.phase !== 'rest') this._land();
    this._paint();
    if (moving || wasMoving || dragging) this._log(dt);
  }

  _paint() {
    const st = this.el.style;
    const s = this.s.x;
    st.transform = `translate3d(${this.x.x.toFixed(2)}px,${this.y.x.toFixed(2)}px,0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}`;
    if (this._pw !== this.w.x || this._ph !== this.h.x) {
      st.width = this.w.x.toFixed(2) + 'px'; st.height = this.h.x.toFixed(2) + 'px';
      this._pw = this.w.x; this._ph = this.h.x;
    }
    st.setProperty('--lift', ((s - 1) / (MOTION.liftScale - 1)).toFixed(3));
  }

  _log(dt) {
    const r = this.rect;
    const f = { t: performance.now(), dt, phase: this.phase, grabbed: this.grabbed,
      x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.w.toFixed(2), h: +r.h.toFixed(2), s: +this.s.x.toFixed(4),
      v: +this.velocity.toFixed(1), vs: +Math.hypot(this.w.v, this.h.v).toFixed(1),
      tx: +this.x.t.toFixed(2), ty: +this.y.t.toFixed(2), tw: +this.w.t.toFixed(2), th: +this.h.t.toFixed(2) };
    const p = this._prevFrame;
    const O = MOTION.maxOmega * MOTION.maxOmega * 0.5 * dt * dt;
    f.jump = p ? +Math.hypot(f.x - p.x, f.y - p.y).toFixed(1) : 0;
    f.jumpSize = p ? +Math.hypot(f.w - p.w, f.h - p.h).toFixed(1) : 0;
    f.allowed = p ? +(p.v * dt + O * Math.hypot(p.x - f.tx, p.y - f.ty) + 2).toFixed(1) : 1e9;
    f.allowedSize = p ? +(p.vs * dt + O * Math.hypot(p.w - f.tw, p.h - f.th) + 2).toFixed(1) : 1e9;
    this._prevFrame = f;
    this.trace.push(f);
    if (this.trace.length > 1200) this.trace.splice(0, this.trace.length - 1200);
  }

  destroy() { this._press = null; this._clearZone(); this.trace.length = 0; }
}

export function zoneLabel(z) {
  return { fill: 'to fill the desktop', left: 'left', right: 'right', centre: 'centre', tl: 'top left', tr: 'top right', bl: 'bottom left', br: 'bottom right' }[z] || z;
}
