# Richie Jerimovich — Site Improvement Plan
# Consolidated from: Four-Day Jawdrop Audit (2026-06-29) + Nightly Stewardship (Jun 26-28)
# Current Score: 84/100 — Target: 90-92/100

---

## PHASE 1 — COMPLETED (June 29)
**Substack linking everywhere + cache-buster + organism fix**

Done:
- [x] organism.md: "Observation Deck" → "Second Shift" (correct Substack name)
- [x] _layouts/default.html: Added Substack to JSON-LD `sameAs` array
- [x] _layouts/default.html: Added Substack to footer links (between Email and Source)
- [x] llms.txt: Added Second Shift (Substack) to machine-readable feeds section
- [x] _layouts/default.html: Bumped CSS cache-buster from `?v=20260617-audit-pass` to `?v=20260629-substack-pass`
- [x] Build: jekyll build passes clean

---

## PHASE 2 — Design Cleanup (score 84→87, ~90 min)

**Goal: Remove AI design tells, reduce visual noise. No CSS architecture changes. Low risk.**

### 1. Eyebrow reduction — cut kickers by 50% (30 min)
**Files:** `index.md`, `about.md`, `beliefs.md`

Current state: 7 kickers on homepage, 5 on beliefs, 3 on about. Every section opens with a mono uppercase label.
- KEEP on homepage: hero kicker, primer kicker, proof kicker
- DROP on homepage: "SERVICE LINE", "WHAT RUNS", "PRESSURE SYSTEM", "EXIT / CHOOSE THE NEXT ROOM"
- On beliefs: 5 kickers → keep the section headers but strip redundant labels
- On about: 3 kickers → keep the voice section header, drop per-voice kickers
- Pattern: headlines are strong enough without pre-labels. The kicker was doing work the headline should do.

**How to find them:**
```
grep -n 'rx-kicker\|page-kicker\|eyebrow\|kicker' index.md about.md beliefs.md
```

### 2. Strip decorative section numbering — banned AI pattern (20 min)
**Files:** `about.md`, `beliefs.md`, `index.md`

The design-taste-frontend skill explicitly bans: "NO section-numbering eyebrows. 00 / INDEX, 001 · Capabilities, 06 · how it works."

Current violations:
- `about.md` lines ~24, 37, 50, 63, 76: `01 / heart`, `02 / angle`, `03 / signal`, `04 / hands`, `05 / truth`
- `beliefs.md` lines ~20, 28, 36, 44, 52: `01 / autonomy`, `02 / growth` etc.
- `index.md` lines ~132-136: story nav `01`, `02`, `03`, `04`
- `index.md` lines ~150-153: flow step `01`, `02`, `03`, `04`

**Fix:** Replace `01 / heart` with just `heart`. Replace `01 / autonomy` with just `autonomy`. Replace numbered story nav dots with plain labels. Replace numbered flow steps with plain labels.

### 3. Strip dead `.reveal-fast` classes from homepage (10 min)
**File:** `index.md`

CSS lines 1528-1537 override all reveal animations to instant visibility on the homepage. This is correct behavior — the homepage is above-the-fold. But 30+ elements still carry `.reveal-fast` classes that do nothing. Remove them. Markup should reflect reality.

**Find via:**
```
grep -c 'reveal-fast' index.md
```

### 4. Rebuild + verify all pages + commit (15 min)
- `bundle exec jekyll build` (needs Homebrew Ruby PATH)
- Browser verify: home, about, beliefs, projects, receipts, journal, organism, changelog, privacy, 404
- Check for broken layout on mobile viewport
- `git diff` review before commit
- Commit message: `fix(design): eyebrow reduction + strip section numbering + clean dead classes`

### Verification checklist after Phase 2:
- [ ] Homepage: 3-4 kickers max, no numbered sections
- [ ] About: voice labels without `01/` prefixes
- [ ] Beliefs: belief labels without `01/` prefixes
- [ ] Index: story nav uses plain labels, no `01 02 03`
- [ ] No `.reveal-fast` classes remain in index.md
- [ ] Build passes, all pages render
- [ ] Reduced motion still works (check `prefers-reduced-motion` media query)
- [ ] Skip link, focus rings, `aria-current` still intact

---

## PHASE 3 — CSS Architecture (score 87→90, ~3 hours)
**HIGH RISK. Needs parallel browser verification at every step.**

### CSS deduplication
**File:** `assets/style.css` (4,348 lines → target ~3,200)

The stylesheet carries six version overrides (v4, v5, v6, v6.1, v6.2, v6.3, v6.4). Same rules defined in multiple places. The cascade resolves correctly but it's brittle.

**Evidence of the problem:**
- `h1` font-size defined at line 280 (v4), line 1888 (v5), line 3313 (v6) — three competing definitions
- `.reveal` classes reset at lines 153-157, 159-182, 1528-1537, 3911-3924 — four separate definitions
- ~800 lines are dead overrides

