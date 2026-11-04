#!/usr/bin/env python3
"""Deterministic checks for a USMLE-style qbank. Does not call a model and does not modify the input."""

import argparse
import json
import sys
from pathlib import Path

from tier_rules import TIER_OPTION_COUNT, TIER_PHRASE_COUNT, TIER_RATING, match_phrase

VALIDATOR_VERSION = "1.1.0"
KNOWN_SCHEMA_VERSIONS = ("1.0.0", "1.1.0")
LABELS = ("Easy", "Medium", "Hard")
FORMATS = ("Vignette", "Basic")
BASES = ("textbook", "inferred", "unattributed")
LETTERS = "ABCDE"
FORBIDDEN_VARIANT_FIELDS = (
    "id",
    "subject",
    "difficultyRating",
    "difficultyLabel",
    "questionFormat",
    "recallType",
    "educationalObjective",
    "sourceReferences",
    "validation",
    "keyInfoProvenance",
)
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
TEMPLATE_PATH = REPO_ROOT / "tests" / "fixtures" / "schema_template.json"
SOURCES_PATH = SCRIPT_DIR / "sources.json"


def issue(code, severity, path):
    return {"code": code, "severity": severity, "path": path, "source": "validator"}


def status_of(issues):
    severities = {item["severity"] for item in issues}
    if "error" in severities:
        return "fail"
    if "warn" in severities:
        return "warn"
    return "pass"


def letter_counts(seq):
    counts = {letter: 0 for letter in LETTERS}
    total = 0
    for letter in seq:
        if letter in counts:
            counts[letter] += 1
            total += 1
    return counts, total


def max_run(seq):
    best = 0
    run = 0
    prev = None
    for letter in seq:
        if letter == prev:
            run += 1
        else:
            prev = letter
            run = 1
        if run > best:
            best = run
    return best


def deviation(counts, total):
    if total == 0:
        return 0.0
    uniform = total / 5.0
    return round(max(abs(counts[letter] - uniform) for letter in LETTERS), 4)


def run_ending(seq, index):
    letter = seq[index]
    length = 1
    cursor = index - 1
    while cursor >= 0 and seq[cursor] == letter:
        length += 1
        cursor -= 1
    return length


def as_list(value):
    return value if isinstance(value, list) else []


def option_keys(options):
    keys = []
    for option in options:
        if isinstance(option, dict) and isinstance(option.get("key"), str):
            keys.append(option["key"])
        else:
            keys.append(None)
    return keys


def keys_contiguous(keys):
    return bool(keys) and keys == [chr(65 + i) for i in range(len(keys))]


def load_allowlist():
    if not SOURCES_PATH.is_file():
        return set()
    try:
        document = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    entries = document.get("sources") if isinstance(document, dict) else None
    if not isinstance(entries, list):
        return set()
    allow = set()
    for entry in entries:
        if isinstance(entry, dict):
            allow.add((entry.get("sourceTitle"), entry.get("chapterSection")))
    return allow


def check_version(ver, version, path, label, primary_option_count, issues, repaired):
    options = ver.get("options")
    options = options if isinstance(options, list) else []
    keys = option_keys(options)
    correct = ver.get("correctAnswer")
    record = {
        "version": version,
        "correctAnswer": correct if isinstance(correct, str) else None,
        "substringChecks": [],
        "phraseCountInRange": False,
        "optionCount": len(options),
        "optionCountMatchesPrimary": len(options) == primary_option_count,
        "correctAnswerInOptions": correct in keys,
        "distractorKeysMatch": False,
        "provenanceAligned": not version == "primary",
    }

    if label in TIER_OPTION_COUNT:
        lo, hi = TIER_OPTION_COUNT[label]
        if not (lo <= len(options) <= hi):
            issues.append(issue("option-count-tier", "error", f"{path}.options"))
    if not keys_contiguous(keys):
        issues.append(issue("option-keys-gaps", "error", f"{path}.options"))
    if correct not in keys:
        issues.append(issue("correct-answer-missing", "error", f"{path}.correctAnswer"))

    analysis = ver.get("distractorAnalysis")
    wanted = set(keys) - {correct} if correct in keys and all(key is not None for key in keys) else None
    record["distractorKeysMatch"] = isinstance(analysis, dict) and wanted is not None and set(analysis) == wanted
    if not record["distractorKeysMatch"]:
        issues.append(issue("distractor-keys-mismatch", "error", f"{path}.distractorAnalysis"))

    phrases = ver.get("keyInfoPhrases")
    phrases = phrases if isinstance(phrases, list) else []
    vignette = ver.get("vignette") if isinstance(ver.get("vignette"), str) else ""
    matched = 0
    if label in TIER_PHRASE_COUNT:
        lo, hi = TIER_PHRASE_COUNT[label]
        record["phraseCountInRange"] = lo <= len(phrases) <= hi
        if not record["phraseCountInRange"]:
            issues.append(issue("phrase-count-tier", "error", f"{path}.keyInfoPhrases"))
    for index, phrase in enumerate(phrases):
        found = match_phrase(vignette, phrase) if isinstance(phrase, str) else None
        if found is None:
            issues.append(issue("phrase-not-found", "error", f"{path}.keyInfoPhrases[{index}]"))
            record["substringChecks"].append({
                "phrase": phrase if isinstance(phrase, str) else "",
                "exactMatch": False,
                "offset": None,
                "repairedFrom": None,
            })
            continue
        exact, offset, span = found
        matched += 1
        if exact:
            record["substringChecks"].append({
                "phrase": span,
                "exactMatch": True,
                "offset": offset,
                "repairedFrom": None,
            })
        else:
            repaired[0] += 1
            record["substringChecks"].append({
                "phrase": span,
                "exactMatch": False,
                "offset": offset,
                "repairedFrom": phrase,
            })
    if label in TIER_PHRASE_COUNT and matched < TIER_PHRASE_COUNT[label][0]:
        issues.append(issue("phrase-count-low", "error", f"{path}.keyInfoPhrases"))
    return record


