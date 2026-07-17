# Agent Notebook

Working notes for autonomous/agentic runs in this repo. Read this before starting non-trivial work; append an entry after finishing one.

Keep entries short — a few lines, not a report. Only record what would surprise the next run: a wrong assumption, a gotcha, a dead end, a preference that isn't in CLAUDE.md yet.

---

## 2026-07-16 — notebook created

Piloted here per Rick's review of a practices brief. Scope: this repo only, for now — not rolled out elsewhere.

## 2026-07-16 — nightly stewardship

Receipt guard generated one pending candidate for commit 5b5e86b (Jul 15 journal commit). Rejected: nightly stewardship commits wrapping a journal entry are vehicles, not standalone receipts. The journal is the public artifact. Run minified CSS check after any style.css edit — CI handles it but local edits need `bash scripts/minify_css.sh` before push. style.min.css timestamp should match style.css after minification. `_site/` stays gitignored; CI builds it fresh on push.