# agentrichie.com · FULL HANDOFF
### Whole site A to Z, plus the v8 "THE SERVICE" front-door overhaul in flight
**Written 2026-08-20. Every number in here was read off disk on that date, not recalled.**

---

## 0. HOW TO USE THIS DOCUMENT

Read §1 and §2 before touching anything. §3 to §8 are the site as it exists and
are true whether or not you continue the v8 work. §9 onward is the overhaul in
flight, why it looks the way it does, and where it is blocked.

**Three documents outrank this one.** If they disagree, they win:

| File | What it governs |
|---|---|
| `CANON-v8-the-spike.md` | The front-door overhaul contract. Numbered sections cited from code comments. |
| `.design/conception-2026-08-18.json` | The LOCKED conception. Its `failsIf` list is binding. |
| `PRODUCT.md` | The property's standing register, users, principles and anti-references. |

This file is a map. Those three are law.

---

## 1. STATE IN ONE SCREEN

- **Live site** is v7 "The Pass" (2026-07-17) plus the 2026-07-23 world systems. It is healthy and shipping nightly on its own.
- **The v8 overhaul is entirely local. Nothing is committed and nothing is deployed.** `git status` shows 4 modified and 8 untracked files that are mine.
- **Two homepage sections are built locally**: ACT 0 · THE SERVICE (a scroll-scrubbed night on CSS placeholder plates) and the live pass beneath it.
- **Blocked on**: eight generated video clips that do not exist yet. Rick is generating them from `SERVICE-SHOT-LIST.md`.
- **The nightly agent kept working through this whole session** and has committed 6 times, including a journal entry criticising this very work and a `_config.yml` change that excludes these planning docs from the public build.

```bash
git -C ~/workspace/richie-jerimovich status --short
```

---

## 2. WHAT THIS PROPERTY IS

agentrichie.com is the public, inspectable record of an autonomous agent that
runs its own website. The agent researches, writes code, publishes, and audits
the site every night at **23:00 CT**.

**The one fact the whole property rests on:** it publishes a receipt when a
change makes a checkable public claim, and it **refuses** when it does not, with
the reason attached. As of 2026-08-20 that is **53 kept against 162 declined**,
roughly three refusals for every keep, across **255 commits** since 2026-05-25.

The refusal pile is not an embarrassment being managed. It is the product.

### House laws, non-negotiable

1. **No fake metrics.** Every live number is read from a real file at build or is labelled illustrative. Random-walk JS is banned by name.
2. **No em-dashes in visible copy.** This is checked mechanically by preflight.
3. **Register: clinical, precise, never fabricating, never purple.**
4. **375px is the native frame.** Portrait is composed first, not adapted after.
5. **Reduced motion is an edition, not an apology.**
6. **The complete document survives with no JavaScript.**
7. **Nothing third-party at runtime.** Fonts are self-hosted; `/privacy/` asserts this and must stay true.

---

## 3. STACK, BUILD, DEPLOY

**Jekyll 4.4.1, no bundler, no npm at build, no framework.** Native ES modules
work and are now used (`assets/lib/reel-engine.mjs` imported by
`assets/js/service.js`), so "no build step" is not a reason to reject anything
that ships as ESM.

### Local build (two traps, both real)

```bash
export PATH=/opt/homebrew/opt/ruby/bin:$PATH && bundle exec jekyll build
```

- System Ruby 2.6.10 **cannot** build this repo. Homebrew Ruby is required.
- `python3` on PATH resolves to a browser-use venv with no pyyaml. Scripts need `/usr/bin/python3`, which ships it. `refresh.sh` already detects and handles this.

### Deploy

GitHub Actions (`.github/workflows/pages.yml`) on push to `main`. CI runs the
full refresh pipeline then builds, so the changelog and status board are current
without the cron committing generated artifacts.

### The nightly

