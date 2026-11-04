"""Smoke test for scripts/dump_recipe.py."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_dump_recipe_es_smoke():
    proc = subprocess.run(
        ["python3", "scripts/dump_recipe.py",
         "--size", "5", "--difficulty", "mixed", "--lang", "es"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    out = proc.stdout
    assert out.startswith("Genera 5 preguntas")
    assert "{SLOT_PLAN}" in out
    assert "{ID_PREFIX}" in out
    assert "si no estás seguro" not in out
    # Extract the schema literal (first {...} balanced block).
    # It is the first line after the "con este esquema" line.
    schema_line = next(
        line for line in out.splitlines()
        if line.strip().startswith('{"examTitle"')
    )
    assert "schemaVersion" not in schema_line, (
        "schema literal must not contain schemaVersion"
    )
    assert "validation" not in schema_line, (
        "schema literal must not contain validation"
    )
    # schemaVersion may appear only in the prohibition sentence.
    for match in re.finditer("schemaVersion", out):
        start = max(0, match.start() - 40)
        context = out[start:match.end() + 20]
        assert "NO incluyas schemaVersion" in context, (
            f"schemaVersion appears outside the prohibition sentence: "
            f"...{context}..."
        )
