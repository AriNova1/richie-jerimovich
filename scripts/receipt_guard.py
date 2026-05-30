#!/usr/bin/env python3
"""Generate and guard public-safe Agent Richie receipts.

This script keeps receipts boring on purpose:
- public receipts live in _data/agent_receipts.yml
- draft candidates live in _receipts_pending/ and are gitignored
- every candidate is evidence-bounded to a public commit
- the privacy gate rejects obvious leaks before anything can publish
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml

PUBLIC_RECEIPTS = Path("_data/agent_receipts.yml")
PENDING_DIR = Path("_receipts_pending")
DEFAULT_REMOTE = "origin/main"

REQUIRED_FIELDS = {
    "id",
    "sort_order",
    "title",
    "work_date",
    "published_date",
    "category",
    "actor",
    "summary",
    "public_claim",
    "evidence",
    "verification",
    "confidence",
    "privacy_level",
    "limitations",
}

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}(?!\d)")
LOCAL_PATH_RE = re.compile(r"(?:/Users/|/home/|file://|~/)")
SECRET_RE = re.compile(
    r"(?i)(api[_-]?key|auth[_-]?token|secret|password|passwd|bearer\s+[a-z0-9._\-]{12,}|sk-[a-z0-9]{12,})"
)
PRIVATE_URL_RE = re.compile(r"(?i)(localhost|127\.0\.0\.1|0\.0\.0\.0|ngrok-free\.app|\.local)(?:[:/]|$)")

SKIP_PATH_PREFIXES = (
    "_site/",
    ".git/",
    ".jekyll-cache/",
    "_receipts_pending/",
)
SKIP_PATHS = {
    "_data/agent_receipts.yml",
    "_site/receipts.json",
    "_site/receipts/index.html",
}

CATEGORY_RULES = [
    ("privacy", ("privacy",)),
    ("agent receipts", ("receipt", "receipts", "receipt_guard")),
    ("journal integrity", ("_journal/", "journal")),
    ("design and accessibility", ("assets/style.css", "_layouts/", "404.html", "a11y", "accessibility", "design")),
    ("site infrastructure", ("_config.yml", "Gemfile", "scripts/", "tests/", "sitemap")),
]


def run_git(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()


def load_yaml_file(path: Path, default: Any) -> Any:
    if not path.exists() or path.read_text().strip() == "":
        return default
    data = yaml.safe_load(path.read_text())
    return default if data is None else data


def write_yaml_file(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True))


def slugify(text: str, max_len: int = 56) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len].strip("-") or "receipt"


def remote_commit_url(repo: Path, short_sha: str) -> str:
    try:
        remote = run_git(repo, "remote", "get-url", "origin")
    except subprocess.CalledProcessError:
        remote = "https://github.com/AriNova1/richie-jerimovich.git"
    remote = remote.strip()
    if remote.startswith("git@github.com:"):
        remote = "https://github.com/" + remote.removeprefix("git@github.com:")
    if remote.endswith(".git"):
        remote = remote[:-4]
    return f"{remote}/commit/{short_sha}"


def commit_subject(repo: Path, ref: str) -> str:
    return run_git(repo, "show", "-s", "--format=%s", ref)


def commit_date(repo: Path, ref: str) -> str:
    return run_git(repo, "show", "-s", "--date=short", "--format=%cd", ref)


def changed_files(repo: Path, ref: str) -> list[tuple[str, str]]:
    output = run_git(repo, "show", "--name-status", "--format=", ref)
    rows: list[tuple[str, str]] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        rows.append((status, path))
    return rows


def is_receiptable_commit(repo: Path, ref: str) -> bool:
    subject = commit_subject(repo, ref).lower()
    if subject.startswith("merge "):
        return False
    files = changed_files(repo, ref)
    visible = [p for _s, p in files if not p.startswith(SKIP_PATH_PREFIXES) and p not in SKIP_PATHS]
    if not visible:
        return False
    # Avoid receipt recursion where the only source changes are the receipts system itself.
    if all("receipt" in p.lower() for p in visible):
        return False
    return True


def infer_category(subject: str, files: list[tuple[str, str]]) -> str:
    haystack = " ".join([subject, *[p for _s, p in files]]).lower()
    for category, needles in CATEGORY_RULES:
        if any(needle in haystack for needle in needles):
            return category
    return "site update"


def evidence_note(files: list[tuple[str, str]], max_files: int = 5) -> str:
    if not files:
        return "Public commit changes tracked repository files."
    visible = [(s, p) for s, p in files if not p.startswith(SKIP_PATH_PREFIXES)]
    sample = visible[:max_files]
    rendered = ", ".join(f"{status} {path}" for status, path in sample)
    extra = len(visible) - len(sample)
    if extra > 0:
        rendered += f", plus {extra} more file(s)"
    return f"Public commit changes {rendered}."


def build_receipt_from_commit(repo: Path, ref: str, existing_sort_orders: list[int] | None = None) -> dict[str, Any]:
    short_sha = run_git(repo, "rev-parse", "--short=7", ref)
    subject = commit_subject(repo, ref)
    date = commit_date(repo, ref)
    files = changed_files(repo, ref)
    category = infer_category(subject, files)
    max_sort = max(existing_sort_orders or [590])
    slug = slugify(subject)
    title = title_from_subject(subject)
    file_count = len([p for _s, p in files if not p.startswith(SKIP_PATH_PREFIXES)])

    receipt = {
        "id": f"ar-{date}-{slug}",
        "sort_order": max_sort + 10,
        "title": title,
        "work_date": date,
        "published_date": dt.date.today().isoformat(),
        "category": category,
        "actor": "Agent Richie",
        "summary": f"Recorded a public repository change from commit {short_sha}: {subject}.",
        "public_claim": f"The public repository shows commit {short_sha} changed {file_count} tracked file(s) on {date}.",
        "evidence": [
            {
                "type": "git commit",
                "label": f"Commit {short_sha}",
                "url": remote_commit_url(repo, short_sha),
                "commit": short_sha,
                "evidence_note": evidence_note(files),
            }
        ],
        "verification": {
            "method": "public git commit",
            "checked_with": f"git show --name-status --format='%h %cs %s' {short_sha}",
            "result": "pending public commit check",
        },
        "confidence": "high",
        "privacy_level": "public safe pending review",
        "limitations": [
            "Git proves repository changes, not inner intent or full authorship context.",
            "This receipt was generated as a candidate and still needs final public-safety review before publishing.",
        ],
    }
    errors = validate_receipt(receipt)
    if errors:
        raise ValueError("candidate failed privacy gate: " + "; ".join(errors))
    return receipt


def title_from_subject(subject: str) -> str:
    cleaned = re.sub(r"^(fix|feat|docs|chore|journal|design)(\([^)]*\))?:\s*", "", subject, flags=re.I)
    cleaned = cleaned.strip() or subject.strip()
    return cleaned[:1].upper() + cleaned[1:]


def existing_receipt_commits(receipts: list[dict[str, Any]]) -> set[str]:
    commits: set[str] = set()
    for receipt in receipts:
        for evidence in receipt.get("evidence", []) or []:
            commit = evidence.get("commit")
            if commit:
                commits.add(str(commit))
    return commits


def generate_pending(repo: Path, max_commits: int = 25, ref_range: str | None = None) -> list[Path]:
    repo = repo.resolve()
    receipts = load_yaml_file(repo / PUBLIC_RECEIPTS, [])
    existing_commits = existing_receipt_commits(receipts)
    existing_ids = {r.get("id") for r in receipts}
    sort_orders = [int(r.get("sort_order", 0)) for r in receipts]
    pending_dir = repo / PENDING_DIR
    pending_dir.mkdir(exist_ok=True)

    commits = recent_commits(repo, max_commits=max_commits, ref_range=ref_range)
    created: list[Path] = []
    for ref in commits:
        short_sha = run_git(repo, "rev-parse", "--short=7", ref)
        if any(short_sha.startswith(c) or c.startswith(short_sha) for c in existing_commits):
            continue
        if not is_receiptable_commit(repo, ref):
            continue
        receipt = build_receipt_from_commit(repo, ref, sort_orders)
        if receipt["id"] in existing_ids:
            receipt["id"] = f'{receipt["id"]}-{short_sha}'
        path = pending_dir / f'{receipt["id"]}.yml'
        if path.exists():
            continue
        write_yaml_file(path, receipt)
        created.append(path)
        existing_ids.add(receipt["id"])
        sort_orders.append(int(receipt["sort_order"]))
    return created


def recent_commits(repo: Path, max_commits: int, ref_range: str | None = None) -> list[str]:
    args = ["log", f"--max-count={max_commits}", "--format=%H"]
    if ref_range:
        args.insert(1, ref_range)
    output = run_git(repo, *args)
    return [line for line in output.splitlines() if line.strip()]


def validate_receipt(receipt: dict[str, Any], today: dt.date | None = None) -> list[str]:
    today = today or dt.date.today()
    errors: list[str] = []
    missing = sorted(REQUIRED_FIELDS - set(receipt))
    if missing:
        errors.append(f"missing required fields: {', '.join(missing)}")

    for key in ("work_date", "published_date"):
        value = receipt.get(key)
        try:
            parsed = dt.date.fromisoformat(str(value))
        except Exception:
            errors.append(f"{key} is not an ISO date")
            continue
        if parsed > today:
            errors.append(f"{key} is future-dated")

    if not receipt.get("evidence"):
        errors.append("evidence is required")
    if not receipt.get("limitations"):
        errors.append("limitations are required")

    text = flatten_strings(receipt)
    if EMAIL_RE.search(text):
        errors.append("email address detected")
    if PHONE_RE.search(text):
        errors.append("phone number detected")
    if LOCAL_PATH_RE.search(text):
        errors.append("local filesystem path detected")
    if SECRET_RE.search(text):
        errors.append("secret-like text detected")
    if PRIVATE_URL_RE.search(text):
        errors.append("private or local URL detected")
    if "planned" in str(receipt.get("privacy_level", "")).lower():
        errors.append("privacy_level cannot describe planned work")
    if re.search(r"\b(will|going to|planned|roadmap)\b", str(receipt.get("summary", "")).lower()):
        errors.append("summary appears to describe future or planned work")

    return errors


def flatten_strings(value: Any) -> str:
    parts: list[str] = []
    if isinstance(value, dict):
        for item in value.values():
            parts.append(flatten_strings(item))
    elif isinstance(value, list):
        for item in value:
            parts.append(flatten_strings(item))
    elif isinstance(value, str):
        parts.append(value)
    return "\n".join(parts)


def validate_receipt_file(path: Path) -> list[str]:
    receipt = load_yaml_file(path, {})
    return validate_receipt(receipt)


def validate_public(repo: Path) -> list[str]:
    receipts = load_yaml_file(repo / PUBLIC_RECEIPTS, [])
    errors: list[str] = []
    seen_ids: set[str] = set()
    for index, receipt in enumerate(receipts):
        rid = str(receipt.get("id", f"index-{index}"))
        if rid in seen_ids:
            errors.append(f"{rid}: duplicate id")
        seen_ids.add(rid)
        for error in validate_receipt(receipt):
            errors.append(f"{rid}: {error}")
        for evidence in receipt.get("evidence", []) or []:
            commit = evidence.get("commit")
            if commit:
                try:
                    run_git(repo, "cat-file", "-e", f"{commit}^{{commit}}")
                except subprocess.CalledProcessError:
                    errors.append(f"{rid}: commit {commit} not found locally")
    return errors


def validate_pending(repo: Path) -> list[str]:
    pending_dir = repo / PENDING_DIR
    errors: list[str] = []
    for path in sorted(pending_dir.glob("*.yml")):
        for error in validate_receipt_file(path):
            errors.append(f"{path.name}: {error}")
    return errors


def publish_candidate(repo: Path, candidate_path: Path) -> None:
    if not candidate_path.is_absolute():
        candidate_path = repo / candidate_path
    candidate = load_yaml_file(candidate_path, {})
    errors = validate_receipt(candidate)
    if errors:
        raise ValueError("candidate failed privacy gate: " + "; ".join(errors))
    receipts_path = repo / PUBLIC_RECEIPTS
    receipts = load_yaml_file(receipts_path, [])
    existing_ids = {r.get("id") for r in receipts}
    if candidate.get("id") in existing_ids:
        raise ValueError(f"receipt id already exists: {candidate.get('id')}")
    receipts = [candidate, *receipts]
    receipts.sort(key=lambda r: int(r.get("sort_order", 0)), reverse=True)
    write_yaml_file(receipts_path, receipts)
    candidate_path.unlink()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate and validate Agent Richie receipts.")
    parser.add_argument("--repo", default=".", help="Repository path")
    parser.add_argument("--generate-pending", action="store_true", help="Draft pending receipts for unreceipted commits")
    parser.add_argument("--max-commits", type=int, default=25)
    parser.add_argument("--ref-range", help="Optional git rev range, e.g. origin/main..HEAD")
    parser.add_argument("--validate-public", action="store_true")
    parser.add_argument("--validate-pending", action="store_true")
    parser.add_argument("--publish-candidate", help="Move a pending candidate into _data/agent_receipts.yml")
    args = parser.parse_args(argv)

    repo = Path(args.repo).resolve()
    all_errors: list[str] = []

    if args.generate_pending:
        created = generate_pending(repo, max_commits=args.max_commits, ref_range=args.ref_range)
        if created:
            print("created pending receipts:")
            for path in created:
                print(path.relative_to(repo))
        else:
            print("no pending receipts created")

    if args.publish_candidate:
        publish_candidate(repo, Path(args.publish_candidate))
        print(f"published {args.publish_candidate}")

    if args.validate_public:
        all_errors.extend(validate_public(repo))
    if args.validate_pending:
        all_errors.extend(validate_pending(repo))

    if all_errors:
        for error in all_errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    if args.validate_public or args.validate_pending:
        print("receipt validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
