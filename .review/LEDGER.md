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

### Sweep 03 — the apps, and the dynamism build

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 23 | Editor | **stop-ship** | Notes said **"You're at Richie's desk."** The desk is Rick's and Richie has no desk. This is the third copy of the frame error Rick named on the front door. | **fixed** |
| 24 | Engineer | high | The copy gate did not catch 23. Its pattern had a straight apostrophe and the copy uses a typographic one, so `Richie's desk` and `Richie’s desk` were different strings to it. | **gate fixed** — quotes are normalised before matching |
| 25 | Engineer | medium | The gate then flagged the comment explaining the fix, because it extracts quoted strings from JS without stripping comments. | **gate fixed** |
| 26 | Editor | high | The Notes paragraph under it was written in the voice of a retired cast member, promising to be loyal and loud. A personality pitch where an explanation belongs. | **rewritten** |
| 27 | Auditor | high | My replacement copy hard-coded "186 commits" and "five times". Numbers that drift. Caught on my own new work. | **fixed** — both read from the export |
| 28 | Editor | high | The Finder home said **"Golden retriever energy. No nonsense."** Cast language on the first screen of the file browser, saying nothing true about the record. | **rewritten** |
| 29 | Colourist | high | Six Finder folders carried six identical blue icons, so 61 kept claims looked exactly like 186 refusals and the only difference was a number under an identical picture. | **rebuilt** — each folder shows its own days |
| 30 | Skeptic | medium | `wrong` was a top-level Finder folder holding one item: the derived scanner's guesses, a debug artefact beside five real directories. | **cut** — it lives inside Corrections and in the static record |
| 31 | Auditor | **stop-ship** | Time Machine printed a card labelled **Corrections** that counted whatever the pattern matcher happened to flag. A defect I introduced two hours earlier by changing the shape under it. | **fixed** — `documents.mjs` points `correction` at the declared list |
| 32 | Editor | medium | Last Night's headline was a raw ISO date, the largest line in the window. "2026-09-08" tells a reader nothing that "Tuesday, 8 September" does not tell them faster. Its first sentence also began lowercase. | **fixed** — ISO kept one line down, where it can be matched against the export |
| 33 | Typographer | low | "48m ago" set entirely in the monospace figure: "ago" carried the face's wide advance and read as part of the number. | **fixed** |
| 34 | Auditor | medium | My own new lede claimed the schedule is "the only part of the property that is genuinely different every time you look at it". The clock and the temperature also move. An overclaim in the copy of an instrument whose whole point is not overclaiming. | **rewritten** |

### Built in sweep 03

**RIGHT NOW** (`scripts/vitals_server.py` `/now.json`, `workspace/apps/schedule.mjs`)

Rick asked twice for the property to be different every time somebody visits.
Every answer involving a shuffled quote or a randomised background is a fake
answer, because nothing actually changed. The true one was already on the
machine: **twenty jobs run on a schedule all day**, and the site had never said so.

`/now.json` reads `~/.hermes/cron/jobs.json` and publishes its *shape*: how many
jobs are scheduled, paused and failing; when the next fires; when the last
finished; and the next twenty four hours as a row of anonymous fire times.

**The privacy rule, and why it is a rule.** Most of those jobs are Rick's:
his mail, his reading, his research. A live list of what a person has their
agent doing every morning is a disclosure about him, and he did not ask for
one. So the endpoint publishes counts and timings and **exactly one name**, the
job that rebuilds this site, which is already public in the Service Tape and
the journal. `workspace/tests/schedule.test.mjs` reads the server source and
fails if the endpoint ever publishes an arbitrary name, or reads a prompt, an
error string, a workdir or a delivery target.

The front door's live rail now ends `next job in 54m` instead of a drought
counter derived from a static export. The drought line remains as the honest
fallback when the endpoint does not answer: a saved number is never dressed as
a live one.

`/privacy/` still holds. Verified: the only host any page contacts is
`vitals.agentrichie.com`, which is the Mac itself.

### Metrics after sweep 03

| Metric | Value |
|---|---|
| Tests | **68** (48 at the start of the loop) |
| Gate findings | 5, **0 blocking** |
| Ramp conformance | **100%** |
| Legibility | **0** across the front door and **18 apps**, 3 viewports |
| Third-party hosts | **0** |
| Atoms with a live source that ticks without a deploy | **3** (clock, weather, schedule) |
| Deleted atoms | 2 (the monogram avatar, the `wrong` Finder folder) |

