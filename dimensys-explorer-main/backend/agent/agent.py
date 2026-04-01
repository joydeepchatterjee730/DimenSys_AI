"""Agent: NVIDIA NIM (OpenAI-compatible) chat for structured multi-dimension reasoning."""

from __future__ import annotations

from typing import Any, Dict, List

from backend.agent.calibration import calibrate_agent_response
from backend.agent.nim_client import async_chat_completion, get_api_key
from backend.utils.logger import get_logger

logger = get_logger("dimensys.agent")

SYSTEM_PROMPT = (
    "Follow the user's requested output format (numbered sections). "
    "Be accurate, empathetic, and safety-conscious. Do not give personalized financial, legal, "
    "or medical instructions; offer general education and suggest professionals when appropriate."
)


def _format_dimension_outputs(dimensions: List[Dict[str, Any]]) -> str:
    """Human-readable block of structured dimension signals."""
    lines: List[str] = []
    for d in dimensions:
        err = d.get("error")
        name = str(d.get("name", "?")).title()
        if err:
            lines.append(f"* {name}: unavailable ({err})")
            continue
        label = d.get("label", "?")
        conf = float(d.get("confidence") or 0.0)
        expl = str(d.get("explanation", "")).strip()
        lines.append(f"* {name}: {label} (confidence {conf:.2f}){f' — {expl}' if expl else ''}")
    return "\n".join(lines) if lines else "* (no dimension data)"


def build_agent_prompt(dimensions: List[Dict[str, Any]], text: str) -> str:
    """User message for the chat model: expert assistant + signals + guidelines + output format."""
    dimension_outputs = _format_dimension_outputs(dimensions)
    return (
        "You are an expert AI assistant.\n\n"
        "Analyze the user input using the structured signals below:\n\n"
        f"User input:\n{text}\n\n"
        f"Structured signals:\n{dimension_outputs}\n\n"
        "Guidelines:\n"
        "* Adapt tone based on sentiment (e.g., fear → reassuring tone)\n"
        "* Carefully consider risk level before giving suggestions\n"
        "* Provide safe, practical, and context-aware advice\n"
        "* Avoid generic responses\n"
        "* Be concise but insightful\n\n"
        "Output format:\n"
        "1. Brief explanation of the situation\n"
        "2. Clear, actionable response\n"
    )


async def generate(dimensions: List[Dict[str, Any]], text: str, model: str = None) -> Dict[str, str]:
    """
    Build a structured prompt and return NIM model output (calibrated).

    Returns ``{"input": prompt, "response": model_response}``.
    """
    prompt = build_agent_prompt(dimensions, text)
    logger.debug("Agent calling NIM (prompt chars=%s)", len(prompt))

    if not get_api_key():
        logger.warning("NVIDIA_API_KEY not set; agent returning configuration message")
        return {
            "input": prompt,
            "response": (
                "Agent is not configured: set NVIDIA_API_KEY to enable NVIDIA NIM chat. "
                "Dimension analysis above is still valid."
            ),
        }

    try:
        content = await async_chat_completion(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=768,
            temperature=0.35,
            model=model,
        )
        if not content:
            content = "(Empty response from model.)"
        calibrated = calibrate_agent_response(content, dimensions, text)
        return {"input": prompt, "response": calibrated}
    except Exception as exc:  # noqa: BLE001
        logger.exception("NIM agent request failed: %s", exc)
        return {
            "input": prompt,
            "response": f"Agent request failed ({type(exc).__name__}: {exc}). "
            "Check NVIDIA_API_KEY, NIM_BASE_URL, and NIM_CHAT_MODEL.",
        }