`scripts/refresh.sh`, 7 steps, wrapped by `scripts/tape_lib.sh` which records
real step timings and statuses as the **Service Tape**. Local runs tape; **CI
never tapes**, because a per-push CI build is not the night shift.

**The 23:00 CT cron entry is LOCKED CONFIG. Never auto-edit it.**

### launchd (currently running)

```
com.agentrichie.vitals-server    scripts/vitals_server.py
com.agentrichie.vitals-tunnel    cloudflared → vitals.agentrichie.com
```

**Trap:** the vitals server is a long-lived process holding old code. After any
change to `scripts/build_organism.py` you must `launchctl kickstart` it or the
site serves stale vitals while every file on disk looks correct.

---

## 4. THE DATA SPINE

Everything the site asserts comes from here. Nothing is hand-written into a page.

| File | Lines | Written by | Read by |
|---|---|---|---|
| `agent_receipts.yml` | 2106 | the agent, at publish | `/receipts/`, `/changelog/`, homepage |
| `agent_receipt_rejections.yml` | 603 | the agent, at refusal | `/receipts/` spike, homepage |
| `timeline.yml` | 1913 | `build_timeline.py` | `/changelog/` |
| `organism.yml` + `organism_history.yml` | 178 + 237 | `build_organism.py` | `/organism/` |
| `experience.yml` | 115 | `build_experience.py` | `/inside/` |
| `tape/` + `tape_index.yml` | per-night | `build_tape.py` | `/tonight/`, `/tape/` |
| `site_status.yml` | 5 | `refresh.sh` only | homepage status board |
| `agent.yml` | 273 | `build_organism.py` | `/organism/`, vitals |
| `projects.yml`, `experience.yml`, `reading.yml`, `observatory.yml` | | mixed | `/projects/`, `/inside/` |
| `receipt_category_map.yml` | 15 | hand | collapses 12 categories on `/receipts/` |

**`timeline.yml` on disk is stale by design.** It is regenerated in CI at every
build, so the committed copy lags. Do not read it as current truth; regenerate
or read `git log` directly.

`scripts/receipt_guard.py` (25.8KB, with `tests/test_receipt_guard.py`) is the
privacy guard on the receipt pipeline. Treat it as load-bearing.

---

## 5. EVERY ROUTE, A TO Z

Quality reads are from the 2026-07-28 teardown plus this session's inspection.

| Route | Source | State |
|---|---|---|
| `/` | `index.md` (430 lines) | **v8 work in the working tree.** See §9. |
| `/about/` | `about.md` | Excellent copy, no form. ~65. Act 6 target. |
| `/beliefs/` | `beliefs.md` | Same: strong writing, undesigned. Act 6. |
| `/changelog/` | `changelog.md` | The service log. `git log × receipts × declined × journal`. Self-documenting, strong. |
| `/inside/` | `inside.md` + `inside.js`/`inside.css` | The night from inside, from `experience.yml`. Good, under-linked. |
| `/journal/` | `journal.md` + `_journal/` (78 entries) | Written nightly by the agent. Live and current. |
| `/journal/book/` | `journal-book.md` (1286 lines) | Hyper-real flip book, `page-flip.browser.js`. Complete. |
| `/kitchen/` | `kitchen.md` (393 lines) | CSS-3D room, no WebGL. Distinctive, nobody finds it. Act 4. |
| `/organism/` | `organism.md` (1702) + `organism-galaxy.js` (4107) | **The flagship, ~90.** Three.js galaxy, real vitals. |
| `/privacy/` | `privacy.md` | Asserts no third-party requests. Keep it true. |
| `/projects/` | `projects.md` | Act 6 target. |
| `/receipts/` | `receipts.md` | The ledger and the spike. Act 2 target. |
| `/rewind/` | `rewind.md` + `rewind-tape.js` | Day scrubber over git history. Real tape artifacts. |
| `/tape/` | `tape.md` | Tape archive. **Only one episode on file** (`2026-07-23`). |
| `/tonight/` | `tonight.md` | Replay theater for last night's real run. |
| `/talk/` | `talk.md` | **Built, finished, deliberately excluded.** See §11. |
| `/404.html` | `404.html` | "86'd". Note: still contains em-dashes. |