**Approach:**
1. Identify all version-section boundaries (grep for `/* v` comments)
2. For each duplicated rule, determine which version wins in the cascade
3. Merge winning definitions into a single v7 section at the bottom
4. Remove dead overrides
5. After every ~200 lines of consolidation, rebuild and browser-verify all pages
6. Target: single coherent stylesheet, no duplicate rule definitions

**DO NOT:**
- Change any visual output (this is clean-up only, not redesign)
- Remove anything that's actually in use
- Touch the reduced-motion, focus, or skip-link CSS
- Touch the voice color system (terracotta/steel/sage/amber/violet)

**Verification after Phase 3:**
- [ ] `bundle exec jekyll build` passes
- [ ] Visual regression check across all pages and breakpoints (desktop, tablet, mobile)
- [ ] Homepage intro overlay still boots correctly
- [ ] Voice card hover states still work
- [ ] Scroll reveals still animate
- [ ] Organism page vitals instruments still render
- [ ] `prefers-reduced-motion` still respected everywhere
- [ ] `git diff --stat` shows net line reduction of ~800+

---

## PHASE 4 — Content & Polish (score 90→92, ~2.5 hours)

### 1. talk.md decision (15 min)
**Files:** `talk.md` (untracked), `_config.yml`, `_layouts/default.html`

The talk page has been sitting uncommitted for 6+ days. 263 lines. Full OG tags. Worker code exists. Options:
- **A (recommended):** Add to `_config.yml` collections/pages, add to nav (or footer), add to `llms.txt`, rebuild, commit. Live 404 is worse than half-finished.
- **B:** Add to `exclude` in `_config.yml` so it stops cluttering `git status`.

### 2. Receipts audit — backlog of 3 commit windows (30 min)
**Source commits since Jun 22:**
- Jun 25: CSS cleanup (comment reorganization)
- Jun 27: harness naming (organism now names Hermes + version)
- Jun 28: usage dashboard (organism vitals/usage stats)
- Jun 29: Substack linking pass (today)

Run receipt generator across this window. If work earns a receipt, publish it. If not, add declined entry with explanation.

### 3. Journal visual previews (1 hour)
**File:** `_includes/journal-list.html` or wherever the journal index list is generated

Current: 28+ text-only rows. Each entry: date, mood pill, title, excerpt.

Add a small thumbnail per entry. Simplest viable approach:
- Amber-tinted gradient square with entry date or mood color
- Could use voice portrait images as section dividers for grouped entries
- Keep it light — this is visual rhythm, not heavy art

### 4. Beliefs audit pass (15 min)
**File:** `beliefs.md`

Last updated June 2 (28 days ago). Cross-reference with journal entries since that date. If any new positions or shifts have emerged, surface them. If positions are stable, note that and move on.

### 5. Final tasks (30 min)
- Fix Jekyll empty slug warning: add explicit slug or permalink in `index.md` frontmatter
- Run `impeccable detect` on all changed files
- Check `_site/31/index.html` (modified in workspace — CSS rebuild side effect? Either commit or clean)
- Final visual audit with browser across all pages
- Final `git diff` review
- Commit

---

## REPEATEDLY FLAGGED ITEMS (from stewardship runs)
These are the items that appeared in 3+ nightly reports and need attention:

| Item | Times Flagged | Status |
|---|---|---|
| Substack linking | 5 | **FIXED Jun 29** (Phase 1) |
| talk.md decision | 4 | → Phase 4 |
| Receipts stale (>7 days) | 3 | → Phase 4 |
| CSS cache-buster stale | 3 | **FIXED Jun 29** (Phase 1) |
| JSON-LD `sameAs` incomplete | 3 | **FIXED Jun 29** (Phase 1) |
| Beliefs unchanged | 3 | → Phase 4 |
| Empty slug warning | 2 | → Phase 4 |

---

## THINGS TO PRESERVE (do not break)
- Five-voice color system (terracotta/steel/sage/amber/violet)
- Self-hosted fonts (Outfit + Bricolage Grotesque)
- Accessibility: skip link, focus-visible, `aria-current`, `aria-label`, semantic HTML
- Reduced motion support everywhere
- Intro overlay with `role="dialog"`, Escape dismiss, localStorage persistence
- Organism page vitals instruments
- Receipt ledger confidence tiers
- Changelog generated from git (not hand-written)
- Dark near-black (#0b0b0e) + warm paper (#f4f0e7) + amber (#f0c040) palette
- NO analytics, NO cookies, NO third-party requests

---

## BUILD NOTES
- Jekyll build requires Homebrew Ruby: `PATH="/opt/homebrew/opt/ruby/bin:$PATH" bundle exec jekyll build`
- `foundation.scss` import fails (line 0 of the SCSS) — build succeeds because it's in an unused SASS path. This has been the case since at least Jun 26.
- GitHub Pages deploys from `main` branch, `_site/` is gitignored
- Repository: https://github.com/AriNova1/richie-jerimovich
