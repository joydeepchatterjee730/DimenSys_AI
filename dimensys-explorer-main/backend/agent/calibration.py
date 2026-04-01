"""Post-process agent model output: format, length, guardrails, tone."""

from __future__ import annotations

import re
from typing import Any, Dict, List

_MAX_WORDS = 220
_TARGET_WORDS = 200

_RISK_HIGH_NOTE = (
    "Note: This involves elevated risk. Consider conservative steps.\n\n"
)

_DISTRESS_LINE = (
    "You are not alone, and it is okay to feel this way. Small, steady steps can help.\n\n"
)


def _dim_label(dimensions: List[Dict[str, Any]], name: str) -> str:
    for d in dimensions:
        if d.get("name") == name and not d.get("error"):
            return str(d.get("label", "")).lower().strip()
    return ""


def _is_distress_sentiment(label: str) -> bool:
    if not label:
        return False
    if label in ("fear", "concern", "anxiety", "anxious", "distress", "worried", "stress", "scared"):
        return True
    return any(w in label for w in ("fear", "anxious", "scared", "worry"))


def _has_numbered_parts(text: str) -> bool:
    return bool(re.search(r"(?m)^\s*1\.\s+\S", text) and re.search(r"(?m)^\s*2\.\s+\S", text))


def _ensure_two_part_format(text: str) -> str:
    t = text.strip()
    if _has_numbered_parts(t):
        return t
    parts = re.split(r"\n\s*\n+", t, maxsplit=1)
    if len(parts) >= 2 and parts[0].strip() and parts[1].strip():
        return f"1. {parts[0].strip()}\n\n2. {parts[1].strip()}"
    m = re.match(r"^(.+?[.!?])(\s+)(.+)$", t, re.DOTALL)
    if m:
        return f"1. {m.group(1).strip()}\n\n2. {m.group(3).strip()}"
    return f"1. Context and interpretation.\n\n2. {t}"


def _limit_words(text: str, max_words: int = _MAX_WORDS) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    clipped = " ".join(words[:_TARGET_WORDS])
    return clipped + "\n\n[Response shortened for clarity.]"


def _tone_intro(sentiment_label: str) -> str:
    """Lightweight tone adapter (prepended before numbered sections)."""
    sl = sentiment_label.lower().strip()
    if sl in ("fear", "concern", "anxiety", "anxious", "distress", "worried", "negative", "scared"):
        return "Taking a reassuring, calm tone:\n\n"
    if sl in ("positive", "joy", "happy"):
        return "Keeping an encouraging tone:\n\n"
    return "Keeping this direct and concise:\n\n"


def _skip_calibration(raw: str) -> bool:
    s = raw.lower()
    return (
        "not configured" in s
        or "agent request failed" in s
        or "empty response from model" in s
    )


def calibrate_agent_response(
    raw: str,
    dimensions: List[Dict[str, Any]],
    user_text: str,
) -> str:
    """
    Validate two-part structure, cap length, add risk/distress guardrails, tone intro.
    """
    del user_text  # reserved for future context-aware trimming
    if not raw or not raw.strip():
        return raw
    if _skip_calibration(raw):
        return raw.strip()

    text = raw.strip()
    risk_lab = _dim_label(dimensions, "risk")
    sent_lab = _dim_label(dimensions, "sentiment")

    prefix_parts: List[str] = []
    if risk_lab == "high":
        prefix_parts.append(_RISK_HIGH_NOTE.rstrip())

    if _is_distress_sentiment(sent_lab):
        prefix_parts.append(_DISTRESS_LINE.rstrip())

    core = _ensure_two_part_format(text)
    core = _limit_words(core)
    core = _tone_intro(sent_lab) + core

    out = ""
    if prefix_parts:
        out = "\n\n".join(prefix_parts) + "\n\n"
    out = out + core
    return out.strip()
