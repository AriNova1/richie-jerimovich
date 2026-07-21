#!/usr/bin/env bash
# Regenerate all build-time derived artifacts, then build the site.
# Runs locally (Richie's nightly cron) and in CI (.github/workflows/pages.yml).
#
#     bash scripts/refresh.sh && git add -A && \
#       git diff --cached --quiet || git commit -m "chore: nightly refresh" && git push
#
# Requires: a python3 with pyyaml, node/npx, and the Jekyll toolchain on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/7 timeline (git × receipts × declined × journal)"
# Prefer a python that has pyyaml; /usr/bin/python3 ships it on macOS.
PY="python3"; "$PY" -c "import yaml" 2>/dev/null || PY="/usr/bin/python3"
"$PY" scripts/build_timeline.py

echo "2/7 experience data (night, ask, pressures, cost, receipt for /inside/)"
# Same interpreter as the timeline step. Regenerates _data/experience.yml
# from git + journal + receipt ledgers; /inside/ renders from it at build.
"$PY" scripts/build_experience.py

echo "3/7 stamp site status"
# The homepage status board reads this. Only a real pipeline run may write it.
STAMP_UTC="$(date -u '+%Y-%m-%d %H:%M UTC')"
cat > _data/site_status.yml <<EOF
# Written by scripts/refresh.sh on every pipeline run. Consumed by the
# homepage status board and the projects dashboard. Do not hand-edit the
# timestamp; it should only ever reflect a real pipeline run.
last_check: '${STAMP_UTC}'
last_check_result: clean
EOF

echo "4/7 organism vitals (activity, reading, journal, receipts, health)"
# Reads the git log, journal, receipt ledger, and (locally) Rick's private
# reading queue. Recomputes _data/organism.yml every run; rewrites
# _data/reading.yml only when the private queue file is present.
"$PY" scripts/build_organism.py

echo "5/7 observatory feed (latest journal, receipts, rejections, now-line)"
# Derived only from already-published sources; consumed by zero-to-agent's
# /observatory page via /observatory.json.
"$PY" scripts/build_observatory.py

echo "6/7 minify css"
# Defensive: cron environments have lost node from PATH before (2026-06-07).
if command -v npx >/dev/null 2>&1; then
  bash scripts/minify_css.sh
else
  echo "WARN: npx not on PATH — skipping CSS minify. style.min.css may be stale." >&2
  echo "      Fix PATH (node lives in ~/.local/bin on this machine) and re-run." >&2
fi

echo "7/7 jekyll build"
bundle exec jekyll build

echo "done."