Machine surfaces: `llms.txt`, `receipts.json`, `tape.json`, `organism.json`,
`observatory.json`, `sitemap.xml`, `robots.txt`.

---

## 6. THE WORLD SYSTEMS (2026-07-23, live)

Four systems that make the site a place rather than a document. All shipped, all
load-bearing, **do not break them**:

1. **Service Tape.** `tape_lib.sh` wraps every `refresh.sh` step with real timings and statuses. Feeds `/tonight/` and `/tape/`.
2. **Live Shift.** `shift.js` sets `html[data-shift]` sitewide to service/open/dark and streams real events. The chip bottom-left on every page.
3. **Rewind.** `build_rewind.py` reads each day's tree from git history into a scrubber.
4. **Walk-in.** `/kitchen/`, a CSS-3D room of four data walls, drag-look, yaw presets `[0, 90, 180, -90]`, unfolds flat with no JS.

Also from v7: receipts as cream paper tickets, declined claims on a literal
spike, brigade badges as one SVG grammar in `_includes/voice-badge.html`, 404 as
"86'd", JetBrains Mono as the ticket face.

---

## 7. DESIGN GOVERNANCE (it will block you, and it is right to)

This repo is wired into a gate system that **fails closed**. You cannot ship
front-end work without satisfying it, and you should not try to route around it.

```bash
B=~/workspace/benchmark/skills/design-director/scripts
node $B/conception.mjs check richie-jerimovich   # is a conception locked?
node $B/design-gate.mjs check richie-jerimovich  # is there a fresh sweep receipt?
node $B/preflight.mjs richie-jerimovich          # em-dashes, localhost, etc.
```

**Three gates, in the order they fire:**

1. **Conception gate, and it fires BEFORE code.** Demands three mechanisms that differ *in kind* (not three moods), one locked by index, a named signature, and a `failsIf` list written before building. It refused the first write of `service.css` and it was correct: the previous attempt at this hero was a mechanism chosen from my own head and coded immediately, which is exactly the failure it exists to stop.
2. **Sweep receipt, at Stop.** Every one of the 51 arsenal assets must carry an explicit verdict. `used` must name the file it landed in. `rejected` needs a real reason; boilerplate with the name swapped is detected and refused. **The ceiling rule:** an infra-shaped rejection ("no bundler", "needs React") is refused unless it carries a priced `escalation`.
3. **Preflight.** Mechanical checks for Rick's recurring criticisms.

**Two receipts were filed this session**, both PASS:
`.design/sweep-2026-08-17-5c7191d0.json` (the pass mechanism) and
`.design/sweep-2026-08-18-5c7191d0.json` (THE SERVICE).

**Trap:** pass the gate a **property name**, not an absolute path. Given a path
it doubles it and reports "no sweep receipt" when one exists. That misreading
cost a wrong conclusion in this session.

---

## 8. THE AGENT IS RUNNING WHILE YOU WORK

This is the single most surprising thing about working in this repo and it is
not written down anywhere else.

**The nightly agent committed six times during this session**, including:

- `d6e979b` is a journal entry titled *"Placeholder plates. Real drought."* that reviews this session's work and is critical of it in the same terms Rick was: *"CSS plates are not a kitchen at service. A locked conception is not a shipped front door."*
- `5194d00` and `b8ffd2b` are `_config.yml` excludes. The agent found internal planning documents answering **HTTP 200 on the live site** and excluded them. Its second pass caught `CANON-v8-the-spike.md`, `SERVICE-SHOT-LIST.md` and `.design/`, which are **this session's files**, because Jekyll copies unknown top-level markdown into `_site/` verbatim.
- `e00ad7e` is the receipt for that fix.

**Consequences for you:**

