"""Contract tests for scripts/validate_qbank.py. Fixtures are read-only."""

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "scripts" / "validate_qbank.py"
POSTPROCESS = ROOT / "scripts" / "postprocess_qbank.py"
FIXTURES = ROOT / "tests" / "fixtures"
GOLDEN = FIXTURES / "bloque_renal_vascular.json"
TEMPLATE = FIXTURES / "schema_template.json"


def validate(path, out):
    proc = subprocess.run(
        [sys.executable, str(VALIDATOR), str(path), "--out", str(out)],
        capture_output=True,
        text=True,
        check=False,
    )
    sidecar = json.loads(out.read_text(encoding="utf-8")) if out.is_file() else None
    return proc.returncode, sidecar, proc.stdout, proc.stderr


def all_issues(sidecar):
    items = list(sidecar["validation"]["issues"])
    for block in sidecar["blocks"]:
        for record in block["questions"]:
            items.extend(record["validation"]["issues"])
    return items


def question_record(sidecar, qid):
    for block in sidecar["blocks"]:
        for record in block["questions"]:
            if record["id"] == qid:
                return record
    raise AssertionError(f"missing question {qid}")


def matched_phrase_count(record, version="primary"):
    for item in record["validation"]["versions"]:
        if item["version"] == version:
            return sum(1 for check in item["substringChecks"] if check["offset"] is not None)
    raise AssertionError(f"missing version {version}")


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_golden():
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


def test_template_fails_as_qbank(tmp_path):
    # The template is a shape reference, not a qbank. It must fail
    # validation. The specific codes below collectively prove the
    # validator recognized it as a non-qbank, without requiring a
    # dedicated template-not-a-qbank check (which Step 1 skipped).
    code, sidecar, _stdout, _stderr = validate(TEMPLATE, tmp_path / "template.validation.json")
    assert code == 1, "template must fail as a qbank"
    invalid_codes = {
        "difficulty-label-invalid",
        "question-format-invalid",
        "provenance-basis-invalid",
        "distractor-keys-mismatch",
        "variant-count",
        "unverified-source",
    }
    actual = {item["code"] for item in all_issues(sidecar)} & invalid_codes
    assert len(actual) >= 3, f"expected >= 3 structural failures in template, got {actual}"


def test_golden_baseline_issue_codes(tmp_path):
    # BASELINE: this test asserts the pre-regeneration fixture.
    # When the fixture is regenerated with the v1.1.0 recipe (which emits
    # keyInfoProvenance natively), update this test in the same commit:
    #   provenance-length: 25 -> 0
    #   phrase-count-tier: 1 -> 0
    # The regenerated fixture and this test must land together.
    # schema-version-missing stays 1: the v1.1.0 recipe forbids the model
    # from emitting schemaVersion. unverified-source stays 50 while
    # scripts/sources.json is an empty allowlist.
    _code, sidecar, _stdout, _stderr = validate(GOLDEN, tmp_path / "golden.validation.json")
    items = all_issues(sidecar)
    counts = Counter(item["code"] for item in items)
    expected = {
        "schema-version-missing",
        "provenance-length",
        "phrase-count-tier",
        "unverified-source",
    }
    assert set(counts) == expected, f"actual counts: {dict(counts)}"
    assert counts["provenance-length"] == 25, f"actual counts: {dict(counts)}"
    assert counts["phrase-count-tier"] == 1, f"actual counts: {dict(counts)}"
    assert counts["schema-version-missing"] == 1, f"actual counts: {dict(counts)}"
    assert counts["unverified-source"] == 50, f"actual counts: {dict(counts)}"
    exam_codes = [item["code"] for item in sidecar["validation"]["issues"]]
    assert exam_codes == ["schema-version-missing"]
    tier = [
        item
        for item in question_record(sidecar, "REN-VASC-023")["validation"]["issues"]
        if item["code"] == "phrase-count-tier"
    ]
    assert len(tier) == 1
    assert tier[0]["path"].endswith(".variants[1].keyInfoPhrases")