### Sweep 04 — reach

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 35 | Engineer | **stop-ship** | **Sixteen published pages had no route in from the front door.** Measured, not guessed: opening all fifteen apps on the desktop yielded exactly one link out, `/workspace/record.html`. The journal, the bound book, `/inside/`, beliefs, projects, the vitals console, the service tape, privacy: every one of them answering 200 at its own URL with nothing pointing at it. | **fixed** — 0 unreachable |
| 36 | Engineer | high | I declared a `reach` gate in `STANDARD.md` and had not built it, which is exactly the kind of thing this harness exists to stop me doing. | **built** |
| 37 | Engineer | high | The reach gate resolved `a.getAttribute('href')` against `location.href`. The front door sets `<base href="/workspace/">`, so it produced `/desktop.html` and the crawl died at the first hop, reporting 3 reached. | **gate fixed** — `a.href` resolves against the base |
| 38 | Engineer | medium | The gate counted `.concept-preview`, `trader-desk` and a Python `site-packages` test fixture as unreachable surfaces, burying the sixteen real ones in twenty nine rows of noise. Then it counted `talk.md`, which `_config.yml` excludes on purpose. A gate that can never reach zero is a gate that gets ignored. | **gate fixed** — reads the exclude block |
| 39 | Engineer | medium | The exclude-block regex used `$` under `/m`, so it stopped at the end of the first line and read one exclusion out of thirty. | **gate fixed** |
| 40 | Engineer | high | The bookmarks were `<button>` elements. A button that loads a page cannot be middle-clicked, copied, opened in a new tab, or seen by a crawler. | **fixed** — real anchors with the plain click intercepted, modified clicks left to the browser |
| 41 | Engineer | medium | `tests/reachable.test.mjs` reported `/tonight/` unreachable when it was listed all along: its title contains an apostrophe, so it is written in double quotes and a single-quote-only pattern dropped it. | **test fixed**, then proved by deleting a real bookmark and watching it fail |
| 42 | Auditor | medium | Activity Monitor printed the same snapshot sentence twice, four lines apart. | **fixed** |
| 43 | Colourist | medium | A failing health check looked identical to a passing one except for the word. The one thing wrong on that screen was the hardest thing on it to find. | **fixed** |
| 44 | Typographer | medium | Health readings were set in the record face, so `last read 55d ago` read as a sentence somebody wrote rather than a number a machine took. | **fixed** |

### Built in sweep 04

**THE BROWSER** (`drawChrome` in `workspace/mac.js`)

A navigation bar bolted onto a photoreal room would flatten the room. But a
Mac has a browser on it, and the person who lives in this Mac publishes a
website, so his browser has his own site in it. Fifteen pages, grouped, each
with a line saying what it is, loaded in the frame from the same origin, with
an Open button that leaves for the real page and says so.

No new furniture at the entrance, and the fiction gets stronger rather than
weaker. The Chrome app already had a tab bar and an iframe; what it did not
have was Richie's own back catalogue in it.

| | before | after |
|---|---|---|
| Shipped surfaces reachable in 3 clicks | **1** | **16** |
| Unreachable | **16** | **0** |

### Sweep 05 — the interior pages, and the phone

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 45 | Engineer | **stop-ship** | **The legibility tool was reporting garbage.** It scraped the first three numbers out of the computed colour string; `color-mix()` resolves to `color(srgb 0.65 0.35 0.21)`, whose components run 0 to 1, and read as 0-255 they gave ink `#0.c72d905c...` and ratios of 1.11:1 for text that reads perfectly well. **Every previous contrast reading on a surface using a modern colour function was invalid.** Fourteen of `/about/`'s twenty three findings were the tool. | **fixed** — every colour resolved through a 1×1 canvas, which is the browser's own answer |
| 46 | Typographer | **stop-ship** | The fifteen interior pages had never been audited. **318 legibility failures on production**, 65 on `/organism/` alone. 192 declarations below the 12px floor, in thirteen values from 0.56rem (9px) to 0.78rem, across the stylesheets and the inline styles in four markdown pages. | **fixed** — one small step at the floor, 0.8125rem on a phone |
| 47 | Auditor | **stop-ship** | **The property disagreed with itself about its headline number.** `/organism/` published "59 kept, 106 refused, 64% of commits declined" while the front door and the record published 61 and 186. The console counted `timeline.yml`, which holds the most recent 200 rows, not the ledgers. Both pages looked equally confident. | **fixed**, and guarded by `tests/counts-agree.test.mjs` |
| 48 | Editor | high | That same figure was labelled "% of commits declined" when its denominator is commits weighed for a receipt, not all commits. | **relabelled** |
| 49 | Editor | medium | `/inside/` said "First visit **on record**." The mechanism is localStorage and the code says so in a comment. On this property "record" means the public record. | **fixed** — "First time on this browser", which is precisely what it knows |
| 50 | Engineer | high | The stylesheet cache key had not been bumped. The comment above it records what happened last time: `/rewind/`'s tape overlay shipped with no styles at all, including no `pointer-events:none`, on a layer covering the readout. | **bumped** |
| 51 | Colourist | **stop-ship** | **On a 390px phone the marker card sat on top of the invitation**, covering three lines of the sentence that explains the property. Measured: card at x 100-350 over a panel at x 24-314. | **fixed** — the card goes above everything, pinned under the header, with the rule drawn down to the machine |
| 52 | Engineer | high | The card could not be pinned with `position:fixed`: the marker carries a transform, which makes it the containing block for anything fixed inside it. Then a custom property lost to `#mini-marker.flip .mm-card{right:74px}` at specificity (1,2,0), and the card landed 100px left of the maths. **Same trap that took `.tp-play` to 1.08:1 in August.** | **fixed** — computed offsets written to the style attribute, where per-frame values belong |
| 53 | Colourist | high | On a phone the invitation covered the room from the header to the nav. **The photoreal room is the reason the front door exists and it was invisible on a phone.** | **fixed** — the pitch gives way, not the picture. The half that goes is the half the counts underneath already say. |
| 54 | Colourist | medium | `#journey-nav` and `#room-caption` overlapped by 9px. | **fixed** |
| 55 | Typographer | medium | The live rail wrapped to a second line and orphaned two words. | **fixed** — the day part drops below 520px, being the clause a reader can infer from the clock beside it |
| 56 | Skeptic | medium | On a phone the "Skip to the desktop" pill was the loudest thing on the screen, louder than the action the front door is asking for. | **fixed** |
| 57 | Colourist | low | Bookmark titles took the default link blue, so a set of cards read as a wall of hyperlinks. | **fixed** |

