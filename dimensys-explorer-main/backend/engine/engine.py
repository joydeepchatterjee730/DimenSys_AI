"""
Orchestrates dimension execution (parallel or sequential), agent, and fusion.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional, Tuple

from backend.agent.agent import generate
from backend.config.config_loader import EngineConfig, load_engine_config
from backend.engine.base_dimension import BaseDimension
from backend.engine.consistency import apply_consistency_pass
from backend.engine.registry import DIMENSION_REGISTRY
from backend.fusion.fusion import fuse
from backend.models.schemas import AnalyzeConfig, DimensionOutput, FinalResponse
from backend.utils import cache as response_cache
from backend.utils.logger import get_logger
from backend.utils.normalize import normalize_conf

logger = get_logger("dimensys.engine")


def _instantiate_dimensions(enabled_keys: List[str]) -> List[BaseDimension]:
    instances: List[BaseDimension] = []
    for key in enabled_keys:
        dim_cls = DIMENSION_REGISTRY[key]
        instances.append(dim_cls())
    return instances


def _safe_run_dimension(
    dim: BaseDimension,
    text: str,
    request_id: str,
    *,
    debug: bool,
) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """Run one dimension; never raises. Records wall-clock time. Optional raw snapshot for debug."""
    logger.debug("[%s] Dimension start: %s", request_id, dim.name)
    start = time.perf_counter()
    raw_debug: Optional[Dict[str, Any]] = None
    try:
        raw = dim.process(text)
        if debug:
            raw_debug = {k: v for k, v in raw.items()}
        elapsed = time.perf_counter() - start
        name = str(raw.get("name", dim.name))
        conf = normalize_conf(raw.get("confidence"))
        out = DimensionOutput(
            name=name,
            label=str(raw.get("label", "unknown")),
            confidence=conf,
            explanation=str(raw.get("explanation", "No explanation provided.")),
            time=elapsed,
            error=None,
        )
        logger.debug("[%s] Dimension done: %s in %.4fs", request_id, dim.name, elapsed)
        return out.model_dump(), raw_debug
    except Exception as exc:  # noqa: BLE001 — intentional fail-safe
        elapsed = time.perf_counter() - start
        logger.exception("[%s] Dimension failed: %s (%s)", request_id, dim.name, exc)
        return (
            DimensionOutput(
                name=dim.name,
                label="processing_failed",
                confidence=0.0,
                explanation=f"The {dim.name} dimension encountered an error during processing.",
                time=elapsed,
                error=str(exc),
            ).model_dump(),
            None,
        )


async def _run_dimensions(
    text: str,
    dimensions: List[BaseDimension],
    *,
    parallel: bool,
    request_id: str,
    debug: bool,
) -> Tuple[List[Dict[str, Any]], List[Optional[Dict[str, Any]]], float]:
    loop = asyncio.get_running_loop()
    if not dimensions:
        return [], [], 0.0

    max_workers = max(1, len(dimensions)) if parallel else 1
    t0 = time.perf_counter()

    def _run(d: BaseDimension) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
        return _safe_run_dimension(d, text, request_id, debug=debug)

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        if parallel:
            tasks = [loop.run_in_executor(pool, _run, dim) for dim in dimensions]
            pairs = await asyncio.gather(*tasks)
        else:
            pairs = []
            for dim in dimensions:
                pairs.append(await loop.run_in_executor(pool, _run, dim))

    dim_wall = time.perf_counter() - t0
    rows = [p[0] for p in pairs]
    raws = [p[1] for p in pairs]
    return rows, raws, dim_wall


async def run_analysis(
    text: str,
    request_config: AnalyzeConfig | None,
    model: str = None,
    *,
    debug: bool = False,
) -> FinalResponse:
    """
    Full pipeline: resolve config → dimensions → consistency → agent → fusion.
    """
    request_id = str(uuid.uuid4())
    t_pipeline_start = time.perf_counter()

    logger.debug("[%s] Analysis input received (length=%s) debug=%s", request_id, len(text), debug)

    engine_cfg: EngineConfig = load_engine_config(
        request_config,
        available_dimension_keys=set(DIMENSION_REGISTRY.keys()),
    )
    cache_key = response_cache.get_cache_key(text, engine_cfg.enabled_dimensions, engine_cfg.parallel)
    cached_payload = response_cache.get(cache_key)
    if cached_payload is not None:
        total_time = time.perf_counter() - t_pipeline_start
        payload = dict(cached_payload)
        payload["request_id"] = request_id
        payload["total_time"] = total_time
        payload["cached"] = True
        payload.setdefault("adjustments", [])
        errs = [d.get("error") for d in payload.get("dimensions", []) if d.get("error")]
        logger.info(
            "[%s] telemetry request_id=%s total_time=%.4fs cached=True errors=%s",
            request_id,
            request_id,
            total_time,
            errs,
        )
        return FinalResponse.model_validate(payload)

    logger.debug("[%s] Engine config: dimensions=%s parallel=%s", request_id, engine_cfg.enabled_dimensions, engine_cfg.parallel)

    dimension_instances = _instantiate_dimensions(engine_cfg.enabled_dimensions)
    dim_results, raw_snapshots, dimensions_time = await _run_dimensions(
        text,
        dimension_instances,
        parallel=engine_cfg.parallel,
        request_id=request_id,
        debug=debug,
    )

    dim_results, adjustments = apply_consistency_pass(text, dim_results)
    for d in dim_results:
        if "confidence" in d:
            d["confidence"] = normalize_conf(d.get("confidence"))

    logger.debug("[%s] Agent processing start", request_id)
    t_agent0 = time.perf_counter()
    agent_dict = await generate(dim_results, text, model=model)
    agent_time = time.perf_counter() - t_agent0
    logger.debug("[%s] Agent processing done", request_id)

    logger.debug("[%s] Fusion step start", request_id)
    t_fusion0 = time.perf_counter()
    final_text = fuse(dim_results, agent_dict)
    fusion_time = time.perf_counter() - t_fusion0
    logger.debug("[%s] Fusion step done", request_id)

    total_time = time.perf_counter() - t_pipeline_start
    dim_errors = [str(d.get("error")) for d in dim_results if d.get("error")]

    debug_payload: Optional[Dict[str, Any]] = None
    if debug:
        prompt_chars = len(str(agent_dict.get("input", "")))
        debug_payload = {
            "dimensions_raw": [r for r in raw_snapshots if r is not None],
            "agent_prompt_chars": prompt_chars,
            "execution_breakdown": {
                "dimensions_time": round(dimensions_time, 4),
                "agent_time": round(agent_time, 4),
                "fusion_time": round(fusion_time, 4),
            },
        }

    final = FinalResponse(
        request_id=request_id,
        dimensions=[DimensionOutput.model_validate(d) for d in dim_results],
        agent=dict(agent_dict),
        final_output=final_text,
        total_time=total_time,
        adjustments=adjustments,
        cached=False,
        debug=debug_payload,
    )

    try:
        response_cache.set(cache_key, final.model_dump())
    except Exception:  # noqa: BLE001
        logger.exception("[%s] cache set failed", request_id)

    logger.info(
        "[%s] telemetry request_id=%s total_time=%.4fs cached=False errors=%s",
        request_id,
        request_id,
        total_time,
        dim_errors,
    )
    logger.info("[%s] Pipeline complete in %.4fs adjustments=%s", request_id, total_time, adjustments)

    return final
