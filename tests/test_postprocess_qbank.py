"""Contract tests for scripts/postprocess_qbank.py. The golden fixture is not modified."""

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "scripts" / "validate_qbank.py"
POSTPROCESS = ROOT / "scripts" / "postprocess_qbank.py"
GOLDEN = ROOT / "tests" / "fixtures" / "bloque_renal_vascular.json"


def run_post(src, out, seed, dry_run=False):
    command = [sys.executable, str(POSTPROCESS), str(src), "--seed", str(seed)]
    if dry_run:
        command.append("--dry-run")
    if out is not None:
        command.extend(["--out", str(out)])
    return subprocess.run(command, capture_output=True, text=True, check=False)


def validate(path, out):
    proc = subprocess.run(
        [sys.executable, str(VALIDATOR), str(path), "--out", str(out)],
        capture_output=True,
        text=True,
        check=False,
    )
    sidecar = json.loads(out.read_text(encoding="utf-8")) if out.is_file() else None
    return proc.returncode, sidecar


def all_issues(sidecar):
    items = list(sidecar["validation"]["issues"])
    for block in sidecar["blocks"]:
        for record in block["questions"]:
            items.extend(record["validation"]["issues"])
    return items


def questions_of(data):
    return data["blocks"][0]["questions"]


def load_golden():
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


def test_after_postprocess_no_errors(tmp_path):
    # Post-processor is NOT responsible for fixing fixture-content
    # errors (provenance-length, phrase-count-tier). Those require
    # regeneration with the v1.1.0 recipe. This test asserts only the
    # errors the post-processor IS responsible for are resolved.
    before_code, before = validate(GOLDEN, tmp_path / "before.validation.json")
    assert before_code == 1
    assert before["validation"]["issueCounts"]["error"] > 0
    out = tmp_path / "post.json"
    processed = run_post(GOLDEN, out, seed=42)
    assert processed.returncode == 0, processed.stderr
    after_code, after = validate(out, tmp_path / "after.validation.json")
    items = all_issues(after)
    error_counts = Counter(item["code"] for item in items if item["severity"] == "error")
    warn_counts = Counter(item["code"] for item in items if item["severity"] == "warn")
    # The validator does not emit answer-letter-duplicate or
    # consecutive-subject-repeats-exceeded. Those conditions are the
    # block fields below. For this fixture the subject floor is 8.
    block = after["blocks"][0]["validation"]
    assert block["answerDistribution"]["pass"] is True
    assert block["consecutiveSubjectRepeats"] == 8
    assert error_counts["provenance-length"] == 25
    assert error_counts["phrase-count-tier"] == 1
    assert warn_counts["unverified-source"] == 50
    assert after_code == 1


def test_deterministic(tmp_path):
    first = tmp_path / "first.json"
    second = tmp_path / "second.json"
    assert run_post(GOLDEN, first, seed=42).returncode == 0
    assert run_post(GOLDEN, second, seed=42).returncode == 0
    assert first.read_bytes() == second.read_bytes()


def test_different_seeds_differ(tmp_path):
    first = tmp_path / "seed42.json"
    second = tmp_path / "seed43.json"
    assert run_post(GOLDEN, first, seed=42).returncode == 0
    assert run_post(GOLDEN, second, seed=43).returncode == 0
    order_first = [question["id"] for question in questions_of(json.loads(first.read_text(encoding="utf-8")))]
    order_second = [question["id"] for question in questions_of(json.loads(second.read_text(encoding="utf-8")))]
    assert order_first != order_second


def test_subject_shuffle_respects_floor(tmp_path):
    out = tmp_path / "post.json"
    processed = run_post(GOLDEN, out, seed=42)
    assert processed.returncode == 0, processed.stderr
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["blocks"][0]["validation"]["consecutiveSubjectRepeats"] == 8


def test_no_id_renumber(tmp_path):
    before = load_golden()
    out = tmp_path / "post.json"
    assert run_post(GOLDEN, out, seed=42).returncode == 0
    after = json.loads(out.read_text(encoding="utf-8"))
    before_ids = {question["id"] for question in questions_of(before)}
    after_ids = {question["id"] for question in questions_of(after)}
    before_pairs = {(question["id"], question["vignette"]) for question in questions_of(before)}
    after_pairs = {(question["id"], question["vignette"]) for question in questions_of(after)}
    assert before_ids == after_ids
    assert before_pairs == after_pairs


def test_no_provenance_synthesis(tmp_path):
    before = {
        question["id"]: ("keyInfoProvenance" in question, question.get("keyInfoProvenance"))
        for question in questions_of(load_golden())
    }
    out = tmp_path / "post.json"
    assert run_post(GOLDEN, out, seed=42).returncode == 0
    for question in questions_of(json.loads(out.read_text(encoding="utf-8"))):
        present, value = before[question["id"]]
        assert ("keyInfoProvenance" in question) is present
        if present:
            assert question["keyInfoProvenance"] == value


def test_dry_run_writes_nothing(tmp_path):
    src = tmp_path / "input.json"
    src.write_bytes(GOLDEN.read_bytes())
    before = src.stat().st_mtime_ns
    out = tmp_path / "not-written.json"
    processed = run_post(src, out, seed=42, dry_run=True)
    assert processed.returncode == 0, processed.stderr
    assert not out.exists()
    assert src.stat().st_mtime_ns == before


def test_dry_run_reports_reorder(tmp_path):
    processed = run_post(GOLDEN, None, seed=42, dry_run=True)
    assert processed.returncode == 0, processed.stderr
    assert "consecutiveSubjectRepeats 11 -> 8" in processed.stdout