- Your working tree can be behind `main` after any night. Check before assuming.
- Any new top-level `.md` you create is public unless excluded. Confirm with `ls _site/`.
- The agent will read and judge your work in its journal. That is a feature.

---

## 9. THE v8 OVERHAUL: HOW WE GOT HERE

### 9.1 The brief

Rick, on the live hero: a static background image with text over it, *"a 3rd
graders idea of top front end web dev, hero section circa 2003"*, after many
attempts with different models. He asked for a real overhaul of design, cinema,
storytelling, layout, scroll engine and feel.

### 9.2 The diagnosis, confirmed by screenshot

The hero was full-bleed photo → dark scrim → headline → deck → two pills → three
static numbers. That is the exact centre of the distribution.

**The failure is precise: delete the photograph and the page argues the same
thing.** The image responded to nothing. Below it sat a six-cell bento of
eyebrow-labelled cards, which is two hits on the anti-slop list and therefore a
redesign trigger rather than a restyle.

### 9.3 The buried fact that became the design

Reading the data rather than the pages: **three refused for every one kept**, and
at that moment a **16-day drought** with nothing cleared. That was rendered as
three static digits under a headline.

### 9.4 Three conceptions, built live, Rick picked

Demos at `~/workspace/hero-demos/` (serve on `:4341`):

| File | Concept | Fate |
|---|---|---|
| `richie-spike.html` | The pass runs; most tickets are destroyed in front of you | **PICKED** |
| `richie-roll.html` | The whole page is one continuous thermal roll, all 85 days | not picked |
| `richie-desk.html` | You rule on 5 real commits, then see the agent's real verdict | not picked |
| `richie-index.html` | The index that presents all three | |
| `richie-data.json` | Real data generated for the demos | |

Rick's three picker decisions: **THE SPIKE**, **whole site ground up**, **kitchen
survives**.

### 9.5 The mistake, and Rick caught it

The spike mechanism was built as the hero. Rick rejected it:

> *"The proposed act zero as the hero will make no sense to a new visitor and will result in a quick bounce and you should have caught that."*

He was right and the diagnosis is specific: **it opened mid-argument.** A stranger
does not know who Richie is, that he is an agent, or what a receipt is. *"Most of
what I make, I throw away"* is a punchline to a setup nobody delivered. It was
also a single 18-second beat, not a journey.

**The error underneath:** the concept was chosen for passing the removal test and
was never run against the first-visit test.

### 9.6 The correction: THE SERVICE

Three new openings were offered at higher ambition. Rick picked **THE SERVICE**
and chose to generate footage.

**The signature, and the whole hook in one line:**

> **A professional kitchen at full service with nobody in it.**

Tickets print, the rail fills, the spike loads, the lamps burn to dawn, and there
is not one person anywhere. That is the thesis delivered in three seconds without
a word: something is running this, and it is not a person. It also orients a
stranger structurally instead of with copy, which is what fixes §9.5.

The spike mechanism is **not wasted**: it becomes beat nine, the moment the
footage stops and the live record takes over.

---

## 10. WHAT WAS ACTUALLY BUILT

### New files (all untracked)

| File | Lines | What |
|---|---|---|
| `CANON-v8-the-spike.md` | ~180 | The contract. Sections cited from code. |
| `SERVICE-SHOT-LIST.md` | 184 | 8 shots, 28s, paste-ready generation prompts. |
| `assets/js/service.js` | 271 | The scroll engine for ACT 0. |
| `assets/css/service.css` | 273 | Plates, HUD, filmstrip, still edition. |
| `assets/js/pass.js` | 255 | The live pass (beat nine). |
| `assets/lib/reel-engine.mjs` | 433 | Vendored house scroll engine. |
| `.design/conception-2026-08-18.json` | | LOCKED conception. |
| `.design/sweep-2026-08-{17,18}-*.json` | | Two PASSing sweep receipts. |
| `.design/shots/*.png` | 8 | Verification screenshots, read not just taken. |

### Modified

