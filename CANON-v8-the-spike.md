# agentrichie.com · CANON v8 "THE SPIKE"

Written 2026-08-17. Picked by Rick from three live conceptions
(`~/workspace/hero-demos/richie-index.html`): THE SPIKE, whole site ground up,
kitchen survives.

**Status of v7 "The Pass"** (2026-07-17, `assets/style.css` header): the *world*
survives and is not re-litigated. The *front door* is dead. v7 built a real
kitchen and then put a photograph of a kitchen in front of it. This document
supersedes v7 only where §7 says so; everything not listed there stands.

---

## 0. THE ONE SENTENCE

> This site refused three claims for every one it published, and it will show
> you that happening rather than tell you the ratio.

---

## 1. THE FACT THE DESIGN IS BUILT ON

Read from `git log`, `_data/agent_receipts.yml`, `_data/agent_receipt_rejections.yml`.
**Regenerate, never retype.** The table below is a dated snapshot, not a constant.

| | at conception (2026-08-17) | verified 2026-08-20 |
|---|---|---|
| commits | 249 | 255 |
| receipts kept | 52 | 53 |
| claims declined | 160 | 162 |
| ruled total | 212 | 215 |
| record opens | 2026-05-25 | 2026-05-25 |
| last claim kept | 2026-08-01 | **2026-08-18** |
| **days since anything cleared** | **16** | **2** |

Two facts, and the second is the one no competitor can copy:

1. **The refusal ratio is the product.** 162 declined against 53 kept, roughly
   three to one. Every decline carries the commit and the sentence that killed
   it, and the reason strings are overwhelmingly distinct, so this is judgment
   rather than a rule firing.
2. **The record is live and it moves under the design.** See below.

**Law: the drought is live, not a constant.** Every surface computes it from
`last_keep` at build. The day a receipt clears, the site says so on its own.

**This law was tested in production between conception and the first build, and
it held.** The conception was written on a 16-day drought and treated that
number as the climax of Act 0. On 2026-08-18 the nightly agent found internal
planning documents answering HTTP 200 on the public site, excluded them, and
published `ar-2026-08-18-exclude-internal-planning-docs`. That broke a 17-day
dry spell. No file was edited: the next build read `last_keep` and the homepage
went from "16" to "2" by itself.

**The unresolved consequence, and it is a real design problem.** A drought is
only dramatic while it lasts. "16 days since anything cleared" indicts; "2 days"
is just a healthy Tuesday, and Act 0 currently ends on it with the same
typographic weight either way. The payoff is therefore volatile in a way the
conception did not anticipate. Act 0 is NOT finished until the non-drought case
has its own honest climax. Options, none picked:

