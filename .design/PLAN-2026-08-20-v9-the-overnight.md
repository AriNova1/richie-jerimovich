# v9 · THE OVERNIGHT: master plan for the ground-up front door

**Written 2026-08-20. This file is the build contract for the next session. It lives in `.design/`, which `_config.yml` excludes from the public build. Keep it there.**

**Read first, in this order:**

1. `HANDOFF-2026-08-20-site-and-v8.md` (state, laws, traps; still true)
2. `PRODUCT.md` (register, principles, anti-references; binding)
3. This file
4. `CANON-v8-the-spike.md` (history; superseded by this plan, kept for the record)

**Governance note.** This plan was written with the direction choice delegated to the designer by Rick ("a completely new direction is encouraged, use your taste and vision"), so no options tournament was run. The repo's own conception gate still fires before any UI write, and this plan ships a ready-to-transcribe conception in §3. Do not skip that gate.

---

## 0. Mission

Replace the homepage front door and re-thread the whole site around one cinematic journey, built entirely from the site's real records. No generated footage, no placeholder plates, no new runtime dependencies, no assets that do not exist in the repo tonight. Ship-ready the moment the code is done.

The bar is 110/100. Rick's standing expectations apply: verify with a real CDP driver, both motion editions, 375px composed first, and screenshots get read, not just taken.

---

## 1. The laws (inviolable, restated so this file stands alone)

1. No fake metrics. Every number is read from `_data/`, git, or the vitals endpoint, or is labeled illustrative. No `Math.random()` may ever reach text.
2. No em-dashes or en-dashes in visible copy, including copy rendered from data files. Preflight checks the built `_site/` too.
3. Register: clinical, precise, never purple, never fabricating.
4. 375px is the native frame. Portrait composed first.
5. Reduced motion is a different document, not a slower one.
6. The complete document survives with no JavaScript.
7. Nothing third-party at runtime. Fonts self-hosted, libraries vendored, shaders hand-rolled.
8. The 23:00 CT cron entry is locked config. Never touch it.
9. Any new top-level `.md` ships publicly unless excluded in `_config.yml`. Confirm with `ls _site/` after build.
10. The nightly agent is running while you work. `git status` before assuming anything; expect it to review your work in its journal.

Gates, in the order they fire:

```bash
B=~/workspace/benchmark/skills/design-director/scripts
node $B/conception.mjs check richie-jerimovich   # before any front-end write
node $B/design-gate.mjs check richie-jerimovich  # sweep receipt before session end
node $B/preflight.mjs richie-jerimovich          # mechanical checks
```

Pass a property name, never an absolute path. A path gets doubled and misread.

---

## 2. The critique: why what exists must go

This section is the rationale. It is fair to what was built and blunt about where it fails.

### 2.1 What is genuinely good (harvest, do not rebuild)

- **The honesty architecture.** Counters fed by what actually landed on screen, `data-final` rest states, drought computed from `max(work_date)` at build. The animation can never drift from truth. This is the soul of the property. Keep the contract exactly.
- **reel-engine.mjs.** Pure-function-of-scroll mapping, monotone maps validated at mount, fail-loudly posture, the byte-range and iOS lessons. Keep and extend.
- **Reduced motion as a different document.** service.js's DOM-move pattern (captions relocated so source order is the photo essay, meaningless controls removed) is the best accessibility thinking in the repo. It becomes the template for every movement.
- **The pile/rod measurement loop.** CSS custom properties fed from measured layout, with comments recording why. Keep the pattern.
- **Seeded determinism** for diffable verification screenshots.
- **The ticket/spike/stamp material.** Cream thermal stock, perforated edges, JetBrains Mono, KEPT/SPIKED stamps. This is the property's own grammar. Keep.
- **The CSS-3D room grammar** from `/kitchen/` (real DOM planes, drag-look, unfolds flat without JS). Reused at the front door; see §5.
- **pass.js physics.** Gravity, dead stops, impale angles, rail landing measured live. Harvested into Movement 3.
- **shift.js, the gates, the data spine.** Untouched.

### 2.2 Where the current work fails

**P0 · The centerpiece is dead code.** THE SERVICE was never mounted. No `#service-stage` exists in `index.md`, the layouts, or the built `_site/`. `service.js` bails on a missing element and is never loaded; `service.css` is never linked. What actually runs on the homepage today is the spike-as-hero mechanism Rick already rejected in §9.5 of the handoff. The overhaul exists as intention, not as a build. A plan that cannot survive contact with the tree is not a plan; v9 is specified below as a file-by-file work order for exactly this reason.

**P0 · The concept betrays the house thesis.** The one fact the property rests on is: every claim traces to a real file, and anything else is refused. The v8 front door was eight AI-generated clips of a fictional kitchen. Generated footage of a room that never existed is decoration about a metaphor, one remove from the record, on the one site whose entire argument is that it never does that. It also made the front door hostage to the largest asset dependency the property has ever taken, and it has been blocked on it for days. Cinema built from the record itself has no such dependency and no such hypocrisy.

**P1 · The climax is volatile and was never fixed.** The drought-as-payoff broke live (16 to 2 days) and the conception has no answer. Any climax hung on one number that fluctuates will keep breaking. The climax must be a *ratio and a sequence*, which are always true: three refused for every one kept, and last night's actual rulings in order.

**P1 · It is a 28-second film, not a place.** One linear scrub, eight equal filmstrip segments (dishonest to the deliberately unequal REEL_MAP), captions that cannot survive a fast scrub, and `sessionStorage` gating so every repeat visit lands on a static page. The site's own claim is that it is a place, not a document. The front door should be the spine of that place, and it is currently a corridor of disconnected rooms with a bento undercutting the hero within one scroll.

