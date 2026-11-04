#!/usr/bin/env python3
"""Rebalance, reorder, and stamp validation on a qbank.

The subject/difficulty reorder permutes question objects inside a block.
It does not read or write ``id``. Ids move only with their question.
Duplicate ids are rewritten later, and only in the collision pass.
"""

import argparse
import copy
import itertools
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

from validate_qbank import (
    LETTERS,
    deviation,
    letter_counts,
    load_allowlist,
    validate,
)

PROSE_FIELDS = ("attendingTip", "explanation", "hint", "keyLearningPoint")
LETTER_REF_RES = (
    re.compile(r"\b(?:la\s+opci[oó]n|opci[oó]n|letra)\s+[A-E]\b", re.I),
    re.compile(r"\b[A-E]\s+y\s+[A-E]\b"),
    re.compile(r"\btodas\s+(?:las\s+)?anteriores\b", re.I),
    re.compile(r"\bninguna\s+(?:de\s+las\s+)?anteriores\b", re.I),
)
OPTION_TODAS_RE = re.compile(r"\b(?:todas|ninguna)\s+(?:de\s+las\s+|las\s+)?anteriores\b", re.I)
ID_RE = re.compile(r"([^-]+)-([^-]+)-(\d+)$")


def versions_of(question):
    found = []
    if isinstance(question, dict):
        found.append(question)
        raw = question.get("variants")
        if isinstance(raw, list):
            found.extend(item for item in raw if isinstance(item, dict))
    return found


def option_keys(version):
    keys = []
    for option in version.get("options") or []:
        if isinstance(option, dict) and isinstance(option.get("key"), str):
            keys.append(option["key"])
    return keys


def ordered_options(version):
    texts = []
    options = version.get("options")
    if not isinstance(options, list) or not options:
        return False
    for option in options:
        if not isinstance(option, dict) or not isinstance(option.get("text"), str):
            return False
        texts.append(option["text"].strip())
    return all(re.match(r"\d", text) for text in texts)


def letter_refs(version):
    chunks = []
    for field in PROSE_FIELDS:
        value = version.get(field)
        if isinstance(value, str):
            chunks.append(value)
    analysis = version.get("distractorAnalysis")
    if isinstance(analysis, dict):
        chunks.extend(value for value in analysis.values() if isinstance(value, str))
    text = "\n".join(chunks)
    return any(pattern.search(text) for pattern in LETTER_REF_RES)


def skip_reason(question):
    """Conservative rekey skip. None means the question may be permuted."""
    for version in versions_of(question):
        if ordered_options(version):
            return "ordered"
        for option in version.get("options") or []:
            text = option.get("text") if isinstance(option, dict) else None
            if isinstance(text, str) and OPTION_TODAS_RE.search(text):
                return "todas-ninguna"
        if letter_refs(version):
            return "letter-refs"
    return None


def move_correct(version, new_letter):
    """Move the correct option's content onto ``new_letter``. Keys stay put."""
    old = version.get("correctAnswer")
    if old == new_letter:
        return True
    by_key = {}
    for option in version.get("options") or []:
        if isinstance(option, dict) and isinstance(option.get("key"), str):
            by_key[option["key"]] = option
    if old not in by_key or new_letter not in by_key:
        return False
    source = by_key[old]
    dest = by_key[new_letter]
    source_body = {key: value for key, value in source.items() if key != "key"}
    dest_body = {key: value for key, value in dest.items() if key != "key"}
    for key in list(source.keys()):
        if key != "key":
            del source[key]
    for key in list(dest.keys()):
        if key != "key":
            del dest[key]
    source.update(dest_body)
    dest.update(source_body)
    analysis = version.get("distractorAnalysis")
    if isinstance(analysis, dict):
        moved = analysis.pop(new_letter, None)
        if moved is not None:
            analysis[old] = moved
    version["correctAnswer"] = new_letter
    return True


def mark_rebalanced(state, question, before):
    slot = state.setdefault(id(question), {"rebalanced": False, "originalLetters": None})
    if slot["originalLetters"] is None:
        slot["originalLetters"] = list(before)
    slot["rebalanced"] = True


def current_letters(question):
    return [version.get("correctAnswer") for version in versions_of(question)[:3]]


