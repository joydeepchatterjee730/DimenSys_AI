"""NVIDIA NIM OpenAI-compatible chat API client (sync + async)."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

from backend.utils.logger import get_logger

logger = get_logger("dimensys.nim")

DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "meta/llama-3.1-8b-instruct"
DEFAULT_TIMEOUT = 120.0


def _base_url() -> str:
    return os.getenv("NIM_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def _model() -> str:
    return os.getenv("NIM_CHAT_MODEL", DEFAULT_MODEL)


def get_api_key() -> Optional[str]:
    return os.getenv("NVIDIA_API_KEY") or None


def _headers() -> Dict[str, str]:
    key = get_api_key()
    if not key:
        return {}
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def sync_chat_completion(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 512,
    temperature: float = 0.3,
    model: str = None,
) -> str:
    """Synchronous chat completion (for dimensions running in thread pool)."""
    key = get_api_key()
    if not key:
        raise RuntimeError("NVIDIA_API_KEY is not set")

    url = f"{_base_url()}/chat/completions"
    payload: Dict[str, Any] = {
        "model": model or _model(),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.post(url, headers=_headers(), json=payload)
        resp.raise_for_status()
        data = resp.json()
    return _extract_message_text(data)


async def async_chat_completion(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 512,
    temperature: float = 0.3,
    model: str = None,
) -> str:
    """Async chat completion for the agent."""
    key = get_api_key()
    if not key:
        raise RuntimeError("NVIDIA_API_KEY is not set")

    url = f"{_base_url()}/chat/completions"
    payload: Dict[str, Any] = {
        "model": model or _model(),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    print(f"Using model: {payload['model']}")
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        resp = await client.post(url, headers=_headers(), json=payload)
        resp.raise_for_status()
        data = resp.json()
    return _extract_message_text(data)


def _extract_message_text(data: Dict[str, Any]) -> str:
    try:
        choices = data.get("choices") or []
        if not choices:
            return ""
        msg = choices[0].get("message") or {}
        content = msg.get("content", "")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: List[str] = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(str(block.get("text", "")))
            return "\n".join(p for p in parts if p).strip()
        return str(content).strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning("Unexpected NIM response shape: %s (%s)", data, exc)
        return ""
