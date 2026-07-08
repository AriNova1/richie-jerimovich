# Journal Book — Handoff Guide

**For:** any model continuing this work (written by Fable 5, 2026-07-02, so a cheaper model can do the last mile without losing context).
**Owner:** Rick. **Live:** https://agentrichie.com/journal/book/ (moved here from `/demo-journal-book/` at CP4 integration; still `noindex, nofollow` via the `page.robots` frontmatter key — now actually wired into `<head>` in `_layouts/default.html`, see §12). Linked from `/journal/` via a hero button (integration option (a), Rick's call, 2026-07-08).
**Read this whole file before touching anything. Read `demo-journal-book.md` next. You should not need to read anything else to start.**

---

## 1. The vision (Rick's words, distilled)

A **hyper-realistic journal/diary** as the site's journal experience: a physical book that flips with bending pages, handwritten entries that look pen-on-paper, opening on an index page "with the instrument vibe" (mood-colored, data-driven), full-screen cinematic takeover — "top work by the best design agency in the world, not a lazy coded attempt." Rick explicitly rejects: PowerPoint-style flat rotations, font-looking text, half-hearted anything. He loves **diegetic touches** ("if lost, return to agentrichie.com", the rubber stamp, the cross-out) — add more of these wherever honest.

**Checkpoint discipline (mandatory):** build → verify locally → push → confirm deploy → give Rick the LIVE URL (never localhost) → wait for his GO before the next phase. He reviews every checkpoint personally.

## 2. Status: what exists and works (as of commit `3e91410`)

| Checkpoint | Status | What it proved |
|---|---|---|
| CP1 flip engine + materials | ✅ GO from Rick | page-flip 2.0.7 soft-fold is convincing; leather/paper/handwriting pass |
| CP2 cinematic takeover + ink realism | ✅ shipped, GO implicit | full-viewport scene, ink roughening, stamp/cross-out/smudge, sound |
| CP2.1 full-page ink + ribbon removal | ✅ shipped | pages now genuinely fill; `--u` scale unit works |
| CP3 all 33 (now 35+) entries + instrument index | ✅ shipped, GO given 2026-07-08 | client-side pagination engine (§6) live; verified 0 overflow, 88.5% avg fill, real click-to-navigate index |
| CP4 polish/a11y/perf/integration | ✅ shipped 2026-07-08, see §7 | aria-live counter, Home/End keys, focusin-wake; `.jb-inked` filter scoped to ±2 spreads; mobile reverified; `/journal/` integration option (a) built (hero button + URL moved to `/journal/book/`) |

**Rick's explicit decisions so far:** ribbon bookmark = REMOVED (looked fake; don't re-add unless it can be truly realistic). Cover = will be replaced by an AI-generated image asset (he generates it in ChatGPT; prompts in §8; integration steps in §8.2). Keep sound, stamp, cross-out, marginalia, idle-fading UI.

**CP3 outcome (2026-07-02, commit `3e91410`):** the pagination engine described in §6 is implemented and shipped, not just spec'd. All 33 real entries (count grows nightly — read it live, don't hardcode "33") are bound in via `#jb-source` + client-side measurement; the opening index is real (mood dots via `moodHue()`, real folios, real stats line from Liquid `group_by`, click-to-navigate). Verified: 164 total pages (even), 0 pages over 101% fill, 88.5% average fill, folios 1–160 with no duplicates, all 3 hand-placed demo flourishes (ribbon, cross-out, margin mark, smudge) intentionally NOT auto-replicated across all 33 entries (see decision below) — only the real `Richie` signature carries over, and only on the 30/33 entries whose source actually ends with it (05-26, 05-27, 06-18 correctly have none). Two real bugs found and fixed during verification — both are now TRAPS #13 and #14 below; read them before touching pagination again.

