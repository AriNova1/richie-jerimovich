import datetime as dt
import importlib.util
import json
import subprocess
from pathlib import Path
from urllib.error import HTTPError

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


def test_reject_candidate_records_commit_and_removes_pending_file(tmp_path):
    repo = tmp_path
    (repo / "_data").mkdir()
    pending = repo / "_receipts_pending"
    pending.mkdir()
    candidate = minimal_receipt(receipt_id="ar-2026-05-30-candidate", sort_order=510, commit="bbbbbbb")
    candidate_path = pending / "ar-2026-05-30-candidate.yml"
    write(candidate_path, yaml.safe_dump(candidate, sort_keys=False))

    receipt_guard.reject_candidate(repo, candidate_path, "Covered by broader public receipt.")

    rejections = yaml.safe_load((repo / "_data" / "agent_receipt_rejections.yml").read_text())
    assert rejections[0]["commit"] == "bbbbbbb"
    assert "id" not in rejections[0]
    assert not candidate_path.exists()


def test_generate_pending_skips_rejected_commits(tmp_path):
    repo = init_repo(tmp_path)
    (repo / "_data").mkdir()
    (repo / "_receipts_pending").mkdir()
    write(repo / "index.md", "hello\n")
    git(repo, "add", "index.md")
    git(repo, "commit", "-m", "Add homepage proof")
    sha = git(repo, "rev-parse", "--short=7", "HEAD")
    write(repo / "_data" / "agent_receipt_rejections.yml", yaml.safe_dump([{"commit": sha, "reason": "Not public-worthy."}], sort_keys=False))

    created = receipt_guard.generate_pending(repo, max_commits=10)

    assert created == []
    assert list((repo / "_receipts_pending").glob("*.yml")) == []


def test_verify_receipt_evidence_checks_commit_and_every_public_url(tmp_path):
    repo = init_repo(tmp_path)
    write(repo / "index.md", "hello\n")
    git(repo, "add", "index.md")
    git(repo, "commit", "-m", "Add homepage proof")
    sha = git(repo, "rev-parse", "--short=7", "HEAD")
    receipt = minimal_receipt(commit=sha)
    receipt["evidence"].append(
        {
            "type": "live url",
            "label": "Live page",
            "url": "https://example.com/proof",
            "evidence_note": "Public page.",
        }
    )
    checked = []

    result = receipt_guard.verify_receipt_evidence(
        receipt,
        repo,
        url_checker=lambda url, timeout: checked.append(url) or (True, 200, "ok"),
    )

    assert result["status"] == "pass"
    assert result["commit_checks"][0]["exists_local"] is True
    assert checked == [
        f"https://github.com/AriNova1/richie-jerimovich/commit/{sha}",
        "https://example.com/proof",
    ]


def test_verify_receipt_evidence_fails_closed_on_dead_url(tmp_path):
    repo = init_repo(tmp_path)
    write(repo / "index.md", "hello\n")
    git(repo, "add", "index.md")
    git(repo, "commit", "-m", "Add homepage proof")
    sha = git(repo, "rev-parse", "--short=7", "HEAD")
    receipt = minimal_receipt(commit=sha)

    result = receipt_guard.verify_receipt_evidence(
        receipt,
        repo,
        url_checker=lambda url, timeout: (False, 404, "HTTP 404"),
    )

    assert result["status"] == "fail"
    assert result["url_checks"][0]["status_code"] == 404


def test_verify_receipt_evidence_rejects_private_url_without_fetch(tmp_path):
    repo = init_repo(tmp_path)
    receipt = minimal_receipt(commit="missing")
    receipt["evidence"] = [
        {
            "type": "live url",
            "label": "Unsafe",
            "url": "http://127.0.0.1:9999/private",
            "evidence_note": "Must never be fetched.",
        }
    ]
    fetched = []

    result = receipt_guard.verify_receipt_evidence(
        receipt,
        repo,
        url_checker=lambda url, timeout: fetched.append(url) or (True, 200, "ok"),
    )

    assert result["status"] == "fail"
    assert fetched == []
    assert "non-public URL" in result["url_checks"][0]["detail"]


def test_verify_receipt_evidence_never_executes_checked_with(tmp_path):
    repo = init_repo(tmp_path)
    marker = tmp_path / "must-not-exist"
    receipt = minimal_receipt(commit="missing")
    receipt["evidence"] = []
    receipt["verification"]["checked_with"] = f"touch {marker}"

    receipt_guard.verify_receipt_evidence(receipt, repo)

    assert not marker.exists()


def test_verify_public_evidence_reuses_duplicate_url_result(tmp_path):
    repo = init_repo(tmp_path)
    (repo / "_data").mkdir()
    first = minimal_receipt(receipt_id="ar-first", commit="")
    second = minimal_receipt(receipt_id="ar-second", commit="")
    shared_url = "https://example.com/shared"
    first["evidence"] = [{"type": "live url", "url": shared_url}]
    second["evidence"] = [{"type": "live url", "url": shared_url}]
    write(repo / "_data" / "agent_receipts.yml", yaml.safe_dump([first, second], sort_keys=False))
    checked = []

    results = receipt_guard.verify_public_evidence(
        repo,
        url_checker=lambda url, timeout: checked.append(url) or (True, 200, "ok"),
    )

    assert [result["status"] for result in results] == ["pass", "pass"]
    assert checked == [shared_url]


