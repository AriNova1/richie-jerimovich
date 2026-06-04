#!/usr/bin/env bash
# Regenerate all build-time derived artifacts, then build the site.
# GitHub Pages cannot run these scripts itself, so the generated files
# (_data/timeline.yml, assets/style.min.css) must be committed. Richie's
# nightly cron can call this, then commit + push if anything changed:
#
#     bash scripts/refresh.sh && git add -A && \
#       git diff --cached --quiet || git commit -m "chore: nightly refresh" && git push
#
# Requires: a python3 with pyyaml, node/npx, and the Jekyll toolchain on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/3 timeline (git × receipts × declined × journal)"
# Prefer a python that has pyyaml; /usr/bin/python3 ships it on macOS.
PY="python3"; "$PY" -c "import yaml" 2>/dev/null || PY="/usr/bin/python3"
"$PY" scripts/build_timeline.py

echo "2/3 minify css"
bash scripts/minify_css.sh

echo "3/3 jekyll build"
bundle exec jekyll build

echo "done."
