# Prompts

`verifier.md` is the adversarial question reviewer. It is cross-family: the same prompt is used for every question, regardless of subject or difficulty. The reviewer starts from the assumption that the question is broken. A clean pass has to be earned.

`scripts/verify_qbank.py` loads this file and sends it with each question. The model client is not wired yet.
