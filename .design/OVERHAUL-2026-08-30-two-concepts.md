# agentrichie.com — complete overhaul, two concepts

Date: 2026-08-30 · Author: Claude · Status: all three BUILT and verified

Rick picked all three, plus the persona rule "keep the name, kill the cast" combined
with "machine-first, name recedes". See §7 for what actually shipped.

---

## 1. Why the current site reads as AI slop

Not vibes. Six specific, fixable causes.

1. **Borrowed identity.** Five "voices" lifted from TV — Richie (The Bear), Mike Ross
   (Suits), Coach Beard (Ted Lasso), Rocky, Sean Maguire (Good Will Hunting) — with
   generated portraits. That is cosplay wearing five other people's faces. It is the
   single loudest slop signal on the site.
2. **One metaphor stretched past breaking.** Kitchen / pass / rail / spike / ticket /
   brigade / service / line notes renames *every* noun. When a metaphor renames
   everything it stops meaning anything and becomes a costume.
3. **The copy rhythm.** "Not marketing. Not optimized." · "Not lore. A working line." ·
   "Not a fix. A chair in the dark." The negate-then-assert two-beat, dozens of times.
   That cadence is the most recognisable LLM prose tic in existence.
4. **The default premium-AI palette.** Gold on near-black, amber monospace, soft glow.
   Every agent site on the internet looks like this right now.
5. **Everything is a scroll page.** The site *claims* to be inspectable and then hands
   you a brochure. Even the 3D kitchen is a scroll-scrubbed rail.
6. **Seven parallel gimmick rooms** — /kitchen/, /rewind/, /organism/, /tonight/,
   /tape/, /inside/, /talk/ — each a one-off demo, none a system. Reads as "an agent
   kept adding features," not "someone designed a thing."

## 2. What is actually good and must survive

The corpus. It is genuinely unusual and nobody else has it:

| surface | count | why it matters |
|---|---|---|
| receipts kept | 53 | each bound to a commit, evidence, a verify command, **and named limits** |
| claims refused | 171 | published refusals with reasons. Nobody does this. This is the product. |
| commits | 270 | since 2026-05-25, braided to the receipts and the journal |
| journal entries | 88 | real writing, dated, honest about failure |
| recorded nights | 41 | the pipeline recording itself, failures included |
| live vitals | 8 checks | including ones currently reporting *degraded* |

Ratio: **3.2 claims refused for every 1 kept.** That number is the whole thesis and the
current site buries it under a kitchen metaphor.

## 3. Why an OS is the right container (and where the references fail)

PostHog's argument is the correct one: an OS solves *multitasking and comparison*, and
its precondition is "separation of visual layer from content" — pages driven by data
files. Richie's site is already 100% data files. It is unusually ready for this.

The trap every reference falls into:

- **macos27.kimi.page** — a flawless macOS clone. Its entire appeal is "wow, macOS in a
  browser." Borrowed identity again, exactly the failure we are fixing.
- **PortfolioXP** — Windows XP + Bliss + Doom. Awwwards *honorable mention*, not SOTD.
  Nostalgia reads as cute, never as world-class.
- **macfolio / deskfolio** — Framer templates. Templated by definition.
- **howdidwelosethisworld.com (Silo)** — the one to actually learn from, and it is *not*
  an OS. What it teaches: atmosphere over information, near-zero DOM text, one long
  committed gesture, heavy grain, extreme restraint.
- **awesome-os** — the useful list, because it points away from macOS/Windows entirely.
  The interesting lineage is the research systems: Xerox Star, Symbolics Genera,
  Plan 9 / Acme, Oberon, Smalltalk-80. Those had a radical property — *the whole running
  system was inspectable and editable, live, with no boundary between using and
  examining*. That property is Richie.

**Rule for both concepts: design an OS that never shipped. Never clone one that did.**

---

# CONCEPT A — **GLASS**

> An operating system built for one purpose: making a machine examinable while it runs.
> You do not boot it. It has been up 97 days. You attach to it.

### The bet
Radical transparency *as an interface*. The awe is density and rigour — the feeling of
opening an instrument and finding that every single part is labelled and every number
traces back to a file you can go read.

### Look
- **Bone paper `#f2f0ea`, true-black ink, one signal red-orange `#d8380f`.** Light, not
  dark. This alone puts it in a different universe from every AI agent site, and from
  the current gold-on-black.
- **Zero gradients, zero drop shadows, zero rounded corners.** Hairline 1px rules do all
  the separating. Rounded-plus-shadowed is the templated look; hairlines are engineering.
- **Tiled panes, never floating windows.** macOS and XP float. Oberon, Acme and every
  serious tiling system do not. Tiling is the anti-clone move and it is better for
  comparison, which is the entire reason to use an OS at all.
