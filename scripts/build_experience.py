#!/usr/bin/env python3
"""Build the canonical data file for the /inside/ cinematic experience.

Every scene on /inside/ reads from _data/experience.yml so the film cannot
drift from the public record. Everything here is derived from real repo data:
git log, _journal/, _data/agent_receipts.yml, _data/agent_receipt_rejections.yml.
Nothing is invented. Where no honest line exists for a voice, the script says
so (dramatized: true, line_source: null) and the page labels it.

Output: _data/experience.yml  (consumed by inside.md at build time)

Re-runnable, deterministic for a given repo state:
    python3 scripts/build_experience.py
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
RECEIPTS = ROOT / "_data" / "agent_receipts.yml"
REJECTIONS = ROOT / "_data" / "agent_receipt_rejections.yml"
TIMELINE = ROOT / "_data" / "timeline.yml"
JOURNAL_DIR = ROOT / "_journal"
OUT = ROOT / "_data" / "experience.yml"
REPO = "https://github.com/AriNova1/richie-jerimovich"

# The experience follows the latest published receipt that is eligible to
# anchor the film. Receipts may set experience_skip: true when they document
# the /inside/ surface itself and would make the film self-referential.
# The chosen receipt's work date anchors commits, journal, pressure readings,
# cost, and evidence to one real night.
JOURNAL_SCAN_DEPTH = 10


# ── loaders ──────────────────────────────────────────────────────────────

def load_yaml(path: Path):
    if not path.exists():
        return []
    return yaml.safe_load(path.read_text()) or []


def git_commits(limit: int = 300):
    """Return [{sha, date, subject}] newest-first, like build_timeline.py."""
    fmt = "%h\x1f%cs\x1f%s"
    out = subprocess.run(
        ["git", "log", f"-{limit}", f"--pretty=format:{fmt}"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    rows = []
    for line in out.splitlines():
        if not line.strip():
            continue
        sha, date, subject = line.split("\x1f", 2)
        rows.append({"sha": sha, "date": date, "subject": subject})
    return rows


def commits_from_timeline():
    """Defensive fallback when git is unavailable: reuse the built timeline."""
    rows = []
    for e in load_yaml(TIMELINE):
        if e.get("type") != "commit":
            continue
        rows.append({"sha": e.get("sha", ""), "date": e.get("date", ""),
                     "subject": e.get("subject", "")})
    return rows


def parse_journal(path: Path):
    """Return {slug, url, date, title, body} for one journal file."""
    slug = path.stem
    text = path.read_text()
    title = slug
    body = text
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if m:
        try:
            fm = yaml.safe_load(m.group(1)) or {}
            title = str(fm.get("title") or slug)
        except yaml.YAMLError:
            pass
        body = m.group(2)
    date = slug[:10] if re.match(r"\d{4}-\d{2}-\d{2}", slug) else ""
    return {
        "slug": slug,
        "url": f"/journal/{slug}/",
        "date": date,
        "title": title,
        "body": body,
    }


def recent_journals(depth: int = JOURNAL_SCAN_DEPTH):
    """Newest-first parsed journal entries."""
    files = sorted(JOURNAL_DIR.glob("*.md"), reverse=True)
    return [parse_journal(p) for p in files[:depth]]


# ── text helpers ─────────────────────────────────────────────────────────

def strip_markdown(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)  # links -> label
    text = re.sub(r"[*_`>#]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def sentences(body: str):
    """Naive sentence split, good enough for the journal's plain prose."""
    flat = re.sub(r"\s+", " ", strip_markdown(body))
    parts = re.split(r"(?<=[.!?])\s+", flat)
    return [p.strip() for p in parts if p.strip()]


def truncate(text: str, limit: int) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[: limit - 3].rsplit(" ", 1)[0]
    return cut.rstrip(",;:—-") + "..."


def journal_excerpt(body: str, limit: int = 320) -> str:
    paras = [p for p in re.split(r"\n\s*\n", body) if p.strip()]
    first_two = " ".join(strip_markdown(p) for p in paras[:2])
    return truncate(first_two, limit)


# ── voice line scanner ───────────────────────────────────────────────────
# Each pressure gets a weighted keyword set. Sentences containing the
# journal's rhetorical device ("counterargument") are disqualified: that is
# the form of the diary, not a voice speaking.

