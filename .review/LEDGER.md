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
