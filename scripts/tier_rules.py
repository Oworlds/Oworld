"""Tier bounds and the canonical keyInfoPhrase matcher.

The matcher follows getClues in src/App.jsx: exact find, then a case-insensitive
find. It does not apply NFC or whitespace folding.
"""

# Inclusive (min, max) option counts. Easy is a range; Medium and Hard are exact.
TIER_OPTION_COUNT = {
    "Easy": (3, 4),
    "Medium": (5, 5),
    "Hard": (5, 5),
}

# Inclusive (min, max) keyInfoPhrases counts for a vignette tier.
# Floors are 2 / 3 / 4. Ceilings follow the vignette recipe (3 / 4 / 5).
TIER_PHRASE_COUNT = {
    "Easy": (2, 3),
    "Medium": (3, 4),
    "Hard": (4, 5),
}

# Inclusive (min, max) difficultyRating for each difficultyLabel.
TIER_RATING = {
    "Easy": (1, 2),
    "Medium": (3, 3),
    "Hard": (4, 5),
}


def match_phrase(text, phrase):
    """Return (exact, offset, span) or None.

    exact is True when text.find(phrase) hits. Otherwise try
    text.lower().find(phrase.lower()) and, on a hit, return the slice of
    text that starts at that offset and has len(phrase). A blank phrase
    does not match. No NFC and no whitespace folding.
    """
    if not isinstance(text, str) or not isinstance(phrase, str) or not phrase.strip():
        return None
    offset = text.find(phrase)
    if offset != -1:
        return (True, offset, phrase)
    folded = text.lower()
    offset = folded.find(phrase.lower())
    if offset == -1:
        return None
    return (False, offset, text[offset:offset + len(phrase)])