def test_verify_receipt_evidence_retries_one_transient_transport_failure(tmp_path):
    repo = init_repo(tmp_path)
    receipt = minimal_receipt(commit="")
    attempts = []

    def flaky(url, timeout):
        attempts.append(url)
        if len(attempts) == 1:
            return False, None, "Remote end closed connection without response"
        return True, 200, "HTTP 200"

    result = receipt_guard.verify_receipt_evidence(receipt, repo, url_checker=flaky)

    assert result["status"] == "pass"
    assert len(attempts) == 2


def test_public_url_rejects_credentials_unusual_ports_and_embedded_private_ipv4(monkeypatch):
    monkeypatch.setattr(
        receipt_guard.socket,
        "getaddrinfo",
        lambda *args, **kwargs: [(2, 1, 6, "", ("8.8.8.8", args[1]))],
    )

    credentialed = receipt_guard._public_http_url("https://user:token@example.com/proof")
    unusual_port = receipt_guard._public_http_url("https://example.com:8443/proof")

    monkeypatch.setattr(
        receipt_guard.socket,
        "getaddrinfo",
        lambda *args, **kwargs: [(10, 1, 6, "", ("2002:7f00:1::", args[1], 0, 0))],
    )
    transition_address = receipt_guard._public_http_url("https://example.com/proof")

    assert credentialed[0] is False
    assert unusual_port[0] is False
    assert transition_address[0] is False


def test_live_check_uses_get_semantics_instead_of_false_passing_head(monkeypatch):
    monkeypatch.setattr(receipt_guard, "_public_http_url", lambda url: (True, "public URL"))

    class FakeOpener:
        def open(self, request, timeout):
            if request.method == "HEAD":
                return FakeResponse(200)
            raise HTTPError(request.full_url, 404, "not found", {}, None)

    class FakeResponse:
        def __init__(self, status):
            self.status = status

        def getcode(self):
            return self.status

    monkeypatch.setattr(receipt_guard, "build_opener", lambda *args: FakeOpener())

    ok, status, detail = receipt_guard.check_public_url("https://example.com/proof")

    assert ok is False
    assert status == 404
    assert detail == "HTTP 404"


def test_commit_verification_rejects_symbolic_revision(tmp_path):
    repo = init_repo(tmp_path)
    write(repo / "index.md", "hello\n")
    git(repo, "add", "index.md")
    git(repo, "commit", "-m", "Add homepage proof")
    receipt = minimal_receipt(commit="HEAD")
    receipt["evidence"][0]["url"] = "https://github.com/AriNova1/richie-jerimovich/commit/HEAD"

    result = receipt_guard.verify_receipt_evidence(
        receipt,
        repo,
        url_checker=lambda url, timeout: (True, 200, "HTTP 200"),
    )

    assert result["status"] == "fail"
    assert result["commit_checks"][0]["exists_local"] is False
    assert "hex" in result["commit_checks"][0]["detail"]


def test_verifier_redacts_url_credentials_and_query_from_json_result(tmp_path, monkeypatch):
    repo = init_repo(tmp_path)
    receipt = minimal_receipt(commit="")
    secret_url = "https://user:token@example.com/proof?access_token=super-secret#private"
    receipt["evidence"] = [{"type": "live url", "url": secret_url}]
    monkeypatch.setattr(receipt_guard, "_public_http_url", lambda url: (False, "credentials are not allowed"))

    result = receipt_guard.verify_receipt_evidence(receipt, repo)
    encoded = json.dumps(result)

    assert "token" not in encoded
    assert "super-secret" not in encoded
    assert "#private" not in encoded
    assert result["url_checks"][0]["url"] == "https://example.com/proof"


def test_verify_live_empty_dataset_fails_closed(tmp_path, capsys):
    (tmp_path / "_data").mkdir()
    write(tmp_path / "_data" / "agent_receipts.yml", "[]\n")

    status = receipt_guard.main(["--repo", str(tmp_path), "--verify-live"])
    output = capsys.readouterr()

    assert status == 1
    assert "no public receipts" in output.err.lower()


def test_verify_live_missing_receipt_is_clean_cli_error(tmp_path, capsys):
    (tmp_path / "_data").mkdir()
    write(tmp_path / "_data" / "agent_receipts.yml", "[]\n")

    status = receipt_guard.main(
        ["--repo", str(tmp_path), "--verify-live", "--receipt-id", "missing"]
    )
    output = capsys.readouterr()

    assert status == 1
    assert output.out == ""
    assert output.err.strip() == "ERROR: receipt id not found: missing"


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
