#!/usr/bin/env python3
"""Build the Rewind: a per-day fossil record of this site's whole life,
read from git history — never estimated, never interpolated.

For every calendar day since the first commit, takes the last commit of that
day and reads, at that exact tree: the published receipt count, the declined
count, the journal entry count, and the day's commit subjects. Output goes to
assets/rewind.json for the /rewind/ scrubber.

Run by scripts/refresh.sh. Needs full git history (CI checks out with
fetch-depth: 0). Days with no commits carry the previous day's state forward,
marked quiet — that is real too: nothing happened.
"""

import json
import os
import subprocess
import sys
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "rewind.json")

# Design eras, by first commit date of each look. Real boundaries from the log.
ERAS = [
    ("2026-05-25", "first light", "a bare Jekyll page and a promise to check nightly"),
    ("2026-06-08", "five voices", "the voice system arrives; the site learns to argue"),
    ("2026-06-17", "proof forward", "receipts, changelog, organism: evidence moves to the front"),
    ("2026-07-17", "the pass", "tickets on steel — the kitchen runs the site"),
]


def git(*args):
    return subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True
    ).stdout


def count_at(sha, path, needle):
    blob = git("show", f"{sha}:{path}")
    return blob.count(needle) if blob else 0


def journal_count_at(sha):
    names = git("ls-tree", "-r", "--name-only", sha, "_journal")
    return len([n for n in names.splitlines() if n.endswith(".md")])


def main():
    log = git("log", "--reverse", "--format=%H %cI %s")
    lines = [ln for ln in log.splitlines() if ln.strip()]
    if not lines:
        print("rewind: no git history", file=sys.stderr)
        return 1

    # last commit sha per UTC day + subjects per day
    by_day = {}
    subjects = {}
    total_commits = {}
    n = 0
    for ln in lines:
        sha, iso, subject = ln.split(" ", 2)
        d = iso[:10]
        n += 1
        by_day[d] = sha
        total_commits[d] = n
        subjects.setdefault(d, []).append(subject)

    first = date.fromisoformat(min(by_day))
    last = date.fromisoformat(max(by_day))

    days = []
    prev = None
    d = first
    while d <= last:
        ds = d.isoformat()
        era = next(
            (e for e in reversed(ERAS) if e[0] <= ds), ERAS[0]
        )
        if ds in by_day:
            sha = by_day[ds]
            snap = {
                "date": ds,
                "sha": sha[:7],
                "commits": total_commits[ds],
                "receipts": count_at(sha, "_data/agent_receipts.yml", "\n- id:")
                + (1 if git("show", f"{sha}:_data/agent_receipts.yml").startswith("- id:") else 0),
                "declined": count_at(sha, "_data/agent_receipt_rejections.yml", "- commit:"),
                "journal": journal_count_at(sha),
                "subjects": subjects[ds][-3:],
                "quiet": False,
            }
            prev = snap
        else:
            snap = dict(prev, date=ds, subjects=[], quiet=True)
        snap["era"] = era[1]
        snap["era_line"] = era[2]
        days.append(snap)
        d += timedelta(days=1)

    with open(OUT, "w") as f:
        json.dump({"schema": 1, "days": days}, f, separators=(",", ":"))
    print(f"rewind: {len(days)} days, {first} → {last}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
