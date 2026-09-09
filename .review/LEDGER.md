# The Ledger

Every finding, its seat, its gate, its verdict. Append only. A row is never
deleted, only closed.

Severities: **stop-ship** (frame, honesty, a11y block) · **high** · **medium** · **low**

---

## Sweep 01 — the type system, the front door, the record
Opened 2026-09-09 ~06:00. Against `abb2f99`, local `:4713` and production.

### Metrics at open

| Metric | Value |
|---|---|
| Font stacks resolved on the front door | **17 system-only + 1 Georgia. Zero webfonts.** |
| `@font-face` in the whole shipped experience | **0** (the retired site had 5) |
| Ramp conformance | **51%** |
| Distinct sizes in the 11-16px band | **10, across 285 declarations** |
| Front door weight | 11.28 MB desktop / 5.88 MB phone |
| Legibility findings on production | 0 |
| Unsourced lens marks | 0 |

### Findings

| # | Seat | Gate | Sev | Finding | Verdict |
|---|---|---|---|---|---|
| 01 | Typographer | type | high | **The flagship experience has no typeface.** 17 of 18 text elements on the front door resolve to `-apple-system, system-ui, Helvetica Neue`. The retired Jekyll site self-hosts Outfit, Bricolage Grotesque and JetBrains Mono, subset, with `unicode-range` and `font-display:swap`. The relaunch shipped without any of it. | **BUILD: two-register type system** |
| 02 | Typographer | type | high | **The single most prominent line on the property is set in Georgia.** `#invitation h1` "I live in that machine." falls back to `Georgia, 'Times New Roman', serif`. Georgia is the serif you get when you decline to choose a serif. | **BUILD (with 01)** |
| 03 | Typographer | type | high | **The "it is a Mac simulation" defence does not survive leaving macOS.** `-apple-system` resolves to Segoe UI on Windows and Roboto on Android. The argument for the stack is exactly the argument against shipping only the stack. | **BUILD (with 01)** |
| 04 | Typographer | type | high | **The ramp is a smear.** 10 distinct sizes (11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16) across 285 declarations in a 5px band. 84 of them at 12.5px, a number that exists because something was nudged until it looked right. No reader perceives 12 against 12.5, so the hierarchy carries no information. | **BUILD: one ramp** |
| 05 | Typographer | type/live | high | `#return-room` renders at **10px** at every viewport. The legibility audit reported 0 because the button is hidden until you enter the machine and it never sampled it. | **FIX** |
| 06 | Typographer | type | medium | 11 source rules below the 12px floor in `spatial.css` (8px, 9px, 9.5px, 10px, 11px, 11.5px). Most are dead under `spatial-photo.css`, which loads later. Dead or not, the next person to tidy the override resurrects an 8px caption. | **FIX at source** |
| 07 | Editor | copy | **stop-ship** | `index.html:7` — `<main aria-label="Richie's room">`. A screen-reader user is told, in the first announcement of the main region, the exact thing the frame forbids. The room is Rick's. Invisible to any eyeball audit. | **FIX** |
| 08 | Auditor | — | **stop-ship** | The Corrections surface is not showing corrections. `corpus.wrong[0]` matched `"a correction"` inside *"a correction path outside the model"*, a sentence about system design, not about Richie being wrong. `CORR` matches the word, not the meaning. | **FIX the builder** |
| 09 | Editor | — | high | Six of the ten "wrong" rows are separate sentences from one journal entry, each printed with the same title and date, each a fragment with no context. It reads as a bug. The material is real and is being wasted. | **REBUILD the surface** |
| 10 | Skeptic | — | medium | `/about/` renamed "voices" to "layers" and kept five characters with backstories, an id each, a colour each and a badge each. "It calls you cuz because family is who you choose" is a character, whatever the heading calls it. The rename satisfied the guard, not the ruling. | **QUEUED — needs a real answer, not a rename** |
| 11 | Colourist | — | medium | The front door resolves 9 distinct font sizes across 18 elements. Nearly every element has a private size. That is not a system, it is 18 separate decisions. | **BUILD (with 04)** |

### Gate first-catches

Per `STANDARD.md`, a gate is not trusted until it has caught something real.