def check_provenance(question, path, issues):
    phrases = question.get("keyInfoPhrases")
    phrase_len = len(phrases) if isinstance(phrases, list) else 0
    provenance = question.get("keyInfoProvenance")
    provenance_len = len(provenance) if isinstance(provenance, list) else 0
    aligned = True
    if provenance_len != phrase_len:
        aligned = False
        issues.append(issue("provenance-length", "error", f"{path}.keyInfoProvenance"))
    sources = question.get("sourceReferences")
    source_len = len(sources) if isinstance(sources, list) else 0
    if isinstance(provenance, list):
        for index, entry in enumerate(provenance):
            entry_path = f"{path}.keyInfoProvenance[{index}]"
            if not isinstance(entry, dict):
                aligned = False
                issues.append(issue("provenance-index-out-of-range", "error", entry_path))
                issues.append(issue("provenance-basis-invalid", "error", entry_path))
                continue
            source_index = entry.get("sourceIndex", None)
            index_ok = source_index is None or (
                isinstance(source_index, int)
                and not isinstance(source_index, bool)
                and 0 <= source_index < source_len
            )
            if "sourceIndex" not in entry or not index_ok:
                aligned = False
                issues.append(issue("provenance-index-out-of-range", "error", f"{entry_path}.sourceIndex"))
            if entry.get("basis") not in BASES:
                aligned = False
                issues.append(issue("provenance-basis-invalid", "error", f"{entry_path}.basis"))
    return aligned


def check_sources(question, path, allowlist, allow_pages, issues):
    sources = question.get("sourceReferences")
    if not isinstance(sources, list):
        return
    for index, source in enumerate(sources):
        source_path = f"{path}.sourceReferences[{index}]"
        if not isinstance(source, dict):
            issues.append(issue("unverified-source", "warn", source_path))
            continue
        key = (source.get("sourceTitle"), source.get("chapterSection"))
        if key not in allowlist:
            issues.append(issue("unverified-source", "warn", source_path))
        if not allow_pages and "pageNumber" in source and source.get("pageNumber") is not None:
            issues.append(issue("unverified-source", "warn", f"{source_path}.pageNumber"))


