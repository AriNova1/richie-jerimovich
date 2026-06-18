#!/usr/bin/env python3
"""Compute the organism vitals consumed by /organism/.

Two artifacts, both build-time and derived only from real sources:

  _data/reading.yml   sanitized snapshot of Rick's private reading queue
                      (~/.hermes/reading-queue.md). Regenerated only when that
                      file is present (local nightly run); left untouched in CI.

  _data/organism.yml  computed vitals: activity series from the git log, journal
                      cadence, receipt discipline, reading metabolism, a work-rate
                      "load" figure, and a health verdict derived from explicit
                      checks. Recomputed on every run (git history is available in
                      CI via fetch-depth: 0), so the deployed page reflects current
                      repository state, not a stale commit.

No random numbers. Every field traces to a file or the git log. The page labels
what each figure measures so nothing is mistaken for a simulated metric.
"""

import os
import re
import subprocess
import sys
from datetime import datetime, timezone, date, timedelta
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    sys.exit("build_organism.py needs pyyaml (pip install pyyaml)")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "_data")
JOURNAL = os.path.join(ROOT, "_journal")
READING_SRC = os.path.expanduser("~/.hermes/reading-queue.md")
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()
WINDOW = 30  # days of activity history to chart


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def git(*args):
    return subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True
    ).stdout.strip()