def test_corrupted_phrase_not_found(tmp_path):
    # REN-VASC-002 is Easy with 3 matched phrases. The tier floor is 2, so
    # losing one match drops the matched count by 1 and stays inside 2-3.
    # A regenerated Easy item at the floor of 2 would instead add
    # phrase-count-low once the matched count falls to 1.
    data = load_golden()
    question = next(item for item in data["blocks"][0]["questions"] if item["id"] == "REN-VASC-002")
    question["keyInfoPhrases"][0] = "xyzzy-not-in-vignette"
    path = tmp_path / "phrase.json"
    write_json(path, data)
    before_code, before, _stdout, _stderr = validate(GOLDEN, tmp_path / "before.validation.json")
    after_code, after, _stdout, _stderr = validate(path, tmp_path / "after.validation.json")
    assert before_code == 1 and after_code == 1
    before_q = question_record(before, "REN-VASC-002")
    after_q = question_record(after, "REN-VASC-002")
    before_missing = [item for item in before_q["validation"]["issues"] if item["code"] == "phrase-not-found"]
    after_missing = [item for item in after_q["validation"]["issues"] if item["code"] == "phrase-not-found"]
    assert len(before_missing) == 0
    assert len(after_missing) == 1
    assert after_missing[0]["path"].endswith(".keyInfoPhrases[0]")
    assert matched_phrase_count(after_q) == matched_phrase_count(before_q) - 1


def test_corrupted_option_count(tmp_path):
    data = load_golden()
    question = next(item for item in data["blocks"][0]["questions"] if item["id"] == "REN-VASC-001")
    assert question["difficultyLabel"] == "Medium"
    removed = next(index for index, option in enumerate(question["options"]) if option["key"] != question["correctAnswer"])
    del question["options"][removed]
    path = tmp_path / "options.json"
    write_json(path, data)
    _code, sidecar, _stdout, _stderr = validate(path, tmp_path / "options.validation.json")
    hits = [
        item
        for item in question_record(sidecar, "REN-VASC-001")["validation"]["issues"]
        if item["code"] == "option-count-tier" and item["path"].endswith(".options") and ".variants[" not in item["path"]
    ]
    assert len(hits) == 1


def test_distractor_keys_mismatch(tmp_path):
    data = load_golden()
    question = next(item for item in data["blocks"][0]["questions"] if item["id"] == "REN-VASC-001")
    removed = next(iter(question["distractorAnalysis"]))
    del question["distractorAnalysis"][removed]
    path = tmp_path / "distractors.json"
    write_json(path, data)
    _code, sidecar, _stdout, _stderr = validate(path, tmp_path / "distractors.validation.json")
    hits = [
        item
        for item in question_record(sidecar, "REN-VASC-001")["validation"]["issues"]
        if item["code"] == "distractor-keys-mismatch" and ".variants[" not in item["path"]
    ]
    assert len(hits) == 1


def test_forbidden_variant_field(tmp_path):
    provenance = load_golden()
    question = next(item for item in provenance["blocks"][0]["questions"] if item["id"] == "REN-VASC-001")
    question["variants"][0]["keyInfoProvenance"] = []
    provenance_path = tmp_path / "variant-provenance.json"
    write_json(provenance_path, provenance)
    _code, sidecar, _stdout, _stderr = validate(provenance_path, tmp_path / "variant-provenance.validation.json")
    provenance_hits = [
        item
        for item in question_record(sidecar, "REN-VASC-001")["validation"]["issues"]
        if item["code"] == "forbidden-variant-field" and item["path"].endswith(".keyInfoProvenance")
    ]
    assert len(provenance_hits) == 1

    validation = load_golden()
    question = next(item for item in validation["blocks"][0]["questions"] if item["id"] == "REN-VASC-001")
    question["variants"][0]["validation"] = {}
    validation_path = tmp_path / "variant-validation.json"
    write_json(validation_path, validation)
    _code, sidecar, _stdout, _stderr = validate(validation_path, tmp_path / "variant-validation.validation.json")
    validation_hits = [
        item
        for item in question_record(sidecar, "REN-VASC-001")["validation"]["issues"]
        if item["code"] == "forbidden-variant-field" and item["path"].endswith(".validation")
    ]
    assert len(validation_hits) == 1