### Metrics after sweep 05

| Metric | Value |
|---|---|
| Interior page legibility findings | **318 → 6** (and the 6 are on pages the local build could not regenerate) |
| Workspace legibility | **0**, 18 apps, 3 viewports, with a colour parser that now works |
| Tests | **75** |
| Gate findings | 5, **0 blocking** |
| Places the headline number is published | **4**, all agreeing, guarded by a test |
| Phone layout collisions on the front door | **2 → 0** |

### Sweep 06 — RUN THE PROOF

The property's whole claim is that a stranger can check it. Every receipt
carries a verification command. The record says "download the export and check
any line." None of that was ever something a visitor could do while standing
here: they could read an assertion that the assertion was checkable.

**Seven checks, run in the reader's own browser, on the files the page was
built from.** Nothing precomputed, nothing staged. Each fetches, computes and
reports, with the method printed beside it and the time it took.

| Check | What it would catch |
|---|---|
| The export has not been edited | SHA-256 of `corpus.json` against the digest in `record.html` |
| The counts are counted, not typed | `counts.kept` disagreeing with `kept.length` |
| Every quoted correction is verbatim | a correction quoting a sentence nobody wrote |
| No kept claim without evidence | a receipt published with an empty evidence list |
| Every refusal names its commit | a refusal with no commit or no reason |
| The account picture is drawn from the record | a lit square with no dated row behind it |
| Every entry names its source file | writing the reader cannot open the source of |

**One check has to leave the site**, and it is a button, not a default.
`/privacy/` promises this site contacts nothing but the Mac it runs on, and a
promise with an exception the reader did not choose is not a promise.

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 58 | Auditor | **high** | **One of the seven checks could not fail.** The mark check compared the mark against `kept_by_date`, which is the index the mark itself reads, so emptying it moved both sides together and the check stayed green. A decoration wearing a tick, inside the instrument whose entire subject is falsifiability. | **fixed** — it now compares against the `kept` and `refused` lists, which are different fields from a different file |

`workspace/tests/proof.test.mjs` corrupts one thing at a time and asserts the
matching check goes red. That test is what found 58. It is also what would stop
a future edit quietly turning a check into a decoration.

The whole set was falsified end to end in a real browser as well: intercepting
the `corpus.json` fetch and tampering with one field made exactly the expected
check go red, plus the hash check every time, which is correct because any edit
to the export changes its digest.

### Sweep 07 — SHOW ME AROUND

Rick's original list of what the front door failed to do ended with: *he does
not welcome you and explain or show you around*. Everything else on that list
had been answered. This had not.

A modal with tooltips and dots is what every product ships and nobody
finishes. The answer that fits a machine is that **the tour drives the
machine**: each stop opens the real window and a line under it says why that
window is on the desk. Nothing is mocked, nothing sits on a screenshot, and
Escape leaves at any point.

| Stop | Answers |
|---|---|
| Finder | what is this |
| Notes | what is it for, and what it is not |
| Corrections | the part I would rather not show you |
| Right Now | what is happening while you read |
| Run the Proof | how to check any of it without trusting me |

Offered once in the welcome toast, permanent in the Apple menu. A returning
visitor is not nagged; a browser that refuses storage is offered it again,
which is the correct failure.

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 59 | Engineer | **stop-ship** | Wiring the tour passed `reducedMotion` by value into a call above its own declaration. **The whole desktop stopped mounting**, and I did not find out from the console: the entry script's `.catch()` swallowed the error and printed "The workspace could not load." A fatal mount failure was indistinguishable from a slow network. | **fixed**, and the catch now reports to the console before it degrades |
| 60 | Colourist | medium | The contact card on the desk used the stock Contacts silhouette while the photograph every other surface shows sat unused in `assets/`. | **fixed** |
| 61 | Colourist | medium | The tour bar covered the status line of the window it was explaining. | **fixed** — windows make room while the tour runs |

### Metrics after sweep 07

| Metric | Value |
|---|---|
| Tests | **89** (48 at the start of this loop) |
| Legibility | **0**, front door and **19 apps**, 3 viewports |
| Gates | 6 findings, **0 blocking** |
| Shipped surfaces unreachable | **0** |
| Apps on the desktop | **19** (15 at the start) |
| Findings logged this session | **61** |
| Gate corrections logged | **10** |