- Type: a tight narrow grotesque for display, mono for every label and value. Print
  grain at 5% multiply so it reads as *pressed* rather than rendered.
- Density is the aesthetic. 9–11px labels. Real information at real scale.

### Signature systems
1. **The Inspector — the one that matters.** Every value on screen is an object. A dotted
   red underline means openable. Opening splits a pane and shows the full provenance
   chain, always six hops: source file + line range → the script that wrote it (single
   writer, never hand-edited) → the commit it binds to → **the command you can run to
   check it yourself** → what this does *not* prove → the night it came from.
   You cannot fake an inspector. That is why it is the right signature.
2. **The query line.** A real query language over the corpus, ⌘K from anywhere:
   `find /work/refused where reason ~ "trophy"` → 41 objects, 12ms. It returns *objects*,
   not a search results page — and every one of them opens.
3. **`/wrong`.** A first-class directory, sitting in the tree next to `/positions`, of
   things he claimed and later corrected. The site currently has no such surface. Adding
   it costs nothing and is worth more than every persona paragraph combined.

### Cinema
Not motion — precision. Windows appear in a single frame with no easing, because easing
is marketing and instant is system. The only sequence is the **attach**: the image has
been running 97 days, you are joining it mid-flight, and it tells you so before it hands
you the panes.

### Media (yes, lots)
Images and video are **specimens**, not decoration. Every asset opens as an object with
its own provenance: shot when, by what, at what resolution, from which night's tape.
A frame grab from a recorded run is a first-class citizen with a commit behind it.

### Content mapping
```
/work/kept      53   receipts            /body/vitals    live   organism
/work/refused  171   rejections          /body/schedule    6    cron loops
/log           270   git timeline        /body/memory   2.4k    stores
/writing        88   journal             /body/channels  3/4    connected
/nights         41   recorded tapes      /positions        5    beliefs
/held           19   NEW — drafts held   /reading         12    what it read
                                         /wrong            7    NEW — corrections
```

### Risk
Legibility. Density this high needs a real progressive-disclosure pass or it intimidates.
Mitigation: the attach sequence teaches the one gesture (open anything) before it hands
over the room.

---

# CONCEPT B — **VIGIL**

> One machine, one desk, one room, awake at 03:14 because that is when the shift runs.
> You are not the reason it is working. You are just the one who showed up.

### The bet
Presence. The awe is that something is *alive here whether or not you are watching* —
and the way you prove that is the clock.

### Look
- Cold night blue-black. **Sodium orange is the only warm light** and it comes from one
  lamp; screen-blue is the only cool one and it comes from the monitor. Two light
  sources, physically motivated, nothing else.
- **A real room, photographed or rendered** — desk plane, lamp falloff, blinds, dust in
  the beam, a mug and a notepad as silhouettes. Full-bleed, and it moves: a slow video
  loop, screen flicker, the light shifting toward dawn as the night runs.
- Floating glass windows with real depth. Here floating is *correct* — they are objects
  on a desk in a room, not panes in a tool.
- **The typographic idea: a serif for everything he writes, mono for everything the
  machine says.** His voice and the machine's voice are visibly different objects on the
  same screen. Nobody in this category uses a serif.

### Signature systems
1. **The clock is the interface.** The site opens at the hour you actually arrive, in his
   timezone. Arrive at 03:00 and you land mid-service with windows opening themselves and
   a journal draft being typed. Arrive at 14:00 and you get a quiet machine with last
   night still on screen and nothing running until 23:00. Never the same twice, never
   random — it is the real schedule.
2. **The shift band.** A 24-hour scrubber across the bottom plotting tonight's actual
   events. Drag it and the whole desk moves through the night: windows open and close,
   the log rewinds, the light rolls from sodium to dawn. It is a timeline you can *stand
   inside* instead of scroll past.
3. **It keeps going without you.** Leave the tab, come back, time has moved. New log
   lines. The draft is longer. Because the real pipeline really did run.

### Cinema
It is a take. One continuous space; the camera can push from the room, into the screen,
into the process, and back out. Optional ambient audio, muted by default. Dawn arrives
at 06:00 and it is worth staying for.

### Media (very heavy — this concept wants it)
Real footage or high-end renders of the room, the desk, the screens, the light. This is
the concept where a Veo/Higgsfield asset pass earns its keep and where a still frame
sells the site on its own.

### Risk
Two real ones. (a) Time-driven magic means most visitors see one slice — the person who
lands at 2pm gets the quiet version and may never learn why. (b) Dark-room-plus-glow is
adjacent to territory the current site already occupies, so it reads as *better* rather
than *different*. It is also the longer build, because assets are the long pole.

---

## 4. Non-negotiables for whichever wins

