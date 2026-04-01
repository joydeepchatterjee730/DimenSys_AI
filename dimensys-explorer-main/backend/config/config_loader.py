"""Load and validate analysis configuration (dimensions, parallel flag)."""

from dataclasses import dataclass
from typing import List, Set

from backend.models.schemas import AnalyzeConfig


@dataclass(frozen=True)
class EngineConfig:
    """Resolved settings for the analysis engine."""

    enabled_dimensions: List[str]
    parallel: bool


def load_engine_config(
    request_config: AnalyzeConfig | None,
    *,
    available_dimension_keys: Set[str],
) -> EngineConfig:
    """
    Merge request config with defaults and validate dimension names.

    Unknown dimension names are skipped with only valid keys retained.
    """
    if request_config is None:
        cfg = AnalyzeConfig()
    else:
        cfg = request_config

    parallel: bool = cfg.parallel
    requested = list(cfg.dimensions) if cfg.dimensions else list(available_dimension_keys)

    enabled: List[str] = []
    for key in requested:
        if key in available_dimension_keys and key not in enabled:
            enabled.append(key)

    if not enabled:
        enabled = sorted(available_dimension_keys)

    return EngineConfig(enabled_dimensions=enabled, parallel=parallel)