def distinct_three(letters):
    return len(letters) == 3 and all(isinstance(letter, str) for letter in letters) and len(set(letters)) == 3


def repair_distinct(question, rng, force, state, skipped):
    letters = current_letters(question)
    if distinct_three(letters):
        return False
    reason = skip_reason(question)
    if reason and not force:
        skipped.append((question.get("id"), reason))
        return False
    vers = versions_of(question)[:3]
    if len(vers) < 3:
        return False
    pools = []
    for version in vers:
        keys = option_keys(version)
        rng.shuffle(keys)
        if not keys:
            return False
        pools.append(keys)
    for choice in itertools.product(*pools):
        if not distinct_three(list(choice)):
            continue
        mark_rebalanced(state, question, letters)
        for version, new_letter in zip(vers, choice):
            if version.get("correctAnswer") != new_letter:
                move_correct(version, new_letter)
        return True
    return False


def version_letters(questions):
    found = []
    for question in questions:
        for version in versions_of(question):
            letter = version.get("correctAnswer")
            if isinstance(letter, str):
                found.append(letter)
    return found


def over_uniform(questions):
    counts, total = letter_counts(version_letters(questions))
    return deviation(counts, total) > 1


def balanced_targets(total):
    uniform = total / 5.0
    counts = {letter: int(round(uniform)) for letter in LETTERS}
    while sum(counts.values()) > total:
        letter = max(LETTERS, key=lambda item: (counts[item], item))
        counts[letter] -= 1
    while sum(counts.values()) < total:
        letter = min(LETTERS, key=lambda item: (counts[item], item))
        counts[letter] += 1
    if any(abs(counts[letter] - uniform) > 1 for letter in LETTERS):
        return None
    return counts


def assign_letter_plan(groups, targets):
    """Give each version a letter so the block hits ``targets`` and each question stays distinct."""
    remaining = dict(targets)

    def place(index):
        if index == len(groups):
            return []
        pools = [option_keys(version) for version in groups[index]]
        if any(not pool for pool in pools):
            return None

        def choose(slot, chosen):
            if slot == len(pools):
                return list(chosen)
            ranked = sorted(pools[slot], key=lambda letter: (-remaining.get(letter, 0), letter))
            for letter in ranked:
                if letter in chosen or remaining.get(letter, 0) <= 0:
                    continue
                chosen.append(letter)
                found = choose(slot + 1, chosen)
                if found:
                    return found
                chosen.pop()
            return None

        choice = choose(0, [])
        if choice is None:
            return None
        for letter in choice:
            remaining[letter] -= 1
        rest = place(index + 1)
        if rest is None:
            for letter in choice:
                remaining[letter] += 1
            return None
        return [choice] + rest

    return place(0)


def rebalance_global(questions, rng, force, state, skipped):
    if not over_uniform(questions):
        return 0
    movable = []
    fixed = []
    for question in questions:
        vers = versions_of(question)
        reason = skip_reason(question)
        if len(vers) != 3 or (reason and not force):
            if reason and not force:
                skipped.append((question.get("id"), reason))
            fixed.extend(vers)
        else:
            movable.append(question)
    counted = version_letters(questions)
    targets = balanced_targets(len(counted))
    if targets is None:
        return 0
    for version in fixed:
        letter = version.get("correctAnswer")
        if letter in targets:
            targets[letter] -= 1
    if any(count < 0 for count in targets.values()):
        return 0
    if sum(targets.values()) != 3 * len(movable):
        return 0
    groups = [versions_of(question)[:3] for question in movable]
    order = list(range(len(movable)))
    plan = None
    for _attempt in range(24):
        attempt_groups = [groups[index] for index in order]
        plan = assign_letter_plan(attempt_groups, targets)
        if plan is not None:
            movable = [movable[index] for index in order]
            break
        rng.shuffle(order)
    if plan is None:
        return 0
    changed = 0
    for question, choice in zip(movable, plan):
        before = current_letters(question)
        if list(choice) == before:
            continue
        mark_rebalanced(state, question, before)
        for version, new_letter in zip(versions_of(question)[:3], choice):
            if version.get("correctAnswer") != new_letter:
                move_correct(version, new_letter)
        changed += 1
    return changed


