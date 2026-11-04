"""The v1.1.0 schema template is the shape contract. This file does not edit it."""

import json
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "schema_template.json"

# Field tree from the v1.1.0 exam template after keyInfoProvenance was
# removed from variants. A missing path means the template drifted.
REQUIRED = {
    "schemaVersion": None,
    "examTitle": None,
    "validation": {
        "validatorVersion": None,
        "status": None,
        "questionCount": None,
        "issueCounts": {"error": None, "warn": None, "repaired": None},
    },
    "blocks": [{
        "blockName": None,
        "timeLimitMinutes": None,
        "validation": {
            "answerDistribution": {
                "scope": None,
                "primary": {"A": None, "B": None, "C": None, "D": None, "E": None},
                "allVersions": {"A": None, "B": None, "C": None, "D": None, "E": None},
                "maxRunLength": None,
                "maxDeviationFromUniform": None,
                "rebalanced": None,
                "pass": None,
            },
            "difficultyMix": {"Easy": None, "Medium": None, "Hard": None, "pass": None},
            "consecutiveSubjectRepeats": None,
        },
        "questions": [{
            "id": None,
            "subject": None,
            "difficultyRating": None,
            "difficultyLabel": None,
            "questionFormat": None,
            "vignette": None,
            "keyInfoPhrases": None,
            "stem": None,
            "options": [{"key": None, "text": None}],
            "correctAnswer": None,
            "attendingTip": None,
            "explanation": None,
            "keyLearningPoint": None,
            "distractorAnalysis": None,
            "hint": None,
            "educationalObjective": None,
            "sourceReferences": [{
                "sourceTitle": None,
                "chapterSection": None,
                "pageNumber": None,
                "relevance": None,
            }],
            "keyInfoProvenance": [{"sourceIndex": None, "basis": None}],
            "validation": {
                "status": None,
                "versions": [{
                    "version": None,
                    "correctAnswer": None,
                    "substringChecks": [{
                        "phrase": None,
                        "exactMatch": None,
                        "offset": None,
                        "repairedFrom": None,
                    }],
                    "phraseCountInRange": None,
                    "optionCount": None,
                    "optionCountMatchesPrimary": None,
                    "correctAnswerInOptions": None,
                    "distractorKeysMatch": None,
                    "provenanceAligned": None,
                    "letterRefsInProse": None,
                }],
                "answerLetter": {
                    "letters": None,
                    "allDistinct": None,
                    "runLengthEndingHere": None,
                    "rebalanced": None,
                    "originalLetters": None,
                },
                "issues": [{"code": None, "severity": None, "path": None, "source": None}],
            },
            "variants": [{
                "vignette": None,
                "keyInfoPhrases": None,
                "stem": None,
                "options": [{"key": None, "text": None}],
                "correctAnswer": None,
                "attendingTip": None,
                "explanation": None,
                "keyLearningPoint": None,
                "distractorAnalysis": None,
                "hint": None,
            }],
        }],
    }],
}


def assert_fields(node, spec, path):
    if isinstance(spec, dict):
        assert isinstance(node, dict), path or "$"
        for key, child in spec.items():
            child_path = f"{path}.{key}" if path else key
            if key not in node:
                raise AssertionError(f"missing field: {child_path}")
            if child is not None:
                assert_fields(node[key], child, child_path)
    elif isinstance(spec, list):
        assert isinstance(node, list) and node, f"missing field: {path}"
        assert_fields(node[0], spec[0], f"{path}[0]")


def load_template():
    return json.loads(TEMPLATE.read_text(encoding="utf-8"))


def test_template_has_all_required_fields():
    assert_fields(load_template(), REQUIRED, "")


def test_template_enums():
    data = load_template()
    question = data["blocks"][0]["questions"][0]
    assert set(question["difficultyLabel"].split("|")) == {"Easy", "Medium", "Hard"}
    assert set(question["questionFormat"].split("|")) == {"Vignette", "Basic"}
    assert set(question["keyInfoProvenance"][0]["basis"].split("|")) == {"textbook", "inferred", "unattributed"}
    assert set(data["validation"]["status"].split("|")) == {"pass", "warn", "fail"}
    assert set(question["validation"]["status"].split("|")) == {"pass", "warn", "fail"}
    page_number = question["sourceReferences"][0]["pageNumber"]
    assert isinstance(page_number, str) and "optional" in page_number


def test_template_variant_excludes_keyinfo_provenance():
    variant = load_template()["blocks"][0]["questions"][0]["variants"][0]
    assert "keyInfoProvenance" not in variant


def test_template_variant_excludes_validation():
    variant = load_template()["blocks"][0]["questions"][0]["variants"][0]
    assert "validation" not in variant
