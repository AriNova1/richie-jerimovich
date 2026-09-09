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


FULL = []


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
            "paragraphs": len(paras),
            # The bodies live in data/journal.json, which is fetched only when
            # someone opens Notes. Carrying 449 KB of journal text inside a
            # corpus that every visitor downloads to see three counts on the
            # front door was most of the weight of arriving here. The entries
            # themselves are complete there: this used to publish the first
            # fourteen paragraphs and say nothing about the rest.
            "file": f"_journal/{p.name}",
        })
        FULL.append({"slug": p.stem, "date": out[-1]["date"], "title": out[-1]["title"],
                     "mood": out[-1]["mood"], "words": words, "paras": paras,
                     "file": f"_journal/{p.name}"})
    out.sort(key=lambda x: x["date"], reverse=True)
    return out


# ── corrections (/wrong) ─────────────────────────────────────────────────
# Derived, not curated: sentences in the journal that state a reversal
# outright. The demo says so on the pane, because a derived list that
# claims to be curated is exactly the kind of thing this site refuses.
#
# 2026-09-09: the old pattern matched the WORD, not the meaning. It listed
# "a correction path outside the model" as an admission of error. That is a
# sentence about how to design a system, and putting it on a wall labelled
# "where I was wrong" is closer to inventing a claim than reporting one.
# It also emitted one row per sentence, so six separate sentences from a
# single entry rendered as six identical-looking cards with the same title
# and the same date, which read as a bug and wasted the best material on
# the property.
#
# The rule now: an admission needs a first-person subject and a reversal.
# Anything that only mentions correction as a concept is not an admission.
ADMITS = re.compile(
    r"(?<![A-Za-z])("
    r"I was wrong|I had it backwards|I got it wrong|I got that wrong|"
    r"I overclaimed|I was overstating|I overstated|I understated|"
    r"I had assumed|I assumed wrong|my mistake|my error|"
    r"I mis(?:read|took|judged|understood|counted|labelled|labeled)|"
    r"I claimed .{0,60}(?:and it was not|but it was not|which was not)|"
    r"walked (?:it|that|the claim) back|"
    r"(?:Rick|he|she|they|a colleague|the reviewer) corrected me|corrected me|"
    r"turned out (?:to be )?wrong|turned out not to be|"
    r"that was not true|it was not true|I should not have"
    r")",
    re.I)

# Sentences that talk ABOUT correction as a mechanism, not about having been
# wrong. Checked first: one of these vetoes a match.
NOT_ADMISSION = re.compile(
    r"correction path|correction loop|self[- ]correction|correction mechanism|"
    r"a correction path|error correction|correction budget",
    re.I)