def check_question(question, path, label_hint_runs, allowlist, allow_pages, repaired):
    issues = []
    if not isinstance(question, dict):
        issues.append(issue("option-count-tier", "error", path))
        return {"id": None, "validation": {"status": "fail", "versions": [], "answerLetter": None, "issues": issues}}, []

    label = question.get("difficultyLabel")
    if label not in LABELS:
        issues.append(issue("difficulty-label-invalid", "error", f"{path}.difficultyLabel"))
        label = None
    if question.get("questionFormat") not in FORMATS:
        issues.append(issue("question-format-invalid", "error", f"{path}.questionFormat"))
    if label in TIER_RATING:
        rating = question.get("difficultyRating")
        lo, hi = TIER_RATING[label]
        if isinstance(rating, bool) or not isinstance(rating, (int, float)) or not (lo <= rating <= hi):
            issues.append(issue("rating-label-mismatch", "error", f"{path}.difficultyRating"))

    options = question.get("options")
    primary_option_count = len(options) if isinstance(options, list) else 0
    versions = [check_version(question, "primary", path, label, primary_option_count, issues, repaired)]
    versions[0]["provenanceAligned"] = check_provenance(question, path, issues)

    raw_variants = question.get("variants")
    variants = raw_variants if isinstance(raw_variants, list) else []
    if len(variants) != 2:
        issues.append(issue("variant-count", "error", f"{path}.variants"))
    primary_letter = question.get("correctAnswer")
    letters = [primary_letter if isinstance(primary_letter, str) else None]
    for index, variant in enumerate(variants):
        variant_path = f"{path}.variants[{index}]"
        version = f"variant{index + 1}"
        if not isinstance(variant, dict):
            issues.append(issue("variant-option-count", "error", variant_path))
            letters.append(None)
            continue
        for field in FORBIDDEN_VARIANT_FIELDS:
            if field in variant:
                issues.append(issue("forbidden-variant-field", "error", f"{variant_path}.{field}"))
        before = len(issues)
        record = check_version(variant, version, variant_path, label, primary_option_count, issues, repaired)
        if len(variant.get("options") if isinstance(variant.get("options"), list) else []) != primary_option_count:
            if not any(item["code"] == "variant-option-count" and item["path"] == f"{variant_path}.options" for item in issues[before:]):
                issues.append(issue("variant-option-count", "error", f"{variant_path}.options"))
        record["optionCountMatchesPrimary"] = record["optionCount"] == primary_option_count
        record["provenanceAligned"] = True
        versions.append(record)
        letter = variant.get("correctAnswer")
        letters.append(letter if isinstance(letter, str) else None)

    check_sources(question, path, allowlist, allow_pages, issues)

    distinct = len(letters) == 3 and all(isinstance(letter, str) for letter in letters) and len(set(letters)) == 3
    validation = {
        "status": status_of(issues),
        "versions": versions,
        "answerLetter": {
            "letters": letters,
            "allDistinct": distinct,
            "runLengthEndingHere": run_ending(label_hint_runs, len(label_hint_runs) - 1) if label_hint_runs else 1,
            "rebalanced": False,
            "originalLetters": None,
        },
        "issues": issues,
    }
    qid = question.get("id") if isinstance(question.get("id"), str) else None
    return {"id": qid, "validation": validation}, [letter for letter in letters if letter in LETTERS]


def block_validation(questions, primary_letters, all_letters):
    subjects = [question.get("subject") if isinstance(question, dict) else None for question in questions]
    repeats = sum(1 for left, right in zip(subjects, subjects[1:]) if left == right)
    mix = {"Easy": 0, "Medium": 0, "Hard": 0}
    mix_pass = True
    for question in questions:
        label = question.get("difficultyLabel") if isinstance(question, dict) else None
        if label in mix:
            mix[label] += 1
        else:
            mix_pass = False
    mix["pass"] = mix_pass and sum(mix[label] for label in LABELS) == len(questions)
    primary_counts, primary_total = letter_counts(primary_letters)
    all_counts, all_total = letter_counts(all_letters)
    primary_dev = deviation(primary_counts, primary_total)
    all_dev = deviation(all_counts, all_total)
    run = max_run(primary_letters)
    return {
        "answerDistribution": {
            "scope": "block",
            "primary": primary_counts,
            "allVersions": all_counts,
            "maxRunLength": run,
            "maxDeviationFromUniform": max(primary_dev, all_dev),
            "rebalanced": False,
            "pass": primary_dev <= 1 and all_dev <= 1 and run <= 2,
        },
        "difficultyMix": mix,
        "consecutiveSubjectRepeats": repeats,
    }


def example_letter_map(template):
    return (
        isinstance(template, dict)
        and len(template) == 1
        and all(isinstance(key, str) and len(key) == 1 and key in LETTERS for key in template)
    )


def optional_placeholder(template):
    return isinstance(template, str) and "optional" in template


def check_shape(data, template, path, issues):
    if isinstance(template, dict):
        if not isinstance(data, dict):
            issues.append(issue("shape-type-invalid", "error", path or "$"))
            return
        if example_letter_map(template):
            value_template = next(iter(template.values()))
            for key, value in data.items():
                check_shape(value, value_template, f"{path}.{key}", issues)
            return
        for key, value_template in template.items():
            child = f"{path}.{key}" if path else key
            if key not in data:
                if not optional_placeholder(value_template):
                    issues.append(issue("shape-field-missing", "error", child))
                continue
            check_shape(data[key], value_template, child, issues)
        return
    if isinstance(template, list):
        if not isinstance(data, list):
            issues.append(issue("shape-type-invalid", "error", path or "$"))
            return
        if template:
            for index, item in enumerate(data):
                check_shape(item, template[0], f"{path}[{index}]", issues)
        return
    if isinstance(template, str) and "|" in template and "optional" not in template:
        allowed = [part.strip() for part in template.split("|")]
        if data not in allowed:
            issues.append(issue("shape-enum-invalid", "error", path or "$"))


