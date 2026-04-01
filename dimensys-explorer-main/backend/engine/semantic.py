"""Semantic dimension: sentence-transformers embeddings + keyword extraction."""

from __future__ import annotations

import re
import threading
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from backend.engine.types import Dimension
from backend.engine.registry import register_dimension

_model_lock = threading.Lock()
_model: Optional[Any] = None
_topic_matrix: Optional[np.ndarray] = None
_topic_labels: Optional[List[str]] = None

_STOP = frozenset(
    "the a an and or but if to of in on for with is are was were be been being this that these those "
    "i you he she it we they me my your their our as at by from not no so do does did can could would should"
    .split()
)

# Anchor phrases per topic — embedded once and compared by cosine similarity to input
_TOPIC_ANCHORS: Dict[str, str] = {
    "finance": "investing banking money stocks portfolio budget retirement savings inflation economy",
    "health": "doctor hospital medicine symptoms diagnosis therapy wellness fitness nutrition disease",
    "education": "school university learning homework teaching students curriculum course study exam",
    "technology": "software programming computer code api cloud data engineering developer security",
    "business": "startup company strategy marketing sales revenue customers management hiring workplace",
    "general": "daily life conversation general topic miscellaneous",
}

# Optional: only import if available
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


def _token_keywords(text: str, max_kw: int = 8) -> List[str]:
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    out: List[str] = []
    for w in words:
        if w in _STOP:
            continue
        if w not in out:
            out.append(w)
        if len(out) >= max_kw:
            break
    return out


def _get_model_and_topics() -> Tuple[Any, np.ndarray, List[str]]:
    global _model, _topic_matrix, _topic_labels
    with _model_lock:
        if _model is None:
            if SentenceTransformer is not None:
                _model = SentenceTransformer("all-MiniLM-L6-v2")
                labels = list(_TOPIC_ANCHORS.keys())
                phrases = [_TOPIC_ANCHORS[k] for k in labels]
                emb = _model.encode(phrases, convert_to_numpy=True, normalize_embeddings=True)
                _topic_matrix = np.asarray(emb, dtype=np.float32)
                _topic_labels = labels
    # Return empty model and topics if not available
    if _model is None:
        return None, np.array([]), []
    assert _topic_matrix is not None and _topic_labels is not None
    return _model, _topic_matrix, _topic_labels


class SemanticDimension(Dimension):
    """Topic classification via embedding similarity plus simple keyword extraction."""

    @property
    def name(self) -> str:
        return "semantic"

    def _classify_by_keywords(self, text: str) -> str:
        keywords = _token_keywords(text)
        keyword_counts: Dict[str, int] = {}
        for keyword in keywords:
            for topic, anchor in _TOPIC_ANCHORS.items():
                if keyword in anchor.split():
                    keyword_counts[topic] = keyword_counts.get(topic, 0) + 1
        topic = max(keyword_counts, key=keyword_counts.get, default="general")
        return topic

    def process(self, text: str) -> Dict[str, Any]:
        keywords = _token_keywords(text)
        snippet = (text or "").strip()[:2000]
        
        # Try to use embedding model if available
        model_result = _get_model_and_topics()
        
        if model_result[0] is not None:
            model, topic_mat, topic_labels = model_result
            with _model_lock:
                v = model.encode(snippet, convert_to_numpy=True, normalize_embeddings=True)
                v = np.asarray(v, dtype=np.float32).reshape(-1)
                sims = topic_mat @ v
                best_i = int(np.argmax(sims))
                best_score = float(sims[best_i])
                topic = topic_labels[best_i]
                
                # Prefer "finance" when obvious lexicon triggers even if embedding ties
                tl = text.lower()
                if re.search(r"\b(invest|investing|portfolio|stock|money|finance|crypto)\b", tl):
                    if topic != "finance" and best_score < 0.42:
                        topic = "finance"
                        best_score = max(best_score, 0.55)
                
                kw_part = ", ".join(keywords) if keywords else "(none)"
                explanation = (
                    f"Keywords: {kw_part}. Topic (all-MiniLM-L6-v2 vs anchors): {topic} "
                    f"(similarity {best_score:.2f})."
                )
                return {
                    "name": self.name,
                    "label": topic,
                    "confidence": min(max(best_score, 0.0), 1.0),
                    "explanation": explanation,
                }
        
        # Fallback to simple keyword-based classification
        else:
            topic = self._classify_by_keywords(text)
            explanation = f"Fallback classification used: {topic}"
            return {
                "name": self.name,
                "label": topic,
                "confidence": 0.5,
                "explanation": explanation,
            }


# Register the dimension
register_dimension("semantic", SemanticDimension)