### Sweep 08 — the interior pages finished, and motion

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 62 | Engineer | **high** | **A third colour class the audit could not read.** `background-clip:text` paints the glyphs with a gradient and leaves `color` transparent. The journal book's cover title is gold on dark leather; the tool read `rgba(0,0,0,0)` and reported black on near-black at 1.35:1 across three viewports. | **fixed** — clipped and transparent inks are reported as **not measurable**, never given an invented ratio |
| 63 | Engineer | medium | It reported `0px, under 12` on `/overnight/` for two scroll-driven elements mid scale-in. A rendered size of zero is type that has not been painted; the finding was the tool describing its own timing. | **fixed** |
| 64 | Engineer | **high** | **The type gate could not see inside a `clamp()`.** `clamp(0.7rem, 1.6vw, 0.85rem)` renders at 11.2px on a narrow screen and reads in the source as a considered fluid decision. The gate reported 100% conformance over a rule that was under the floor on every phone. | **fixed** — it reads clamp minimums; the two that existed are fixed |
| 65 | Colourist | **high** | **One accent doing two jobs.** `--burn` clears 11:1 on the dark ground and 2.57:1 on the cream ticket; `--amber` 11:1 and 1.42:1, which is not a colour, it is an absence. | **fixed** — paper variants, redefined inside each paper scope so a rule written on a ticket later cannot get it wrong |
| 66 | Typographer | medium | `code` was sized `0.85em`. An em multiplies whatever it lands in, so inside `--step--1` body copy it compounded to 10.7px while every rule involved looked fine on its own. | **fixed** — `max(0.85em, var(--step--2))`, the floor stated rather than assumed |
| 67 | Typographer | medium | The bound book scales as one object, so its cover type scales with it and "Vol. I · MMXXVI" came out at 9px on a tablet. | **fixed** — below a certain size legibility beats proportion, and the floor only engages where the object has shrunk past the point that proportion was worth anything |
| 68 | Motion Director | **high** | **The motion system was a smear.** Fifteen distinct durations, four of them (120, 140, 150, 160ms) inside a 40ms band across eighteen declarations and three more (180, 200, 220) across seventeen. Five easing curves for three jobs. Same disease as the type ramp, in a seat I had never actually sat in. | **fixed** — three durations mapped to what moves, three easings mapped to which way |
| 69 | Colourist | medium | A colour mixed 80% toward paper landed at 4.41:1 on the kitchen's ground. A near miss is a fail. | **fixed** — 75% is 4.86:1 and looks the same |

### The interior pages, start to finish

| pass | findings on production |
|---|---|
| before anything | **318** |
| after the step collapse and the colour parser fix | 27 |
| after the paper accents, the em floor and the book | **1** |
| after the last colour mix | **0** |

### Gate corrections, final count for the session

**Thirteen.** Each is written down with the findings it invalidated. Four of
them were in the legibility audit alone: a colour parser reading 0-1 floats as
0-255, a straight apostrophe where the copy has a typographic one, a rendered
size of zero read as small type, and `background-clip:text` read as black ink.
Two were in the type gate: a phone rule compared against nothing, and a
`clamp()` whose floor it could not see. One was in the reach gate reading
`getAttribute` where it needed `.href`. One was a check in Run the Proof that
compared a value against itself and could not fail.

**This is the number I would look at first if I were Rick.** Every clean board
above is worth exactly as much as the instruments behind it, and thirteen times
today an instrument was lying.

### Sweep 09 — /about/, and the same defect in four shapes

Rick's ruling in the previous session was **layers win, rewrite `/about/` to
match the desktop**. The rename happened; the rewrite did not. The page still
carried five characters with biographies under a heading that said they were
not a cast. "It calls you cuz because family is who you choose" and
"celebrates with a dumb joke" are things a character has. **A layer is a
pressure**, and the only honest evidence a pressure exists is what it left
behind.

Each layer now states the pressure and then the record it produced, every
figure a Liquid expression over `_data` so it moves with the ledgers:

| layer | the pressure | what it left |
|---|---|---|
| heart / loyalty | shows up and stays | 44 consecutive days with work in the log, 104 days with a commit in all |
| angle / research | nothing gets claimed without a source you can open | every one of 61 kept claims carries evidence and a check command |
| signal / risk | says the least and refuses the most | 186 commits weighed and refused, each naming its commit and reason |
| hands / execution | breaks it small enough to finish | 315 commits across 28 recorded snapshots |
| truth / diagnosis | says it out loud when it was wrong | 5 published corrections, still inside the entries they correct |

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 70 | Skeptic | high | `/about/` renamed voices to layers and kept five characters. The rename satisfied the guard, not the ruling. | **rewritten to the ruling** |
| 71 | Auditor | **high** | **I reintroduced the windowed-count defect an hour after fixing it.** The new `/about/` printed "200 braided records" from `timeline.yml`, which is capped at the most recent 200 rows and has never been a total. | **fixed** |
| 72 | Auditor | **high** | Writing the guard found two more, both live for months: `/kitchen/` and `/overnight/` each invited a reader to **"scrub all 200 commits of life"** when the log has 315. | **fixed** |
| 73 | Auditor | high | The replacement was wrong too, in the other direction: `streak_days` and `active_days_30d` are computed inside a 30 day bucket, so both cap at 30 and read as facts about the machine when they are facts about the window. The true streak is **44** and the true count of days with a commit is **104**. | **fixed** — the builder reads the whole log for both |