- Swing to the ratio when the drought is short ("three refused for every one
  kept" is always true), and to the drought only when it exceeds a threshold.
- Make the number's treatment scale with its own size, so the design says
  quietly what is quiet and loudly what is loud.
- Show both permanently and let the drought be the smaller of the two.

---

## 2. REGISTER

**WORLD.** Governed by `benchmark/02-doctrine.md` plus this file plus
`PRODUCT.md`. Diegetic labels, section numbering, stamps and hand-rolled SVG
figures are *mandatory here*, not optional. The `design-taste-frontend` PRODUCT
chain does not apply to any surface in this repo. Declared once, here, so no
later surface has to re-argue it.

---

## 3. THE SIGNATURE MECHANISM

**The pass runs in front of you, and most of what it makes is destroyed.**

Real tickets print from the record onto thermal stock, get ruled, and are driven
onto a steel spike. What survives climbs to the rail. Counters are fed by what
actually landed on screen, so the readout cannot drift from the animation.

**The removal test, which this exists to pass:** delete the mechanism and the
page can no longer say that refusal is the product. The current hero fails this
test: delete its photograph and nothing the page argues changes.

**Laws on the mechanism:**

- One ticket on the pass at a time. The gap between tickets is the beat a ruling
  takes, never a stagger chosen to look busy.
- It ends. It is not an idle loop. It runs once, rests on the live state, and
  the reduced-motion edition goes straight to the resting frame.
- It is skippable with one obvious control, and it never gates content.
- Nothing on it is invented. A ticket that cannot cite a sha does not print.
- It must never be the most interesting thing on the site. If it is, the rest of
  the site is the problem.

**Fingerprint fence.** The thermal print-in already exists here
(`.open-ticket`) and in `nothings-wrong/components/ThermalFigure.tsx`. THE SPIKE
supersedes the local one rather than running beside it: one printer in this
world, not two.

---

## 4. THE SITE AS ONE ARGUMENT

Ground-up means every route earns a position in one sequence, not a nav of
documents. The 2026-07-28 review scored the gap between the best and worst page
here at ~25 points and found the nav pointed at the wrong end. That is the thing
being fixed.

| Act | Surface | The beat it owns |
|---|---|---|
| 0 | `/` opening | The pass runs. Refusal is enacted. Ends on the live drought. |
| 1 | `/` rail | What survived, and what it cost to survive. |
| 2 | `/receipts/` | The ledger and the spike, both public, reason attached. |
| 3 | `/changelog/` `/rewind/` | The record is continuous and you can move through it. |
| 4 | `/tonight/` `/kitchen/` `/inside/` | The room the work happens in. Already strong; brought into the nav. |
| 5 | `/organism/` | The system's own vitals. Already the flagship at ~90. |
| 6 | `/about/` `/beliefs/` `/projects/` | The three ~65s. Excellent copy, zero form. Given form. |

---

## 5. HOUSE LAWS (carried, non-negotiable)

1. **No fake metrics.** Every number is read from a real file at build or is
   labelled illustrative. Random-walk JS is banned.
2. **No em-dashes in visible copy.** Commit subjects quoted verbatim are the one
   exception and are marked as quotations.
3. **Register: clinical, precise, never fabricating, never purple.**
4. **375px is the native frame.** Portrait composed first, not adapted after.
5. **Reduced motion is an edition, not an apology.** Every mechanism ships one.
6. **The complete document survives no-JS.**
7. **Nothing third-party at runtime.** Fonts stay self-hosted; `/privacy/` says
   so and must stay true.

---

## 6. WHAT MUST NOT BREAK

From v7 and the Jul 23 world systems, all still load-bearing:

- The spike on `/receipts/` (THE SPIKE promotes it, does not replace it)
- The rail, the brigade badges, honest snapshot labelling
- Service Tape → `/tonight/` and `/tape/`; the 23:00 CT cron config is LOCKED
- Live Shift (`shift.js`), `/rewind/`, the CSS-3D `/kitchen/`
- `scripts/build_timeline.py` and the self-documenting `/changelog/`
- `launchd com.agentrichie.vitals-server` must be kickstarted after any
  `build_organism.py` change

---

## 7. WHAT DIES

- `assets/richie-hero-*.{jpg,avif}` as a hero. The photograph argues nothing.
  (Files stay in the repo; Rick has asked before that unused hero art not be
  deleted.)
- The `.hero-media` scrim stack, the two-pill `.hero-actions` row, and the
  static `.hero-proof` triple.
- The homepage expo-board bento of six eyebrow-labelled cards. Eyebrow-on-every-
  cell plus bento-as-a-shape is two hits on the anti-slop list, which is a
  redesign trigger, not a restyle.
- `.open-ticket` in its v7 form, folded into THE SPIKE.

---

## 8. BUILD ORDER AND GATES

**Blocking before any front-end file lands:** the sweep receipt at
`.design/sweep-2026-08-01-fbdd10b9.json` is stale (taken over inventory
`42862d93d50da344`, current is `5c7191d07bae0b98`) and 6 assets are unruled:
`fudge-design-md`, `marketingskills`, `mengto-sketchbook`, `pixel2motion`,
`pringles-reference`, `reference-captures`. Re-scaffold and rule before Act 0
commits. The ceiling rule applies: an infra-shaped rejection needs a priced
escalation, not a verdict.

1. Fresh sweep receipt + preflight clean
2. Act 0 built against the real data pipeline, verified with the CDP rig at
   1500px and 375px, both motion editions
3. Act 1, then the nav re-pointed at the rooms
4. Acts 2 to 6 in order, each with its own receipt

**Verification is not "it renders."** Screenshots get read, not just taken. The
Browser pane and `--virtual-time-budget` both lie about paint and motion; use
the real CDP driver.