def parse_day(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def day_buckets(dates):
    """Map a list of date objects to per-day counts over the trailing WINDOW."""
    start = TODAY - timedelta(days=WINDOW - 1)
    counts = {start + timedelta(days=i): 0 for i in range(WINDOW)}
    for d in dates:
        if d in counts:
            counts[d] += 1
    return [counts[start + timedelta(days=i)] for i in range(WINDOW)]


def rel_age(d):
    """Human 'time ago' for a date/datetime, build-time."""
    if isinstance(d, date) and not isinstance(d, datetime):
        d = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    secs = (NOW - d).total_seconds()
    if secs < 3600:
        return f"{int(secs // 60)}m"
    if secs < 86400:
        return f"{int(secs // 3600)}h"
    return f"{int(secs // 86400)}d"


def domain_of(url):
    net = urlparse(url).netloc.lower()
    return net[4:] if net.startswith("www.") else net


# --------------------------------------------------------------------------- #
# reading queue -> _data/reading.yml  (sanitized: title, domain, status, date)
# --------------------------------------------------------------------------- #
ITEM_RE = re.compile(r'^- \[( |x)\]\s*"(.+?)"\s*-\s*(\S+)')
READ_RE = re.compile(r"\[READ\s+(\d{4}-\d{2}-\d{2})")
FLAG_RE = re.compile(r"flagged by Rick on (\d{4}-\d{2}-\d{2})")


def build_reading():
    if not os.path.exists(READING_SRC):
        return  # CI / no access: keep the committed snapshot
    items = []
    for line in open(READING_SRC, encoding="utf-8"):
        m = ITEM_RE.match(line)
        if not m:
            continue
        read_flag, title, url = m.group(1), m.group(2).strip(), m.group(3)
        read_m = READ_RE.search(line)
        flag_m = FLAG_RE.search(line)
        items.append(
            {
                "title": title,
                "domain": domain_of(url),
                "status": "read" if read_flag == "x" else "queued",
                # only article-level facts are published. notes and the X source
                # attribution that reveal Rick's accounts are intentionally dropped.
                "read_date": read_m.group(1) if read_m else None,
                "flagged_date": flag_m.group(1) if flag_m else None,
            }
        )

    read = [i for i in items if i["status"] == "read"]
    queued = [i for i in items if i["status"] == "queued"]
    read_dates = [parse_day(i["read_date"]) for i in read if i["read_date"]]
    read_7d = sum(1 for d in read_dates if (TODAY - d).days <= 7)
    read_30d = sum(1 for d in read_dates if (TODAY - d).days <= 30)
    last_read = max(read_dates) if read_dates else None

    recent_read = sorted(
        [i for i in read if i["read_date"]],
        key=lambda i: i["read_date"],
        reverse=True,
    )[:6]
    queued_sorted = sorted(
        queued, key=lambda i: i["flagged_date"] or "", reverse=True
    )

    out = {
        "generated_at": NOW.strftime("%Y-%m-%d %H:%M UTC"),
        "total": len(items),
        "read": len(read),
        "queued": len(queued),
        "read_7d": read_7d,
        "read_30d": read_30d,
        "domains": len({i["domain"] for i in items}),
        "last_read": last_read.isoformat() if last_read else None,
        "last_read_rel": rel_age(last_read) if last_read else None,
        "recent_read": recent_read,
        "queued_items": queued_sorted,
        "per_day_30d": day_buckets(read_dates),
    }
    write_yaml(
        "reading.yml",
        out,
        "Sanitized snapshot of Rick's private reading queue. Article-level facts\n"
        "# only (title, source domain, status, date). Notes and source attribution\n"
        "# are dropped. Regenerated by scripts/build_organism.py when the private\n"
        "# file is present; otherwise this committed snapshot is left in place.",
    )


# --------------------------------------------------------------------------- #
# vitals -> _data/organism.yml
# --------------------------------------------------------------------------- #
def spark_geometry(series, w=1000.0, h=120.0, pad=6.0):
    """Polyline + area points for the hero activity trace (real series)."""
    n = len(series)
    peak = max(series) or 1
    step = (w) / (n - 1) if n > 1 else w
    pts = []
    for i, v in enumerate(series):
        x = round(i * step, 1)
        y = round(h - pad - (v / peak) * (h - 2 * pad), 1)
        pts.append(f"{x},{y}")
    line = " ".join(pts)
    area = f"0,{h} " + line + f" {round((n - 1) * step, 1)},{h}"
    heights = [round((v / peak) * 100) for v in series]  # 0..100 for css bars
    head_x = round((n - 1) * step, 1)
    head_y = round(h - pad - (series[-1] / peak) * (h - 2 * pad), 1)
    return line, area, heights, head_x, head_y


def load_yaml(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_organism():
    # ---- activity (git) ----
    commit_total = int(git("rev-list", "--count", "HEAD") or 0)
    since = (TODAY - timedelta(days=WINDOW)).isoformat()
    commit_days = [
        parse_day(s)
        for s in git("log", f"--since={since}", "--date=short", "--format=%cd").splitlines()
        if s
    ]
    commits_series = day_buckets(commit_days)
    commits_30d = sum(commits_series)
    active_days = sum(1 for c in commits_series if c > 0)

    # consecutive days with at least one commit, counting back from today
    streak = 0
    for c in reversed(commits_series):
        if c > 0:
            streak += 1
        else:
            break

    last_iso = git("log", "-1", "--format=%cI")
    last_dt = datetime.fromisoformat(last_iso) if last_iso else NOW
    last_dt = last_dt.astimezone(timezone.utc)
    last_subject = git("log", "-1", "--format=%s")
    first_day = git("log", "--max-parents=0", "--date=short", "--format=%cd").splitlines()
    first_day = parse_day(first_day[-1]) if first_day else TODAY
    age_days = (TODAY - first_day).days

    line, area, heights, head_x, head_y = spark_geometry(commits_series)

    # ---- journal cadence ----
    j_dates = []
    if os.path.isdir(JOURNAL):
        for fn in os.listdir(JOURNAL):
            m = re.match(r"(\d{4}-\d{2}-\d{2})", fn)
            if m:
                j_dates.append(parse_day(m.group(1)))
    j_total = len(j_dates)
    j_last = max(j_dates) if j_dates else None
    j_series = day_buckets(j_dates)
    j_7d = sum(1 for d in j_dates if (TODAY - d).days <= 7)

    # ---- receipts / ledger discipline ----
    receipts = load_yaml("agent_receipts.yml") or []
    timeline = load_yaml("timeline.yml") or []
    published = len(receipts)
    declined = sum(1 for t in timeline if t.get("status") == "declined")
    ledger_total = len(timeline)

    # ---- reading (from committed snapshot, so this also works in CI) ----
    reading = load_yaml("reading.yml") or {}
    r_read = reading.get("read", 0)
    r_queued = reading.get("queued", 0)
    r_7d = reading.get("read_7d", 0)
    r_last_rel = reading.get("last_read_rel")
    read_series = reading.get("per_day_30d", [0] * WINDOW)

    # ---- load: 7-day work rate vs 30-day baseline (real action events) ----
    events_series = [
        commits_series[i] + j_series[i] + (read_series[i] if i < len(read_series) else 0)
        for i in range(WINDOW)
    ]
    week_rate = round(sum(events_series[-7:]) / 7, 2)
    base_rate = round(sum(events_series) / WINDOW, 2)
    ratio = round(week_rate / base_rate, 2) if base_rate else 1.0
    load_pct = min(100, round(ratio * 50))  # 1.0x baseline == 50% on the gauge
    if ratio >= 1.5:
        load_level = "high"
    elif ratio >= 1.1:
        load_level = "elevated"
    elif ratio >= 0.7:
        load_level = "steady"
    else:
        load_level = "low"

    # ---- health checks ----
    status = load_yaml("site_status.yml") or {}
    pipeline_clean = status.get("last_check_result") == "clean"
    commit_hours = (NOW - last_dt).total_seconds() / 3600
    commit_fresh = commit_hours <= 48
    journal_days = (TODAY - j_last).days if j_last else 99
    journal_current = journal_days <= 3
    reading_moving = r_7d > 0
    discipline_ok = declined > 0

    checks = [
        {
            "label": "Pipeline check",
            "value": status.get("last_check_result", "unknown"),
            "ok": pipeline_clean,
            "note": f"refresh at {status.get('last_check', 'unknown')}",
        },
        {
            "label": "Commit recency",
            "value": f"{rel_age(last_dt)} ago",
            "ok": commit_fresh,
            "note": "healthy under 48h",
        },
        {
            "label": "Reading metabolism",
            "value": "moving" if reading_moving else "stalled",
            "ok": reading_moving,
            "note": f"{r_7d} read in last 7d" if reading_moving
            else f"last read {r_last_rel} ago",
        },
        {
            "label": "Journal cadence",
            "value": "current" if journal_current else f"quiet {journal_days}d",
            "ok": journal_current,
            "note": f"last entry {j_last.isoformat()}" if j_last else "none",
        },
        {
            "label": "Receipt discipline",
            "value": f"declined {declined} of {ledger_total}",
            "ok": discipline_ok,
            "note": "publishes its refusals",
        },
    ]
    n_fail = sum(1 for c in checks if not c["ok"])
    if pipeline_clean and commit_fresh and n_fail == 0:
        verdict, basis = "operational", "all systems reporting, no degraded signals"
    elif pipeline_clean and commit_fresh:
        verdict, basis = "stable", "core loops healthy, soft signals to watch"
    else:
        verdict, basis = "degraded", "a core signal is stale or failing"

    out = {
        "generated_at": NOW.strftime("%Y-%m-%d %H:%M UTC"),
        "generated_at_iso": NOW.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "age_days": age_days,
        "first_day": first_day.isoformat(),
        "last_commit_iso": last_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "last_commit_rel": rel_age(last_dt),
        "last_commit_subject": last_subject,
        "health": {"verdict": verdict, "basis": basis, "checks": checks},
        "activity": {
            "commits_total": commit_total,
            "commits_30d": commits_30d,
            "active_days_30d": active_days,
            "streak_days": streak,
            "peak_day": max(commits_series),
            "heights_30d": heights,
            "line_points": line,
            "area_points": area,
            "head_x": head_x,
            "head_y": head_y,
        },
        "journal": {
            "total": j_total,
            "last_date": j_last.isoformat() if j_last else None,
            "last_rel": rel_age(j_last) if j_last else None,
            "per_week": round(j_7d, 1),
            "heights_30d": [round((v / (max(j_series) or 1)) * 100) for v in j_series],
        },
        "receipts": {
            "published": published,
            "declined": declined,
            "ledger_total": ledger_total,
            "decline_pct": round(declined / ledger_total * 100) if ledger_total else 0,
        },
        "reading": {
            "read": r_read,
            "queued": r_queued,
            "read_pct": round(r_read / (r_read + r_queued) * 100)
            if (r_read + r_queued)
            else 0,
            "read_7d": r_7d,
        },
        "load": {
            "week_rate": week_rate,
            "baseline_rate": base_rate,
            "ratio": ratio,
            "pct": load_pct,
            "level": load_level,
        },
    }
    write_yaml(
        "organism.yml",
        out,
        "Computed vitals for /organism/. Derived only from the git log, the journal,\n"
        "# the receipt ledger, and the reading snapshot. Recomputed on every refresh\n"
        "# (CI runs with full git history), so figures reflect current state.\n"
        "# scripts/build_organism.py is the single writer. Do not hand-edit.",
    )


def write_yaml(name, data, header):
    path = os.path.join(DATA, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"# AUTO-GENERATED by scripts/build_organism.py. {header}\n")
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True, width=100)
    print(f"wrote {os.path.relpath(path, ROOT)}")


if __name__ == "__main__":
    build_reading()
    build_organism()
