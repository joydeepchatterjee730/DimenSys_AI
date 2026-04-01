"""Structured synthesis of dimension outputs and agent response."""

from __future__ import annotations

from typing import Any, Dict, List

from backend.utils.logger import get_logger

logger = get_logger("dimensys.fusion")

_DIM_ORDER = ("sentiment", "intent", "risk", "semantic")


def _sorted_dimensions(dimensions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    idx = {n: i for i, n in enumerate(_DIM_ORDER)}
    return sorted(
        dimensions,
        key=lambda d: idx.get(str(d.get("name", "")), len(_DIM_ORDER)),
    )


def _bullet_line(d: Dict[str, Any]) -> str:
    name = str(d.get("name", "dimension")).strip() or "dimension"
    title = name[:1].upper() + name[1:] if name else "Dimension"
    if d.get("error"):
        return f"* {title}: unavailable ({d.get('error')})"
    label = d.get("label", "?")
    expl = str(d.get("explanation", "")).strip()
    if expl:
        return f"* {title}: {label} — {expl}"
    return f"* {title}: {label}"


def fuse(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """
    Build readable synthesis: bullet summary + final agent response section.

    ``agent_output`` should include ``response`` (and optionally ``input``).
    """
    ordered = _sorted_dimensions(dimensions)
    bullets = "\n".join(_bullet_line(d) for d in ordered) if ordered else "* (no dimensions)"

    agent_resp = str(agent_output.get("response", "")).strip()
    if not agent_resp:
        agent_resp = "(No agent response.)"

    final = (
        "Based on the analysis:\n\n"
        f"{bullets}\n\n"
        "Final Response:\n"
        f"{agent_resp}"
    )
    logger.debug("Fusion output length=%s", len(final))
    return final
