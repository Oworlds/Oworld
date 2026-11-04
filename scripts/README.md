# Source allowlist

`sources.json` is the allowlist read by `validate_qbank.py`. An entry has this shape:

```json
{
  "sources": [
    {
      "sourceTitle": "First Aid for the USMLE Step 1",
      "chapterSection": "Renal — Renal artery stenosis",
      "pageNumber": "..."
    }
  ]
}
```

A source matches an entry only when both `sourceTitle` and `chapterSection` are exactly equal. `pageNumber` is stored on the allowlist entry for a later restore step. The validator does not add or remove `pageNumber` on a qbank.

Populating this file is a manual curation step. With an empty `sources` array, every source reference is reported as `unverified-source` (a warning, not an error).