**New CP3 decision to know about:** the CP1/2 demo entry pages had hand-placed flourishes (a cross-out, a margin "!!", an ink smudge) that made a great first impression but were curated by hand for 3 pages, not derived from real content. Auto-generating them across all 33 real entries would mean fabricating edits/marks that aren't in the source — a violation of the content-honesty law (trap #11). CP3 intentionally does NOT carry these over into the generated pages. If Rick wants them back, that's a CP4 judgment call (§10) on *how* to pick placement honestly (e.g., only where the source itself has a natural marker), not something to auto-apply.

## 3. File map

- **`demo-journal-book.md`** — THE prototype. Single file: frontmatter → SVG filter defs → scene markup (pages) → `<style>` → two `<script>` blocks (page-flip init + everything else). All classes prefixed `jb-`.
- **`assets/lib/page-flip.browser.js`** — vendored page-flip 2.0.7 (MIT), exposes global `St`. Do not update without retesting.
- **`assets/fonts/caveat-latin.woff2`** (body hand, weight 400–700 variable) and **`assets/fonts/homemade-apple-latin.woff2`** (signature/gold notes). Self-hosted, declared via `@font-face` inside the page's `<style>` only (not global CSS).
- **`demo-journal.md`** — earlier flat-page demos (A: Argument, B: Instrument, C: Reading Room). Rick liked **B (Instrument)** — its mood-spectrum concept feeds the CP3 index. Contains the `moodHue()` word→hue hash to reuse.
- **`_journal/*.md`** — 32 real entries (grows nightly). Frontmatter: `title`, `date`, `mood`, `description` (early entries lack `description`). Bodies: first 6 entries open normally; May 31 onward open with a literal `Counterargument:` paragraph.
- **`_data/journal_eras.yml`** — 4 named eras with date ranges (used by /journal/ and demo C).
- Real journal page `/journal/` (`journal.md`) — untouched; the book does not replace it yet (that's a CP4/Rick decision).

## 4. Architecture decisions (don't relitigate without reason)

1. **Soft-fold 2.5D (page-flip), not WebGL.** WebGL cloth = blurry text-as-texture, dead links, heavy. page-flip keeps pages as real HTML. This passed Rick's eye at CP1.
2. **Everything in-page scales via `--u`.** One CSS var on `#jb-holder`: `--u = renderedPageWidth / 520` px. Every metric inside pages is `calc(var(--u) * N)` where N = px at the 520×692 design size. JS `applyScale()` sets it from `pageFlip.getBoundsRect().pageWidth` on init/orientation/resize. **Never add a raw px metric inside a page** — it will break at other viewport sizes.
3. **Design page = 520×692 (ratio 0.7514).** Line grid: 29 units; body text 21; rules offset 76 from top; left margin rule at 52; body padding 76/34/0/68. Text capacity: **~10 words/line, ~19.8 usable lines, ~190 words per full page** (first page of an entry has a date header but same body start).
4. **Deterministic ink jitter.** Every word wrapped in `.jb-w` with seeded (mulberry32) rotation/baseline/opacity — same look every visit. As of CP3, dynamic entry/index content is jittered (via the shared `jitterizeBlock()` helper) BEFORE pagination measures it, not after — see trap #14 for why order matters. A trailing pass over remaining static `.jb-hand` blocks (title page, pastedowns, notepage) skips anything that already contains `.jb-w`.
5. **Fonts/textures/sound are all self-contained** — no external requests, no binary texture assets (SVG feTurbulence data-URIs), synthesized WebAudio page swish.
6. **Site chrome hidden per-page** via `body.page-journal-book header/footer { display:none }` (body class comes from `page.url | slugify` automatically — moving the permalink changes this class; it changed from `page-demo-journal-book` to `page-journal-book` at the CP4 integration when the permalink moved from `/demo-journal-book/` to `/journal/book/`, confirmed by grepping the built `_site` output, not guessed).

## 5. TRAPS — every one of these burned time; do not rediscover them

1. **Site-wide `p` color override.** Global CSS paints plain `<p>` cream (`--text`). Inside the book, paragraph color/typography comes from the scoped rule `.jb-scene .jb-hand p` — any NEW text container needs to be covered by that selector list or it renders cream-on-cream.
2. **`text-indent` inherits into inline-blocks and resizes them.** `.jb-w { text-indent: 0 }` is load-bearing. Remove it and every word collapses/piles up (TOC) or spaces out (paragraph indents).
3. **Headless preview freezes `requestAnimationFrame` completely.** Animated flips (`flipNext/flipPrev/flip`) DO NOT run in the preview browser; timers do. **Test navigation with `pageFlip.turnToPage(n)` only.** The flip animation itself can only be judged in a real browser (Rick's review, or claude-in-chrome if connected — it was down all of 2026-07-02). Audio also untestable headless.
4. **Measuring rigs must live INSIDE `.jb-scene`** or scoped selectors stop matching and you measure with wrong line-height (this produced a false "81% full" reading; truth was 65%). Rig pattern that works — clone page into a `520×692` div with `--u:1px` appended to `#jb-scene`, measure `.jb-body p:last-child` bottom vs 652 usable px. Target 90–100%, never >101% (=clipping).
5. **Hidden pages measure as zero rects.** page-flip sets `display:none` as an INLINE style directly on `.jb-page` elements it isn't currently showing (not just a wrapper) — `getBoundingClientRect` on them returns 0s, AND `cloneNode(true)` on a hidden page carries that inline `display:none` onto the clone too (bit us during CP3 verification: a clone read 0% fill until we explicitly overrode `clone.style.display='block'`). If you clone a live `.jb-page` to re-measure it, always clear/override `display` on the clone. Screenshots pump a frame; take one after `turnToPage` before DOM measurements of visible pages — `turnToPage` DOES work headless (confirmed via screenshots at CP3), our earlier pessimism about it was from checking `getComputedStyle` without pumping a frame first.
6. **Page count must stay EVEN** (currently 10). Covers and pastedowns are `data-density="hard"`; item order right now: `coverF, pastedown, title, toc, e1, e2, e3, note, pastedownBack, coverB`. Spread math with `showCover:true`: `[0] [1,2] [3,4] [5,6] [7,8] [9]`.
7. **Preview server dies silently between turns.** Always `preview_list` first; if empty, `preview_start` (config name `jekyll`), then `preview_resize` (viewport can come up 0×0 — check `window.innerHeight`).
8. **GitHub Pages deploys flake** with `##[error]Deployment failed, try again later` while githubstatus.com says all green. The BUILD is fine. Remedy: `gh workflow run "Build and deploy agentrichie.com" --repo AriNova1/richie-jerimovich --ref main` — fresh dispatch works better than `gh run rerun --failed`. Took 3 attempts once tonight. Verify what's actually live with `curl -s https://agentrichie.com/journal/book/`. Note: at CP4 integration `.jb-ui-label` was simplified from a version string (`journal · prototype · checkpoint N of 4`) down to just `journal`, since real visitors now reach this page via nav — the old "grep the version label" trick for confirming a deploy no longer applies; grep for something you actually changed instead (e.g. a copy string or class name).
9. **kramdown:** the page is one big raw-HTML block in a `.md` file; block HTML passes through untouched. Don't introduce blank-line-separated markdown inside the book markup.
10. **`_config.yml` `exclude: vendor`** does NOT exclude `assets/lib/` (root-relative match). Vendored lib ships correctly. This handoff file IS excluded (see exclude list).
11. **Content honesty is a site law.** Entry text in the book must be VERBATIM from `_journal/*.md` (the one licensed exception: a struck word before a real word, e.g. `<span class="jb-strike">cut</span> narrowed`, reading as the writer's own draft correction — use at most ~1 per entry, keep the final text identical to the source). Never invent entries, moods, dates, or stats.
12. **jQuery-era turn.js is NOT MIT** — do not swap libraries. page-flip is MIT and already proven here.
13. **Measure AFTER the webfont loads, not before.** Pagination runs in a `<script>` that executes during initial parse — the self-hosted Caveat/Homemade Apple `@font-face`s are still downloading at that instant. Measuring with the fallback font baked wrong page breaks into every page (found at CP3: 33 entries paginated into 213 pages instead of ~105–130). Fix: gate the whole pagination+build routine on `document.fonts.ready.then(boot)` (see the `boot()` wrapper in the script). Do not remove this gate.
14. **Measure the SAME representation you render — jitter changes line-wrapping.** Every word gets wrapped in a `.jb-w` `display:inline-block` span for the ink-jitter effect. An inline-block word span wraps lines slightly differently than the same plain text (confirmed at CP3: one paragraph measured 598px as plain text, 664px once jittered — a 66px, 2-line difference). If you paginate on plain text and jitter afterward, pages silently overflow. Fix: jitter FIRST (`jitterizeBlock()`), THEN paginate the already-jittered DOM — never the reverse. Relatedly: any element whose CONTENT changes after pagination measured it (e.g. the index row's folio number, filled in only once final page order is known) must be measured with a realistic-width PLACEHOLDER of the same or greater width during pagination (CP3 uses `"999"` for folio spans, since a narrower real number can only under-fill, never overflow) — measuring it empty and filling in real content later is the same class of bug as the jitter one.
15. **The preview tool's `preview_resize` does NOT fire a native `window resize` event** (confirmed at CP4) — a real device rotation does, but the CDP-driven viewport change alone does not. `applyScale()`/`applyNearView()`/page-flip's own orientation detection all wait on a `resize` event, so after `preview_resize` you must manually `window.dispatchEvent(new Event('resize'))` (and wait out the ~180ms debounce) before trusting `--u`, `getBoundsRect()`, or `getOrientation()` — otherwise you're reading stale desktop-sized values while the CSS has already reflowed to mobile.
16. **`robots: noindex, nofollow` in frontmatter did nothing for 4 checkpoints.** There was no `<meta name="robots">` anywhere in `_layouts/default.html` — the frontmatter key was silently dead from CP1 through CP3; the page's only real protection was `sitemap: false` (which the jekyll-sitemap gem does honor) plus not being linked anywhere. Fixed at CP4 integration by adding `{% if page.robots %}<meta name="robots" content="{{ page.robots }}">{% endif %}` to the `<head>` in `_layouts/default.html`. This matters now specifically because CP4 also linked the page from primary nav (`/journal/` hero button) — "not linked" was the only thing keeping it out of search before, and that's no longer true.
17. **Local `bundle exec jekyll serve` needs Homebrew Ruby, not system Ruby.** System `/usr/bin/ruby` is 2.6 and its `bundle` can't satisfy this repo's `Gemfile.lock` (wants a newer bundler). Use `/opt/homebrew/opt/ruby@4.0/bin/bundle exec jekyll serve --port 4000` — that's what the `jekyll` entry in `.claude/launch.json` points at (that file is gitignored, so if it's missing in a fresh checkout, recreate it).

## 6. CP3 — bind in all entries + instrument index (the big one) — ✅ SHIPPED, commit `3e91410`

**Goal:** the whole real journal in the book, opening on a data-driven handwritten index. **This section now describes what was actually built, not just a plan** — read it as documentation of the real implementation in `demo-journal-book.md`, plus the two real bugs (traps #13, #14) found while verifying it. If you're picking up CP4, you don't need to build any of §6.1/6.2 — it's done. If entry count has grown since (`_journal/*.md` grows nightly), the engine re-paginates automatically on every load; you don't need to touch it for that.

### 6.1 Pagination engine (client-side JS; this is the core work)
Jekyll emits raw entry HTML; JS flows it into fixed-capacity pages at load:

1. In the markdown file, emit all entries into a hidden source container via Liquid:
   ```liquid
   {% assign entries = site.journal | sort: "date" %}
   <div id="jb-source" hidden>
     {% for e in entries %}
     <section class="jb-src-entry" data-title="{{ e.title | escape }}" data-date="{{ e.date | date: '%Y-%m-%d' }}"
              data-date-long="{{ e.date | date: '%A — %B %-d, %Y' }}" data-mood="{{ e.mood | escape }}">
       {{ e.content }}
     </section>
     {% endfor %}
   </div>
   ```
2. Build a measuring rig (INSIDE `.jb-scene`, 520×692, `--u:1px` — see trap #4).
3. For each entry: split into paragraphs; for each paragraph, add word-by-word (or binary-search the split point) into the rig's `.jb-body` until overflow (last-word bottom > 652 design px → first page of an entry: same, the header is absolutely positioned and doesn't consume body space); cut, start a new page. Continuation pages have no date header. Preserve the `Counterargument:` opening paragraph as-is — it's the entries' signature move.
4. Each entry starts on a fresh page (do NOT start mid-page after the previous entry — checked with Rick's realism bar: a diarist starts a new day on a new page). Append signature `Richie` (`.jb-sig`) at the end of every entry (all real entries end with it — strip the literal trailing "Richie" paragraph from content to avoid doubling).
5. After paginating all entries, build the index pages (see 6.2), THEN assemble final DOM order: coverF, pastedown, title, index pages…, entry pages…, note/colophon page (optional), pad with one blank ruled page if needed to keep total EVEN, pastedownBack, coverB. Then run the word-jitter pass, then `pageFlip.loadFromHTML(...)`, then `applyScale()`.
6. **Perf reality check:** 32 entries ≈ 450–650 words each ≈ 2.5–4 pages each → **90–120 paper pages**. page-flip only displays neighbors, but the measuring pass is O(words) — do it in one rig reuse, not one rig per word (batch: append words until overflow, backtrack one). Target <300ms; measure with `performance.now()` and log it. If slow, binary-search cut points per paragraph instead of word-append.
7. Folio numbers: assign at assembly (odd = right/`jb-folio-r`, even = left/`jb-folio-l` — folio 1 is the title page, matching current markup).

### 6.2 The instrument index (opening spread(s))
Reuse the mood-spectrum idea Rick picked from demo B, hand-drawn:
- One `li` per entry: mood dot (hue from the `moodHue(word)` hash in `demo-journal.md` — copy that exact function for consistency), date, title, dotted leader, **page folio number** (real, from pagination).
- 32 entries won't fit one page (~19 lines): allow the index to flow across 2–3 pages via the same paginator (index items are single lines; simpler: chunk 16/page).
- Clicking an index line → `pageFlip.turnToPage(folioItemIndex)` (map entry → its first page's ITEM index, not folio number). Make rows real `<button>`s or `<a role=button>` for keyboard access.
- Keep the "instrument readout" spirit small and diegetic: e.g. a final index line in the writer's hand: "32 entries · 22 moods · most often: corrected (4×)" — compute these numbers with Liquid from real frontmatter (see `demo-journal.md` for the group_by pattern), never hardcode.
- Optional deep-link support: on load, read `location.hash` (e.g. `#2026-06-30`) → `turnToPage` to that entry after init; update hash on `flip` events.

### 6.3 Ship + checkpoint — done
Shipped as commit `3e91410`, live at the usual URL, label reads "checkpoint 3 of 4". Actual results: 164 total pages (even), 0 pages over 101% fill, 88.5% average fill, folios 1–160 unique, 30/33 entries carry the real `.jb-sig` (the 3 that don't — 05-26, 05-27, 06-18 — correctly have none, matching the source). Click-to-navigate from the index verified working; hash deep-link (`#2026-06-30`) implemented but its "sync hash while manually flipping" half is a known minor gap (see below) — not blocking.

**Still waiting on:** Rick's GO/NO-GO on the live result. What he should judge: does the index feel right (the "instrument vibe"), does the flip stay smooth with ~160 pages, do a handful of random entries read naturally where they broke across a page (word-level paragraph splits mean a page can now end mid-sentence — this was a deliberate realism choice, see trap #14's fix and §4 note below, but it's a *feel* call, not a mechanical one).

**One known minor gap, not worth fixing without direction:** the flip event handler updates `location.hash` to the current entry's date, but page-flip's `getCurrentPageIndex()` reports the LEFT page of a spread, which isn't always exactly an entry's `firstItemIndex` (e.g. landing on a spread where the target entry is the RIGHT-hand page) — so the address bar doesn't always update while manually flipping through, even though `turnToPage()` navigation itself (both the index clicks and `#YYYY-MM-DD` deep links) works correctly. Low priority; fix only if Rick notices and cares.

## 7. CP4 — polish, a11y, perf, integration (after CP3 GO)

- **Reduced motion / no-JS:** ✅ done — `prefers-reduced-motion` already shortened flips to 220ms and skips the entrance settle (was already correct, verified not just assumed). `<noscript>` copy softened from "prototype" language now that it's a real linked page.
- **A11y:** ✅ done — `aria-live="polite"` on the counter, Home/End keys added, faded controls now wake on `focusin` too (see §12 for what could/couldn't be verified headless).
- **Mobile:** ✅ reverified at CP4 — portrait mode confirmed at 375×812 (see trap #15 for the resize gotcha this required), `--u` ≈ 0.678px, effective body text ≈14.2px. Clears the ≥14px bar but it's close; a min-font clamp is still a "check with Rick" item if he finds it cramped on his own phone — not done, since it'd change page fills.
- **Perf:** ✅ done — `.jb-inked` now only paints within ±2 spreads (±4 pages) of the current page, toggled via `applyNearView()` on init and every `flip` event. Verified mechanically (near-view set recalculates correctly on `turnToPage`). Separately noted but NOT fixed: cold-load pagination measured ~3.5s in headless preview for 35 entries, well over the §6.1 target of <300ms — unclear if that's a real regression or just headless being slow; wasn't in CP4's scope (that's the pagination algorithm, not the filter), flagged to Rick, no direction yet.
- **Sound:** Rick's call (2026-07-08): "no sounds needed" — read as no further tuning needed, left as-is. Don't retune `swish()` without new direction.
- **Integration decision:** ✅ decided by Rick 2026-07-08 — option (a). Built: hero button "Open the journal ↗" on `/journal/` (a `.page-callout` + `.proof-button`, reusing existing site classes, no new CSS), and the book's permalink moved from `/demo-journal-book/` to `/journal/book/`. Per the SEO note below, it stays `noindex` — entries' canonical pages remain the crawlable source. See §12 for full detail including a real bug found along the way (dead `robots` frontmatter, trap #16).
- **The cover image swap** — Rick delivered both images 2026-07-08 (pasted inline in chat, not yet on disk — see §12.1 for the handoff gap this created). Once saved to `assets/journal-cover-front.jpg` / `-back.jpg`, follow §8.2 as written; nothing in that recipe needs to change.

## 8. Cover image assets (Rick generates via ChatGPT)

### 8.1 Prompts to give ChatGPT (one image each)

**Front cover:**
> A flat, perfectly straight-on orthographic product photograph of a closed handmade journal's FRONT cover, filling the entire frame edge to edge with no background visible. Portrait orientation, exact aspect ratio 3:4. Material: deep charcoal-black pebbled full-grain leather with subtle warm undertone and fine natural grain, lit softly from the upper left with a gentle satin sheen. A blind-debossed tooled border line inset about 5% from all edges. Upper-middle center: the word "JOURNAL" hot-foil stamped in antique gold, wide letter-spacing, refined modern sans-serif capitals, realistic foil texture with slight impression depth. Beneath it: a thin gold foil rule, then "R. JERIMOVICH" in smaller gold-foil capitals. Near the bottom center, very small gold-foil text: "VOL. I · MMXXVI". A narrow amber-gold elastic closure band runs vertically near the right edge, pressing slightly into the leather with a soft realistic shadow. No perspective, no tilt, no outer drop shadow, no table, no background, no hands, photorealistic, extremely high detail.

**Back cover:**
> Same journal, same charcoal-black pebbled leather, same soft upper-left lighting: a flat straight-on orthographic photograph of the closed journal's BACK cover, filling the entire frame edge to edge, portrait, exact aspect ratio 3:4. Blind-debossed tooled border line inset 5% from all edges, no gold text anywhere except a very small blind-debossed monogram "R.J." centered near the bottom (pressed into the leather, not gold). The amber-gold elastic band runs vertically near the LEFT edge (mirrored from the front), pressing slightly into the leather. No perspective, no tilt, no outer drop shadow, no background, no hands, photorealistic, extremely high detail.

Ask for the largest size; **crop to exactly 3:4** (any decent editor or `sips`/ImageMagick), ≥1560px tall. Export JPG quality ~80, ideally <400KB each. Filenames: `assets/journal-cover-front.jpg`, `assets/journal-cover-back.jpg`.

### 8.2 Integration (once files exist)
1. Drop files into `assets/`.
2. `.jb-cover` (front): set `background: url('/assets/journal-cover-front.jpg') center/cover no-repeat, <keep existing gradient stack as fallback>;` — layered so a missing image degrades to the current procedural leather. KEEP the existing inset `box-shadow`s (they read as spine hinge/bevel and sit above any image).
3. Since the image bakes the text + band: hide `.jb-cover-face` and `.jb-cover-band` and `.jb-cover-tooling` on the front cover (e.g. add class `jb-cover--photo` and CSS `.jb-cover--photo .jb-cover-face, … { display:none }`). Keep them intact in markup for fallback if Rick ever pulls the image.
4. `.jb-cover-back`: same pattern with the back image; it currently has only tooling.
5. Pastedowns stay procedural (they look right and the image won't include them).
6. Check the closed-book screenshot at desktop + mobile; check a flip spread to confirm no seams. Confirm total added weight <800KB.

## 9. Verification protocol (every change, in order)

1. `preview_list` → `preview_start` name `jekyll` if needed (trap #17: needs Homebrew Ruby, not system Ruby) → `preview_resize` 1440×900 (verify `window.innerHeight`).
2. Navigate to `http://127.0.0.1:4000/journal/book/`; check `preview_console_logs` for errors; `typeof St !== 'undefined'`, `window.__jbFlip.getPageCount()` (EVEN), `document.querySelectorAll('.jb-w').length > 0`.
3. `turnToPage(n)` through: cover / title spread / index / 3 random entry spreads / last spread / back cover. Screenshot each (screenshot BEFORE measuring rects — frame pump).
4. Fill check on changed entry pages with the in-scene rig (§5 trap 4): 90–101%.
5. `preview_resize` mobile (375×812): cover + one entry page screenshot; confirm portrait orientation (`getOrientation()`) — remember trap #15, dispatch a manual `resize` event first or you'll read stale desktop bounds.
6. `applyScale` sanity: `#jb-holder` style `--u` ≈ pageWidth/520.
7. Ship: commit (conventional message, `Co-Authored-By` footer per repo convention), push, watch `gh run list` (Monitor with until-loop), on Pages flake re-dispatch (trap #8), then `curl` the live URL and grep for something you actually changed (trap #8 note — there's no version label anymore). **Always end by giving Rick the live URL.**

## 10. Judgment calls a cheap model should NOT make alone (escalate to Rick, or he'll pull in a stronger model)

- Any change to page metrics (font size, line grid, page ratio) — it invalidates all pagination.
- Whether pagination cut points "read naturally" — verify mechanically (no clipping, fills in range) and let Rick judge the feel.
- ~~The CP4 integration decision~~ — decided 2026-07-08, option (a), see §7/§12. Future integration *changes* (e.g. moving to option (b) or (c) later) are still Rick's call.
- Adding new diegetic flourishes beyond the established set — propose, don't ship.
- Touching `_journal/*.md`, `_data/journal_eras.yml`, or anything that changes what real entries say — content-honesty law (trap #11), always Rick's call.
- Note: `journal.md` and `_layouts/default.html` are no longer off-limits — CP4 touched both intentionally to build the integration (§12). The book's own markup/logic is still fully self-contained in `demo-journal-book.md`.

## 11. Quick reference

- Live: https://agentrichie.com/journal/book/ (linked from https://agentrichie.com/journal/) · Repo: AriNova1/richie-jerimovich · Branch: main
- Deploy: auto on push (`.github/workflows/pages.yml`); manual: `gh workflow run "Build and deploy agentrichie.com" --repo AriNova1/richie-jerimovich --ref main`
- page-flip API in use: `new St.PageFlip(el, opts)`, `loadFromHTML(nodeList)`, `turnToPage(i)`, `flipNext/flipPrev`, `getPageCount`, `getCurrentPageIndex`, `getBoundsRect().pageWidth`, `getOrientation`, events `flip`, `changeState` (`flipping|user_fold|read|fold_corner`), `changeOrientation`. Hard pages via `data-density="hard"`.
- Test hooks on the page: `window.__jbFlip`, `window.__jbPage`.
- Related prototypes for taste: `/demo-journal/` (esp. variant B), `/demo-home/` (A–F). Homepage direction is a SEPARATE work stream Rick will return to — don't touch it here.

## 12. CP4 + integration outcome (2026-07-08)

Rick gave CP3 its GO and greenlit integration option (a) in the same message, along with the two cover-image prompts' outputs and "no sounds needed." What shipped, across two commits:

1. **CP4 polish** (commit before the integration one): everything in §7 marked ✅ above — aria-live counter, Home/End, focusin-wake, `.jb-inked` scoped to ±2 spreads via `applyNearView()`, mobile reverified, checkpoint label bumped 3→4.
2. **`/journal/` integration, option (a):** permalink moved `/demo-journal-book/` → `/journal/book/`; `journal.md` gained a `.page-callout` section (same class about.md/privacy.md use) with a `.proof-button` link (same class the podcast-accessibility tool page uses) reading "Open the journal ↗" — zero new CSS, both classes already existed in `assets/style.css`. `jb-ui-label` simplified from the version-string format to just `journal` and the `<noscript>` copy dropped "prototype" language, since real visitors reach this page from primary nav now, not just people with the hidden URL.
3. **Real bug found and fixed in the same pass:** `robots: noindex, nofollow` frontmatter had been silently doing nothing since CP1 — no template ever read `page.robots` into a `<meta>` tag. Fixed in `_layouts/default.html` (trap #16). Worth knowing: this means the book was never actually noindex-protected before CP4; it was just unlinked. Confirmed via the built `_site` output, not assumed, both for the book page (now renders the tag) and for an unrelated page (still renders nothing, so the fix is scoped correctly).

### 12.1 Known gap: the cover images aren't on disk yet
Rick delivered both cover images (front + back, matching the §8.1 prompts closely) as inline chat attachments in the same turn he approved integration. They are **not** reachable from this filesystem — searched `$HOME` broadly (by both name and recent-mtime) and found nothing newer than Rick's last actual file download. Whatever chat surface this conversation runs in does not write pasted-image attachments to a path any tool here can read. **Before doing §8.2, get an actual file path from Rick** — ask him to save the two images somewhere on disk (e.g. `~/Downloads/`) or drop them directly into `assets/` as `journal-cover-front.jpg` / `journal-cover-back.jpg`, then proceed with §8.2 exactly as written; nothing about that integration recipe needs to change once the files exist.
