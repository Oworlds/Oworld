#!/usr/bin/env python3
"""Print a v1.1.0 question recipe for pasting into an external generator."""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

NODE_PROGRAM = r"""
import { buildQuestionRecipe } from "./prompts/recipe.js";
const config = JSON.parse(process.env.DUMP_RECIPE_CONFIG);
const text = buildQuestionRecipe({
  size: config.size,
  focusMode: config.focus,
  focusValue: config.focusValue,
  lang: config.lang,
  difficulty: config.difficulty,
});
process.stdout.write(text.endsWith("\n") ? text : text + "\n");
"""


def build_recipe(size, difficulty, lang, focus, focus_value):
    """Return the recipe string from prompts/recipe.js."""
    env = dict(os.environ)
    env["DUMP_RECIPE_CONFIG"] = json.dumps({
        "size": size,
        "difficulty": difficulty,
        "lang": lang,
        "focus": focus,
        "focusValue": focus_value or "",
    })
    proc = subprocess.run(
        ["node", "--input-type=module", "-e", NODE_PROGRAM],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        detail = proc.stderr.strip() or proc.stdout.strip() or "node failed"
        raise RuntimeError(detail)
    return proc.stdout


def main(argv=None):
    parser = argparse.ArgumentParser(description="Print the current v1.1.0 question recipe.")
    parser.add_argument("--size", type=int, required=True)
    parser.add_argument("--difficulty", required=True, choices=("easy", "medium", "hard", "mixed"))
    parser.add_argument("--lang", required=True, choices=("es", "en"))
    parser.add_argument("--focus", default="balanced", choices=("balanced", "systems", "discipline"))
    parser.add_argument("--focus-value", default="")
    args = parser.parse_args(argv)
    if args.size < 1:
        print("error: --size must be at least 1", file=sys.stderr)
        return 2
    try:
        sys.stdout.write(build_recipe(args.size, args.difficulty, args.lang, args.focus, args.focus_value))
    except (OSError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
