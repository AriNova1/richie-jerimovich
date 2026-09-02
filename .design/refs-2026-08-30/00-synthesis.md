# What the references actually taught, and what it means for the rebuild

Written after walking all eight properly: reading live DOM and stylesheets, logging in,
opening windows, flying into the room, and dumping the token blocks. The first pass was
two screenshots of a loading screen and a blog post, and the conclusions I drew from it
were wrong in specific ways listed below.

---

## Five findings that change the design

### 1. None of them scroll

| site | `body.scrollHeight` vs `innerHeight` |
|---|---|
| howdidwelosethisworld.com | equal — fixed |
| posthog.com | equal — fixed, 8 inner scrollers |
| pauljaguin.com | equal — fixed |
| henryheffernan.com | fixed, WebGL canvas |

Four for four. Page scroll is the thing that collapses an OS back into a web page. All
three of my demos were already fixed-viewport, so this is the one thing I had right.

### 2. Aliveness is non-interpolated motion, live texture, and sound — not more UI

Silo's signature is nine lines of SVG:

```svg
<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="1">
  <animate attributeName="seed" values="1;2;3;4;5;6;7;8"
           dur="1.1s" calcMode="discrete" repeatCount="indefinite"/>
</feTurbulence>
<feDisplacementMap in="SourceGraphic" in2="boil-noise" scale="36" .../>
```

`calcMode="discrete"` makes the seed **snap** between eight values instead of easing, so
the artwork jitters eight times a second like hand-inked animation. Every chrome element
on that page also carries its own `<canvas>` of live TV static under real DOM text.

Heffernan ships `mouse_down.mp3`, `mouse_up.mp3` and **`key_1` through `key_6`** —
randomised so typing never repeats. PortfolioXP plays the XP startup chime on boot.

I shipped three demos with zero audio and all motion eased. That is precisely the
"mundane, not alive" Rick named, and the fix is cheap and specific.

### 3. A real room costs 185KB, not three days

Heffernan's entire scene: `computer_setup.glb` 73KB + `decor.glb` 54KB +
`environment.glb` 57KB. Low-poly with baked lighting, and the "room" is a **white void**
with only furniture in it — which reads as a diorama rather than as failed photorealism,
and is both cheaper and better.

My plan called VIGIL's room "3–4 days, the long pole." That estimate was made up.

MacFolio does the no-3D version: a **photograph** of a CRT on a real desk with the live
UI composited into the screen.

### 4. Feeling like an OS is token completeness, not style

macos27's `:root`, verbatim: three blur tiers (30/20/12px), a specular inset highlight,
three-layer window shadows **with a separate inactive variant so an unfocused window sits
lower**, a radius per component (window 16, dock 24, dock-icon 22.37%, menu 8,
menu-item 5, capsule 999), five durations (.12/.18/.25/.35/.5s), four easings, label
hierarchy as **alpha on one ink** (.85/.5/.26/.1), and a fourteen-step z-ladder from
desktop 0 to boot 11000.

This is the diagnosis for "so much going on, hard to keep up." GLASS drew everything at
one level of emphasis because it had no declared hierarchy. Density is not the problem;
undifferentiated density is.

Also restraint: only **8 elements** on the whole macos27 desktop have a live
`backdrop-filter`. I had it on every window.

### 5. Skin versus structure

DeskFolio's own page list — Home, About, Projects, Articles, Tools, Contact, 404, Style
Guide — is an ordinary site with folder icons for nav. PortfolioXP's projects genuinely
live in a filing system: folders, an address bar, categories, a Trash.

And PortfolioXP earns its entry with three gates: boot bar → login screen → desktop.
Heffernan uses two: START → click anywhere → fly in. Nobody drops you on a finished
desk, which is exactly what VIGIL does.

`cursor: url("/img/cursors/default-cursor.cur")` — real Windows cursor binaries. The
cheapest immersion in the whole set and I did not consider it.

---

## What I got wrong the first time, stated plainly

- "Silo is one long vertical descent" — it does not scroll at all.
- "PortfolioXP is nostalgia, therefore cute, not world-class" — the nostalgia is the
  skin; the filing structure underneath is the best argument in the set.
- "macos27 is a clone, therefore nothing to learn" — the clone is the least interesting
  part; the token system is transferable to any visual language.
- "VIGIL's room is 3–4 days of asset production" — invented number, off by an order.
- "Media/video is the long pole" — audio is the cheap lever and I skipped it entirely.

---

## The direction this points at

Rick's brief was "richie's own environment recreated, go inside his brain, body, see
things under the hood," and his verdict on the demos was: the instrument and the fusion
are overwhelming and mundane, the room is closest.

