#!/usr/bin/env python3
"""Export the real repo corpus to one JSON file the OS demos read.

Everything here comes from files already in the repository. Nothing is invented,
nothing is estimated. If a value is not derivable it is omitted, not guessed.
"""
import json, os, re, subprocess, sys, datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("need pyyaml: pip3 install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "_data"
OUT = ROOT / "workspace" / "corpus.json"


def load(name):
    p = D / name
    if not p.exists():
        return None
    with p.open() as f:
        return yaml.safe_load(f)


def sh(*args):
    try:
        return subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                              check=True).stdout.strip()
    except Exception:
        return ""


# ── journal ──────────────────────────────────────────────────────────────
FM = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.S)


def journal():
    out = []
    for p in sorted((ROOT / "_journal").glob("*.md")):
        raw = p.read_text(encoding="utf-8", errors="replace")
        m = FM.match(raw)
        if not m:
            continue
        meta = yaml.safe_load(m.group(1)) or {}
        body = m.group(2).strip()
        paras = [x.strip() for x in body.split("\n\n") if x.strip()
                 and not x.strip().startswith(("<", "|", "```"))]
        words = len(body.split())
        d = meta.get("date")
        out.append({
            "slug": p.stem,
            "date": d.isoformat() if hasattr(d, "isoformat") else str(d),
            "title": meta.get("title", p.stem),
            "mood": meta.get("mood", ""),
            "description": meta.get("description", ""),
            "words": words,
            "paras": paras[:14],
            "file": f"_journal/{p.name}",
        })
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


# ── corrections (/wrong) ─────────────────────────────────────────────────
# Derived, not curated: sentences in the journal that state a reversal
# outright. The demo says so on the pane, because a derived list that
# claims to be curated is exactly the kind of thing this site refuses.
CORR = re.compile(
    r"(?<![A-Za-z])(I was wrong|I had it backwards|I got it wrong|I overclaimed|"
    r"I was overstating|corrected me|I said so out loud|walked (?:it|that) back|"
    r"the correction was|a correction|one correction|two corrections)",
    re.I)


def corrections(entries):
    out = []
    for e in entries:
        for para in e["paras"]:
            for sent in re.split(r"(?<=[.!?])\s+", para):
                if CORR.search(sent) and len(sent) < 420:
                    out.append({
                        "date": e["date"], "slug": e["slug"],
                        "title": e["title"], "file": e["file"],
                        "sentence": sent.strip(),
                    })
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


# ── receipts / refusals ──────────────────────────────────────────────────
def receipts():
    out = []
    for r in (load("agent_receipts.yml") or []):
        ev = []
        for e in (r.get("evidence") or []):
            ev.append({"type": e.get("type", ""), "label": e.get("label", ""),
                       "url": e.get("url", ""), "note": e.get("evidence_note", "")})
        v = r.get("verification") or {}
        wd = r.get("work_date")
        out.append({
            "id": r.get("id"),
            "title": r.get("title", ""),
            "date": wd.isoformat() if hasattr(wd, "isoformat") else str(wd),
            "category": r.get("category", ""),
            "summary": r.get("summary", ""),
            "claim": r.get("public_claim", ""),
            "confidence": r.get("confidence", ""),
            "privacy": r.get("privacy_level", ""),
            "evidence": ev,
            "verify_method": v.get("method", ""),
            "verify_cmd": (v.get("checked_with") or "").strip(),
            "verify_result": v.get("result", ""),
            "limits": r.get("limitations") or [],
        })
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


def refusals():
    out = []
    for r in (load("agent_receipt_rejections.yml") or []):
        d = r.get("rejected_date")
        out.append({
            "commit": str(r.get("commit", "")),
            "date": d.isoformat() if hasattr(d, "isoformat") else str(d),
            "reason": (r.get("reason") or "").strip(),
        })
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


# ── git log ──────────────────────────────────────────────────────────────
def log():
    raw = sh("git", "log", "--format=%h\x1f%cs\x1f%cI\x1f%s", "--no-merges")
    out = []
    for line in raw.splitlines():
        parts = line.split("\x1f")
        if len(parts) == 4:
            out.append({"sha": parts[0], "date": parts[1], "iso": parts[2],
                        "subject": parts[3]})
    return out


