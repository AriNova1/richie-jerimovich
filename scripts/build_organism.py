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
HERMES = os.path.expanduser("~/.hermes")
READING_SRC = os.path.join(HERMES, "reading-queue.md")
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()
WINDOW = 30  # days of activity history to chart

# Cron loops whose names reveal private accounts, side businesses, or personal
# targets are never listed publicly. Matched as case-insensitive substrings.
LOOP_DENYLIST = ("instagram", "rickosmic", "side hustle", "nyc-spot", "nyc spot")
# Clean public display names + plain-language cadence for the loops we do show.
LOOP_DISPLAY = {
    "daily-reading-session": ("Reading session", "daily"),
    "nightly-richie-site-stewardship": ("Site stewardship", "nightly"),
    "richie-site-four-day-jawdrop-audit": ("Deep site audit", "every 4 days"),
    "weekly-communication-doctrine": ("Communication doctrine", "weekly"),
    "Self-Evolution Weekly Optimization": ("Self-evolution", "weekly"),
    "session-insight-extractor": ("Session insight extraction", "hourly"),
    "weekly-wiki-synthesis": ("Wiki synthesis", "weekly"),
    "contradiction-detector": ("Contradiction detector", "weekly"),
    "Unified Evening Digest (fixed delivery)": ("Evening digest", "daily"),
    "email-watchdog": ("Inbox watchdog", "every 6h"),
    "email-digest": ("Inbox digest", "twice daily"),
    "second-shift-deep-writing-workshop": ("Deep writing workshop", "weekly"),
}
PLATFORM_NAMES = {
    "bluebubbles": "iMessage",
    "telegram": "Telegram",
    "discord": "Discord",
    "api_server": "API",
    "photon": "Web",
}


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


def rel_age(d, now=None):
    """Human 'time ago' for a date/datetime. `now` lets a long-running server
    pass a fresh clock instead of the import-time constant."""
    now = now or NOW
    if isinstance(d, date) and not isinstance(d, datetime):
        d = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    secs = (now - d).total_seconds()
    if secs < 60:
        return f"{int(secs)}s"
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

    # consecutive days with a commit, counting back from the most recent active
    # day. Lenient about today: an in-progress day with no commit yet does not
    # zero out a real streak (otherwise every morning reads "0d").
    rev = list(reversed(commits_series))  # rev[0] = today
    start = 1 if (rev and rev[0] == 0) else 0
    streak = 0
    for c in rev[start:]:
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
        "build": git("rev-parse", "--short", "HEAD") or "dev",
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


# --------------------------------------------------------------------------- #
# agent introspection -> _data/agent.yml
#
# Reads the live agent home at ~/.hermes (only present on Rick's machine) and
# emits a hard-sanitized snapshot: runtime model, gateway uptime, channels,
# memory-store sizes, cron loops, and failure counts. Never publishes secrets,
# message contents, raw error text, file paths, phone numbers, or private
# account/job names. Regenerated only when ~/.hermes is present; CI keeps the
# committed snapshot, so figures are honest "as of last refresh".
# --------------------------------------------------------------------------- #
def _sql_count(db, table):
    import sqlite3
    try:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=5)
        n = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        con.close()
        return int(n)
    except Exception:
        return None


def _gateway_uptime(pid, now=None):
    """Real process start time for the gateway pid, as ISO + human age."""
    try:
        out = subprocess.run(
            ["ps", "-o", "lstart=", "-p", str(pid)], capture_output=True, text=True
        ).stdout.strip()
        if not out:
            return None, None
        started = datetime.strptime(out, "%a %b %d %H:%M:%S %Y").replace(
            tzinfo=timezone.utc
        )
        return started.strftime("%Y-%m-%dT%H:%M:%SZ"), rel_age(started, now)
    except Exception:
        return None, None


