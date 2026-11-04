#!/usr/bin/env python3
"""Adversarial verifier stub. Loads the prompt and appends model issues.

The model call is intentionally unwired. Pass --model and this process
raises NotImplementedError instead of pretending to review the bank.
"""

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PROMPT_PATH = REPO_ROOT / "prompts" / "verifier.md"


def call_model(model, prompt, question):
    """Send one question to ``provider:model``. Replace this body with a real client."""
    raise NotImplementedError("wire up your LLM client here")


def load_prompt():
    try:
        return PROMPT_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        raise ValueError(f"cannot read {PROMPT_PATH}: {exc}") from exc


def parse_issues(payload):
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise ValueError(f"verifier returned invalid JSON: {exc}") from exc
    if not isinstance(payload, dict) or not isinstance(payload.get("issues"), list):
        raise ValueError("verifier JSON must be an object with an issues array")
    parsed = []
    for item in payload["issues"]:
        if not isinstance(item, dict):
            raise ValueError("each verifier issue must be an object")
        parsed.append({
            "questionId": item.get("questionId"),
            "check": item.get("check"),
            "severity": item.get("severity"),
            "detail": item.get("detail"),
            "source": "llm-verifier",
        })
    return parsed


def append_issues(question, issues):
    own_id = question.get("id")
    validation = question.setdefault("validation", {})
    if not isinstance(validation, dict):
        raise ValueError(f"validation on {own_id} is not an object")
    bucket = validation.setdefault("issues", [])
    if not isinstance(bucket, list):
        raise ValueError(f"validation.issues on {own_id} is not an array")
    for item in issues:
        if item.get("questionId") not in (None, own_id):
            continue
        bucket.append(item)


def verify(data, model, prompt):
    blocks = data.get("blocks") if isinstance(data, dict) else None
    if not isinstance(blocks, list):
        raise ValueError("qbank has no blocks array")
    for block in blocks:
        questions = block.get("questions") if isinstance(block, dict) else None
        if not isinstance(questions, list):
            raise ValueError("block is missing a questions array")
        for question in questions:
            if not isinstance(question, dict):
                continue
            payload = call_model(model, prompt, question)
            append_issues(question, parse_issues(payload))
    return data


def main(argv=None):
    parser = argparse.ArgumentParser(description="Append adversarial verifier issues to a qbank.")
    parser.add_argument("qbank")
    parser.add_argument("--model", help="provider:model. Required. No default client is wired.")
    parser.add_argument("--out")
    args = parser.parse_args(argv)
    if not args.model:
        print("error: --model is required, for example --model provider:model", file=sys.stderr)
        return 2
    if not args.out:
        print("error: --out is required", file=sys.stderr)
        return 2
    try:
        prompt = load_prompt()
        data = json.loads(Path(args.qbank).read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("qbank root must be a JSON object")
        verified = verify(data, args.model, prompt)
    except NotImplementedError:
        raise
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    Path(args.out).write_text(json.dumps(verified, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