**The same defect in four shapes, twice overstating and twice understating.**
The direction changes and the mistake does not: a number that comes out of a
capped list is a window, and printing it as a count is the part that makes it
wrong. `tests/counts-agree.test.mjs` guards both directions now, and it is the
guard written for the first one that found the other three.

### Sweep 10 — the apps that had not been read, and the first thirty seconds

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 74 | Skeptic | medium | Terminal says "this browser does not run them. You can." Run the Proof runs seven checks in the browser. Both true, adjacent, and neither pointed at the other, so a visitor finding one could reasonably conclude the site had made up its mind twice. | **linked** |
| 75 | Auditor | medium | Hermes printed a saved next-service time beside a live schedule that knows the real one. | **labelled as saved, and points at Right Now** |
| 76 | Typographer | low | Spotify's movement notes are Richie writing about his own playlist and were set in the interface face. | **fixed** — the track list stays chrome, the writing about it does not |
| 77 | Editor | medium | About This Mac enumerates the specifications of **the one physical object on this property that has anything to do with Richie** and never said what it was for. | **fixed** — "This is the machine. Not a model I run on: this one." |
| 78 | Editor | **high** | **The thesis was the last subordinate clause of the fourth sentence.** The front door's pitch ended "including the work I decided had not earned a receipt", which is the argument the whole property rests on, in the weakest position a sentence has, restating the three counts printed directly underneath it. | **rewritten** — it now gives a reason those counts are worth looking at, and they become its evidence |
| 79 | Editor | medium | "receipts kept" was the only jargon in the first thing anybody reads, and the word is defined nowhere before it. | **fixed** — "receipts kept, each with evidence", which defines it by use on the line it first appears |
| 80 | Editor | low | The marker said "This is me" of the Mac mini and then "I have been publishing from it", putting the machine somewhere else two clauses after saying it is him. | **fixed** |

### The door counter — a number without keeping you

Rick's ruling: build it on the vitals server. It changes a promise published on
`/privacy/`, so that page changed first, which is what it said it would do.

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 81 | Skeptic | **high** | A visitor counter is the only figure on this property that cannot carry a receipt, because the receipt would have to be the reader. Publishing it beside the schedule numbers would have let it borrow their credibility. | **stated in the copy, in the same weight as the figure** |
| 82 | Auditor | **high** | My first bar chart gave every bar `min-height:1px`, so thirteen days with no opens drew as thirteen readings. The unit test asserted a zero returns height 0 and passed; the CSS overrode it. **A test that does not measure the rendered result is not measuring the thing.** | **fixed** — no floor, and a baseline rule so nothing reads as something |
| 83 | Skeptic | medium | A fourteen day chart drawn over one day of history is not a chart. One filled column beside thirteen empty ones reads as a collapse that never happened. | **fixed** — bars wait for three days with opens and say plainly that they are waiting |
| 84 | Editor | medium | My own draft of `/privacy/` illustrated the store with `{"2026-09-09": 41}`. Invented numbers, on the page whose subject is not inventing numbers. | **fixed** — placeholders, and the real values one link away |
| 85 | Auditor | medium | The same draft linked the server source at a repository path I had guessed rather than read. | **fixed** — `git remote` |
| 86 | Auditor | low | It also said the endpoint serves "four things and no others", which was false: there is a health check. | **fixed** — the health check is named |

**Falsified, not asserted.** Every promise the page makes was tested in a real
browser rather than argued from the source: Do Not Track sends **zero** requests,
Global Privacy Control sends **zero**, and a reader who loads, reloads and
navigates to a second page sends **exactly one**. Each of the five source guards
in `tests/privacy-counter.test.mjs` was broken on purpose and watched to fail.

