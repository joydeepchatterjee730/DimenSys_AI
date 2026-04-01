"""Simple in-memory TTL cache for analyze responses."""

from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, Optional, Tuple

# Default TTL: 3 minutes (within 2–5 minute spec)
DEFAULT_TTL_SECONDS = 180

_store: Dict[str, Tuple[float, Dict[str, Any]]] = {}


def _make_key(text: str, dimensions: Tuple[str, ...], parallel: bool) -> str:
    raw = f"{text.strip()}|{','.join(dimensions)}|{parallel}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def get_cache_key(text: str, dimensions: list[str], parallel: bool) -> str:
    return _make_key(text, tuple(sorted(dimensions)), parallel)


def get(key: str) -> Optional[Dict[str, Any]]:
    now = time.monotonic()
    entry = _store.get(key)
    if not entry:
        return None
    expires_at, payload = entry
    if now > expires_at:
        del _store[key]
        return None
    return payload


def set(key: str, payload: Dict[str, Any], ttl_seconds: float = DEFAULT_TTL_SECONDS) -> None:
    _store[key] = (time.monotonic() + ttl_seconds, payload)


def clear() -> None:
    """Test hook."""
    _store.clear()