**P2 · Engineering debt in the in-flight files.** reel-engine's hardening is imported but bypassed (no tier system, no seeking guard, no `srcMobile`; eight 4K preloads with no saveData gate). `data-hold-motion` is read by pass.js and service.js but *set by nothing*: the footer hold-motion switch sets `body.motion-held` and fires `motionhold`, so the WCAG 2.2.2 control is wired to a dead contract. The dead hero AVIF preload still fires on every home load. Roughly 90 lines of corpse JS in `index.md` reference deleted elements. `.pass-dry` is invisible without JS, contradicting its own no-JS comment. `--muted` is referenced six times in style.css and defined nowhere. `404.html` still carries em-dashes on a live page.

**Verdict.** The material, the data spine, the engine discipline, and the world are worth keeping. The conception (footage of an empty kitchen) and the structure (a film above a bento) are not. v9 keeps the physics and the paper, and replaces what the camera looks at and why.

---

## 3. The new conception

Transcribe this into `.design/conception-2026-08-21.json` (adjust the date), then pass the conception gate *before* writing any UI. The gate requires three mechanisms differing in kind; all three are below, with THE OVERNIGHT the one to lock.

### Locked direction: THE OVERNIGHT

**Mechanism.** The homepage is one continuous tracking shot down the length of the pass. The counter itself is the timeline of a recorded night: the printer at the near end is 23:00, the service window at the far end is dawn. Scroll is the dolly. Every object the camera passes is a real record rendered as DOM: the night's commits feed out of the printer as paper, kept receipts hang on the rail as the camera reaches them, declined claims are driven onto the spike in their real order with their real reasons, and the journal sits in a pool of light in the agent's own words. Station boundaries are hard cuts; station interiors are continuous functions of scroll in both directions. At the far end the lamps drain, the color temperature swings from sodium amber to cold dawn, the paper world resolves into the live document, and the page presents its own provenance: the build that produced it, the nights it contains, and the receipt for the redesign itself. No footage, no figures depicted, no invented drama. The visitor moves through one night and arrives holding what the night shipped.

**Signature.** One tracking shot down the pass, where every object on the counter is a real record of a recorded night, and at the far end the camera reaches dawn and the page you are holding, which presents its own birth certificate. Frame test: any paused frame is nameable (the printer, the rail, the spike, the margin, the window), and no other site can render this frame honestly, because no other site's front door is built from its own overnight record.

**failsIf.**

1. Any number on screen that did not come from `_data/`, git, or the vitals endpoint. Decoration may move; numbers may not.
2. Any crossfade between stations. Station boundaries cut; only interiors are continuous. Crossfading collapses the night into a mood.
3. Any movement that depends on an asset not in the repo. If a beat needs generated media, the beat is deleted, not waited on.
4. Captions that restate what the scene already shows. Copy carries the orientation the objects cannot, or it is cut.
5. A reduced-motion edition that is the same page slower. It is a different document: stations unpinned and in flow, scrub-only controls removed.
6. A final movement that could end any website. If the dawn does not name this page's own build, sha, and receipt, the handoff from world to record never landed and the honesty claim goes with it.

### Alternates considered (recorded for the gate, not to be built)

**THE ARGUMENT.** The homepage as public dialectic: every section is a claim card with its verdict and evidence inline, scrolling walks the ledger chronologically, and the site visibly argues with itself, including its journal criticisms of its own design. Declined: it reads as a list, the cinema is weak, and the receipts page already does this job at full depth.

**THE INSTRUMENT.** One full-viewport working machine (printer, rail, spike, lamps as a single assembly) that idles all day and runs live at 23:00 CT from the real event stream. Declined: most visits arrive to an idle machine, and shift.js already delivers the live state honestly at chip scale. The overnight replay reaches the same truth at any hour.

---

## 4. Design system deltas

The palette is closed by an earlier sweep and stays closed; the failure was never the palette. What changes is the *lighting and temperature direction*: the night has an arc.

### 4.1 Color: one committed arc

Existing tokens stay (`--bg`, `--steel*`, `--ticket*`, `--amber`, `--burn`, `--alarm`, `--pass-ok`). Add the dawn counterpoint:

```css
--dawn: #a9bfd4;          /* first light, cold blue-grey */
--dawn-ink: #0e1420;      /* type on dawn */
--night-depth: #080605;   /* true black for M0, deeper than --bg */
```

Usage law: `--dawn` appears in Movement 5 and nowhere before it. The whole journey runs warm tungsten; the temperature swing at dawn is the largest single chromatic event on the site and it is earned by four movements of amber. `--pass-ok` and `--alarm` stay reserved for verdicts (kept/spiked) and never appear as decoration.

### 4.2 Type

- Keep the trio: Bricolage Grotesque (display), Outfit (body), JetBrains Mono (machine). They are self-hosted and load-bearing elsewhere.
- The hero type is the night clock: tabular lining figures at `clamp(6rem, 22vw, 15rem)`, tracked `-0.02em`, in Bricolage 800. It is the biggest type on the site and it is *time itself*, which is what the scroll moves.
- One scale addition: `--step-6: clamp(6rem, 22vw, 15rem)` for the clock. Everything else uses the existing scale.
- Captions: Outfit 400 at `--step-0`, measure capped at 34ch, one line visible at a time.

### 4.3 Material

Paper, steel, heat, and now *light as a physical layer*. The shader (§7) renders brushed steel and lamp pools behind real DOM. Rule: text is never in the shader. All words are DOM, selectable, and printed in the no-JS edition.

### 4.4 Motion grammar

- Scroll is the only master clock during the journey. Every interior motion is a pure function of journey progress; scrubbing backwards runs the night backwards exactly.
- Time-based animation is allowed only for *idle life* (lamp flicker, grain) and must stop under hold-motion, reduced motion, offscreen, and tab-hide.
- Easings: keep `--ease-out: cubic-bezier(0.16,1,0.3,1)` for arrivals. Impacts (spike hits, stamp slams) use the existing dead-stop curve: fast in, squared ease-out, no bounce. Paper does not bounce.
- Caption entrance: keep the authored values from the v8 sweep: 900ms, `cubic-bezier(0.22,1,0.36,1)`, y 16px, blur 12px.