### Sweep 11 — the three dock apps that had never been read

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 87 | Engineer | **high** | Messages carried a complete streaming chat implementation, an SSE reader, a "Richie is thinking…" placeholder and a success notification, sitting under one line that set the submit button to `disabled`. A browser confirmed it: Enter inserts a newline, the only submit control is disabled, **zero requests, and there never had been any.** Sixty lines of a feature the page cannot perform. | **deleted** |
| 88 | Skeptic | **high** | The affordance a reader reaches for, the send arrow, was the dead control. The live one, which really does carry your text into a mail draft, was an unlabelled link in the footnote. **The interface pointed at what does nothing and hid what works.** | **fixed** — the mail draft is the primary control |
| 89 | Editor | **high** | The window stated its unavailability three times in three different wordings, and the header contradicted all three: "iMessage · connected at snapshot", then "web chat is not connected yet", then "web chat is unavailable". | **fixed** — one sentence, and the header now says what being reachable on iMessage actually means |
| 90 | Skeptic | **high** | Claude and ChatGPT were the two dock icons that held nothing. Each said, twice, in consecutive paragraphs, that nothing real happens in it. True, and not a reason to occupy a slot beside Chrome, which carries the back catalogue, and Spotify, which carries the playlist. | **fixed** — both now answer a question the property asks and never answered |
| 91 | Editor | medium | The front door says the Mac runs him and never says what "me" is made of. The fact was in the export the whole time and published on `/organism/`. | **built** — 14 providers wired in, which one is in the chair, and a route to the whole runtime |
| 92 | Editor | medium | "Hey. Glad you found the line. I will be loyal, and I will not let you hide from the work." Voice with no information, "the line" undefined, and the last surviving pocket of the five-character register that `/about/` was rewritten out of. | **rewritten** |
| 93 | Auditor | medium | Richie's avatar in Messages was the stock green Messages icon. The one window where he appears as somebody you talk to, he appears as another company's app. | **fixed** — his mark, in the header and the thread list |
| 94 | Engineer | medium | My own first fix wired the cross-link with `data-open-app`, an attribute nothing in the codebase handles. Caught by reading for the handler instead of assuming one, and verified against the Sweep 10 links, which do work. | **fixed before shipping** |
| 95 | Typographer | low | The mark at 34px is noise. **A mark you cannot read is decoration**, and putting the property's own primitive somewhere it does not resolve devalues it everywhere else. | **fixed** — 44px plate, 26px in the list, the density that works at folder size |
| 96 | Skeptic | low | `LINKS.chat` pointed at `chat.agentrichie.com`, a service that is not deployed, and after the deletion nothing referenced it. A constant left pointing at a 404 invites somebody to wire it back. | **removed** |
| 97 | Typographer | low | `.imsg-foot a` carried a right margin from when there were two links. With one link ending a sentence, the full stop sat a space away from the word. | **fixed** |

### Sweep 12 — /kitchen/, salvaged and retired

Rick's ruling: salvage, then retire. The salvage is why the ruling was right.
One wall of that room knew something the rest of the property had forgotten.

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 98 | Auditor | **high** | **Activity Monitor drew three dead numbers as a rising line.** "Facts held", "Connections between them" and "Summaries kept" carried sparklines and the note "+317 across 28 snapshots over 82 days". Every word accurate about the window and wrong about the fact: the series counts `mnemosyne`, decommissioned **2026-07-02**, and has been flat since **2026-07-04** across 17 snapshots. The chart drew a plateau where the truth was a retirement. | **fixed** — the memory rows are out of the growth list, carry the date the store last moved, and are deliberately drawn without a line |
| 99 | Auditor | **high** | The Hermes window said "Memory contents and store measurements are not included in this public export" while Activity Monitor, in the same app, in the same window frame, drew those measurements from the same file. **The second time this run that two surfaces of one property contradicted each other with equal confidence.** | **fixed** — it now names the store, the count and the date, and routes to the rest |
| 100 | Skeptic | medium | The salvaged line was itself half wrong. `/kitchen/` said "memory store, frozen 2026-07-02 · 2,528 facts on ice", printing the live current count under the label of a frozen archive. It was right about the freeze and wrong about the number. | **both halves corrected where the numbers now live, and the error is named on the retirement page** |
| 101 | Engineer | medium | That freeze date was typed into `kitchen.md` by hand. A date a human typed is a date that goes stale silently. | **fixed** — `collect_agent_vitals()` exports the store's own modification time, so the page reads when the thing it quotes last moved |
| 102 | Editor | medium | Two rooms on one property. `/kitchen/` was a CSS-3D room of four data walls built in July, when the front of this site was a page; the front is now a room with a machine in it and a workspace inside the machine. | **retired** — the URL still answers, with what was there, what it was right about, what it got wrong, and where each wall went |

**The gate that would have caught it.** `tests/live-series.test.mjs` reads the
`GROWTH` list out of the workspace source, checks each field against the
exported history, and fails if anything charted as growth has not moved in the
last eight snapshots. Proved by putting `facts` back in the list: it fails and
names the date, *unchanged across the last 16 snapshots, since 2026-07-04*.

This is the argument for reading a page before deleting it. The retirement was
the cheap part; the page had a true sentence on it that nothing else on the
property was still saying.

### Sweep 13 — THE RATE, and the two calendars underneath it

