"""Structured synthesis of dimension outputs and agent response with multiple strategies."""

from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List

try:
    import numpy as np
except ImportError:
    np = None

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


def weighted_fusion(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """Weighted average fusion with predefined weights."""
    weights = {
        "sentiment": 0.25,
        "intent": 0.25,
        "risk": 0.3,
        "semantic": 0.2
    }

    summary = []
    for d in dimensions:
        w = weights.get(d["name"], 0.25)
        summary.append(f"{d['name']} ({w}): {d['label']}")

    agent_response = agent_output.get("response", "").strip()
    if not agent_response:
        agent_response = "No response generated."

    return (
        "Based on weighted analysis:\n" + 
        "\n".join(summary) + 
        "\n\nFinal Response:\n" + 
        agent_response
    )


def attention_fusion(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """Attention-based fusion using confidence scores as weights."""
    if np is None:
        logger.warning("NumPy not available, falling back to weighted fusion")
        return weighted_fusion(dimensions, agent_output)

    try:
        scores = np.array([d["confidence"] for d in dimensions])
        exp = np.exp(scores)
        weights = exp / exp.sum()

        summary = []
        for i, d in enumerate(dimensions):
            summary.append(f"{d['name']} ({weights[i]:.2f}): {d['label']}")

        agent_response = agent_output.get("response", "").strip()
        if not agent_response:
            agent_response = "No response generated."

        return (
            "Based on attention fusion:\n" + 
            "\n".join(summary) + 
            "\n\nFinal Response:\n" + 
            agent_response
        )
    except Exception as exc:
        logger.warning("Attention fusion failed: %s, falling back to weighted", exc)
        return weighted_fusion(dimensions, agent_output)


def hierarchical_fusion(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """Hierarchical fusion with priority-based ordering."""
    priority = ["risk", "sentiment", "intent", "semantic"]
    
    sorted_dims = sorted(
        dimensions, 
        key=lambda d: priority.index(d["name"]) if d["name"] in priority else 99
    )

    summary = []
    for d in sorted_dims:
        summary.append(f"{d['name']}: {d['label']}")

    agent_response = agent_output.get("response", "").strip()
    if not agent_response:
        agent_response = "No response generated."

    return (
        "Based on hierarchical reasoning:\n" + 
        "\n".join(summary) + 
        "\n\nFinal Response:\n" + 
        agent_response
    )


def ensemble_fusion(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """Ensemble voting fusion using majority vote on labels."""
    agent_response = agent_output.get("response", "").strip()
    if not agent_response:
        agent_response = "No response generated."
    
    labels = [d["label"] for d in dimensions if not d.get("error")]
    if not labels:
        return "Consensus decision: no valid dimensions\n\nFinal Response:\n" + agent_response
    
    vote = Counter(labels).most_common(1)[0][0]
    vote_count = Counter(labels)[vote]
    total = len(labels)
    
    return (
        f"Consensus decision: {vote} ({vote_count}/{total} votes)\n\n" +
        "Final Response:\n" + 
        agent_response
    )


def fuse(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any], strategy: str = "weighted") -> str:
    """
    Main fusion dispatcher that selects the appropriate strategy.
    
    Args:
        dimensions: List of dimension results
        agent_output: Agent response dictionary
        strategy: Fusion strategy ("weighted", "attention", "hierarchical", "ensemble")
        
    Returns:
        Fused output string
    """
    if strategy == "attention":
        return attention_fusion(dimensions, agent_output)
    elif strategy == "hierarchical":
        return hierarchical_fusion(dimensions, agent_output)
    elif strategy == "ensemble":
        return ensemble_fusion(dimensions, agent_output)
    elif strategy == "weighted":
        return weighted_fusion(dimensions, agent_output)
    else:
        logger.warning("Unknown fusion strategy: %s, using weighted", strategy)
        return weighted_fusion(dimensions, agent_output)


# Legacy function for backward compatibility
def _legacy_fuse(dimensions: List[Dict[str, Any]], agent_output: Dict[str, Any]) -> str:
    """Legacy fusion function for backward compatibility."""
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
    logger.debug("Legacy fusion output length=%s", len(final))
    return final