| Gate | First real catch | Trusted |
|---|---|---|
| `type` (static) | 04, 06 — the 12.5px smear and 11 sub-floor rules | yes |
| `type` (live) | 05 — a 10px control three prior audits missed | yes |
| `copy` | 07 — the frame violation in an aria-label | yes |
| `weight` | measured only, no failure yet | not yet |
| `sourcing` | measured only, 0 unsourced | not yet |
| `motion` | measured only, no failure yet | not yet |
| `a11y` | measured only, no failure yet | not yet |

### Gates corrected during this sweep

Honesty rule 2: a gate that is wrong gets fixed, and its earlier results are
declared invalid rather than quietly replaced.

1. `type` flagged **every** phone size under 13px as "phones get larger type."
   Wrong. The rule only bites when a phone size *shrinks* the desktop value for
   the same selector. Rewritten to compare against the base declaration.
   Invalidated: 6 findings.
2. `type` then flagged display headlines scaling down on phones (25px → 20px).
   Also wrong: a 30px hero at 390px wide is too big, and shrinking it is correct
   responsive typography. The floor applies to body, UI and caption text, which
   is what Rick's original correction was about. Added a 17px display threshold.
   Invalidated: 7 findings.
3. `copy` flagged 150 findings inside `record.html`, which is **the record** —
   journal entries from May carrying the retired cast and the old habits.
   Editing them to match today's rules would be falsifying the record. Added a
   record exemption, matching the line `tests/one-richie.test.mjs` already draws.
   Invalidated: 150 findings.

### Sweep 01 close

| Metric | Open | Close |
|---|---|---|
| Font stacks on the front door | 17 system + 1 Georgia, zero webfonts | **8 chrome, 5 record, 4 evidence**, all self-hosted |
| `@font-face` | 0 | **5** (Newsreader roman + italic, Inter, JetBrains Mono 400/500) |
| Ramp conformance | 51% | **100%** — the type gate reports 0 findings |
| Distinct sizes, 11-16px band | 10 across 285 declarations | **3** |
| Literal `px` text sizes in the source | 330 | **0** below the display threshold |
| `spatial.css` selectors declared more than once | 27, up to 6× each | **0** |
| Legibility findings (front door + 16 apps × 3 viewports) | 0 | **0** |
| Copy gate stop-ships | 1 | **0** |
| Tests | 48 | **64** |
| Third-party hosts contacted | 0 | **0** (fonts are self-hosted; `/privacy/` still holds) |
| Front door weight | 11.28 MB | 11.45 MB (+164 KB of type) |

### Closed

01, 02, 03 — **T1 shipped.** `workspace/type.css` declares three registers and one
assignment table. The machine's interface is SF with Inter behind it, so the
illusion survives Windows and Android instead of collapsing to Segoe UI. What
Richie wrote is Newsreader, variable, optical size live. What a stranger can
check is JetBrains Mono. The evidence lens colours these apart on demand; the
typeface now does it permanently.

04, 11 — **T2 shipped.** One ramp, eight steps, in `type.css`. `apply-ramp.mjs`
moved 155 declarations; a further sweep took every remaining literal size and
`font:` shorthand onto it. 84 rules at 12.5px are gone.

05, 06 — closed by the ramp. `#return-room` was 10px at every viewport and is
now 12px; the 11 sub-floor rules in `spatial.css` are gone at source.

07 — **fixed.** `<main aria-label="Richie's room">` is now `Rick's desk in
Chicago, with the Mac mini that runs Richie`.

08, 09 — **fixed, and the fix found something bigger.** See sweep 02.