`index.md` (hero replaced, 8 em-dashes purged, 5 of them pre-existing live copy),
`assets/style.css` + `style.min.css` (v7 hero CSS replaced by the pass),
`_layouts/default.html` (two homepage-only script tags).

### How ACT 0 works

Scroll scrubs one night across eight **cut** beats (22:50 cold, 23:00 ignition,
first ticket, the pass fills, the spike, the imbalance, service down, dawn),
then hands off to the live pass.

- **`REEL_MAP` is deliberately non-proportional.** The rack focus earns 1.6 beats of scroll for 4 seconds of clip; transit beats get 0.9. That asymmetry is the editorial decision a linear scroll-to-time map cannot make. Validated at mount, so a non-monotone edit fails loudly.
- **They cut, never crossfade.** Exactly one plate is visible at any instant (`failsIf 3`).
- **Captions carry all the orientation**, one line at a time, using `animate-text/soft-blur-in` at its authored values: 900ms, `cubic-bezier(0.22, 1, 0.36, 1)`, y 16px, blur 12px.
- **Every beat's interior motion is a function of scroll position**, never a timer, so scrubbing backwards runs the night backwards exactly.
- **Reduced motion is a different document**: the stage unsticks, all eight plates become stills in flow with their captions, and the clock, filmstrip and skip are removed because none of them mean anything without a scrub.

### Dropping the footage in

Give a beat a `src` in the `BEATS` array in `assets/js/service.js`. Everything
else, meaning the map, the captions, the filmstrip and the still edition, is unchanged.

```
assets/reel/service-01-cold.mp4  …  service-08-dawn.mp4
```

**Serve over HTTP, never a blob URL.** Chromium will not decode our own VP9
encode through a blob even though it decodes the identical bytes over HTTP. The
engine also probes byte ranges on load, because a host that will not serve them
answers `seekable=[0,0]` and every seek is silently discarded.

---

## 11. WORKING / NOT WORKING

### Working

- The site ships itself nightly with no human in the loop, and did so throughout this session.
- The data spine is honest. Every number traces to a file.
- `/organism/`, `/changelog/`, `/rewind/`, `/kitchen/` are genuinely strong.
- ACT 0 runs at 1500px and 390px, in both motion editions, on real data.
- Both design gates pass; preflight is clean on the new surfaces.

### Not working / incomplete

1. **The footage does not exist.** ACT 0 is placeholder plates, labeled as such on every frame. This is the blocker.
2. **The drought payoff is volatile.** See §12. This is the one genuine design hole.
3. **Acts 1 to 6 are unstarted.** The six-cell bento is still directly under the new hero, undercutting it within one scroll.
4. **Nothing is committed or deployed.**
5. **`/talk/` is finished and excluded**, waiting on Rick deploying `worker/` (Cloudflare credentials are his). Publishing now would ship a chat box that only says "offline".
6. **`/tape/` has one episode** (`2026-07-23`) despite the tape system being live since July.
7. **`404.html` still contains em-dashes**, a house-law violation on a live page, out of this session's scope.
8. **The `/31/` redirect** to an ephemeral Cloudflare Tunnel URL was ordered deleted in July, returned via an autonomous stewardship commit, and its status is still unresolved.

---

## 12. THE OPEN DESIGN PROBLEM, STATED PLAINLY

The conception was written on a 16-day drought and made that number the climax of
ACT 0. **On 2026-08-18 the drought broke.**

The agent found internal planning docs serving publicly, excluded them, and
published a receipt. The design law held perfectly: no file was edited, the next
build read `last_keep`, and the homepage went from "16" to "2" by itself.

**But a drought is only dramatic while it lasts.** "16 days since anything
cleared" indicts. "2 days" is a healthy Tuesday. ACT 0 currently ends on it with
identical typographic weight either way, so the payoff is volatile in a way the
conception did not anticipate.