PRESSURE_ORDER = ["mike", "beard", "rocky", "sean", "richie"]

PRESSURE_BEHAVIOR = {
    "mike": "pulls the evidence thread",
    "beard": "dims the risky branch",
    "rocky": "opens the tool and moves",
    "sean": "pauses the room for the truth",
    "richie": "pushes the plate across",
}

PRESSURE_KEYWORDS = {
    "mike": [("reading session", 2), ("synthes", 2), ("benchmark", 2),
             ("research", 2), ("pattern", 1), ("study", 1), ("signal", 1)],
    "beard": [("still broken", 3), ("still blind", 3), ("watchdog", 2),
              ("still dead", 3), ("dead", 2), ("refus", 2),
              ("drift", 2), ("risk", 1), ("wait", 1)],
    "rocky": [("moved the lever", 3), ("shipped", 2), ("built", 2),
              ("rebuilt", 2), ("rebuild", 2), ("updated", 1), ("fix", 1),
              ("cut", 1)],
    "sean": [("pretend", 2), ("truth", 2), ("honest", 2), ("noise", 2),
             ("named", 1), ("actually", 1), ("real", 1)],
    "richie": [("comes back", 3), ("thread", 2), ("showed up", 2),
               ("promise", 2), ("family", 2), ("sits down", 2),
               ("loyal", 2), ("heart", 1)],
}

# Clearly-generic in-character fallbacks, only used when the journal has no
# honest line for a voice. The page badges these as dramatized.
PRESSURE_FALLBACK = {
    "mike": "Show me the reading behind it, or it does not go on the ticket.",
    "beard": "Slow down. Name what breaks before you touch it.",
    "rocky": "Cut it smaller. Ship the piece that works tonight.",
    "sean": "Say the true thing first. The fix can wait one breath.",
    "richie": "We do not leave the line. Not for anybody.",
}

MIN_LINE_LEN = 15
MAX_LINE_LEN = 140


def score_sentence(sentence: str, keywords) -> int:
    score = 0
    low = sentence.lower()
    for stem, weight in keywords:
        if re.search(r"\b" + re.escape(stem), low):
            score += weight
    return score


def find_voice_lines(journals):
    """Pick one quoted line per pressure from recent journal entries.

    Deterministic: scan newest journal first, sentences in order; the highest
    score wins, ties go to the earliest candidate. No hit -> dramatized
    fallback with line_source null.
    """
    best = {v: {"score": 0, "line": None, "url": None} for v in PRESSURE_ORDER}
    for j in journals:
        for sent in sentences(j["body"]):
            if "counterargument" in sent.lower():
                continue
            if not (MIN_LINE_LEN <= len(sent) <= MAX_LINE_LEN):
                continue
            for voice in PRESSURE_ORDER:
                s = score_sentence(sent, PRESSURE_KEYWORDS[voice])
                if s > best[voice]["score"]:
                    best[voice] = {"score": s, "line": sent, "url": j["url"]}

    pressures = []
    for voice in PRESSURE_ORDER:
        b = best[voice]
        if b["line"]:
            pressures.append({
                "voice": voice,
                "behavior": PRESSURE_BEHAVIOR[voice],
                "line": b["line"],
                "line_source": b["url"],
                "dramatized": False,
            })
        else:
            pressures.append({
                "voice": voice,
                "behavior": PRESSURE_BEHAVIOR[voice],
                "line": PRESSURE_FALLBACK[voice],
                "line_source": None,
                "dramatized": True,
            })
    return pressures


# ── cost scanner ─────────────────────────────────────────────────────────

COST_KEYWORDS = [("did not write alone", 4), ("co-auth", 4),
                 ("external coding agent", 3), ("still broken", 3),
                 ("still blind", 3), ("timed out", 3), ("429", 3),
                 ("failed", 3), ("failure", 3), ("dead", 2),
                 ("refused", 1), ("drift", 1), ("error", 1)]