def bucket_shape_issues(shape_issues, question_slots, exam_issues):
    import re
    pattern = re.compile(r"blocks\[(\d+)\]\.questions\[(\d+)\]")
    for item in shape_issues:
        match = pattern.search(item["path"])
        if match:
            key = (int(match.group(1)), int(match.group(2)))
            if key in question_slots:
                question_slots[key].append(item)
                continue
        exam_issues.append(item)


def validate(data, allow_pages, strict_shape):
    exam_issues = []
    repaired = [0]
    allowlist = load_allowlist()
    schema_version = data.get("schemaVersion") if isinstance(data, dict) else None
    if schema_version is None:
        treated = "1.0.0"
        exam_issues.append(issue("schema-version-missing", "warn", "schemaVersion"))
    elif schema_version not in KNOWN_SCHEMA_VERSIONS:
        treated = schema_version if isinstance(schema_version, str) else str(schema_version)
        exam_issues.append(issue("schema-version-unknown", "error", "schemaVersion"))
    else:
        treated = schema_version

    blocks_in = data.get("blocks") if isinstance(data, dict) else None
    blocks_in = blocks_in if isinstance(blocks_in, list) else []
    blocks_out = []
    question_slots = {}
    question_count = 0

    for block_index, block in enumerate(blocks_in):
        block_path = f"blocks[{block_index}]"
        questions_in = block.get("questions") if isinstance(block, dict) else None
        questions_in = questions_in if isinstance(questions_in, list) else []
        primary_letters = []
        all_letters = []
        questions_out = []
        running = []
        for question_index, question in enumerate(questions_in):
            question_count += 1
            path = f"{block_path}.questions[{question_index}]"
            primary = question.get("correctAnswer") if isinstance(question, dict) else None
            running.append(primary if isinstance(primary, str) else None)
            record, letters = check_question(question, path, running, allowlist, allow_pages, repaired)
            question_slots[(block_index, question_index)] = record["validation"]["issues"]
            questions_out.append(record)
            if isinstance(primary, str):
                primary_letters.append(primary)
            all_letters.extend(letters)
        blocks_out.append({
            "blockName": block.get("blockName") if isinstance(block, dict) else None,
            "validation": block_validation(questions_in, primary_letters, all_letters),
            "questions": questions_out,
        })

    if strict_shape:
        template = json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))
        shape_issues = []
        check_shape(data, template, "", shape_issues)
        bucket_shape_issues(shape_issues, question_slots, exam_issues)
        for record_block in blocks_out:
            for record in record_block["questions"]:
                record["validation"]["status"] = status_of(record["validation"]["issues"])

    all_issues = list(exam_issues)
    for block in blocks_out:
        for record in block["questions"]:
            all_issues.extend(record["validation"]["issues"])
    counts = {"error": 0, "warn": 0, "repaired": repaired[0]}
    for item in all_issues:
        if item["severity"] in ("error", "warn"):
            counts[item["severity"]] += 1
    sidecar = {
        "schemaVersion": treated,
        "validation": {
            "validatorVersion": VALIDATOR_VERSION,
            "status": status_of(all_issues),
            "questionCount": question_count,
            "issueCounts": counts,
            "issues": exam_issues,
        },
        "blocks": blocks_out,
    }
    return sidecar


def emit_report(sidecar):
    exam_issues = sidecar["validation"]["issues"]
    emit_line("exam", status_of(exam_issues), exam_issues)
    for block in sidecar["blocks"]:
        for record in block["questions"]:
            qid = record["id"] if record["id"] else "?"
            emit_line(qid, record["validation"]["status"], record["validation"]["issues"])


def emit_line(qid, status, issues):
    rendered = ",".join(f"{item['code']}:{item['severity']}" for item in issues)
    if rendered:
        print(f"{qid}\t{status}\t{rendered}")
    else:
        print(f"{qid}\t{status}")


def default_out(input_path):
    return Path(str(input_path) + ".validation.json")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate a qbank JSON file. Does not modify the input.")
    parser.add_argument("input")
    parser.add_argument("--strict-shape", action="store_true")
    parser.add_argument("--allow-pages", action="store_true")
    parser.add_argument("--out")
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    try:
        text = input_path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        print(f"error: invalid JSON: {exc}", file=sys.stderr)
        return 2
    if not isinstance(data, dict):
        print("error: qbank root must be a JSON object", file=sys.stderr)
        return 2
    if args.strict_shape and not TEMPLATE_PATH.is_file():
        print(f"error: schema template not found: {TEMPLATE_PATH}", file=sys.stderr)
        return 2

    sidecar = validate(data, args.allow_pages, args.strict_shape)
    out_path = Path(args.out) if args.out else default_out(input_path)
    out_path.write_text(json.dumps(sidecar, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    emit_report(sidecar)
    return 1 if sidecar["validation"]["issueCounts"]["error"] else 0


if __name__ == "__main__":
    sys.exit(main())