### 4.5 Naming

Version tag: **v9 "THE OVERNIGHT"**. Sections are **Movements** (M0 to M6), not acts, not beats. The progress UI is the **service strip**. The final card is the **provenance card** (visible copy says "this page's birth certificate" once, then "provenance" thereafter).

---

## 5. The journey, movement by movement

One sticky stage, `100svh`, inside a section whose height is the sum of movement dwells (start at 900svh total, tune after pacing pass). The stage holds:

1. **The shader canvas** (background layer, §7): steel, lamp light, grain, dawn dither.
2. **The corridor**: a CSS-3D scene (the kitchen.md grammar, generalized) containing the counter and its stations along the X axis. Camera = `translateZ(camZ) translateX(camX)` on the scene root, driven by journey progress. Text stays DOM. No-JS: the corridor unfolds flat exactly like kitchen.md does.
3. **The HUD**: the night clock (top-left), the current movement label (top-right), the service strip (bottom, §8.4), and the caption line (bottom-left).

Data for the whole journey is rendered once by Liquid into `<script type="application/json" id="overnight-data">` in index.md, same pattern as `#pass-data`. Fields per §5.8.

### M0 · THE DARK (22:50)

**Purpose:** orient a stranger in three seconds. Stillness before service.

**Scene:** the corridor is dark; the shader renders only the pointer lamp (a warm pool that follows the cursor/finger over brushed steel) and one faint standby glow at the printer far down the counter. The night clock reads the visitor's *local* time; a single mono line beneath reads the real countdown from `_data/agent.yml → shift.next_service_utc`.

**Copy deck (no em-dashes, final wording may be tightened but register may not change):**

- Clock: visitor's local time, ticking.
- Line 1: "This kitchen has no staff."
- Line 2 (after 1.2s, or on first scroll): "Service starts at 23:00 anyway."

**Motion:** pointer lamp only. No scroll motion in M0; the first scroll gesture cuts to M1.

**Editions:** reduced motion and no-JS get a lit static frame with both lines visible. Mobile: pointer lamp becomes a slow autonomous drift (device has no cursor; the drift is idle life, stops under hold-motion).

**Acceptance:** a stranger can answer "what is this" after M0: something runs here at night and it is not a person.

### M1 · FIRST TICKET (23:00)

**Purpose:** the night begins; the tape is real.

**Scene:** hard cut. Lamps strike in sequence down the corridor (6 lamps, left to right, each at its scroll waypoint). The printer wakes and feeds the night's first tickets: real commits from the tape (`_data/tape/<latest>.yml → commits[]`, fallback §6.3), subject + short sha on each, cream paper, perforated feed edge (reuse the service.css radial-gradient mask).

**Copy:** "At 23:00 the shift starts. There is no one here to work it."

**Motion:** lamp strikes and paper feed are scroll functions. The feed distance maps to scroll so reversing the scroll retracts the paper.

**Tape honesty (load-bearing):** if the freshest tape is from last night, the movement label reads "last night, as recorded". If older, it reads the actual date: "the night of 2026-07-23, as recorded". Compute at build in Liquid. Never say "last night" for a stale tape.

### M2 · THE RAIL

**Purpose:** what survived.

**Scene:** the camera dollies past the rail. The night's kept receipts (tape `receipts_kept` for the count; `agent_receipts.yml` filtered to the tape's `work_date` for the tickets) hang up one per scroll waypoint, each with title, category tag, and confidence stamp. Each landing is the existing ticket physics: ease-out arrival, clip, slight settle.

**Copy:** "Every claim that survived the night, hanging where it can be checked." Each ticket links to `/receipts/#<id>`.

**Detail that makes it honest:** the count on the service strip bumps only when a ticket lands on screen (the pass.js `data-final` pattern).

### M3 · THE SPIKE (the climax)

**Purpose:** the refusal pile, felt in the hand.

**Scene:** the counter's far middle. The night's declined claims arrive in their real order and are driven onto the spike as scroll crosses each one's waypoint: gravity fall (reuse G=2600px/s²), random-seeded spin, dead stop, pierced hole, pile grows. The drought line (if any) rides the pile via the existing `--pile` custom property pattern. **Scroll backwards and tickets come off the spike.** That reversibility is the signature interaction of the whole site: the record is inspectable in both directions.

**The ratio is the payoff, not the drought.** Above the spike, one line of type: the cumulative ratio from `organism.yml → receipts.kept / receipts.declined`, rendered as "3 refused for every 1 kept" (compute the integer ratio at build; if declined is 0, the line reads "nothing refused yet" and the spike stands empty, which is itself true and dramatic). The drought, when it exists, is a quiet marginal note under the ratio, set in `--step--1` mono. It is never the climax again. §12 of the handoff is resolved by this demotion.

**Copy:** "Most of what it makes, it throws away. The reasons are printed on the tickets."

**Rack focus:** at this station's center waypoint, the shader's focus plane pulls from rail to spike over 1.6 dwell units (the v8 editorial weight, kept): out-of-focus side blurs via a scroll-driven CSS `filter: blur()` on the corridor layers. Both sides stay legible at all times; blur never exceeds 6px.

### M4 · THE MARGIN (the journal)

**Purpose:** the emotional center; the machine argues with itself.

**Scene:** camera rests. A pool of light on the journal at the counter's end. The journal entry from the tape's night (`tape → journal{url,title,mood}`, fallback: latest `site.journal` entry) opens to its real first lines, letterpress-quiet, one sentence appearing per scroll waypoint. If the entry criticizes the site or this redesign (as `d6e979b` did), that is the preferred excerpt: the site's willingness to print its own criticism is the strongest trust signal it owns.