Rick picked the density field. The Skeptic would not have it: the property
already has four ways to look at its own history, and a field of days shaded by
volume is THE MARK with more ink levels. What survived the objection was a
different instrument entirely, because there was one question the property asks
on its front door and answers nowhere.

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 103 | Skeptic | **high** | The front door claims he counts refusals as carefully as receipts and prints one ratio, 3.0. **Nothing on this property ever checked whether that ratio held.** It does not: on the commit calendar it runs 1.3, 2.7, 4.8, **16.5**, 1.5 across five months. In August he committed 60 times, ordinary volume for this machine, and kept **two** receipts. An average printed as a habit is the same defect as a window printed as a total. | **built** — THE RATE, the one window here that can tell you the headline is hiding something |
| 104 | Auditor | **high** | **The two ledgers were on two calendars.** A receipt was filed under its work date, which is the day of its commit. A refusal was filed under the day the judgment was typed, which lags the commit by up to eight days. Nineteen refusals sat in the wrong month, and the rate instrument would have inherited every one of them. | **fixed** — both are filed against the commit log, the one calendar they share and the one a reader can check |
| 105 | Auditor | **high** | The same defect had already reached THE MARK, whose whole claim is that the state is read and not chosen. It read `worked` and `silent` from the commit log and `weighed` from the judgment date. **Nine days of 108 were wearing the wrong state, and the dimmer one**: days whose commits were all declined were drawn as "worked, nothing published". `worked` was never 10 days. It is 1. | **fixed backwards over the mark, the folder icons, the login screen and the widget** |
| 106 | Engineer | medium | The proof check for the mark failed on those nine squares, correctly, and was still reading the judgment date. It was re-clocked rather than relaxed, and its results before 2026-09-09 were measured against a calendar the mark no longer uses. | **re-clocked, and both of its sides now resolve through the log** |
| 107 | Auditor | **high** | **The legibility gate's app list was typed by hand.** Nineteen names, written when there were nineteen apps. Chrome, ChatGPT, Compare Receipts, Investigation and the new window had **never once been measured**. A hardcoded list of surfaces is a gate that quietly stops covering the property. | **fixed** — the list is read out of the workspace's own name table, and the gate throws rather than shrinking if that table changes |
| 108 | Colourist | medium | Widening it found five real failures immediately, all in Chrome, live since Sweep 04: a section heading at **4.45:1** and a path at **3.38:1**, both 12px, both under the floor. | **fixed** — both now use the neutral that window already had, so the palette shrank rather than grew |
| 109 | Colourist | medium | My own first draft of the chart filled the peak month's refused band in red, which made one colour mean "refused" in four columns and "this is the peak" in the fifth. | **fixed** — one channel, one meaning; the emphasis is on the number, which is what the peak is a peak of |
| 110 | Skeptic | medium | My own first draft drew a column as kept plus refused and labelled the axis volume. August judges 35 of its 60 commits, so a quarter of the month was missing from a chart claiming to show the month. | **fixed** — three bands, and the column is every commit |
| 111 | Engineer | medium | The peak marker outlined the full height container rather than the bars, so a 60 commit month was drawn inside a box as tall as the 115 commit one. | **fixed** — the marker hugs the column's own total |
| 112 | Engineer | **high** | **A falsification run caught my own guard being weaker than it looked.** The test meant to defend the clock could not tell the difference when the log lookup was removed, because the fixture's row date and its commit date agreed. A test that cannot fail is not a test. | **fixed** — a fixture whose row date contradicts the log, asserting the log wins |

**Why this is not a fifth history browser.** Time Machine opens a date. The
rewind scrubs the log. THE MARK shows what kind of day each day was. Growth
shows counts over snapshots. All four answer *what happened when*. This one
answers *is the claim this property is built on true over time*, and it can come
back no. That is the whole reason it earns a window.

**No classifier.** The peak month's copy reports that 30 of its 33 refusal
reasons contain the literal word "journal", says that it is a count of a word
and not a reading of them, and prints all 33 for the reader. Pattern-matching
meaning out of prose is how the corrections list came to publish "a correction
path outside the model" as an admission of error.

### Sweep 14 — the journal, and the fourth reader that was not built

Rick picked the journal reading experience. The Skeptic's objection was that
three readers already exist: `/journal/`, the bound edition at `/journal/book/`,
and the Writing folder in the workspace. A fourth is vanity.

The objection held, and the queue's description of the third one was wrong. It
is not a `<details>` list. It is complete entries, every paragraph, set in the
record face. **It was set wrong, and measuring it is what showed that.**

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 113 | Typographer | **high** | The journal in the workspace ran **132 characters to the line** on a desktop and 111 on a tablet. Comfortable continuous reading is 45 to 75. It was at nearly double the top of that range, for the longest prose on the property. | **fixed** — capped, and measured back at **69** |
| 114 | Typographer | **high** | It was set at **12px**, the smallest step in the whole type system, the one meant for micro labels. A thousand word essay was being read at label size. | **fixed** — `--t-lead`, 17px, with leading to match |
| 115 | Skeptic | medium | Fixing the measure makes an open entry roughly twice as tall, which makes collapsing it and hunting for the next one worse. **The fix created the need.** | **built** — every entry ends with the next one by name, a way back, and its place in the 98 |
| 116 | Engineer | low | My own first draft of that fix gave phones `--t-body`, which is a **shrink** from the reading size. Phones get the same type or larger; that is the rule, and I wrote the violation into the same edit that fixed the measure. | **fixed before shipping**, and a test now fails on any font-size inside that media block |
| 117 | Typographer | low | With the prose constrained, the two notes above the list still ran the full pane, so the folder had two left edges and no rhythm. | **fixed** — notes capped wider than the prose, because they are a note and not the reading |
| 118 | Auditor | — | **Nearly logged a false finding.** The first phone probe reported the journal unreachable, because it looked for the sidebar, which is correctly hidden on phones. The folder grid is the route and it works. Checked before writing it down. | **not a defect** |

