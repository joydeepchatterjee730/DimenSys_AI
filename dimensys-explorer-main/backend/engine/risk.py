"""Risk dimension — layered rule-based signals (financial, emotional, safety)."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from backend.engine.base_dimension import BaseDimension

_FIN = re.compile(
    r"\b(invest|investment|stock|stocks|crypto|bitcoin|portfolio|trade|trading|"
    r"forex|margin|leverage|loan|debt|retirement|401k|etf|options)\b",
    re.I,
)
_EMO = re.compile(
    r"\b(scared|fear|afraid|anxious|anxiety|worried|nervous|panic|stress|overwhelmed|"
    r"depressed|hopeless|unsafe)\b",
    re.I,
)
_HARM = re.compile(
    r"\b(kill myself|suicide|end my life|self[- ]?harm|hurt myself|want to die)\b",
    re.I,
)
_LOW = re.compile(
    r"\b(safe|savings account|insured|guaranteed|low risk|minimal risk|conservative)\b",
    re.I,
)


def _score_text(text: str) -> Tuple[List[str], List[str], bool]:
    """Return (financial_hits, emotional_hits, harmful_hit)."""
    t = text.lower()
    fin_hits = _FIN.findall(t)
    emo_hits = _EMO.findall(t)
    harmful = _HARM.search(t) is not None
    return fin_hits, emo_hits, harmful


class RiskDimension(BaseDimension):
    """Combine financial exposure, emotional strain, and safety-critical phrases."""

    @property
    def name(self) -> str:
        return "risk"

    def process(self, text: str) -> Dict[str, Any]:
        fin_hits, emo_hits, harmful = _score_text(text)
        low_ctx = _LOW.search(text) is not None

        fin_u = sorted(set(fin_hits))
        emo_u = sorted(set(emo_hits))
        fin_n, emo_n = len(fin_u), len(emo_u)

        if harmful:
            return {
                "name": self.name,
                "label": "high",
                "confidence": 0.95,
                "explanation": (
                    "Safety: possible self-harm or crisis language detected. "
                    "Prioritize crisis resources and human support."
                ),
            }

        reasons: List[str] = []
        if fin_u:
            reasons.append("Financial: " + ", ".join(fin_u))
        if emo_u:
            reasons.append("Emotional: " + ", ".join(emo_u))
        reason_tail = (" " + "; ".join(reasons)) if reasons else ""

        if low_ctx and fin_n == 0 and emo_n == 0:
            return {
                "name": self.name,
                "label": "low",
                "confidence": 0.72,
                "explanation": "Language suggests low-risk framing; no strong stressors detected.",
            }

        if fin_n >= 1 and emo_n >= 1:
            return {
                "name": self.name,
                "label": "high",
                "confidence": 0.86,
                "explanation": (
                    "Financial stakes overlap with emotional distress."
                    + reason_tail
                ),
            }

        if fin_n >= 2 or emo_n >= 2:
            return {
                "name": self.name,
                "label": "high",
                "confidence": 0.8,
                "explanation": "Multiple cues in one risk category." + reason_tail,
            }

        if fin_n == 1 or emo_n == 1:
            return {
                "name": self.name,
                "label": "medium",
                "confidence": 0.72,
                "explanation": "Some risk-relevant vocabulary present." + reason_tail,
            }

        return {
            "name": self.name,
            "label": "low",
            "confidence": 0.64,
            "explanation": "No strong financial, emotional, or safety risk cues." + reason_tail,
        }
