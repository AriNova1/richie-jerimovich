# THE ZOOM — photoreal overhaul

2026-09-03. Rick picked THE ZOOM and asked for a rethink of every
aspect: ultra realistic, not gimmicky, unique, natural, best in class.

## The diagnosis

The first build was not badly modelled. It was badly photographed.

| tell | what was actually wrong |
|---|---|
| everything looks like one plastic | no texture maps at all — flat colour plus a single roughness scalar per material |
| nothing has a reflection | no environment map, so `MeshStandardMaterial` had only direct light to work with |
| wrong light shapes | point lights standing in for a 1.3 × 1.5 m window and a 605 × 345 mm panel |
| highlights clip flat | no tone mapping |
| reads as a 3D exercise | every edge a hard 90°; real objects have a chamfer that catches a highlight |
| objects float | the room was a void, so nothing had a floor to sit on or walls to bounce off |
| feels like a slideshow | a cubic ease on camera position — no mass, no overshoot, no focus pull |
| no CRT glow | no post at all: no bloom, no defocus, no grain |

## The one design decision made rather than asked

**No beige CRT.** Every web-desktop in the reference pile reaches for
one. On a site whose whole argument is that the record is real, a
nostalgic costume for a computer that never existed is exactly the
gimmick the brief said to avoid. The hardware is now what it actually
is — an unbranded aluminium box and a matte panel in an apartment in
Chicago at 3am. The interface on it is entirely his, which also kills
any risk of reading as a macOS clone.

## What was built

- `lib/textures.js` — procedural surfaces, zero downloaded bytes.
  Wood, ABS, paper, brushed metal, plaster, carpet, a wear map, and a
  painted Chicago skyline. Every generator returns albedo + roughness
  + normal; normals are derived from an authored height field by Sobel
  so the lighting cannot disagree with itself.
- `zoom/render.js` — the film. ACES filmic at 0.92 exposure, a PMREM
  environment built from the room's *own* sources (so reflections
  agree with the lights), MSAA 4×, defocus → bloom → tone map → grade.
  The grade pass does r²-scaled lateral chromatic aberration, a real
  cos⁴ vignette, a cold lift in the toe, and grain weighted by
  1 − luminance so it lives in the shadows like film.
- `zoom/camera.js` — the operator. Critically-damped implicit springs
  with velocity; **aim leads position** (stiffer spring on the look
  target than the dolly), so the camera turns toward the subject
  before the body follows. Breath and drift never stop. Focus is its
  own slower spring, so the image resolves a beat after the move
  lands.
- `zoom/room.js` — an actual room: floor, three walls, ceiling,
  baseboard, a window with frame, mullion and sill. `RoundedBoxGeometry`
  throughout. RectAreaLights for the window and panel, a SpotLight for
  the lamp (a shade *is* a spot). Catenary-swept cables. Dust confined
  to the lamp cone. Nothing squared, nothing centred, and the mug has
  left a ring.
- Four shots, not four positions: 28 / 45 / 55 / 22 mm, each with its
  own focal distance.

## Bugs found, and what they teach

1. **The panel was buried in its own bezel.** Glass at −696.5mm, bezel
   front face at −696.0mm. Every wide shot showed a lit black slab
   where the interface should be. Looked like a lighting failure; was
   a depth-ordering failure.
2. **Both area lights fired into the wall behind them.** A
   RectAreaLight emits from one face and setting `rotation.y` by hand
   is a coin flip. Fixed with `lookAt`. The room was nearly black with
   two strong sources in it.
3. **A glare-coat plane in front of the panel** was lit point-blank by
   the panel's own area light and blew to flat blue-grey. Removed —
   a matte anti-glare panel is not reflective, which is why it's matte.
4. **Desk moiré.** Wood grain authored at 260 cycles per tile — four
   pixels per cycle — minified into bands at grazing angles. Nothing
   about the lighting was wrong; the texture was aliasing.
5. **`PCFSoftShadowMap` is deprecated** and three silently substitutes
   hard `PCFShadowMap`. The room had hard shadows while the code said
   otherwise, and nothing looked broken. Now VSM with real blur.
6. **Snow indoors.** 420 dust motes at 30% opacity across the room.
   A mote is a speck catching light, not a light source. Now 140,
   dimmer than what they sit against, confined to the lamp cone.
7. **Grid `min-width:auto`** made the refusal rows overflow their own
   column, hard-clipping mid-word and pushing the dates off-screen.
   The ellipsis rule was correct and never got to fire.
8. **The interior was invisible.** At depth 3 the full-screen
   interface painted over the wireframe the camera had just flown
   into, so the one shot where you are past the glass rendered as text
   on black. The inside skin is translucent now.

## The measurement trap — worth recording

Several intermediate readings in this session were **wrong**, and all
for one reason.

The capture script used a **fixed remote-debugging port**. When a run
died on a timeout it left Chrome alive holding that port, and the next
run's `fetch(/json)` silently attached to the **orphan** rather than
the browser it had just launched. So it drove a stale page with a
stale HTTP cache — and reported `fps: 0.0`, `programs: 0`, and a
zoom.css missing 31 rules, all of which were true of a browser that
had been sitting idle for half an hour with a pre-edit cache.

That produced two false conclusions before it was caught: that VSM
shadows had collapsed the frame rate, and that appended CSS was not
being parsed. Neither was true. The site runs at **60 fps** and the
stylesheet parses **127 rules**.

Two fixes, both of which should be standard for any capture harness
here:

- unique port per run, `Network.setCacheDisabled`, and kill the
  browser on an uncaught exception
- **step the simulation by hand** rather than sleeping. Chrome stops
  delivering animation frames to a window it thinks is covered, and
  `Page.captureScreenshot` then forces exactly one frame — so the
  camera advances one spring step per screenshot and it looks
  precisely like a performance collapse. `window.__zoom.step(n)`
  advances the frame body at a fixed dt, independent of rAF.

## Verified

At 1440×900, fresh browser, cache disabled, deterministic stepping:

- 60 fps, 33 programs, 64 geometries
- camera lands on every stop: glass projects 164×126 → 698×437 →
  1110×633 → full viewport
- console clean apart from a favicon 404
- `.p-body` grid, `.p-rail` column, 127 rules parsed

## Still open

- The lamp arm barely reads; the shade looks like it floats.
- The room could take a little more bounce in the upper walls.
- Sound is unchanged from the previous pass and has not been
  re-checked against the new room.
- Mobile is untested at this size.
- None of it is wired into Jekyll, and the static-first requirement
  (the record renders with JavaScript off) is still unmet.
