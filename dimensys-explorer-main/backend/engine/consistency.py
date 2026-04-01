"""Post-dimension consistency rules."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from backend.utils.normalize import normalize_conf

_FINANCE_KW = re.compile(
    r"\b(money|invest|investing|savings|crypto|bitcoin|stock|stocks|portfolio|401k|etf|forex)\b",
    re.I,
)

_FEAR_LABELS = frozenset(
    {
        "fear",
        "concern",
        "anxiety",
        "anxious",
        "distress",
        "negative",
        "worried",
        "stress",
    }
)


def _by_name(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {str(r.get("name", "")): r for r in rows if r.get("name")}


def apply_consistency_pass(
    text: str,
    dimension_rows: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Mutate dimension rows in place where needed; return (rows, adjustment keys).
    """
    adjustments: List[str] = []
    by = _by_name(dimension_rows)
    t = text.lower()

    intent = by.get("intent")
    risk = by.get("risk")
    sentiment = by.get("sentiment")

    # intent=advice + finance keywords + risk not already medium/high
    if intent and risk and _FINANCE_KW.search(t):
        ilab = str(intent.get("label", "")).lower()
        rlab = str(risk.get("label", "")).lower()
        if ilab == "advice" and rlab == "low":
            risk["label"] = "medium"
            risk["confidence"] = normalize_conf(max(float(risk.get("confidence") or 0), 0.62))
            adjustments.append("risk_upgraded_from_low_to_medium")

    # sentiment fear-like + low confidence
    if sentiment:
        slab = str(sentiment.get("label", "")).lower().strip()
        conf = float(sentiment.get("confidence") or 0.0)
        if slab in _FEAR_LABELS or any(x in slab for x in ("fear", "anxious", "scared")):
            if conf < 0.5:
                sentiment["confidence"] = normalize_conf(max(conf, 0.6))
                adjustments.append("sentiment_confidence_bumped_for_fear_signal")

    return dimension_rows, adjustments