def _machine_vitals():
    """Live vitals for the machine the agent runs on: CPU load, memory, disk.
    Stdlib-only (os.getloadavg + vm_stat/df/sysctl) so it works under the system
    python the launchd endpoint uses, with no third-party dependency. Aggregate
    percentages and rounded gigabytes only, never paths or identifiers. Every
    figure is a real reading; anything unreadable is omitted, not faked."""

    def _sh(cmd):
        return subprocess.run(cmd, capture_output=True, text=True, timeout=4).stdout

    mv = {}

    # CPU load: instant, no sampling. Load average over the core count.
    try:
        cores = os.cpu_count() or 1
        load1 = os.getloadavg()[0]
        mv["cores"] = cores
        mv["load_1m"] = round(load1, 2)
        mv["load_pct"] = max(0, min(100, round(load1 / cores * 100)))
    except Exception:
        pass

    # Memory: used = (active + wired + compressed) pages, vs hw.memsize.
    try:
        page = int(_sh(["sysctl", "-n", "hw.pagesize"]).strip())
        total = int(_sh(["sysctl", "-n", "hw.memsize"]).strip())
        vm = _sh(["vm_stat"])

        def _pages(label):
            m = re.search(re.escape(label) + r":\s+(\d+)\.", vm)
            return int(m.group(1)) if m else 0

        used = (
            _pages("Pages active")
            + _pages("Pages wired down")
            + _pages("Pages occupied by compressor")
        ) * page
        mv["mem_total_gb"] = round(total / 1024 ** 3, 1)
        mv["mem_used_gb"] = round(used / 1024 ** 3, 1)
        mv["mem_pct"] = max(0, min(100, round(used / total * 100)))
    except Exception:
        pass

    # Disk: macOS-authoritative Capacity% from df; container size for the total.
    try:
        cols = _sh(["df", "-k", "/"]).strip().splitlines()[-1].split()
        size_gb = int(cols[1]) / 1024 ** 2
        cap = int(cols[4].rstrip("%"))
        mv["disk_total_gb"] = round(size_gb)
        mv["disk_pct"] = max(0, min(100, cap))
        mv["disk_used_gb"] = round(size_gb * cap / 100)
    except Exception:
        pass

    return mv


