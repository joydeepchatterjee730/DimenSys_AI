"""Intent dimension via NVIDIA NIM classification (fallback: lightweight rules)."""

from __future__ import annotations

import re
from typing import Any, Dict

from backend.agent.nim_client import get_api_key, sync_chat_completion
from backend.engine.types import Dimension
from backend.engine.registry import register_dimension
from backend.utils.logger import get_logger

logger = get_logger("dimensys.intent")

ALLOWED = frozenset({"advice", "question", "instruction", "informational"})

INTENT_PROMPT = """Classify the user's message into exactly ONE intent label from this set:
advice, question, instruction, informational.

Definitions:
- advice: seeking guidance, recommendations, or help deciding (e.g. investing, relationships).
- question: primarily asking for factual information (what/how/why) without asking "what should I do".
- instruction: directing the assistant or another party to do something ("write", "list", "do X").
- informational: stating facts or context without a clear question or request.

User message:
{text}

Reply with ONLY the single label word, lowercase, no punctuation."""


def _normalize_label(raw: str) -> str:
    aliases = {
        "information": "informational",
        "info": "informational",
        "inform": "informational",
        "ask": "question",
        "query": "question",
        "command": "instruction",
        "directive": "instruction",
        "guidance": "advice",
        "recommendation": "advice",
    }
    cleaned = re.sub(r"[^a-z\s]", " ", raw.lower())
    tokens = [x for x in cleaned.split() if x]
    for tok in tokens:
        tok = aliases.get(tok, tok)
        if tok in ALLOWED:
            return tok
    collapsed = re.sub(r"[^a-z]", "", raw.lower())
    collapsed = aliases.get(collapsed, collapsed)
    return collapsed if collapsed in ALLOWED else ""


def _rule_based_intent(text: str) -> tuple[str, float, str]:
    t = text.lower().strip()
    if re.search(r"\b(please|need you to|write|list|generate|create|make a)\b", t) and not t.endswith(
        "?"
    ):
        return (
            "instruction",
            0.72,
            "Heuristic: imperative / task-style phrasing (fallback).",
        )
    if "?" in t or re.match(r"^\s*(what|how|why|when|where|who)\b", t):
        return "question", 0.74, "Heuristic: interrogative form (fallback)."
    if re.search(
        r"\b(should i|what should|advice|help me|guide|recommend|not sure)\b",
        t,
    ) or re.search(r"\b(want to|thinking about|afraid|scared)\b.*\b(invest|money)\b", t):
        return (
            "advice",
            0.76,
            "Heuristic: decision-support / guidance-seeking (fallback).",
        )
    return (
        "informational",
        0.6,
        "Heuristic: declarative or general context without strong intent cue (fallback).",
    )


class IntentDimension(Dimension):
    """NIM-based intent tag with rule fallback when API is unavailable."""

    @property
    def name(self) -> str:
        return "intent"

    def process(self, text: str) -> Dict[str, Any]:
        if not get_api_key():
            label, conf, expl = _rule_based_intent(text)
            return {"name": self.name, "label": label, "confidence": conf, "explanation": expl}

        user_msg = INTENT_PROMPT.format(text=text.strip())
        try:
            raw = sync_chat_completion(
                [{"role": "user", "content": user_msg}],
                max_tokens=16,
                temperature=0.0,
            )
            label = _normalize_label(raw)
            if label not in ALLOWED:
                logger.warning("NIM intent parse failed for raw=%r; using rules", raw)
                label, conf, expl = _rule_based_intent(text)
                expl = f"NIM returned {raw!r}; {expl}"
                return {"name": self.name, "label": label, "confidence": conf, "explanation": expl}

            return {
                "name": self.name,
                "label": label,
                "confidence": 0.82,
                "explanation": f"NIM classification (raw: {raw.strip()!r}).",
            }
        except Exception as exc:  # noqa: BLE001
            logger.exception("Intent NIM call failed: %s", exc)
            label, conf, expl = _rule_based_intent(text)
            return {
                "name": self.name,
                "label": label,
                "confidence": conf,
                "explanation": f"{expl} NIM error: {exc}",
            }


# Register the dimension
register_dimension("intent", IntentDimension)