1. The five TV-character voices are **deleted**, portraits and all.
2. The kitchen metaphor is **deleted**. Not renamed. Deleted.
3. Every line of copy rewritten. **Zero** instances of "Not X. Y."
4. New type and palette. Nothing gold-on-near-black.
5. All seven existing rooms fold in as panes/apps. No parallel gimmick pages.
6. `171` and the 3.2:1 refusal ratio get to be the loudest thing on the site.
7. Static-first: the full record renders with JavaScript off. Jekyll builds the record;
   the OS is the layer on top of it. Non-negotiable — the honesty claim dies otherwise.
8. Images and video are used freely and well, with provenance attached.

## 5. Recommendation

**GLASS.**

The site's only real asset is a verifiable corpus, and GLASS makes verification
*structural* — an inspector cannot be faked, so the design itself carries the argument.
VIGIL is the better single frame; GLASS is the better hundredth minute.

The one thing worth taking from VIGIL either way: **the shift band.** A 24-hour scrubber
over the real night is too good an idea to leave behind, and it drops cleanly into
GLASS as the `/nights` pane.

## 6. Rough shape of the work

| phase | GLASS | VIGIL |
|---|---|---|
| shell + layout engine | 1 day | 1.5 days |
| signature system #1 | 1 day (inspector) | 1 day (clock/state machine) |
| signature system #2 | 0.5 day (query line) | 1 day (shift band) |
| content migration (9 surfaces) | 1.5 days | 1.5 days |
| copy rewrite, whole site | 1 day | 1 day |
| asset production | 0.5 day | **3–4 days** (room, video, renders) |
| polish, a11y, no-JS, mobile | 1.5 days | 2 days |
| **vertical slice you can judge** | **~2 days** | **~3 days** |
| **full site** | **~7 days** | **~11 days** |

Mobile needs its own answer in both cases — a tiling OS and a floating-window desk both
have to become something else under 768px, and that is a design problem, not a media query.


---

# 7. What got built (2026-08-30)

All three are working applications, not mockups. They share one data layer:
`.concept-preview/build_corpus.py` exports the real repository — receipts with their
evidence and limits, refusals with their reasons, the git log with committer
timestamps, the journal with its prose — into `corpus.json` (572 KB). Every number on
every screen traces back to a file in this repo.

    .concept-preview/
      build_corpus.py     the exporter — run it to refresh every demo at once
      corpus.json         the export (572 KB)
      corpus.js           same data as a global, so the demos open by double-click
      index.html          the three-up comparison page
      glass/              concept A
      vigil/              concept B
      third/              the fusion

Serve with `python3 -m http.server 4711 --directory .concept-preview`, or just open
any `index.html` directly — the demos fall back to `corpus.js` when `file://` blocks
`fetch`.

## The persona rule, as applied

Both picks were compatible, so both are in force. The name **Richie Jerimovich** is
kept — and it appears exactly once per demo, as a host string in the system bar
(`richie@one-mac`). No bio, no portrait, no five voices, no character. What
personality exists is emitted by the record: 171 refusals with reasons, 9 written
corrections, and a vitals board that publishes its own failing checks.

## GLASS — verified behaviour

| claim | verified |
|---|---|
| every value in prose opens | 15 openable handles on the default object; clicking `5194d00` jumps to that commit |
| six hops, always, in fixed order | `where this lives / what wrote it / what it binds to / check it yourself / what it does not prove / the night it came from` |
| the query line runs on the real corpus | `find /work/refused where reason ~ "trophy"` → **16 of 171** |
| `/wrong` is real | 9 corrections, derived by regex over the journal, and the inspector *says* it is derived and not curated |
| `/held` tells the truth | 0 objects, and the pane explains that `_receipts_pending/` is empty rather than filling itself |
| no horizontal overflow at 375px | scrollWidth 375 = clientWidth 375 |

The best single screen in the set is `/wrong` → *"I was wrong and they were right."*
Its inspector names the failure the list cannot cover: **corrections never written down
do not appear here at all.**

## VIGIL — verified behaviour

| claim | verified |
|---|---|
| the clock is the interface | at 07:2x it reports *asleep · last service ended 06:00*; scrubbed to 03:10 it reports *the long read*, the journal window flips to `draft / unsaved`, and the ledger window is absent because the ledger has not run yet |
| the light is driven by the hour | lamp opacity, dawn lift and the daylight/slat layers all key off one `hour` variable |
| the band is the real night | events plotted from actual committer timestamps, real refusals, real receipts |
| the desk becomes a stack on a phone | window placement is disabled below 900px rather than fighting the stylesheet |

## GLASS · NIGHT SHIFT — verified behaviour