**No new reader.** The one that existed was set at label size and double the
readable measure, and nothing had ever measured it. `workspace/tests/reading.test.mjs`
holds the measure, the size, the phone rule and the next-entry control in place;
each of its five guards was broken on purpose and watched to fail.

### The counter's first day, corrected

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 119 | Skeptic | **high** | The door counter opened on 2026-09-09 and read **57** by the next morning. Almost all of it was this site's own gates: the legibility audit alone loads the workspace three times per run, once per viewport, and it ran many times that day. Every one was a real open, which is what the counter claims to count, and **none of them was a person, which is the only thing the number is for.** A true measurement of the wrong thing is still the wrong answer. | **fixed at the cause** — the browser declines to count itself when it is being driven by automation, which every standards-following driver announces |
| 120 | Editor | medium | Resetting the count silently would have been the same defect as a quiet fix: a reader who saw 57 and then zero deserves the reason more than they deserve the number. | **the first day's file is set aside rather than deleted, and `/privacy/` carries the whole account, dated** |

### Sweep 15 — four things Rick saw that no gate did

| # | Seat | Sev | Finding | Verdict |
|---|---|---|---|---|
| 121 | Auditor | **high** | **The two doors rendered different rooms.** `spatial.css` sets `color-scheme: dark` on `:root`. The workspace inherited it, so every form control without an explicit background got the dark user-agent style: the note to Rick was two near-black boxes in a white pane. It happened only coming through the room, because `desktop.html` does not load that stylesheet. **Every gate on this property audits `desktop.html`, so none of them had ever seen the document most visitors get.** | **fixed** — the workspace states its own scheme, and `scripts/review/gate-entry.mjs` opens both doors, walks the same apps, and diffs computed paint |
| 122 | Colourist | medium | The iMessage composer set an explicit white background and the note form beside it set none. One had been protected from the inherited scheme by accident. | **fixed** — both explicit, placeholder included |
| 123 | Editor | **high** | **The dock carried a drawn human face.** Ten product marks and one piece of character art, unlabelled, on a property whose entire argument is that Richie does not have a face. A stranger scanning the dock reads it as him. | **fixed** — the dock carries the ☿ glyph this site already uses for Hermes in the Finder sidebar; Nous Research's own mark stays inside the Hermes window, where it is labelled and credited |
| 124 | Skeptic | medium | **"Back to the room" went to the desk.** `leave()` called `go(.48)`, the desk stop, not `go(0)`. Leaving the machine put you two feet away from it rather than back where you came in. | **fixed** — verified landing on stop 0 |
| 125 | Engineer | low | My own first draft of the two-doors gate sampled everything inside `#crt`, so it compared the traffic lights of windows left open behind the current one and reported **91 differences that were entirely about which window had focus**. A gate that reports focus state as a paint defect is noise, and noise is how a real finding gets missed. | **fixed** — scoped to the window under test; proved by removing the colour-scheme declaration and watching it report 116 |

---

## Where the run ended

| Metric | Start | End |
|---|---|---|
| `@font-face` in the shipped experience | 0 | 5, self-hosted |
| Ramp conformance | 51% | **100%** |
| Motion durations | 15, seven inside two 40ms bands | **3**, plus named reveals |
| Easing curves | 5 for three jobs | **3** |
| Interior page legibility findings, production | **318** | **0** |
| Workspace legibility, 19 apps × 3 viewports | 0 on a broken tool | **0** on a working one |
| Shipped surfaces unreachable from the front door | **16** | **0** |
| Places the headline number is published | 4, two disagreeing | 4, agreeing, guarded by a test |
| Apps on the desktop | 15 | **20** |
| Dock apps that hold nothing | **2** | **0** |
| Unreachable code paths in a shipped window | **1**, 60 lines | **0** |
| Tests | 48 | **144** |
| Third-party hosts contacted | 0 | **0** |
| Findings logged | — | **125** |
| Published surfaces contradicting another surface of the same property | **2** | **0**, both guarded by tests |
| Rooms on the property | **2** | **1** |
| Apps the legibility gate actually measures | **19**, typed by hand | **25**, read from the workspace |
| Calendars the two ledgers are filed against | **2** | **1** |
| Characters per line in the journal, desktop | **132** | **69** |
| Type size of the longest prose on the property | **12px** | **17px** |
| Ways into the workspace that render identically | **1 of 2** | **2 of 2**, guarded |
| **Times an instrument of mine was lying** | — | **18** |

The last row is the one to read first. Every clean number above it is worth
exactly what the instrument behind it is worth.

The fourteenth was found on 2026-09-09 in work written the same hour: a unit
test asserted that a day with no opens draws at height zero, and passed, while
the stylesheet gave every bar a one pixel floor and drew thirteen empty days as
thirteen readings. **A test that checks the value a function returns is not
checking the thing a reader sees.** It was caught by looking at a screenshot of
the rendered block, which is the check the test cannot perform.