def test_getclues_compatibility(tmp_path):
    data = load_golden()
    question = next(item for item in data["blocks"][0]["questions"] if item["id"] == "REN-VASC-002")
    nfd = "cafe\u0301"
    question["vignette"] = question["vignette"] + " caf\u00e9"
    question["keyInfoPhrases"][0] = nfd
    path = tmp_path / "nfc.json"
    write_json(path, data)
    _code, sidecar, _stdout, _stderr = validate(path, tmp_path / "nfc.validation.json")
    record = question_record(sidecar, "REN-VASC-002")
    primary = next(item for item in record["validation"]["versions"] if item["version"] == "primary")
    check = primary["substringChecks"][0]
    assert check["phrase"] == nfd
    assert check["exactMatch"] is False
    assert check["offset"] is None
    assert check["repairedFrom"] is None
    hits = [
        item
        for item in record["validation"]["issues"]
        if item["code"] == "phrase-not-found" and item["path"].endswith(".keyInfoPhrases[0]")
    ]
    assert len(hits) == 1


def _valid_version(letter, stem):
    phrases = [f"{stem} phrase {index}" for index in range(3)]
    keys = list("ABCDE")
    return {
        "vignette": " ".join(phrases),
        "keyInfoPhrases": phrases,
        "stem": stem,
        "options": [{"key": key, "text": f"{stem} option {key}"} for key in keys],
        "correctAnswer": letter,
        "attendingTip": f"{stem} attending tip",
        "explanation": f"{stem} explanation",
        "keyLearningPoint": f"{stem} learning point",
        "distractorAnalysis": {key: f"{stem} distractor {key}" for key in keys if key != letter},
        "hint": f"{stem} hint",
    }


def valid_qbank():
    primary = _valid_version("A", "primary")
    primary.update({
        "id": "SYN-001",
        "subject": "Renal/Patología",
        "difficultyRating": 3,
        "difficultyLabel": "Medium",
        "questionFormat": "Vignette",
        "educationalObjective": "one mechanism",
        "sourceReferences": [{
            "sourceTitle": "First Aid",
            "chapterSection": "Renal",
            "relevance": "states the mechanism",
        }],
        "keyInfoProvenance": [
            {"sourceIndex": 0, "basis": "textbook"},
            {"sourceIndex": 0, "basis": "inferred"},
            {"sourceIndex": None, "basis": "unattributed"},
        ],
        "variants": [_valid_version("B", "variant one"), _valid_version("C", "variant two")],
    })
    return {
        "schemaVersion": "1.1.0",
        "examTitle": "Synthetic",
        "blocks": [{
            "blockName": "Synthetic block",
            "timeLimitMinutes": 5,
            "questions": [primary],
        }],
    }


def test_exit_codes(tmp_path):
    valid_in = tmp_path / "valid-in.json"
    valid_out = tmp_path / "valid-out.json"
    write_json(valid_in, valid_qbank())
    processed = subprocess.run(
        [sys.executable, str(POSTPROCESS), str(valid_in), "--out", str(valid_out), "--seed", "42"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert processed.returncode == 0, processed.stderr
    valid_code, valid_sidecar, _stdout, valid_err = validate(valid_out, tmp_path / "valid.validation.json")
    assert valid_code == 0, (valid_err, valid_sidecar["validation"]["issueCounts"] if valid_sidecar else None)

    error_code, _sidecar, _stdout, _stderr = validate(GOLDEN, tmp_path / "golden.validation.json")
    assert error_code == 1

    broken = tmp_path / "broken.json"
    broken.write_text("{", encoding="utf-8")
    broken_code, _sidecar, _stdout, _stderr = validate(broken, tmp_path / "broken.validation.json")
    assert broken_code == 2
