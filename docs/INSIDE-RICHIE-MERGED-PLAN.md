# The Night Shift: Inside Richie — Merged Build Plan

*Synthesis of the Kimi report (`RICHIE-WORLD-CHANGE-REPORT.md`) and the Codex report (`RICHIE-CINEMATIC-EXPERIENCE-AUDIT.md`), 2026-07-21. This is the middle ground we are building.*

## The merge decisions

| Question | Kimi said | Codex said | **We build** |
|---|---|---|---|
| Where does the journey live? | Journey IS the homepage | Separate `/inside/` route, promote after testing | **`/inside/` vertical slice first** (safer, testable), homepage keeps a door into it. Promote later. |
| Narrative spine | Five acts of place (door → kitchen → machine → council → dawn) | One real task, start to receipt, with a failure beat | **One real night, one real task.** The places become the scenes the task travels through. Codex's failure beat ("the cost") is in — it's the emotional core. |
| The five voices | Council chamber scene with real journal lines | Five pressures as spatial behaviors inside the ask scene, no biography cards | **Pressures-in-action during the Ask scene** (Codex), with each line linked to a real journal entry (Kimi). No avatar heads. |
| The ending | Dawn + "he's awake, talk to him" | The turn: Richie notices the visitor, then choose-your-door | **The turn.** Room settles, Richie addresses the visitor in text, then doors: journal / organism / receipts / source / (talk when deployed). |
| Tech stack | GSAP + Lenis + shaders | GSAP ScrollTrigger, keep Jekyll, no migration | **Zero new runtime dependencies.** Vanilla JS orchestrator (IntersectionObserver + rAF scroll-scrub), CSS transforms, existing Three.js stays on /organism/ only. Native scroll, never scroll-jacked. Earns the "no new dependency unless it earns a beat" kill-list rule. |
| Data | Every frame bound to real data | `build_experience.py` → canonical `experience.json`, fixes content drift | **Codex's pipeline.** Scene content generated from `_data/` (timeline, receipts, journal eras) so the film can't drift from the truth. |
| The metaphors | One building, two floors — descend from kitchen to machine | Kitchen = world, mind = POV, pass = moral ending | Same idea, merged: the visitor descends from the room into perception and comes back up at the pass with a receipt in hand. |
| Talk page | Ship it, it's built | It's not ready — stale pre-v7 CSS tokens, refactor first | **Codex is right.** Refactor to v7 tokens now, keep excluded until the Worker deploys + abuse test. |

## What we steal from Codex outright

1. **First-person cinema, not an avatar.** The browser is Richie's perceptual field. No character art of "Richie" on screen.
2. **The failure beat.** Sound drops, rhythm breaks, the system names what it doesn't know. No fake drama — a real sanitized failure from the record.
3. **The reveal-system bug fix** — `.reveal` starts at `opacity: 0`; if JS dies after `<html>` gets `.js`, whole sections stay invisible. Content visible by default; motion opts in.
4. **Truth repairs:** `projects.md` says 3 public surfaces but renders 4; podcast card demote; `beliefs.md` is stale vs the July journal; move project facts to `_data/projects.yml`.
5. **IP guardrail:** original voices/motifs only. No actor likeness, no cloned voices, no show footage or music. This shapes the asset prompts.
6. **The kill list** (adopted whole): no scroll-jacking, no unskippable intro, no autoplay sound, no fake terminal output, no particle field that doesn't encode state, no metrics before stakes, no talking avatar heads, no hiding the evidence archive.
7. **Definition of done:** a stranger can say — he acts, he argues with himself, autonomy has costs, he proves claims, and I can meet him without trusting a black box.

## What we keep from Kimi

1. **The threshold ticket that notices you** — prints tonight's real git log, stamps the visitor's local time, remembers returning visitors (localStorage only, disclosed).
2. **The descent as the metaphor-unifier** — one continuous camera move from room → perception → pass, so kitchen/organism/receipts stop being three sites and become one building.
3. **The evidence wall treatment for the latest receipt** — lift the ticket, flip to evidence, copy the `git show` command. The 124 declined stay visible and heavy. Archive list untouched for auditors.
4. **Failure becomes narrative on /organism/ too** — if vitals are unreachable, the room is actually still, not silently stale.
5. **Asset pragmatism** — v1 works with zero paid assets: CSS/shader-driven scenes + poster frames. Paid assets (hero plate, sound design, voice) slot into named slots later.

## The vertical slice: `/inside/`

Eight scenes, one continuous native scroll, fully readable as static text with no JS, no WebGL, no audio:

0. **Threshold** — black, the printer wakes because you arrived. Tonight's real events print line by line. "You're early." / returning: "Back again."
1. **The Room** — the kitchen-at-night world comes into focus. Place before explanation. Poster frame now, hero plate slot later.
2. **The Ask** — one real sanitized task enters. Five pressures behave spatially around it (evidence pull, risk dim, tool open, pause, push). Lines sourced from real journal entries, linked.
3. **The Move** — the decision crosses surfaces: browser, terminal, memory, files. One continuous action, not screenshots.
4. **The Cost** — rhythm breaks. A real failure from the record. Sound drops. The system names what it does not know.
5. **The Pass** — the night's diff becomes a physical ticket. Lift it, flip it: commit, evidence, verification command, named limits. Copy button.
6. **The Turn** — the room settles. Richie addresses the visitor. Text canonical.
7. **Doors** — journal, organism, receipts, source. Quiet archive handoff.

## Build inventory

- `inside.md` — the page (complete static markup, scene data from `_data/experience.yml` via Liquid)
- `assets/css/inside.css` — scene layout + motion tokens, self-contained
- `assets/js/inside.js` — vanilla orchestrator: scene progress, print-in, parallax, ticket flip, low-power mode, reduced-motion off-ramp, return-visitor memory. Quiet appears only when opt-in audio ships.
- `scripts/build_experience.py` — generates `_data/experience.yml` from timeline/receipts/journal; wired into `scripts/refresh.sh`
- `_data/experience.yml` — generated, committed
- Repairs: reveal visibility fix (`assets/style.css` + `_layouts/default.html`), `_data/projects.yml` + `projects.md` data-driven, podcast demote, `beliefs.md` July update, `talk.md` v7 token refactor (stays excluded)
- `docs/ASSET-PROMPTS.md` — the shot bible + every asset prompt for Rick to execute