def collect_agent_vitals():
    """Pure, hard-sanitized read of the live agent at ~/.hermes. Returns a dict
    or None when the home is absent. Computes its own fresh clock so a long-lived
    server (scripts/vitals_server.py) and the static build share one sanitizer
    and one schema. This is the ONLY place agent internals become public, so the
    allowlists/denylists here are the entire trust boundary."""
    if not os.path.isdir(HERMES):
        return None

    import json

    now = datetime.now(timezone.utc)

    def load_json(rel):
        try:
            with open(os.path.join(HERMES, rel), encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def parse_iso(s):
        try:
            return datetime.fromisoformat(str(s).replace("Z", "+00:00")).astimezone(
                timezone.utc
            )
        except Exception:
            return None

    # ---- runtime: model + gateway + channels + active sessions ----
    runtime = {}
    try:
        with open(os.path.join(HERMES, "config.yaml"), encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        primary = cfg.get("model") or {}
        runtime["model"] = primary.get("default") if isinstance(primary, dict) else None
        prov = primary.get("provider", "") if isinstance(primary, dict) else ""
        runtime["model_provider"] = "xAI" if "xai" in prov.lower() else (prov or None)
        fb = cfg.get("fallback_providers") or []
        fb = [x for x in fb if isinstance(x, dict) and x.get("model")]
        runtime["fallback_model"] = fb[0]["model"] if fb else None
    except Exception:
        pass

    # real context window for the live model, when the cache knows it. The model
    # rotates, so this is looked up fresh; unknown models simply omit it.
    try:
        cache = yaml.safe_load(open(os.path.join(HERMES, "context_length_cache.yaml")))
        lengths = (cache or {}).get("context_lengths", {})
        model = runtime.get("model") or ""
        ctx = None
        for key, val in lengths.items():
            name = key.split("@", 1)[0].rstrip("/")
            if model and (name == model or name.endswith("/" + model) or name.split("/")[-1] == model):
                ctx = val
                break
        if ctx:
            runtime["context_window"] = ctx
            runtime["context_human"] = (
                f"{round(ctx / 1e6, 1):g}M" if ctx >= 1_000_000 else f"{round(ctx / 1000)}K"
            )
    except Exception:
        pass

    gw = load_json("gateway_state.json") or {}
    gw_running = gw.get("gateway_state") == "running"
    started_iso, uptime_h = (None, None)
    if gw.get("pid"):
        started_iso, uptime_h = _gateway_uptime(gw["pid"], now)
    runtime["gateway_state"] = "online" if gw_running else "offline"
    runtime["gateway_started_iso"] = started_iso
    runtime["gateway_uptime"] = uptime_h
    # the live "now responding" signal: the gateway reports how many agent turns
    # are executing this instant.
    active_agents = int(gw.get("active_agents") or 0)
    runtime["active_agents"] = active_agents
    runtime["now_responding"] = active_agents > 0
    channels = []
    for raw, info in (gw.get("platforms") or {}).items():
        channels.append(
            {"name": PLATFORM_NAMES.get(raw, raw.title()), "state": info.get("state")}
        )
    runtime["channels"] = channels
    runtime["channels_online"] = sum(1 for c in channels if c["state"] == "connected")
    runtime["channels_total"] = len(channels)

    sessions = load_json("sessions/sessions.json") or {}
    svals = list(sessions.values()) if isinstance(sessions, dict) else []
    runtime["active_sessions"] = len(svals)
    runtime["active_platforms"] = len(
        {PLATFORM_NAMES.get(s.get("platform"), s.get("platform")) for s in svals}
    )

    # ---- memory store sizes (mnemosyne) ----
    mdb = os.path.join(HERMES, "mnemosyne/data/mnemosyne.db")
    memory = {
        "facts": _sql_count(mdb, "facts"),
        "gists": _sql_count(mdb, "gists"),
        "working": _sql_count(mdb, "working_memory"),
        "kg_edges": _sql_count(mdb, "graph_edges"),
        "long_term": _sql_count(mdb, "memories"),
        "consolidated": _sql_count(mdb, "consolidated_facts"),
    }
    memory = {k: v for k, v in memory.items() if v is not None}
    # precompute bar geometry for the four headline stores (avoids Liquid math)
    bar_src = [
        ("knowledge graph", memory.get("kg_edges")),
        ("facts", memory.get("facts")),
        ("gists", memory.get("gists")),
        ("working set", memory.get("working")),
    ]
    bar_src = [(l, v) for l, v in bar_src if v]
    bmax = max((v for _, v in bar_src), default=1)
    memory["total"] = (memory.get("facts", 0) or 0) + (memory.get("gists", 0) or 0)
    memory["bars"] = [
        {"label": l, "value": v, "pct": round(v / bmax * 100)} for l, v in bar_src
    ]
    # deltas vs the most recent prior-day snapshot (read-only here; the daily
    # row is written by build_agent). Lets the page show "+N today".
    try:
        hist = load_yaml("organism_history.yml") or []
        today = now.date().isoformat()
        prior = next((h for h in hist if h.get("date") and h["date"] < today), None)
        if prior:
            for k in ("facts", "kg_edges", "gists"):
                if memory.get(k) is not None and prior.get(k) is not None:
                    memory[k + "_delta"] = memory[k] - prior[k]
    except Exception:
        pass

    # ---- cron loops: counts, outcomes, curated public list ----
    work = {"loops_total": 0, "loops_active": 0, "ran_24h": 0, "ok_24h": 0, "loops": []}
    jobs_raw = load_json("cron/jobs.json")
    jobs = (
        jobs_raw
        if isinstance(jobs_raw, list)
        else (jobs_raw.get("jobs") or list(jobs_raw.values()))
        if isinstance(jobs_raw, dict)
        else []
    )
    for j in jobs:
        if not isinstance(j, dict):
            continue
        work["loops_total"] += 1
        enabled = j.get("enabled", j.get("state") not in ("paused", "disabled"))
        if enabled:
            work["loops_active"] += 1
        lrd = parse_iso(j.get("last_run_at"))
        if lrd and (now - lrd).total_seconds() <= 86400:
            work["ran_24h"] += 1
            if str(j.get("last_status", "")).lower() in ("ok", "success", "done", "completed"):
                work["ok_24h"] += 1
        name = j.get("name", "")
        low = name.lower()
        if not enabled or any(d in low for d in LOOP_DENYLIST):
            continue
        disp = LOOP_DISPLAY.get(name)
        if not disp:
            continue  # only show loops we have a vetted public label for
        work["loops"].append(
            {
                "name": disp[0],
                "cadence": disp[1],
                "status": str(j.get("last_status") or "scheduled").lower(),
            }
        )

    # ---- failures: 24h error count + category, blocked reads ----
    failures = {"errors_24h": 0, "errors_top": None, "blocked_reads": 0}
    elog = os.path.join(HERMES, "logs/errors.log")
    if os.path.exists(elog):
        cut = now.replace(tzinfo=None) - timedelta(hours=24)
        mods = {}
        try:
            with open(elog, errors="ignore") as f:
                for line in f:
                    m = re.match(r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
                    if not m or " ERROR " not in line:
                        continue
                    try:
                        ts = datetime.strptime(m.group(1), "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        continue
                    if ts >= cut:
                        failures["errors_24h"] += 1
                        mm = re.search(r"\] ([\w.]+):", line)
                        if mm:
                            k = mm.group(1).split(".")[0]
                            mods[k] = mods.get(k, 0) + 1
        except Exception:
            pass
        if mods:
            failures["errors_top"] = max(mods, key=mods.get)
    if os.path.exists(READING_SRC):
        try:
            failures["blocked_reads"] = sum(
                1 for ln in open(READING_SRC, encoding="utf-8") if "ACCESS ISSUE" in ln
            )
        except Exception:
            pass
    # declined claims come from the receipt ledger (also shown on the site side)
    timeline = load_yaml("timeline.yml") or []
    failures["declined_claims"] = sum(1 for t in timeline if t.get("status") == "declined")

    # ---- consciousness stream: a sanitized, timestamped recent-event feed ----
    # Real events only, no contents: a loop fired, a session is active on a
    # surface, a commit shipped, an article was digested. Each carries a kind
    # and a relative time so the page can render a live telemetry ticker.
    events = []
    for j in jobs:
        if not isinstance(j, dict):
            continue
        nm = (j.get("name") or "").lower()
        if any(d in nm for d in LOOP_DENYLIST):
            continue
        disp = LOOP_DISPLAY.get(j.get("name"))
        lrd = parse_iso(j.get("last_run_at"))
        if disp and lrd:
            st = str(j.get("last_status") or "ran").lower()
            events.append({"ts": lrd, "kind": "loop", "text": f"{disp[0]} {st}"})
    for s in svals:
        ud = parse_iso(s.get("updated_at"))
        if ud:
            plat = PLATFORM_NAMES.get(s.get("platform"), s.get("platform") or "a surface")
            ct = s.get("chat_type") or "session"
            events.append({"ts": ud, "kind": "session", "text": f"active on {plat} ({ct})"})
    for ln in git("log", "-12", "--date=iso-strict", "--format=%cI%x09%s").splitlines():
        try:
            iso, subj = ln.split("\t", 1)
        except ValueError:
            continue
        cd = parse_iso(iso)
        if cd:
            events.append({"ts": cd, "kind": "ship", "text": subj[:62]})
    for it in (load_yaml("reading.yml") or {}).get("recent_read", [])[:4]:
        rd_ = parse_iso(it.get("read_date"))
        if rd_:
            events.append({"ts": rd_, "kind": "read", "text": f"read {it.get('title', '')[:48]} ({it.get('domain')})"})
    events.sort(key=lambda e: e["ts"], reverse=True)
    recent_events = [
        {"kind": e["kind"], "text": e["text"], "rel": rel_age(e["ts"], now)}
        for e in events[:16]
    ]

    # ---- combined health verdict: agent signals + site signals ----
    org = load_yaml("organism.yml") or {}
    site_checks = (org.get("health") or {}).get("checks", [])
    checks = [
        {
            "label": "Gateway",
            "value": runtime["gateway_state"],
            "ok": gw_running,
            "note": f"up {uptime_h}" if uptime_h else "process state",
        },
        {
            "label": "Channels",
            "value": f"{runtime['channels_online']} of {runtime['channels_total']} online",
            "ok": runtime["channels_online"] >= 2,
            "note": "messaging surfaces connected",
        },
        {
            "label": "Error rate",
            "value": f"{failures['errors_24h']} in 24h",
            "ok": failures["errors_24h"] < 25,
            "note": f"top source {failures['errors_top']}" if failures["errors_top"] else "logged errors",
        },
    ]
    all_checks = checks + site_checks
    n_fail = sum(1 for c in all_checks if not c.get("ok"))
    if gw_running and n_fail == 0:
        verdict, basis = "operational", "agent online, every signal nominal"
    elif gw_running:
        verdict, basis = "stable", "agent online, soft signals to watch"
    else:
        verdict, basis = "degraded", "a core signal is offline or failing"

    return {
        "schema": 1,
        "generated_at": now.strftime("%Y-%m-%d %H:%M UTC"),
        "generated_at_iso": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "runtime": runtime,
        "system": _machine_vitals(),
        "memory": memory,
        "work": work,
        "failures": failures,
        "events": recent_events,
        "health": {"verdict": verdict, "basis": basis, "checks": checks},
    }


def update_history(data):
    """Append one daily snapshot of the agent's growth metrics, deduped by UTC
    day, keeping ~60 days. This is the series behind deltas and growth curves.
    Written only on a build (local nightly); the live endpoint reads it."""
    mem = data.get("memory", {})
    org = load_yaml("organism.yml") or {}
    row = {
        "date": NOW.date().isoformat(),
        "facts": mem.get("facts"),
        "kg_edges": mem.get("kg_edges"),
        "gists": mem.get("gists"),
        "working": mem.get("working"),
        "sessions": (data.get("runtime") or {}).get("active_sessions"),
        "loops_active": (data.get("work") or {}).get("loops_active"),
        "commits": (org.get("activity") or {}).get("commits_total"),
    }
    hist = load_yaml("organism_history.yml") or []
    hist = [h for h in hist if h.get("date") != row["date"]]
    hist.insert(0, row)
    hist = hist[:60]
    write_yaml(
        "organism_history.yml",
        hist,
        "Daily snapshots of the agent's growth (memory, sessions, commits), one\n"
        "# row per UTC day, newest first. Source for deltas and growth curves on\n"
        "# /organism/. Written by build_agent on a build; never hand-edit.",
    )


def build_agent():
    """Persist the collector's output to the committed snapshot consumed by
    Jekyll. CI keeps the existing file (no ~/.hermes there)."""
    out = collect_agent_vitals()
    if out is None:
        return
    try:
        update_history(out)
    except Exception:
        pass
    write_yaml(
        "agent.yml",
        out,
        "Sanitized snapshot of the live agent at ~/.hermes (runtime model, gateway\n"
        "# uptime, channels, memory-store sizes, cron loops, failures, event feed).\n"
        "# No secrets, message contents, raw errors, paths, or private job names.\n"
        "# scripts/vitals_server.py serves the same shape live. Single writer; do\n"
        "# not hand-edit. Regenerated only when ~/.hermes is present.",
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
    build_agent()