def subject_pair_lower_bound(questions):
    count = len(questions)
    if count == 0:
        return 0
    frequencies = Counter(question.get("subject") for question in questions)
    return max(max(0, 2 * freq - count - 1) for freq in frequencies.values())


def reorder_questions(questions, rng):
    """Return the same question objects in a new order. Does not assign id."""
    count = len(questions)
    if count <= 1:
        return list(questions), 0
    priority = list(range(count))
    rng.shuffle(priority)
    rank = {index: place for place, index in enumerate(priority)}
    bound = subject_pair_lower_bound(questions)

    def search(limit):
        used = [False] * count
        sequence = []

        def place(pairs, last_subject, previous, current):
            if len(sequence) == count:
                return True
            options = []
            for index in range(count):
                if used[index]:
                    continue
                question = questions[index]
                added = 1 if last_subject is not None and question.get("subject") == last_subject else 0
                if pairs + added > limit:
                    continue
                label = question.get("difficultyLabel")
                if previous is not None and previous == current == label:
                    continue
                options.append((added, rank[index], index))
            options.sort()
            for added, _rank, index in options:
                question = questions[index]
                used[index] = True
                sequence.append(index)
                if place(pairs + added, question.get("subject"), current, question.get("difficultyLabel")):
                    return True
                sequence.pop()
                used[index] = False
            return False

        if place(0, None, None, None):
            return sequence
        return None

    for limit in range(bound, count):
        found = search(limit)
        if found is not None:
            return [questions[index] for index in found], limit
    return None, None


def adjacent_subject_repeats(questions):
    return sum(
        1
        for left, right in zip(questions, questions[1:])
        if left.get("subject") == right.get("subject")
    )


def next_collision_id(qid, taken):
    match = ID_RE.fullmatch(qid) if isinstance(qid, str) else None
    if not match:
        stem = qid if isinstance(qid, str) else "q"
        number = 2
        while f"{stem}-{number}" in taken:
            number += 1
        return f"{stem}-{number}"
    prefix, call, digits = match.group(1), match.group(2), match.group(3)
    number = int(digits)
    width = len(digits)
    while True:
        number += 1
        candidate = f"{prefix}-{call}-{number:0{width}d}"
        if candidate not in taken:
            return candidate


def rekey_collisions(blocks):
    taken = set()
    changes = []
    for block in blocks:
        for question in block.get("questions") or []:
            if not isinstance(question, dict):
                continue
            qid = question.get("id")
            if not isinstance(qid, str) or qid not in taken:
                if isinstance(qid, str):
                    taken.add(qid)
                continue
            new_id = next_collision_id(qid, taken)
            question["id"] = new_id
            taken.add(new_id)
            changes.append((qid, new_id))
    return changes


def page_numbers_present(data):
    found = 0
    for block in data.get("blocks") or []:
        if not isinstance(block, dict):
            continue
        for question in block.get("questions") or []:
            if not isinstance(question, dict):
                continue
            for source in question.get("sourceReferences") or []:
                if isinstance(source, dict) and "pageNumber" in source and source.get("pageNumber") is not None:
                    found += 1
    return found


def provenance_gaps(questions):
    gaps = 0
    for question in questions:
        phrases = question.get("keyInfoPhrases")
        phrase_len = len(phrases) if isinstance(phrases, list) else 0
        provenance = question.get("keyInfoProvenance")
        provenance_len = len(provenance) if isinstance(provenance, list) else 0
        if provenance_len != phrase_len:
            gaps += 1
    return gaps


def stamp_validation(data, sidecar, state):
    stamped = 0
    if "validation" not in data:
        data["validation"] = sidecar["validation"]
    for block, reported in zip(data.get("blocks") or [], sidecar["blocks"]):
        if isinstance(block, dict) and "validation" not in block:
            block["validation"] = reported["validation"]
        questions = block.get("questions") if isinstance(block, dict) else []
        for question, record in zip(questions or [], reported["questions"]):
            if not isinstance(question, dict) or "validation" in question:
                continue
            validation = record["validation"]
            slot = state.get(id(question))
            if slot and slot.get("rebalanced"):
                validation["answerLetter"]["rebalanced"] = True
                validation["answerLetter"]["originalLetters"] = slot["originalLetters"]
            question["validation"] = validation
            stamped += 1
    return stamped


