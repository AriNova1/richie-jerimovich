import datetime as dt
import importlib.util
import subprocess
from pathlib import Path

import pytest
import yaml


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "receipt_guard.py"

spec = importlib.util.spec_from_file_location("receipt_guard", MODULE_PATH)
assert spec is not None
assert spec.loader is not None
receipt_guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receipt_guard)


def test_build_receipt_from_commit_uses_public_bounded_claim(tmp_path):
    repo = init_repo(tmp_path)
    write(repo / "index.md", "hello\n")
    commit = git(repo, "add", "index.md") or git(repo, "commit", "-m", "Add homepage proof")
    sha = git(repo, "rev-parse", "--short=7", "HEAD")

    receipt = receipt_guard.build_receipt_from_commit(repo, "HEAD", existing_sort_orders=[])

    assert receipt["id"].startswith(f"ar-{dt.date.today().isoformat()}-add-homepage-proof")
    assert receipt["evidence"][0]["commit"] == sha
    assert receipt["evidence"][0]["url"].endswith(f"/commit/{sha}")
    assert "public repository shows" in receipt["public_claim"]
    assert "non-generated tracked file(s)" in receipt["public_claim"]
    assert "proves" not in receipt["summary"].lower()
    assert receipt["limitations"]


def test_privacy_gate_blocks_emails_phone_numbers_and_local_paths():
    receipt = minimal_receipt()
    receipt["summary"] = "Ping richie@example.com at /Users/rickt/private or 516-547-3371."

    errors = receipt_guard.validate_receipt(receipt, today=dt.date(2026, 5, 30))

    assert any("email" in error for error in errors)
    assert any("phone" in error for error in errors)
    assert any("local filesystem path" in error for error in errors)


def test_privacy_gate_blocks_future_dates_and_missing_limitations():
    receipt = minimal_receipt()
    receipt["work_date"] = "2026-05-31"
    receipt["published_date"] = "2026-06-01"
    receipt["limitations"] = []

    errors = receipt_guard.validate_receipt(receipt, today=dt.date(2026, 5, 30))

    assert any("future" in error for error in errors)
    assert any("limitations" in error for error in errors)


def test_generate_pending_skips_existing_receipted_commits(tmp_path):
    repo = init_repo(tmp_path)
    (repo / "_data").mkdir()
    (repo / "_receipts_pending").mkdir()
    write(repo / "index.md", "hello\n")
    git(repo, "add", "index.md")
    git(repo, "commit", "-m", "Add homepage proof")
    sha = git(repo, "rev-parse", "--short=7", "HEAD")
    existing = [minimal_receipt(commit=sha)]
    write(repo / "_data" / "agent_receipts.yml", yaml.safe_dump(existing, sort_keys=False))

    created = receipt_guard.generate_pending(repo, max_commits=10)

    assert created == []
    assert list((repo / "_receipts_pending").glob("*.yml")) == []


def test_publish_candidate_prepends_candidate_and_removes_pending_file(tmp_path):
    repo = tmp_path
    (repo / "_data").mkdir()
    pending = repo / "_receipts_pending"
    pending.mkdir()
    existing = minimal_receipt(receipt_id="ar-2026-05-29-existing", sort_order=500, commit="aaaaaaa")
    write(repo / "_data" / "agent_receipts.yml", yaml.safe_dump([existing], sort_keys=False))
    candidate = minimal_receipt(receipt_id="ar-2026-05-30-candidate", sort_order=510, commit="bbbbbbb")
    candidate_path = pending / "ar-2026-05-30-candidate.yml"
    write(candidate_path, yaml.safe_dump(candidate, sort_keys=False))

    receipt_guard.publish_candidate(repo, candidate_path)

    receipts = yaml.safe_load((repo / "_data" / "agent_receipts.yml").read_text())
    assert [r["id"] for r in receipts] == ["ar-2026-05-30-candidate", "ar-2026-05-29-existing"]
    assert not candidate_path.exists()


def minimal_receipt(receipt_id="ar-2026-05-30-test", sort_order=600, commit="abc1234"):
    return {
        "id": receipt_id,
        "sort_order": sort_order,
        "title": "Added a public test artifact",
        "work_date": "2026-05-30",
        "published_date": "2026-05-30",
        "category": "site infrastructure",
        "actor": "Agent Richie",
        "summary": "Added a public test artifact.",
        "public_claim": "The public repository shows a public test artifact changed on 2026-05-30.",
        "evidence": [
            {
                "type": "git commit",
                "label": f"Commit {commit}",
                "url": f"https://github.com/AriNova1/richie-jerimovich/commit/{commit}",
                "commit": commit,
                "evidence_note": "Public commit changes index.md.",
            }
        ],
        "verification": {
            "method": "public git commit",
            "checked_with": f"git show --name-status --format='%h %cs %s' {commit}",
            "result": "pending public commit check",
        },
        "confidence": "high",
        "privacy_level": "public safe",
        "limitations": ["Git proves repository changes, not inner intent or full authorship context."],
    }


def init_repo(path):
    git(path, "init")
    git(path, "config", "user.email", "test@example.invalid")
    git(path, "config", "user.name", "Test User")
    git(path, "remote", "add", "origin", "https://github.com/AriNova1/richie-jerimovich.git")
    return path


def git(repo, *args):
    return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
