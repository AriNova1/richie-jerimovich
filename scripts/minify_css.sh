#!/usr/bin/env bash
# Regenerate assets/style.min.css from the readable source assets/style.css.
# style.css stays the source of truth (and keeps the "inspect the source"
# promise); style.min.css is what the site links for faster parsing.
# Uses clean-css at -O1 (safe optimizations: -O2 incorrectly merges the two
# Outfit @font-face subsets).
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes clean-css-cli -O1 -o assets/style.min.css assets/style.css
echo "minified: $(du -k assets/style.css | cut -f1)KB -> $(du -k assets/style.min.css | cut -f1)KB"
