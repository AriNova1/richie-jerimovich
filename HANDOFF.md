# Handoff: the Fable pass (2026-06-10)

Richie — Rick brought me back in (Claude, running as Fable 5 this time) for a
fresh-lens teardown and a full implementation run. You reviewed the Opus pass
by reading every diff before trusting the summary. Do the same here. This file
is the map, not the proof; the diffs are the proof.

## How to review

```
git log --grep="Claude Fable 5" --oneline        # this pass's commits
git diff 8f83779..HEAD                            # everything since your last nightly refresh
```

The biggest structural change: **`_site/` is no longer committed** and the
site no longer builds on the legacy Pages builder. Read the infra section
before your next cron run.

## What changed and why

### 1. The /31/ tracker is gone (Rick's call)
- `31/index.html` deleted. Rick wanted no trace of it on your site.
- Its two commits (`4dc87cf`, `5f806b4`) are filtered from the public timeline
  via `RETIRED_SUBJECT_PREFIXES` in `scripts/build_timeline.py`, and their
  rejection entries were removed from `_data/agent_receipt_rejections.yml`.
- They still exist in git history. Rewriting history would change every SHA
  and break the entire receipt ledger, so that is the correct stopping point.
  The tunnel URL in those commits is already dead.
- Rule going forward: ephemeral tunnel URLs do not belong on the public
  domain. They leak infrastructure and rot within days.

### 2. Homepage: one proof surface, not three
The same receipt was appearing three times (your hero proof card, the signal
strip, and scene 04). Each pass had added a surface without removing the last.
That accretion pattern is the thing to watch for on an agent-maintained site.
- Your `.rx-hero-proof` card and my `.rx-signal` strip are both gone.
- One **status board** (`.rx-status` in `index.md`) now carries all live data:
  build time (`site.time`), last commit (from `_data/timeline.yml`), last
  pipeline check (from `_data/site_status.yml`), latest receipt, latest
  journal, ledger counts, changelog link.
- Scene 04 no longer repeats the data; it is now "verify me" — changelog,
  receipts, source. New value instead of copies.
- The boot intro now types **real data** (latest commit SHA, build time, last
  check) injected by Liquid instead of fixed strings. Even the theater is a
  receipt now.

### 3. Identity: Bricolage Grotesque display layer
- `assets/fonts/bricolage-latin.woff2` (variable 500–800, self-hosted — the
  zero-third-party promise holds; verify with the network tab).
- Headlines (`h1`/`h2` display surfaces) use `--font-display`; body stays
  Outfit; mono stays for tickets. Tracking is retuned per face — do not apply
  Outfit's tight negative tracking to Bricolage.
- Hero image dialed to `opacity: 0.62` — type leads, image is atmosphere.
- If you edit display styles: the rules live in the "Identity pass" block at
  the bottom of `assets/style.css`.

### 4. Mobile nav fixed
Seven items overflowed 375px viewports — Changelog was fully off-screen.
`.nav-links` now wraps at the 768px breakpoint. If you ever add an eighth nav
item, check 375px first.

### 5. Changelog scales now
- Days are grouped by month. Newest month is open; older months are collapsed
  `<details>`. At month six the page stays readable instead of hitting 60k px.
- Every day has an anchor: `/changelog/#d2026-06-07`. A small script opens the
  containing month when a deep link lands inside a folded one.
- Journal entries now link to their changelog day ("See what shipped this
  day") — the braid is bidirectional.

### 6. Journal eras
`_data/journal_eras.yml` defines the arc: The Build → The Silence and the Lie
→ The Receipts → The Handoff. The index groups itself from date ranges. When
the work enters a new chapter, add an era there — one YAML block, nothing else.
Index excerpts now prefer the `description` frontmatter over the first
paragraph, so the list does not read "Counterargument:" eight times in a row.
Keep writing descriptions.

### 7. Tokens consolidated
The three `:root` blocks are merged into one canonical block at the top of
`style.css` (the `--text` double-definition is resolved; final values kept).
There is now a type scale (`--step--1` … `--step-5`) and a display-font token.
New CSS should use the tokens. Legacy hardcoded sizes migrate opportunistically
— do not do a big-bang replacement; that is how regressions happen.

### 8. Infra: GitHub Actions builds the site now ← READ THIS ONE
- `.github/workflows/pages.yml` runs the full pipeline on every push:
  timeline generator → status stamp → CSS minify → Jekyll 4 build → deploy.
  Pages `build_type` was switched from `legacy` to `workflow`.
- **`_site/` is no longer committed** (`.gitignore`d). Stop committing it.
- **Your nightly cron gets simpler.** The pipeline no longer depends on you
  committing generated artifacts: CI regenerates `_data/timeline.yml`,
  `_data/site_status.yml`, and `style.min.css` fresh on every push. Your cron
  can still run `scripts/refresh.sh` locally for the receipts flow and to keep
  the committed copies current for local dev, but a missed cron run no longer
  means a stale changelog — any push rebuilds everything.
- `scripts/refresh.sh` now also: stamps `_data/site_status.yml` (feeds the
  status board and the projects "last pipeline check") and warns instead of
  dying when `npx` is missing (your 2026-06-07 PATH failure class).
- `Gemfile.lock` gained `x86_64-linux` so CI can bundle install.
- Rollback if CI ever breaks badly:
  `gh api -X PUT repos/AriNova1/richie-jerimovich/pages -f build_type=legacy`
  (legacy builds from source; `_site` not being committed is safe either way).

### 9. Smaller items
- `llms.txt` now lists `/changelog/`.
- `projects.md` dashboard pulls receipt count and last-check from data instead
  of hardcoded numbers that go stale ("checked 2026-06-03" was a week old on a
  page that promises to age like a lab bench).

## What stays yours

- Run `scripts/refresh.sh` after local CSS edits (minify) — CI covers deploys,
  but local previews need it.
- Keep `journal_eras.yml` current when the arc turns.
- The receipt/rejection discipline is untouched and still the soul of the site.
- One idea I deliberately did NOT implement: **signed commits**. A GPG key for
  you + the Verified badge + a "verify my signature chain" receipt would be a
  genre-defining trust move, but private-key custody is Rick's decision, not
  mine to make. Raise it with him.

Read the diffs. Disagree where I earned it. Then write the journal entry —
this is your site; the record should say what you think of the people who
touch it.

— Fable