COST_MEANING = {
    "did not write alone": "The work shipped, but a sole-credit story would be false. The receipt names the collaboration.",
    "co-auth": "The work shipped, but authorship is shared. Proof includes who helped make it.",
    "external coding agent": "Another system did the heavy lifting. The record keeps that context beside the claim.",
    "timed out": "A job waited on an API that never answered. That run shipped nothing.",
    "still broken": "It stayed broken through the night. Reporting it again is not the fix.",
    "still blind": "A sensor stayed dark. The machine worked around what it could not see.",
    "refused": "The scheduler declined to spend on a config nobody pinned. Silence has a price.",
    "drift": "The config moved and the job did not. Unpinned work breaks quietly.",
    "failed": "The job failed and the record says so. Autonomy includes the misses.",
    "dead": "Some scheduled jobs were still dead. A running system has to name the parts that are not running.",
}


def meaning_for(text: str) -> str:
    low = text.lower()
    for stem, _ in COST_KEYWORDS:
        if re.search(r"\b" + re.escape(stem), low) and stem in COST_MEANING:
            return COST_MEANING[stem]
    return "The job failed and the record says so. Autonomy includes the misses."


def find_cost(commits, journals, night_date: str):
    """One real cost from the same night as the anchored receipt."""

    candidates = []  # (score, length, order, text, source)
    order = 0

    # Commit subjects from the anchored night.
    for c in commits:
        if night_date and c["date"] != night_date:
            continue
        s = score_sentence(c["subject"], COST_KEYWORDS)
        if s > 0:
            candidates.append((s, len(c["subject"]), order,
                               truncate(c["subject"], 160),
                               f"{REPO}/commit/{c['sha']}"))
            order += 1

    # Journal sentences from the anchored night; merge a short hit with the next
    # sentence when the pair still fits the card.
    for j in journals:
        if night_date and j["date"] != night_date:
            continue
        sents = sentences(j["body"])
        for i, sent in enumerate(sents):
            s = score_sentence(sent, COST_KEYWORDS)
            if s == 0:
                continue
            text = sent
            if len(sent) < 80 and i + 1 < len(sents):
                merged = sent + " " + sents[i + 1]
                if len(merged) <= 160:
                    text = merged
                    s += score_sentence(sents[i + 1], COST_KEYWORDS)
            candidates.append((s, len(text), order, truncate(text, 160), j["url"]))
            order += 1

    if candidates:
        # Highest score wins; ties prefer the more informative (longer) text,
        # then the earliest scanned.
        candidates.sort(key=lambda c: (-c[0], -c[1], c[2]))
        _, _, _, text, source = candidates[0]
        authorship = any(stem in text.lower() for stem in (
            "did not write alone", "co-auth", "external coding agent"))
        return {
            "what_happened": text,
            "source": source,
            "what_it_means": meaning_for(text),
            "kind": "authorship-cost" if authorship else "failure",
        }

    # Honest fallback: a claim the system refused on the anchored night.
    rejections = [r for r in load_yaml(REJECTIONS)
                  if r.get("rejected_date") == night_date]
    if rejections:
        r = rejections[0]
        reason = truncate(str(r.get("reason", "")), 160)
        return {
            "what_happened": f"Declined to claim commit {r.get('commit')}: {reason}",
            "source": "/receipts/",
            "what_it_means": "The ledger said no. A claim refused is a cost too.",
            "kind": "declined-claim",
        }
    return None


# ── the ask ──────────────────────────────────────────────────────────────

def find_ask(night_commits, night_journal, receipt=None):
    """One real task from the night. Prefer a non-stewardship commit; else
    pull the literal ask out of the journal; else the journal title."""
    if receipt:
        evidence = receipt.get("evidence") or []
        first_evidence = evidence[0] if evidence else {}
        return {
            "title": truncate(str(receipt.get("title") or "The receipt's task"), 90),
            "source_ref": first_evidence.get("label") or receipt.get("id"),
            "source_url": first_evidence.get("url") or receipt.get("url"),
        }
    for c in night_commits:
        if not c["subject"].lower().startswith("stewardship"):
            return {
                "title": truncate(c["subject"], 90),
                "source_ref": c["sha"],
                "source_url": f"{REPO}/commit/{c['sha']}",
            }
    if night_journal:
        m = re.search(r"the ask:\s*(.+?)[.!?](?:\s|$)", night_journal["body"],
                      re.I | re.S)
        if m:
            return {
                "title": truncate(strip_markdown(m.group(1)), 90),
                "source_ref": night_journal["slug"],
                "source_url": night_journal["url"],
            }
        return {
            "title": night_journal["title"],
            "source_ref": night_journal["slug"],
            "source_url": night_journal["url"],
        }
    if night_commits:
        c = night_commits[0]
        return {
            "title": truncate(c["subject"], 90),
            "source_ref": c["sha"],
            "source_url": f"{REPO}/commit/{c['sha']}",
        }
    return None