### Sweep 02 — corrections

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 12 | Typographer | high | `spatial-photo.css`, whose job is the photograph, was re-deciding the size of the front door's entire pitch paragraph. It shipped at 12.5px. This is the same file and the same failure that shipped an 8px eyebrow in August. | **fixed** — a photo stylesheet does not get a vote on reading size |
| 13 | Engineer | high | `spatial.css` declared `#invitation` six times, `#room-caption` six times, `.mm-card` four, with two identical copy-pasted comment blocks. Nobody could answer "what size is the body copy" without simulating the cascade. Both of the front door's shipped type defects came out of exactly that. | **fixed** — flattened to 96 rules, one per selector per media context, proved invisible by `computed-diff.mjs` at three viewports |
| 14 | Editor | medium | The marker on the Mac mini read "He has been publishing from it for 107 days" while every other line on the screen is first person. The machine's own label read like a museum card written by somebody else. | **fixed** |
| 15 | Typographer | medium | That marker set a whole sentence of prose in the evidence face, so a description looked like a log line. | **fixed** — and it exposed an error in the assignment table |
| 16 | Engineer | high | The assignment table mapped `[data-tier]` to the evidence face. **A tier is where a fact came from; a register is what kind of speech it is.** A verbatim journal quote carries `data-tier="export"` and is still prose. Setting it in monospace made Richie's own sentences look like log output. | **fixed** — the evidence face is assigned to surfaces, never to tiers |
| 17 | Editor | **stop-ship** | The login screen said **"Click to sit down at the desk"**, two lines above "This does not unlock the physical machine." The frame violation Rick named on the front door had a second copy here. The copy gate did not catch it: its pattern list had "take a seat" and "the desk is yours" but not this phrasing. | **fixed**, and the gate widened |
| 18 | Colourist | high | The account picture was a flat orange circle with an **R** in it. A program has no face, and a monogram is what you draw when you have decided not to draw anything. | **rebuilt** — see THE MARK |
| 19 | Auditor | **stop-ship** | `corpus.wrong` listed *"a correction path outside the model"* as an admission of error. It is a sentence about designing systems. `CORR` matched the word, not the meaning. | **fixed** in the builder |
| 20 | Editor | high | Six of the ten rows were separate sentences from one entry, each printed with the same title and date, so the property's sharpest material rendered as a bug. | **fixed** — one row per entry |
| 21 | Auditor | **high, and this is the real one** | Tightening the pattern took the count from 10 to **1**, which is wrong in the other direction. The strongest correction on the property, an in-place addendum opening `**Correction (June 19):**`, was missed by both versions. **No regex catches this. The automated approach was the defect.** | **rebuilt** — see CORRECTIONS |
| 22 | Typographer | low | On a phone the pitch was capped at `40ch`, narrower than the width the device actually had. | **fixed** |

### Built in sweep 02

**THE MARK** (`workspace/mark.mjs`) — one cell per day since 25 May, four states
read from the export: cleared a receipt, weighed and declined, worked with no
candidate, silent. 107 days: 38 cleared, 55 weighed, 9 worked, 5 silent. It is
the account picture on the login screen and a wide strip in the Public Record
widget, and it grows by one cell a day without anybody deciding it should.
Rick's note was that Richie never shows himself. The honest portrait of
something that publishes a record is the record.

**CORRECTIONS** (`_data/corrections.yml`, `workspace/apps/corrections.mjs`) —
five declared corrections, each carrying what was published, what was true, how
it surfaced, what it cost, and a verbatim quote. `tests/corrections.test.mjs`
holds every quoted sentence to the journal file it names, on every build.
The derived scanner is kept, and kept separate, because its failures are part of
the record: the app says out loud that it once published a sentence about
correction paths as an admission of error, and that it still misses the
strongest correction on the property.

Reachable from the Apple menu, and a directory in the static record.

### Gate first-catches, updated

| Gate | First real catch | Trusted |
|---|---|---|
| `type` (static) | 04, 06 — the 12.5px smear and 11 sub-floor rules | yes |
| `type` (live) | 05 — a 10px control three prior audits missed | yes |
| `copy` | 07 — the frame violation in an aria-label | yes |
| `overflow` | added mid-sweep; caught `.sr-only` as a false positive first, which is how it learned | yes |
| `computed-diff` | 13 — caught two real cascade changes in the flatten on the first run, then zero after the source conflicts were fixed | yes |
| `corrections` verbatim | proved by substituting a plausible invented quote; the test failed and named it | yes |
| `weight`, `sourcing`, `motion`, `a11y` | measured only, no failure yet | not yet |

### Gates corrected in sweep 02

4. `copy` had no pattern for "sit down at the desk", so a stop-ship frame
   violation sat on the login screen through a full gate run. Widened.
5. `gate-live` measured character-per-line against a 45 floor at every
   viewport. A 390px phone physically cannot hold 45 characters at a legible
   size, and enforcing it would push type back down, which is the exact defect
   this pass exists to undo. Floor is now 30 below 700px.
