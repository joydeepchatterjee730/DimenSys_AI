"""Sentiment dimension using DistilBERT SST-2 (HuggingFace pipeline)."""

from __future__ import annotations

import re
import threading
from typing import Any, Dict, Optional

from backend.engine.base_dimension import BaseDimension

_pipeline_lock = threading.Lock()
_pipeline: Optional[Any] = None

_FEAR_LEX = re.compile(
    r"\b(scared|scary|fear|afraid|anxious|anxiety|worried|nervous|panic|terrified)\b",
    re.I,
)


def _get_pipeline() -> Any:
    global _pipeline
    with _pipeline_lock:
        if _pipeline is None:
            from transformers import pipeline  # lazy import

            _pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
            )
        return _pipeline


class SentimentDimension(BaseDimension):
    """Binary sentiment mapped to coarse emotion labels with lexicon refinement."""

    @property
    def name(self) -> str:
        return "sentiment"

    def process(self, text: str) -> Dict[str, Any]:
        pipe = _get_pipeline()
        with _pipeline_lock:
            result = pipe(text[:512])[0]

        raw_label = str(result.get("label", "")).upper()
        score = float(result.get("score", 0.0))

        # HF returns POSITIVE / NEGATIVE (or LABEL_0 / LABEL_1 on some configs)
        is_positive = "POSITIVE" in raw_label or raw_label.endswith("LABEL_1")
        is_negative = "NEGATIVE" in raw_label or raw_label.endswith("LABEL_0")

        if is_positive and not is_negative:
            label = "positive"
            explanation = (
                "Model: positive polarity (SST-2). Tone reads constructive or upbeat "
                f"(confidence {score:.2f})."
            )
            mapped_confidence = score
        elif is_negative:
            if _FEAR_LEX.search(text):
                label = "fear"
                explanation = (
                    "Negative polarity with fear/anxiety lexicon: reads as fear-leaning distress "
                    f"(model conf {score:.2f})."
                )
            else:
                label = "concern"
                explanation = (
                    "Negative polarity without strong fear cues: concern or frustration "
                    f"(model conf {score:.2f})."
                )
            mapped_confidence = score
        else:
            label = "neutral"
            mapped_confidence = min(max(score, 0.0), 1.0)
            explanation = f"Unclear polarity label from model ({raw_label}); treating as neutral."

        return {
            "name": self.name,
            "label": label,
            "confidence": min(max(mapped_confidence, 0.0), 1.0),
            "explanation": explanation,
        }