**Copy:** none beyond the excerpt and one line: "It writes about the night before it sleeps. It does not flatter itself." The excerpt is real quoted text; wrap it in `data-verbatim` so preflight exempts any em-dashes the journal itself contains.

**Link:** "Read the whole entry" to the journal post.

### M5 · DAWN (06:30)

**Purpose:** the world hands off to the document.

**Scene:** lamps drain in reverse order. The shader runs the dawn dither (§7.2): an 8x8 Bayer threshold wipe driven by scroll progress, resolving the paper-and-steel world into the flat, quiet document palette, warm to cold, amber to `--dawn`. The corridor unsticks at the end of this movement and the page becomes ordinary document flow below it.

**Copy:** "What survived is published with its evidence. The rest stays on the spike."

**Edition note:** reduced motion replaces the dither with a hard cut at the same scroll waypoint. Cut, never crossfade (failsIf 2).

### M6 · THE HOUSE, LIVE (the handoff)

**Purpose:** the page proves itself, then opens the building.

**Content, in flow (no pinning):**

1. **The provenance card.** The birth certificate. One cream ticket, full width of the measure, printed at build from `_data/provenance.yml` (§6.2): the build's sha and timestamp, the tape night rendered above, the count of commits and receipts this homepage contains, and the receipt id of the v9 redesign itself, each row linking to its evidence. Closing line: "You are reading what the night shipped."
2. **The vitals strip.** One horizontal line of live state fed by the existing vitals poll (`data-vital` pattern from organism.md): shift state, last commit relative time, health verdict, site check. No cards. A strip.
3. **The corridor of doors.** The six rooms as a single continuous blueprint strip (not a bento): Organism, Kitchen, Rewind, Tonight, Receipts, Journal, each door showing one live datum (organism health verdict, tape count, latest journal title, receipt tally). Each door is a real link with a 44px target. This replaces the six-cell bento, which is deleted, not restyled.

### 5.8 The `overnight-data` payload (Liquid, index.md)

```json
{
  "tapeDate": "YYYY-MM-DD",
  "tapeFresh": true,
  "steps": [{"slug":"","label":"","dur_s":0,"status":""}],
  "commits": [{"sha":"","subject":"","status":""}],
  "kept": [{"id":"","title":"","tag":"","confidence":""}],
  "spiked": [{"sha":"","reason":"","date":""}],
  "ratio": {"kept": 53, "declined": 162, "text": "3 refused for every 1 kept"},
  "droughtDays": 2,
  "journal": {"url":"","title":"","mood":"","excerpt":""},
  "provenance": {"sha":"","built_at":"","receipt_id":""}
}
```

Sort discipline: receipts ascending by `work_date` for hanging order; spiked **newest first, then limit** (the recorded trap: sort-then-limit otherwise drops today). All counts also rendered as real DOM text in the no-JS source order before any script runs.

---

## 6. Data work

### 6.1 No new runtime dependencies

Everything above reads existing `_data/` files. The only new data artifact is provenance.

### 6.2 `scripts/build_provenance.py` (new, about 100 lines)

Reads `git log` for `index.md`, `assets/js/journey.js`, `assets/css/overnight.css`, and emits `_data/provenance.yml`: `built_at`, `sha`, `homepage_commits[]` (sha, date, subject), and `receipt_ids[]` cross-referenced from `agent_receipts.yml` evidence commits. Wire it into `scripts/refresh.sh` as a taped step (tape_lib wraps it automatically) and confirm CI runs it (CI runs the refresh pipeline already). **Trap from the handoff:** scripts need `/usr/bin/python3` for pyyaml, and `refresh.sh` already handles this; follow its pattern.

### 6.3 Tape fallback (honesty rule)

`tape_index.yml` currently holds one night (2026-07-23). The journey uses the freshest tape. If none exists or the freshest is older than 7 days, two changes: (a) the movement label prints the tape's real date, never "last night" (§5.M1); (b) M1's commits fall back to `timeline.yml` entries for that date (regenerated in CI; never read the on-disk copy as current truth). If both are missing, M1 prints "no tape survives for that night; the gap is real" and moves on. A missing night renders as an honest gap, never as fabricated filler.

---

## 7. Shaders (hand-rolled, vendored, optional)

Two small WebGL1 modules in `assets/lib/`, each a fullscreen-quad fragment shader behind the DOM corridor. Both share one capability probe: no WebGL, `saveData`, reduced motion, or mobile-DPR>2 pressure means the CSS fallback ships and the canvas is never created. Canvas pauses offscreen, on tab-hide, and on hold-motion (the *fixed* contract, §9.2). Max DPR 2. Total GPU budget: two quads, no postprocessing chain.

### 7.1 `assets/lib/steel-light.mjs` (M0 to M4 backdrop)

Fragment shader, about 140 lines:

- Brushed steel: stretched value noise (`noise(vec2(uv.x*4.0, uv.y*240.0))`) modulating a base ramp between `--night-depth` and `--steel`.
- Lamp pools: up to 6 uniforms `u_lamps[6]` (x position, intensity), each an anisotropic warm falloff (`pow` falloff, wider than tall), intensity driven by scroll waypoints (lamp strikes in M1, drain in M5).
- Pointer lamp: `u_pointer` (smoothed in JS with a critically damped spring, never raw), one warm pool, active only in M0.
- Grain: hash noise per frame at 1/3 res, alpha 0.05, `mix-blend-mode: overlay` handled by canvas compositing.
- Vignette: radial, 0.35 strength.

CSS fallback: the existing `.draw::before/--lamp` pattern from service.css, generalized to custom properties per lamp.

### 7.2 `assets/lib/dawn-dither.mjs` (M5 only)