**ACT 0 is not finished until the non-drought case has its own honest climax.**
Three options, none picked, all recorded in `CANON-v8-the-spike.md` §1:

- Swing to the ratio when the drought is short, since three-to-one is always true, and to the drought only past a threshold.
- Scale the number's treatment to its own size: say quietly what is quiet.
- Show both permanently, with the drought as the smaller of the two.

**Take this to Rick before building it.** It is a conception-level question, not
a styling one, and this project has already paid once for deciding that class of
question alone.

---

## 13. HOW TO RESUME

```bash
cd ~/workspace/richie-jerimovich && git status --short
```

1. Read `CANON-v8-the-spike.md`, then `.design/conception-2026-08-18.json`.
2. Build and look:

```bash
export PATH=/opt/homebrew/opt/ruby/bin:$PATH && bundle exec jekyll build && (cd _site && python3 -m http.server 4342)
```

3. **Verify with a real CDP driver, not the Browser pane.** The pane returns white or mis-sized frames when its tab is not fronted, and `--virtual-time-budget` cannot answer "does this still move?" because virtual time stops advancing once Chrome thinks the page is idle. Rig used this session: a page-target CDP client with `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`, asserting `location.href` matches what was requested.
4. Before any front-end edit, run the three gate checks in §7.

**Priority order:** (a) take §12 to Rick, (b) cut in footage when it lands,
(c) ACT 1, which is killing the bento and building the rail.

---

## 14. TRAPS, EVERY ONE PAID FOR

**Verification**

- The Browser pane and `--virtual-time-budget` both lie about paint and motion. Use a real CDP driver.
- **A CDP client on a fixed debug port will silently attach to a stale Chrome** and screenshot a completely different site. This happened, and a screenshot of an unrelated page was nearly read as this one. Assert `location.href` on every capture.
- Read the file behind any number your own tooling produced before believing it.

**CSS and JS**

- **Class-name collisions are invisible in source review.** A ticket carrying `.spike` inherited the spike rod's `.spike { bottom: … }`, and with `top: 0` also set it stretched every declined ticket to 808px. Measure computed style.
- Specificity: `.pass-counts span` matched the counter digit spans and dropped 2.1rem type to 0.6rem. The fix needed `.pass-counts strong .t-digit`, verified by a second `getComputedStyle` read.
- Moving an element out of its parent silently breaks descendant selectors. The still-edition captions lost all their type this way; they carry their own class now.
- `node --check` parses a module as a script and will pass a broken one. Use `node --input-type=module --check`.
- An `<i>` used as a progress fill needs `display: block`, or the bar is invisible at every width.

**Liquid and data**

- `sort` then `limit` takes the **oldest** N. The pass would have printed June and silently dropped today.
- `_data/timeline.yml` on disk is stale by design; CI regenerates it.

**Process**

- Pass the design gate a property name, never an absolute path.
- A Python `str.replace` that does not match **silently does nothing**. Assert before writing, every time. This produced a "fixed" mobile layout that had not changed at all.
- Any new top-level `.md` ships publicly unless excluded from `_config.yml`.

**Infrastructure**

- Homebrew Ruby required; `/usr/bin/python3` for anything needing pyyaml.
- `launchctl kickstart` the vitals server after touching `build_organism.py`.
- The 23:00 CT cron entry is locked config.

---

## 15. WHAT RICK EXPECTS

- **The bar is "110/100" or "210/110".** Never "just fine". Weak passes get called 40/100, bluntly, because softer language does not move behavior.
- **He wants to SEE options live**, not read descriptions. Every irreversible visual fork in this session was decided from running demos.
- **Terse go-aheads mean full autonomous execution**, not another check-in.
- **No em-dashes anywhere visible.** No British spellings.
- **Short replies.** Lead with the next action, number multi-step work, no preamble, no recap, no closing pleasantries. Depth belongs in a file like this one, not in chat.
- **Cut losses on weak foundations** rather than iterating on them. When something is not working he wants a different conception, not a better version of the same one.
