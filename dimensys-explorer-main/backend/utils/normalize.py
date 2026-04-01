"""Normalize model scores to confidence in [0, 1]."""

from __future__ import annotations

from typing import Any


def normalize_conf(x: Any) -> float:
    """
    Map logits, percentages, or raw floats to ``[0.0, 1.0]``.

    * Already in [0, 1] → clamped
    * (1, 100] → treated as percent
    * Other → best-effort clamp
    """
    try:
        v = float(x)
    except (TypeError, ValueError):
        return 0.0
    if v != v:  # NaN
        return 0.0
    if 0.0 <= v <= 1.0:
        return v
    if 1.0 < v <= 100.0:
        return min(max(v / 100.0, 0.0), 1.0)
    if v > 100.0:
        return 1.0
    if v < 0.0:
        return 0.0
    return min(max(v, 0.0), 1.0)