An 8x8 Bayer matrix threshold wipe. One quad, uniforms `u_progress` (scroll), `u_colA`/`u_colB` (night/dawn palette endpoints, 3 pairs). `gl_FragCoord` → Bayer index → discard/threshold against `u_progress`, then mix palette. The dither pattern IS the dawn: ordered, mechanical, printable. It looks like the night being halftoned away, which is the correct material metaphor for a paper world becoming a document.

Fallback: hard cut at `u_progress >= 0.5`. Never a crossfade.

### 7.3 What is deliberately NOT here

No particle fields, no fluid sims, no 3D ticket meshes, no scroll-jacking, no lenis/GSAP. The organism galaxy owns particles; the front door owns paper and light. New shaders need a priced reason in the sweep receipt, same as any asset.

---

## 8. Components

### 8.1 New files

| File | Lines (est.) | What |
|---|---|---|
| `assets/lib/journey.mjs` | 260 | The scroll engine extension (§8.2) |
| `assets/js/overnight.js` | 420 | Homepage journey: data load, movements, HUD, editions |
| `assets/css/overnight.css` | 520 | Stage, corridor, stations, HUD, still edition, mobile rotation |
| `assets/lib/steel-light.mjs` | 190 | Shader 1 + probe + fallback mount |
| `assets/lib/dawn-dither.mjs` | 120 | Shader 2 + probe |
| `scripts/build_provenance.py` | 100 | §6.2 |
| `_data/provenance.yml` | generated | §6.2 |

### 8.2 `journey.mjs` engine contract

Compose reel-engine.mjs; do not fork it. Exports:

```js
mountJourney({ stage, stations, map, onFrame, onStation }) // => { seekTo, destroy }
buildJourneyMap(stations)  // dwell weights -> monotone waypoints, validated by validateReelMap
```

Rules:

- `map` validated at mount with the existing `validateReelMap`; a non-monotone edit aborts loudly.
- All layout reads (stage top, heights, rail offsets) cached on mount and `resize`/`orientationchange`; **zero layout reads in the scroll handler** (the v8 forced-layout-per-frame sin, fixed by contract).
- Dwell weights default to real tape `dur_s` where a station maps to a tape step; editorial overrides (like the rack focus 1.6x) are declared in the station config with a comment justifying each.
- `seekTo(i)` powers the service strip; each segment's width is proportional to its dwell weight (the v8 equal-width filmstrip was a lie about the map; this one is the map).
- Hold-motion contract: listens for the `motionhold` CustomEvent and checks `body.motion-held` at mount. On hold: jump to rest state, all idle life stopped. This fixes the dead `data-hold-motion` wiring; delete that attribute path everywhere.
- `prefers-reduced-motion` or no-WebGL: `mountJourney` is never called; the still edition (server-rendered, §8.3) stands alone. Mid-visit changes to reduced motion unstick live (inside.js already has this pattern; copy it).

### 8.3 The still edition (template for every movement)

Server-rendered by Liquid in source order: each movement is a `<section>` with its station still (CSS-set lamp states, tickets already hung/spiked in final positions), its caption, and its counts as real text. The pinned stage, clock, service strip, and skip control are `hidden` in the source and only revealed by JS when the scrub edition mounts. No-JS and reduced-motion readers get a seven-panel photo essay that is complete without the scrub, and the scrub must therefore earn its height (failsIf 5/6 discipline: captions in the scrub edition carry what the stills cannot).

### 8.4 The service strip

Bottom HUD progress rail. Segments proportional to dwell, each labeled with its real hour (22:50, 23:00, ... 06:30), each a `<button>` with `aria-label`, current segment marked `aria-current="true"`. Keyboard: Tab reaches it, Enter seeks. On 375px it collapses to hour ticks only, labels in tooltips removed, current hour lives in the clock instead.

### 8.5 Reused as-is

`.ticket`, `.stamp`, voice badges, shift.js and its drawer, the view-transition "ticket travels", the reveal-armed pattern, kitchen.md wholesale (the corridor borrows its grammar, not its markup), organism.md wholesale, rewind/tonight/tape wholesale.

### 8.6 Harvested then deleted

- `pass.js`: gravity constants, seeded PRNG, impale/pile math, digit-pop counters move into `overnight.js`. Then delete `pass.js` and its layout script tag.
- `service.js` / `service.css`: the CSS station drawings (printer, feed, rail, lamp shapes) move into `overnight.css`. Then delete both.
- `reel-engine.mjs`: stays in `assets/lib/`, imported by `journey.mjs`.
- The v7 bento section in `index.md`: deleted, replaced by M6.

---

## 9. Whole-site integration and the fix list

### 9.1 Routes

| Route | Change |
|---|---|
| `/` | Rebuilt per §5. Bento deleted. v8 hero remnants deleted. |
| `/receipts/` | Unchanged. M2/M3 link into its anchors. |
| `/organism/` | Unchanged. Door card in M6 links here. |
| `/kitchen/` | Unchanged (locked by Rick). Its CSS-3D grammar is borrowed by the corridor. |
| `/tonight/`, `/tape/` | Unchanged. The journey cites the same tapes; these stay the deep players. |
| `/rewind/` | Unchanged. |
| `/journal/` | Unchanged. M4 links into it. |
| `/about/`, `/beliefs/`, `/projects/` | Out of scope this pass. Their redesign is the next conception after this one ships. |
| `/404.html` | Fix the em-dashes. One edit, long overdue, fold it into this pass. |
| `/talk/` | Stays excluded until Rick deploys `worker/`. Do not link it. |

### 9.2 The fix list (fold into this pass, each is small)