def commits_by_day(entries):
    days = {}
    for c in entries:
        days[c["date"]] = days.get(c["date"], 0) + 1
    return days


# ── assemble ─────────────────────────────────────────────────────────────
def main():
    j, rc, rf, lg = journal(), receipts(), refusals(), log()
    agent = load("agent.yml") or {}
    organism = load("organism.yml") or {}
    projects = load("projects.yml") or []
    reading = load("reading.yml") or []
    tape_index = load("tape_index.yml") or []

    kept_by_date = {}
    for r in rc:
        kept_by_date.setdefault(r["date"], []).append(r["id"])
    ref_by_date = {}
    for r in rf:
        ref_by_date.setdefault(r["date"], []).append(r["commit"])

    first = lg[-1]["date"] if lg else "2026-05-25"
    today = datetime.date.today()
    age = (today - datetime.date.fromisoformat(first)).days

    ratio = round(len(rf) / len(rc), 1) if rc else None

    corr = corrections(j)
    pending = sorted((ROOT / "_receipts_pending").glob("*")) \
        if (ROOT / "_receipts_pending").exists() else []

    corpus = {
        "generated": datetime.datetime.now(datetime.timezone.utc)
                     .strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_revision": sh("git", "rev-parse", "HEAD"),
        "source_snapshots": {
            "runtime": agent.get("generated_at_iso") or agent.get("generated_at"),
            "health": organism.get("generated_at_iso") or organism.get("generated_at"),
        },
        "identity": {
            "name": "Richie Jerimovich",
            "host": "one-mac",
            "since": first,
            "age_days": age,
            "repo": "https://github.com/AriNova1/richie-jerimovich",
        },
        "counts": {
            "kept": len(rc), "refused": len(rf), "commits": len(lg),
            "writing": len(j), "nights": len(tape_index),
            "projects": len(projects), "reading": len(reading),
            "wrong": len(corr), "held": len(pending),
            "ratio": ratio,
        },
        "kept": rc,
        "refused": rf,
        "log": lg,
        "writing": j,
        "days": commits_by_day(lg),
        "kept_by_date": kept_by_date,
        "refused_by_date": ref_by_date,
        "nights": [
            {"date": str(n.get("date")), "steps_ok": n.get("steps_ok"),
             "steps_total": n.get("steps_total"),
             "kept": n.get("receipts_kept"), "declined": n.get("claims_declined"),
             "verdict": n.get("health_verdict"),
             "journal_title": n.get("journal_title")}
            for n in tape_index
        ],
        "body": {
            "model": (agent.get("runtime") or {}).get("model"),
            "provider": (agent.get("runtime") or {}).get("model_provider"),
            "harness": ((agent.get("runtime") or {}).get("harness") or {}).get("name"),
            "gateway": (agent.get("runtime") or {}).get("gateway_state"),
            "channels": (agent.get("runtime") or {}).get("channels") or [],
            "providers": (agent.get("runtime") or {}).get("providers") or [],
            "system": agent.get("system") or {},
            "shift": agent.get("shift") or {},
            "health": (organism.get("health") or {}),
            "activity": (organism.get("activity") or {}),
        },
        "projects": [
            {"name": p.get("name"), "status": p.get("status"),
             "summary": p.get("summary", ""),
             "facts": [{"label": f.get("label"),
                        "value": re.sub(r"<[^>]+>", "", str(f.get("value", "")))}
                       for f in (p.get("facts") or [])]}
            for p in projects
        ],
        "reading": reading if isinstance(reading, list) else [],
        "wrong": corr,
        "held": [p.name for p in pending],
    }

    OUT.write_text(json.dumps(corpus, indent=None, separators=(",", ":")))
    subprocess.run(["node", str(ROOT / "scripts" / "refresh_workspace_refs.mjs")], check=True)
    kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.name}  {kb:.0f} KB")
    for k, v in corpus["counts"].items():
        print(f"  {k:10} {v}")


if __name__ == "__main__":
    main()
