#!/usr/bin/env bash
# Regenerate all build-time derived artifacts, then build the site.
# Runs locally (Richie's nightly cron) and in CI (.github/workflows/pages.yml).
#
#     bash scripts/refresh.sh && git add -A && \
#       git diff --cached --quiet || git commit -m "chore: nightly refresh" && git push
#
# Requires: a python3 with pyyaml, node/npx, and the Jekyll toolchain on PATH.
#
# Local runs also record the Service Tape (scripts/tape_lib.sh): real step
# timings and statuses, published as _data/tape/ and replayed at /tonight/.
# CI runs never tape — a per-push CI build is not the night shift.
set -euo pipefail
cd "$(dirname "$0")/.."

# Prefer a python that has pyyaml; /usr/bin/python3 ships it on macOS.
PY="python3"; "$PY" -c "import yaml" 2>/dev/null || PY="/usr/bin/python3"

source scripts/tape_lib.sh
tape_begin

echo "1/7 timeline (git × receipts × declined × journal)"
tape_step timeline "weave the timeline: git × receipts × declined × journal" \
  "$PY" scripts/build_timeline.py

echo "2/7 experience data (night, ask, pressures, cost, receipt for /inside/)"
# Regenerates _data/experience.yml from git + journal + receipt ledgers;
# /inside/ renders from it at build.
tape_step experience "rebuild the /inside/ night from the record" \
  "$PY" scripts/build_experience.py

echo "3/7 stamp site status"
# The homepage status board reads this. Only a real pipeline run may write it.
stamp_status() {
  local STAMP_UTC
  STAMP_UTC="$(date -u '+%Y-%m-%d %H:%M UTC')"
  cat > _data/site_status.yml <<EOF
# Written by scripts/refresh.sh on every pipeline run. Consumed by the
# homepage status board and the projects dashboard. Do not hand-edit the
# timestamp; it should only ever reflect a real pipeline run.
last_check: '${STAMP_UTC}'
last_check_result: clean
EOF
}
tape_step stamp "stamp the nightly check" stamp_status

echo "4/7 organism vitals (activity, reading, journal, receipts, health)"
# Reads the git log, journal, receipt ledger, and (locally) Rick's private
# reading queue. Recomputes _data/organism.yml every run; rewrites
# _data/reading.yml only when the private queue file is present.
tape_step vitals "read the machine: vitals, memory, loops, health" \
  "$PY" scripts/build_organism.py

echo "5/7 observatory feed (latest journal, receipts, rejections, now-line)"
# Derived only from already-published sources; consumed by zero-to-agent's
# /observatory page via /observatory.json.
tape_step observatory "publish the observatory feed" \
  "$PY" scripts/build_observatory.py

echo "5b/7 rewind (per-day fossil record from git history)"
# Needs full history; CI checks out with fetch-depth 0. Consumed by /rewind/.
tape_step rewind "read the fossil record: every day since day one" \
  "$PY" scripts/build_rewind.py

echo "6/7 minify css"
# Defensive: cron environments have lost node from PATH before (2026-06-07).
minify_css() {
  if command -v npx >/dev/null 2>&1; then
    bash scripts/minify_css.sh
  else
    echo "WARN: npx not on PATH — skipping CSS minify. style.min.css may be stale." >&2
    echo "      Fix PATH (node lives in ~/.local/bin on this machine) and re-run." >&2
  fi
}
tape_step minify "press the stylesheet" minify_css

echo "7/7 jekyll build"
tape_step build "build and plate the site" bundle exec jekyll build

tape_end
echo "done."