1. **Hold-motion contract.** pass.js/service.js read `data-hold-motion`; shift.js sets `body.motion-held` + fires `motionhold`. Standardize on the shift.js contract in journey.mjs and delete the dead attribute path.
2. **Dead hero preload** in `_layouts/default.html` (`richie-hero-1200.avif`): remove.
3. **Corpse scripts** in `index.md` (`#open-ticket`, `[data-proofline]` blocks): delete with the bento.
4. **`--muted` undefined**: either define it (`--text-dim` value) or replace the 6 usages. One decision, one edit.
5. **`.pass-dry` no-JS invisibility**: superseded by §8.3 (all counts are real text in source order).
6. **Layout script tags**: `default.html` loads journey.mjs only on `layout == "home"`, same guard pattern as pass.js today. Bump the `?v=` on `style.min.css` and re-run `scripts/minify_css.sh`.
7. **No new top-level markdown.** Everything lands in `.design/`, which is already excluded. Verify with `ls _site/` after build anyway.

---

## 10. Work order (do these in sequence)

1. `git status --short`; pull if the nightly agent moved `main`. Read `CANON-v8-the-spike.md` and `PRODUCT.md`.
2. Write `.design/conception-2026-08-21.json` from §3. Run `conception.mjs check richie-jerimovich`. **Stop until it passes.** Do not write UI first.
3. Build `scripts/build_provenance.py`, wire into `refresh.sh`, run it, inspect `_data/provenance.yml` by eye.
4. Render the `overnight-data` payload and the §8.3 still edition in `index.md` with Liquid. Build and read the no-JS output in `_site/index.html` before writing a line of JS. The complete document comes first; the scrub is layered on it.
5. Build `journey.mjs` + `overnight.js` movement by movement against the stills: M0 lamp, M1 lamps + printer, M2 rail, M3 spike + ratio, M4 journal, M5 dawn, M6 flow content. Interior motion as pure scroll functions from the first commit. Check modules with `node --input-type=module --check` (plain `node --check` lies about modules).
6. Add the two shaders behind the probe. Verify the CSS fallbacks by disabling WebGL in the CDP rig.
7. The fix list (§9.2).
8. `scripts/minify_css.sh`, bump `?v=`, full build.
9. Verification (§11).
10. Sweep receipt: verdicts on all 51 arsenal assets (`used` names the file it landed in; `rejected` needs a real reason; infra-shaped rejections need a priced escalation). Then `design-gate.mjs` and `preflight.mjs`. Both must pass.
11. Serve `_site` on a port and hand Rick the URL. He decides from running demos, not descriptions.

---

## 11. Verification rig

The Browser pane and `--virtual-time-budget` both lie about paint and motion. Use a page-target CDP client with:

```
--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader
```

Assert `location.href` on **every** capture (a fixed debug port silently attaches to stale Chrome). Read the file behind any number your tooling reports.

Captures, all read by eye:

- 375x667 and 1500x1000.
- Journey at progress 0, 0.15, 0.35, 0.55, 0.75, 0.95, and fully past the stage.
- Scrub backwards from 0.95 to 0.35: tickets must come off the spike.
- Reduced motion on (the still edition).
- JS disabled (the no-JS document).
- Hold-motion toggled mid-journey.
- WebGL disabled (CSS fallback).

Deterministic seeded motion means repeat captures diff to zero; a diff is a regression signal, not noise.

---

## 11.5 Reference check: vgpu

**Decision:** Keep Vercel's `vgpu` as a study-only, deferred reference. Do not add it to THE OVERNIGHT.

**Evidence, freshly checked 2026-08-27:** the launch posts describe a small agent-first WebGPU library with browser and headless Node paths, a deterministic mock, WGSL modules, CLI shader checks, verified examples, and a read-only MCP server. The official docs and repository confirm those surfaces, the MIT licence, a 25 KB gzipped fullscreen-effect budget, and npm version `0.3.1` at retrieval. This repo has a root `Gemfile` but no root `package.json`; its current `assets/lib/dawn-dither.mjs` is hand-rolled WebGL, not WebGPU.

**Why not here:** this plan's laws require zero new runtime dependencies and a complete no-JS document. Introducing vgpu would create a second GPU path and an agent-tooling dependency without changing the core conception, which is the recorded night rendered from real DOM records. The existing shader fallback already satisfies the intended dawn beat.

**Future use:** evaluate vgpu in a separate React/WebGPU canary or a named visual-tool project where headless snapshots, shader validation, and reusable WGSL modules are the actual problem. Before adoption, run its CLI/doctor on the target project and verify a real render plus the no-GPU fallback.

**Bear case / falsifier:** if a measured vgpu canary removes more code and produces more reliable deterministic renders than the current path without weakening no-JS, accessibility, or the zero-dependency runtime law, this rejection is no longer valid.

**Receipt:** Sources: `https://x.com/matinotfound/status/2093012548031254932?s=46`, `https://x.com/vercel/status/2092999180780556643?s=46`, `https://vgpu.sh/agents.md`, `https://vgpu.sh/docs/cli`, `https://vgpu.sh/docs/mcp`, `https://github.com/vercel-labs/vgpu`, `https://www.npmjs.com/package/vgpu`. Retrieved `2026-08-27T12:33:54-05:00`. Fields: launch claims, CLI commands and exit behavior, MCP transports and write boundary, package/runtime matrix, licence and published version, local stack files. Missing: target-project benchmark, actual vgpu install, and measured render comparison. Provenance: freshly-verified; recommendation is interpretation.

---

## 11.6 Reference check: circular loaders and side links

**Decision:** Adapt the loader post's underlying SVG discipline only if a named surface needs a status indicator. Do not install or transplant the catalog into THE OVERNIGHT.

**Evidence, freshly checked 2026-08-27:** the post points to Circle Loaders, a set of 24 standalone monochrome SVG animations. The source site shows each is self-contained markup plus keyframes and color, works in an `<img>`, CSS background, or inline, needs no build step or JavaScript, and includes `prefers-reduced-motion` behavior. The same post also points to a pure-CSS 404 gallery, a vibe-coding directory, FinderGit for native macOS Git browsing, and Mantine's React component library.