The room, then — but the room as Heffernan does it rather than as I did it: real
geometry, a camera that moves, sound on every action, the interface living on a screen
inside the world, one focal thing at a time, and an entry you have to earn.

And the second half of his brief is the part none of the references do: **inside**.
Heffernan's camera stops at the desk. Nothing in this set goes further in. That is the
opening.

---

# Built (2026-08-30, second pass)

Rick picked **all three premises** at **full craft**. All three are running at
`.concept-preview/v2/`, over the same corpus export the first round used.

## The shared kit — `v2/lib/`

- **`kit.css`** — the token ladder, taken straight off the macos27 teardown because
  "so much going on, hard to keep up" is a hierarchy problem, not a density problem:
  fourteen named z-layers, a radius per component, three blur tiers used sparingly,
  five durations, five easings, emphasis as **alpha on one ink** (.92/.62/.34/.14), and
  a separate inactive shadow so an unfocused surface physically sits lower.
- **`sound.js`** — every sound **synthesised**, not sampled. Heffernan rotates six
  keypress samples; six samples still loop, so this generates a fresh noise burst with
  jittered pitch and filter per strike and never repeats. Room tone with a 0.07Hz
  breath on the fan, asymmetric mouse down/up, a CRT power-on (rising whine + flyback
  thump + static crack), static bursts, one chime reserved for a job completing.
  Nothing plays until a real gesture unlocks it.
- **`kit.js`** — Silo's boil, installed verbatim including the load-bearing
  `calcMode="discrete"`; live canvas static driven by one shared rAF; the corpus loader.

## THE ZOOM — `v2/zoom/`

Four camera stops: the room, the desk, the screen, inside. The interface on the glass
is **real DOM registered to the projected screen quad every frame**, not a render-target
texture, so it stays selectable and sharp. Outside is warm and photographic; inside
switches to phosphor and schematic — Silo's two-skins-over-one-desktop, repurposed to
mean something.

The room is built from three.js primitives rather than loaded: desk, drawer unit, CRT
with a tapered tube, keyboard with 75 instanced keys, mouse, mug, a stack of paper
nobody squared, two binders, an anglepoise that is also the only warm light, a chair.

Three real bugs found by capture, all fixed:
- The screen plane and the bezel face were at the same Z. The field of flickering
  blue rectangles in the first capture was **z-fighting**, not a texture.
- Depth 2 sat at z=0.72, so the interface projected to 1525×1164 inside a 1440×900
  viewport and every pixel of it was off-frame.
- Depth 3 puts the camera *behind* the screen plane, where projecting its corners
  returned a 28086px box. Inside the machine there is no monitor to register to, so
  the overlay simply becomes the viewport.

And one design failure: the CRT was painted near-black, so a site about a machine that
works all night opened on a photograph of a switched-off monitor. It now carries a live
canvas texture — the same four directories as bar meters, plus a scrolling commit tail —
legible as light from the widest shot, with **REFUSED as the longest bar**.

## THE SIGNAL — `v2/signal/`

Silo View, with nothing invented. Six recorded nights on a monitoring wall, each tile
drawing its own night from **real committer timestamps** with a deterministic activity
trace, a sweep head, and degradation proportional to that night's outcome. The tune-in
bar fills to the fraction of health checks actually passing (60%). The Settings panel is
Silo's, carrying real values including `Pipeline check — stale 4d` and
`Reading metabolism — stalled`.

One honesty fix: the ledger pass runs once, so all 23 refusals on a night share a
timestamp. Stacking them on one x is a wall, not a reading — they are spread across the
ledger window in the order taken, and each tile says *"ledger marks show order, not
minutes"* rather than implying each had its own.

## THE RIG — `v2/rig/`

RICHIE MK I: six parts, drawn as a 1-bit engineering plate with a Bayer 4×4 ordered
dither on sepia paper — holidayOS's halftone register, matthewpmunger's striped title
bars. The spike is drawn with the refusals impaled on it and is **visibly taller than
the ledger stack beside it**, which is the 3.2:1 argument as a picture.

The house rule, written into the file and onto the page: *a part earns its place only
if it shows a reading that would be wrong to invent.* This is exactly how the kitchen
metaphor died, and the demo says so about itself rather than hoping nobody notices.

## Still open

- Custom cursors are in `kit.css` as SVG data URIs; PortfolioXP's real `.cur` binaries
  would be better and are cheap.
- The zoom's CRT still reads slightly flat-panel; the tube wants more taper.
- Nothing is wired into Jekyll. Static-first remains a build requirement, unmet.