# ── threshold lines ──────────────────────────────────────────────────────

def build_threshold_lines(night_date, night_commits, night_journal,
                          kept, declined, journal_count):
    lines = [f"night of {night_date}: service ticket"]
    if night_journal:
        lines.append(truncate(f"journal: {night_journal['title'].lower()}", 60))
    for c in night_commits:
        lines.append(truncate(f"{c['sha']} {c['subject']}", 60))
    lines.append(truncate(f"{kept} receipts kept · {declined} claims declined", 60))
    lines.append(truncate(f"{journal_count} journal entries on the shelf", 60))
    return [l[:60] for l in lines[:8]]


# ── main ─────────────────────────────────────────────────────────────────

def main() -> int:
    try:
        commits = git_commits()
    except (subprocess.CalledProcessError, FileNotFoundError):
        commits = commits_from_timeline()

    receipts = load_yaml(RECEIPTS)
    rejections = load_yaml(REJECTIONS)
    journals = recent_journals()
    journal_count = len(list(JOURNAL_DIR.glob("*.md"))) if JOURNAL_DIR.exists() else 0

    kept = len(receipts)
    declined = len(rejections)

    latest_receipt = None
    if receipts:
        eligible = [r for r in receipts if not r.get("experience_skip")]
        pool = eligible or receipts
        r = sorted(pool, key=lambda x: x.get("sort_order", 0),
                   reverse=True)[0].copy()
        r["url"] = f"/receipts/#{r.get('id')}"
        latest_receipt = r

    night_date = (latest_receipt or {}).get("work_date") or (
        commits[0]["date"] if commits else (
            journals[0]["date"] if journals else ""))
    night_commits = [c for c in commits if c["date"] == night_date]
    night_journal = next((j for j in journals if j["date"] == night_date), None)
    trace_journals = [night_journal] if night_journal else []

    experience = {
        "night": {
            "date": night_date,
            "receipt_id": (latest_receipt or {}).get("id"),
            "commits": [
                {"sha": c["sha"], "subject": c["subject"],
                 "url": f"{REPO}/commit/{c['sha']}"}
                for c in night_commits
            ],
            "journal": ({
                "title": night_journal["title"],
                "excerpt": journal_excerpt(night_journal["body"]),
                "slug": night_journal["slug"],
                "url": night_journal["url"],
            } if night_journal else None),
        },
        "threshold_lines": build_threshold_lines(
            night_date, night_commits, night_journal,
            kept, declined, journal_count),
        "ask": find_ask(night_commits, night_journal, latest_receipt),
        "pressures": find_voice_lines(trace_journals),
        "cost": find_cost(night_commits, trace_journals, night_date),
        "receipt": latest_receipt,
        "stats": {
            "receipts_kept": kept,
            "claims_declined": declined,
            "journal_entries": journal_count,
            "site_last_commit": commits[0]["date"] if commits else night_date,
            "trace_date": night_date,
        },
    }

    header = (
        "# AUTO-GENERATED by scripts/build_experience.py — do not hand-edit.\n"
        "# Canonical scene data for /inside/. Anchored to the latest eligible\n"
        "# published receipt (experience_skip: true is ignored) and its work\n"
        "# date; derived from git, _journal/, agent_receipts.yml and\n"
        "# agent_receipt_rejections.yml. Lines marked dramatized: true are\n"
        "# generic in-character fallbacks, not quotes.\n"
    )
    OUT.write_text(header + yaml.safe_dump(experience, sort_keys=False,
                                           allow_unicode=True))
    n_dramatized = sum(1 for p in experience["pressures"] if p["dramatized"])
    print(f"wrote experience for {night_date} -> {OUT.relative_to(ROOT)} "
          f"({len(night_commits)} commits, {len(experience['pressures'])} pressures "
          f"[{n_dramatized} dramatized], cost: {experience['cost']['kind'] if experience['cost'] else 'none'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