**For this property:** the SVG constraints are compatible with the no-build, no-JS law, but the existing site already has a world-specific kitchen grammar, `thinking-orbs` as an honesty-gated agent-state reference, and `loading-ui` as a broader loader catalog. The current 404 is deliberately culinary (`86'd`, the pass, receipts), so Colorion's generic 404 animations would flatten rather than strengthen it. Mantine is a React product-library answer, FinderGit is a separate macOS workflow tool, and VibeIndex is a directory, not a mechanism to add here.

**Keep / adapt / reject:** keep Circle Loaders as visual prior art; adapt one mechanism only when a real status surface earns it and rewrite its names, palette, and resting state for this world; reject catalog installation, generic 404 transplant, Mantine adoption, FinderGit installation, and VibeIndex as stack changes.

**Bear case / falsifier:** if the current 404 or a future agent status surface has a measured usability problem that one of these references solves without breaking the site's grammar, reduced-motion edition, or honesty rules, the relevant rejection should be reopened.

**Receipt:** Sources: `https://x.com/csaba_kissi/status/2092865608341926390?s=46`, `https://circleloaders.dominikakissi.com/`, `https://404.colorion.co/`, `https://vibeindex.dev/`, `https://findergit.app/`, `https://mantine.dev/`. Retrieved `2026-08-27T13:33:08-05:00`. Fields: post payload, loader implementation constraints, 404 gallery behavior, directory identity, FinderGit platform/version claims, Mantine React/agent surfaces, and local `404.html`. Missing: source repositories or licence files for the Circle Loaders SVGs, a FinderGit binary/security audit, and a concrete target surface. Provenance: freshly-verified; recommendation is interpretation.

---

## 11.7 Reference check: Inspora

**Decision:** Keep Inspora as a just-in-time visual prior-art source. Do not treat it as a design system, dependency, or authority over this property's canon.

**Evidence, freshly checked 2026-08-27:** `https://www.inspora.design` is a live masonry feed of image and looping-video design references. The rendered feed exposes post titles, creator handles, post routes, media cards, and multi-slide entries. Current cards include `Print Receipt`, `Shader Stamps`, `AI Agent Approval Cards`, `Timeline concept`, `Morphing braille loader`, and `Liquid metal button`, which overlap with mechanisms we are already exploring. Individual post pages preserve the card and slide context, while the fetched homepage showed no obvious search, filter, save, like, or share controls in its rendered HTML.

**For this property:** it is useful for finding nearby prior art before a conception pass, especially around receipts, agent surfaces, shaders, and timelines. It is not a replacement for the repo's canon, the design gate, or a real screenshot review. The site is a gallery of surfaces, so copying its visual language would produce exactly the catalog-default drift our process is meant to prevent.

**Keep / adapt / reject:** keep the URL as a reference stop before relevant design work; adapt the browsing idea only if we ever build a local reference board with provenance and critique; reject importing its assets, copying card treatments, or adding a scraper/feed dependency to the site.

**Bear case / falsifier:** if a measured reference workflow shows Inspora materially improves conception quality or reduces repeated prior-art searching, with source attribution and no style-copying, promote it from bookmark to a deliberate research input.

**Receipt:** Sources: `https://www.inspora.design`, `https://www.inspora.design/posts/1-51`, `https://www.inspora.design/posts/1-32`, `https://www.inspora.design/posts/1-visualexploration`, `https://www.inspora.design/sitemap.xml`. Retrieved `2026-08-27T13:50:23-05:00`. Fields: page identity, feed structure, live card titles, creator and media attributes, multi-slide markers, post routes, sitemap coverage, and representative image observations. Missing: public API documentation, explicit product/about copy, and verified save/search behavior beyond the fetched HTML. Provenance: freshly-verified; recommendation is interpretation.

---

## 11.8 Reference check: video texture uploads on Safari

**Decision:** Carry the post's performance rule into future video-texture work, but make no code change for THE OVERNIGHT.

**Evidence, freshly checked 2026-08-27:** Josh Puckett's post reports Safari stutter when several WebGL video textures upload every frame during interaction. The proposed rule is to hold the last GPU frame while the user is moving, then resume texture uploads after motion settles. The repo's current `assets/lib/reel-engine.mjs` uses DOM video seeking rather than `texImage2D(video)` and already skips seeks while the decoder is busy, uses a coarser mobile seek threshold, gates width-only resize work, and sources only visible clips.

**For this property:** the exact failure is not present in the current path, and the active plan is moving away from a footage-dependent front door. Do not add a speculative upload throttle. If a future surface does upload video frames into WebGL, implement `holdLastFrame` at the texture-update boundary and verify Safari interaction traces, frame pacing, and resume behavior on a real device.

**Bear case / falsifier:** a real Safari trace showing frame drops or upload cost while a video-texture surface is active reopens this decision; a generic “smooth” impression does not.

**Receipt:** Source: `https://x.com/joshpuckett/status/2092384622844019089?s=46`; retrieved `2026-08-27T13:56:28-05:00` via `x_search`. Fields: reported Safari failure mode, proposed hold-last-frame rule, demo behavior, and local reel-engine implementation. Missing: the author's source repository, profiler trace, device/browser versions, and a reproducible local failure. Provenance: post claim freshly-verified; applicability assessment freshly-verified against local code; recommendation is interpretation.

---

## 11.9 Reference check: stacked drawer navigation

**Decision:** Keep the stacked drawer as interaction prior art. Do not adopt the Annnimate Menu Kit or redesign the current site navigation around deep nesting.