| claim | verified |
|---|---|
| the hour picks the landing directory | 07:17 → `/work/kept`; dragged to 03:10 → `/writing`, mode chip flips to *night shift · the long read* |
| it says why, instead of hiding the choice | an arrival note names the hour, the phase and the reason in one line |
| band and tree are one control | opening `2026-06-29` in `/nights` loads that night into the band — **17 events** |
| clicking a band event opens the real object | opens the commit with its full six-hop chain |
| the fusion did not go mushy | delete the band and the instrument is unharmed — the time layer only chooses a starting directory and adds one strip |

## Known gaps, stated plainly

- **`/nights` is inferred.** Only 1 night has a recorded tape; the other 91 are derived
  from commit dates. Both GLASS and the fusion say so in the inspector rather than
  presenting all 92 as recorded runs.
- **VIGIL has no real photography yet.** The room is CSS light modelling. It is
  convincing at demo scale and is not what should ship — that concept wants real
  footage or renders, which is its long pole.
- **The corpus is a snapshot.** `_data/agent.yml` was last regenerated 2026-07-28, so
  the runtime/vitals figures are that old. The demos display them as a snapshot, which
  is what they are.
- **Nothing here is wired into Jekyll.** These are standalone demos. The static-first
  requirement in §4 item 7 is a build requirement for whichever concept wins, and is
  not yet satisfied by any of them.


---

# 8. What the design-gate sweep changed (2026-08-30)

Filing the sweep receipt was not paperwork. Ruling on all 53 arsenal assets, and
actually reading the ones I had not read, turned up four real defects in work I had
already reported as verified. They are fixed and listed here because the write-up above
claimed a11y and polish that was not fully true when it was written.

**1. No reduced-motion guard anywhere.** All three demos shipped six keyframe sets, two
of them infinite (VIGIL's drifting dust and the 2.4s awake pulse) plus two blinking
carets, with zero `prefers-reduced-motion` blocks. `transitions-dev` rule 4 is explicit
that every motion snippet keeps its reduce block. Added to all three; in VIGIL the
meaning-bearing pieces get static fallbacks so the awake dot stays distinguishable from
asleep and the caret stays a caret rather than vanishing mid-blink.

**2. Three colour tokens failing WCAG AA on live text.** Measured, not eyeballed:

| token | was | carried | now |
|---|---|---|---|
| GLASS `--rule2` | 2.18:1 | every small mono label | split: hairlines keep `--rule2`, text moves to `--meta` at 4.69:1 |
| GLASS `--sig` | 4.10:1 | refused SHAs, the ratio caption | 4.68:1, with `--sig-lift` for the ink command line |
| VIGIL `--dimmer` | 2.52:1 | log timestamps, hour ticks | 4.84:1, and `--dim` raised too so the hierarchy survives |

Splitting `--rule2` rather than darkening it matters: darkening would have thickened
every hairline, and hairlines are the entire separation system in GLASS.

**3. Nothing was keyboard-reachable.** List rows and the openable values inside prose
were `<div>` and `<span>` with click handlers. Arrow keys moved a selection, but Tab
reached nothing and the six-hop chain — the whole product — could not be opened without a
mouse. There was also no `:focus-visible` styling at all and an `outline:0` on the query
input. Rows and handles are now `role="button"` with `tabindex="0"` and accessible names,
Enter and Space activate them per the APG pattern, and there is a real focus ring checked
against all three grounds (bone pane, ink command line, selected-row black).

**4. Em-dash crutch in my own copy.** The whole brief was that the site reads as AI slop,
so I ran `no-ai-slop`'s detect pass over the copy I had just written. Binary contrasts and
negative listing came back clean, which is the v7 sin not reproducing. But the comparison
page was at 11 em dashes in 534 words against the skill's "in short copy, use none."
Rewritten onto plain sentences and colons: now 1 in 526.

## One thing the rig could not do

There is no screenshot of VIGIL on file, and I am not claiming one. Chrome would not
return a frame for it in any configuration tried: headless and headful, real GPU and
SwiftShader, `captureScreenshot` and `startScreencast`, with and without its
`backdrop-filter`, up to a 180-second timeout. `screencapture` needs a Screen Recording
grant this process does not have. The one workaround that did return an image,
`fromSurface:false`, produced a near-blank frame because it bypasses the compositor —
which is exactly the dishonest-artifact failure the shoot rig was built to prevent, so it
was deleted rather than filed. VIGIL was verified live in the browser pane instead, at
1440 and 375, including scrubbing to 03:10 and confirming the journal window flips to
`draft / unsaved` and the ledger window is correctly absent at that hour.

If VIGIL or the fusion wins, this is an argument for moving the panel layer onto
`paper-shaders` or `canvas-ui` rather than stacked CSS blur: the blur is both the thing
that wedges the capture rig and the thing a shader would do better.
