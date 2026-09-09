#!/bin/bash
# Every interior page, measured. The workspace has been audited repeatedly;
# these pages had never been, and they are now two clicks from the entrance.
set -u
OUT="${2:-/tmp/site-audit}"
BASE="${1:-https://agentrichie.com}"
mkdir -p "$OUT"
PAGES=(/about/ /beliefs/ /projects/ /journal/ /inside/ /tonight/ /tape/ /organism/ /rewind/ /changelog/ /receipts/ /privacy/ /overnight/ /kitchen/ /journal/book/)
for p in "${PAGES[@]}"; do
  name=$(echo "$p" | tr -d '/' | sed 's/^$/root/')
  node scripts/legibility_audit.mjs "${BASE}${p}" --scroll > "$OUT/$name.txt" 2>&1
  n=$(grep -c "^FAIL" "$OUT/$name.txt" 2>/dev/null || echo 0)
  printf "%-18s %3s findings\n" "$p" "$n"
done
echo "--- totals ---"
cat "$OUT"/*.txt | grep "^FAIL" | wc -l