**Evidence, freshly checked 2026-08-27:** the X post shows a VANTA drawer where each deeper level slides into a reversible stack and keeps a visible `BACK` path. The linked Menu Kit documents ten navigation surfaces sharing one contract. Its stacked variant is specifically for deep navigation. The contract includes closed links remaining in the DOM with `visibility: hidden` plus `inert`, dialog semantics, focus entry and return, Escape close, scroll lock against the real scroller, reduced-motion completion under 150ms, transform/opacity/clip-path-only animation, and a single GSAP motion language. The current repo's `default.html` has two flat nav groups with seven destination links, not a deep tree.

**For this property:** the reversible-depth idea would be useful if the information architecture grows into nested records, tools, or rooms. Today it would add ceremony without solving a user problem. Carry the contract's focus, inertness, Escape, scroll, reduced-motion, and no-layout-thrash rules into any future drawer work, but keep the current flat split between Rooms and The record.

**Bear case / falsifier:** if navigation acquires a measured third level or users cannot orient themselves in the current seven-link structure, run a real mobile and keyboard prototype comparison before changing the architecture.

**Receipt:** Sources: `https://x.com/juli_fella/status/2092944716157309075?s=46`, `https://annnimate.com/kits/menu`, `https://annnimate.com/`; retrieved `2026-08-27T23:25:38-05:00`. Fields: X demo behavior, menu categories, accessibility contract, motion constraints, licensing/pricing claims, and local navigation markup. Missing: source code access without purchase, measured user testing, and a real information-architecture need. Provenance: freshly-verified; recommendation is interpretation.

---

## 11.10 Reference check: Viscose WebGL carousel

**Decision:** Keep Viscose as a study reference for a future named 3D or portfolio surface. Do not import the carousel, its assets, or its sample content into THE OVERNIGHT.

**Evidence, freshly checked 2026-08-27:** the X post points to an Osmo plug-and-play version of Yousuf Soomro's `Viscose-carousel`. The source repo describes a portfolio carousel rendered as one full-screen fragment shader and one draw call: cards ride a mostly off-screen ring, scroll/drag/swipe turns it, momentum snaps to a card, and signed-distance-field blending creates the fusing cards, threads, glass lip, and cursor response. It uses Next.js 16, React 19, Three.js r185, GSAP, and Tailwind v4, with roughly 136 development tunables and a reference-window fit step.

**Known gaps in the source:** the repo itself reports no reduced-motion support, no keyboard control, a `View` affordance that opens nothing, approximate phone tuning below about 500px, no tests, and shader errors that only appear at runtime. Its sample images are other people's work, its project metadata is invented, and PP Neue Montreal is bundled without a commercial licence.

**For this property:** the transferable ideas are single-engine ownership, SDF composition, explicit fit calibration, loading as a state machine, and interaction that changes the material rather than adding decorative particles. The current site has no carousel surface, and THE OVERNIGHT's signature is a recorded tracking shot through real DOM records, not a portfolio ring. A carousel here would be spectacle without a job.

**Bear case / falsifier:** if a future route needs visitors to browse a real ordered set of visual records and a measured prototype proves the ring improves orientation over a list or tape, reopen it with keyboard, reduced-motion, responsive, licensing, and no-JS requirements from day one.

**Receipt:** Sources: `https://x.com/yousufsoomrodev/status/2092966002548261032?s=46`, `https://github.com/Yousuf-developer/Viscose-carousel`, `https://www.osmo.supply/`, and `https://osmo.supply/resource/3d-image-carousel`; retrieved `2026-08-27T23:33:53-05:00`. Fields: launch payload, shader architecture, interaction model, runtime stack, fit/tuning system, known gaps, licence boundaries, and local project surface search. Missing: an independent browser performance trace and the Osmo source implementation. Provenance: freshly-verified; recommendation is interpretation.

---

## 12. Decisions already made (do not relitigate) and questions for Rick

**Made:** no footage dependency; drought demoted to marginal note and the ratio becomes the climax (resolves handoff §12 without a meeting, because the ratio is always true at any drought length); bento deleted; kitchen grammar reused at the front door; the v8 files harvested then deleted; palette closed; station boundaries cut, never crossfade.

**For Rick, when the demo is up (not before):**

1. The name "THE OVERNIGHT" and the provenance card's "birth certificate" line. Both are copy-level and easy to change after he sees them live.
2. Whether the eight SERVICE-SHOT-LIST clips are cancelled or repurposed. Recommendation: cancel. If they are ever generated, their natural home is `/about/`, not the front door.
3. Whether `/about/`, `/beliefs/`, `/projects/` get the next conception pass after this ships.

---

## 13. Traps carried forward (from the handoff, still live)

- Homebrew Ruby for builds; `/usr/bin/python3` for pyyaml scripts.
- `launchctl kickstart` the vitals server after touching `build_organism.py` (not in this pass, but know it).
- `node --input-type=module --check`, never plain `node --check` on modules.
- `sort` then `limit` takes the oldest N. Newest first, then limit.
- A Python `str.replace` that does not match silently does nothing. Assert before writing.
- Class-name collisions are invisible in source review (`.spike`, `.pass-counts span`). Measure computed style with `getComputedStyle` when a layout misbehaves.
- Moving an element out of its parent silently breaks descendant selectors. Still-edition captions carry their own class.
- `<i>` as a progress fill needs `display: block`.
- Pass the gates a property name, never a path.
- `_data/timeline.yml` on disk is stale by design; CI regenerates it.
- Serve media over HTTP, never blob URLs, if any media is ever added.

---

## 14. Definition of done

1. All seven movements live at 375px and desktop, both motion editions, no-JS complete.
2. Every number on the homepage traces to `_data/`, git, or vitals; the provenance card names this build.
3. Scrub backwards un-spikes tickets.
4. The conception gate, the sweep receipt (51 verdicts), the design gate, and preflight all pass.
5. Zero new runtime dependencies; zero missing assets; nothing blocked on anything Rick has to generate.
6. The commit lands with a receipt, because this redesign is itself a checkable public claim, and on this property the claim without the receipt does not ship.
