import re

OUT_OF_SCOPE_PATTERNS = [
    r"\bdiagnos(e|is|ing)\b",
    r"\bprescri(be|ption)\b",
    r"\bshould i (take|give|administer)\b",
    r"\bdosage for (me|my patient|a \d+)",
    r"\bpatient-specific\b",
    r"\bwhat (should|would) you do\b",
    r"\bcalculate.*dose\b",
    r"\btreat my\b",
    r"\bemergency\b.*\bwhat to do\b",
]

OUT_OF_SCOPE_RE = re.compile("|".join(OUT_OF_SCOPE_PATTERNS), re.IGNORECASE)

REFUSAL_MESSAGE = (
    "I can only answer from your uploaded reference documents, and I don't provide personal "
    "medical advice, diagnoses, or patient-specific dosing. Please refer to your institutional "
    "protocols and clinical judgment, or consult the relevant protocol document. If you have a "
    "specific protocol you'd like me to look up, please upload it and rephrase your question "
    "as a reference lookup (e.g. \"What does the hand hygiene protocol say about …?\")."
)

DISCLAIMER_SUFFIX = "\n\n*Reference lookup only — not medical advice. Always follow institutional protocols and clinical judgment.*"


def classify_query(query: str) -> tuple[bool, str | None]:
    if OUT_OF_SCOPE_RE.search(query):
        return True, REFUSAL_MESSAGE
    return False, None


def ensure_citations(answer: str, has_sources: bool) -> str:
    if has_sources and not re.search(r"\[\d+\]", answer):
        return answer.rstrip() + " " + "[1]"
    return answer


def append_disclaimer(answer: str) -> str:
    if DISCLAIMER_SUFFIX.strip() in answer:
        return answer
    return answer + DISCLAIMER_SUFFIX
