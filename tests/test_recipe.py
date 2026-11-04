"""The v1.1.0 recipe diff, read from prompts/recipe.js through Node."""

import json
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def recipe_bundle():
    script = """
import { PROMPT_SCHEMA_TEXT, buildQuestionRecipeEs } from "./prompts/recipe.js";
const recipe = buildQuestionRecipeEs({});
process.stdout.write(JSON.stringify({ schema: PROMPT_SCHEMA_TEXT, recipe }));
"""
    proc = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    return json.loads(proc.stdout)


def test_recipe_schema_has_keyinfo_provenance(recipe_bundle):
    schema = recipe_bundle["schema"]
    assert schema.count("keyInfoProvenance") == 1
    variant = schema.split('"variants":', 1)[1]
    assert "keyInfoProvenance" not in variant


def test_recipe_schema_has_no_validation(recipe_bundle):
    assert "validation" not in recipe_bundle["schema"]


def test_recipe_schema_has_no_schemaVersion(recipe_bundle):
    assert "schemaVersion" not in recipe_bundle["schema"]


def test_recipe_spanish_omits_pagenumber(recipe_bundle):
    recipe = recipe_bundle["recipe"]
    assert "omite pageNumber siempre" in recipe
    assert "si no estás seguro" not in recipe


def test_recipe_references_slotplan(recipe_bundle):
    assert "{SLOT_PLAN}" in recipe_bundle["recipe"]


def test_recipe_references_idprefix(recipe_bundle):
    assert "{ID_PREFIX}" in recipe_bundle["recipe"]


def test_recipe_no_letter_references_clause(recipe_bundle):
    assert "nunca te refieras a una opción por su letra" in recipe_bundle["recipe"]