def question_ids(block):
    return [question.get("id") for question in block.get("questions") or [] if isinstance(question, dict)]


def process(data, seed, force):
    notes = []
    allowlist = load_allowlist()
    if not allowlist:
        notes.append("INFO sources-allowlist-empty")
    pages = page_numbers_present(data)
    if pages:
        notes.append(f"INFO pages-present-not-stripped count={pages}")
    rng = random.Random(seed)
    state = {}
    skipped = []
    rekeys = []
    orders = []
    if not isinstance(data.get("blocks"), list):
        raise ValueError("qbank has no blocks array")
    for block in data["blocks"]:
        if not isinstance(block, dict) or not isinstance(block.get("questions"), list):
            raise ValueError("block is missing a questions array")
        questions = [question for question in block["questions"] if isinstance(question, dict)]
        before_ids = [question.get("id") for question in questions]
        before_repeats = adjacent_subject_repeats(questions)
        for question in questions:
            repair_distinct(question, rng, force, state, skipped)
        rebalance_global(questions, rng, force, state, skipped)
        reordered, limit = reorder_questions(questions, rng)
        if reordered is None:
            raise ValueError("subject/difficulty constraints have no solution")
        block["questions"] = reordered
        orders.append({
            "block": block.get("blockName"),
            "before": before_ids,
            "after": [question.get("id") for question in reordered],
            "repeats_before": before_repeats,
            "repeats_after": adjacent_subject_repeats(reordered),
            "limit": limit,
        })
    rekeys = rekey_collisions(data["blocks"])
    return {
        "notes": notes,
        "state": state,
        "skipped": skipped,
        "rekeys": rekeys,
        "orders": orders,
        "rebalanced": sum(1 for slot in state.values() if slot.get("rebalanced")),
    }


def render_summary(data, meta, stamped, gaps):
    lines = list(meta["notes"])
    lines.append(f"letter rebalances: {meta['rebalanced']}")
    for skip_id, reason in meta["skipped"]:
        lines.append(f"rekey-skipped:{reason} {skip_id}")
    for order in meta["orders"]:
        lines.append(
            f"reorder {order['block']}: consecutiveSubjectRepeats {order['repeats_before']} -> {order['repeats_after']}"
        )
        lines.append("before: " + " ".join(str(qid) for qid in order["before"]))
        lines.append("after: " + " ".join(str(qid) for qid in order["after"]))
        if order["repeats_after"] > 2:
            lines.append(
                "subject-constraint-floor: "
                f"{order['repeats_after']} is the minimum adjacent repeats for this subject mix"
            )
    lines.append(f"id rekeys: {len(meta['rekeys'])}")
    for old, new in meta["rekeys"]:
        lines.append(f"rekeyed {old} -> {new}")
    lines.append(f"validation blocks to stamp: {stamped}")
    lines.append(f"provenance warnings preserved: {gaps}")
    return "\n".join(lines)


def load_qbank(path):
    try:
        text = Path(path).read_text(encoding="utf-8")
    except OSError as exc:
        raise ValueError(str(exc)) from exc
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("qbank root must be a JSON object")
    return data


def main(argv=None):
    parser = argparse.ArgumentParser(description="Post-process a qbank. Does not synthesize keyInfoProvenance.")
    parser.add_argument("input")
    parser.add_argument("--out")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-rekey", action="store_true")
    args = parser.parse_args(argv)
    if not args.dry_run and not args.out:
        print("error: --out is required unless --dry-run is set", file=sys.stderr)
        return 1
    try:
        data = load_qbank(args.input)
        working = copy.deepcopy(data)
        meta = process(working, args.seed, args.force_rekey)
        sidecar = validate(working, allow_pages=False, strict_shape=False)
        questions = [
            question
            for block in working.get("blocks") or []
            if isinstance(block, dict)
            for question in block.get("questions") or []
            if isinstance(question, dict)
        ]
        gaps = provenance_gaps(questions)
        if args.dry_run:
            pending = sum(1 for question in questions if "validation" not in question)
            print(render_summary(working, meta, pending, gaps))
            return 0
        stamped = stamp_validation(working, sidecar, meta["state"])
        Path(args.out).write_text(json.dumps(working, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(render_summary(working, meta, stamped, gaps))
        return 0
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