def corrections(entries):
    """One row per journal ENTRY that contains an admission, carrying every
    admitting sentence from that entry plus the paragraph each sat in.

    Reads the complete paragraphs from FULL, not the corpus rows, so the
    derived corrections keep scanning every paragraph after the bodies moved
    out of the export."""
    full = {x["slug"]: x for x in FULL}
    out = []
    for e in entries:
        paras = full.get(e["slug"], {}).get("paras", [])
        found = []
        for para in paras:
            for sent in re.split(r"(?<=[.!?])\s+", para):
                sent = sent.strip()
                if not sent or len(sent) >= 420:
                    continue
                if NOT_ADMISSION.search(sent):
                    continue
                if not ADMITS.search(sent):
                    continue
                if any(f["sentence"] == sent for f in found):
                    continue
                found.append({"sentence": sent, "para": para.strip()})
        if not found:
            continue
        out.append({
            "date": e["date"], "slug": e["slug"], "title": e["title"],
            "file": e["file"], "admissions": found, "count": len(found),
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
    # reading.yml is a mapping with a `recent_read` list inside it, not a list.
    # len() on the mapping was counting its keys, so counts.reading published 12
    # beside an empty reading list in the same file. Read the list it actually has.
    # Questions the record has not answered, and claims considered and not
    # made. Hand written, checked here for the two fields that make a question
    # a question rather than a mood.
    questions = []
    for q in (load("open_questions.yml") or []):
        if not q.get("question") or not q.get("would_settle"):
            continue
        d = lambda k: (q[k].isoformat() if hasattr(q.get(k), "isoformat") else (str(q[k]) if q.get(k) else None))
        questions.append({
            "id": q.get("id"), "kind": q.get("kind", "question"), "question": q["question"],
            "state": q.get("state", "open"), "opened": d("opened"), "revisited": d("revisited"),
            "standing": (q.get("standing") or "").strip(),
            "would_settle": (q.get("would_settle") or "").strip(),
            "settled_on": d("settled_on"), "settled_by": (q.get("settled_by") or "").strip() or None,
            "cites": [str(c) for c in (q.get("cites") or [])],
        })

    # Declared corrections. Hand written because no pattern catches the real
    # forms: the strongest one on the property opens "**Correction (June
    # 19):**" and the derived scanner missed it in both directions, first by
    # matching the word "correction" anywhere and then by demanding "I was
    # wrong". tests/corrections.test.mjs holds every quote to the journal file
    # it names, verbatim, so hand written does not mean unchecked.
    declared = []
    for c in (load("corrections.yml") or []):
        if not c.get("quote") or not c.get("source"):
            continue
        d = lambda k: (c[k].isoformat() if hasattr(c.get(k), "isoformat") else (str(c[k]) if c.get(k) else None))
        declared.append({
            "id": c.get("id"), "published": d("published"), "corrects": d("corrects"),
            "source": c["source"], "headline": (c.get("headline") or "").strip(),
            "claimed": (c.get("claimed") or "").strip(),
            "corrected": (c.get("corrected") or "").strip(),
            "how_found": (c.get("how_found") or "").strip(),
            "cost": (c.get("cost") or "").strip(),
            "quote": " ".join((c.get("quote") or "").split()),
            "kept_in_place": bool(c.get("kept_in_place")),
            "kept_because": " ".join((c.get("kept_because") or "").split()) or None,
        })
    declared.sort(key=lambda x: x["published"] or "", reverse=True)

    # The Service Tape: the run recording itself. Real step timings, real
    # receipt decisions, written by the nightly pipeline as it went. Four
    # nights is 16 KB, so it travels in the export rather than beside it.
    tapes = []
    for meta in (load("tape_index.yml") or []):
        day = str(meta.get("date"))
        t = load(f"tape/{day}.yml")
        if not t:
            continue
        iso = lambda v: (v.isoformat() if hasattr(v, "isoformat") else (str(v) if v is not None else None))
        tapes.append({
            "date": day, "trigger": t.get("trigger"),
            "started": iso(t.get("started")), "ended": iso(t.get("ended")),
            "steps_ok": t.get("steps_ok"), "steps_total": t.get("steps_total"),
            "receipts_kept": t.get("receipts_kept"), "claims_declined": t.get("claims_declined"),
            "health_verdict": t.get("health_verdict"),
            "journal": {k: (t.get("journal") or {}).get(k) for k in ("title", "mood", "url")} if t.get("journal") else None,
            "steps": [{"slug": x.get("slug"), "label": x.get("label"), "status": x.get("status"),
                       "start": iso(x.get("start")), "end": iso(x.get("end")), "dur_s": x.get("dur_s")}
                      for x in (t.get("steps") or [])],
            "commits": [{"sha": x.get("sha"), "subject": x.get("subject"), "status": x.get("status"),
                         "receipt_id": x.get("receipt_id"), "rejection_reason": x.get("rejection_reason")}
                        for x in (t.get("commits") or [])],
        })
    tapes.sort(key=lambda x: x["date"], reverse=True)

    reading_raw = load("reading.yml") or {}
    reading = (reading_raw.get("recent_read") or []) if isinstance(reading_raw, dict) else (reading_raw if isinstance(reading_raw, list) else [])
    reading_meta = {
        k: reading_raw.get(k) for k in ("total", "read", "queued", "read_7d", "read_30d", "domains", "last_read", "last_read_rel")
    } if isinstance(reading_raw, dict) else {}
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
            "questions": len(questions), "open_questions": len([q for q in questions if q["state"] != "settled"]),
            "wrong": len(corr), "corrections": len(declared), "held": len(pending),
            "ratio": ratio,
        },
        # The nightly run publishes this export and only then records its own
        # decision about the commit that published it. So the refusal file on
        # disk is always at least one row ahead of any export it produced. That
        # row is not lost; it appears in the next export. Saying so here is
        # cheaper than a number that never reconciles with its own source.
        "refusal_cutoff_note": (
            "This export was written before tonight's run finished. The decision about the "
            "commit that published it is recorded after this file exists, so the source file "
            "carries at least one more row than you see here. It appears in the next export."
        ),
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
        "reading": reading,
        "reading_meta": reading_meta,
        "questions": questions,
        "tapes": tapes,
        "wrong": corr,
        "corrections": declared,
        "held": [p.name for p in pending],
    }

    OUT.write_text(json.dumps(corpus, indent=None, separators=(",", ":")))

    # The complete journal, every paragraph, fetched on demand by Notes.
    FULL.sort(key=lambda x: x["date"], reverse=True)
    journal_out = ROOT / "workspace" / "data" / "journal.json"
    journal_out.parent.mkdir(parents=True, exist_ok=True)
    journal_out.write_text(json.dumps(
        {"generated": corpus["generated"], "count": len(FULL), "entries": FULL},
        indent=None, separators=(",", ":")))
    print(f"  journal    {len(FULL)} complete entries -> workspace/data/journal.json")
    subprocess.run(["node", str(ROOT / "scripts" / "refresh_workspace_refs.mjs")], check=True)
    kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.name}  {kb:.0f} KB")
    for k, v in corpus["counts"].items():
        print(f"  {k:10} {v}")


if __name__ == "__main__":
    main()
