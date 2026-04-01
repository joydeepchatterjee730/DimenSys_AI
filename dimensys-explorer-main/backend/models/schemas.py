"""Request and response schemas for the DimenSys AI API."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AnalyzeConfig(BaseModel):
    """Per-request analysis configuration."""

    dimensions: List[str] = Field(
        default_factory=lambda: ["sentiment", "intent", "risk", "semantic"],
        description="Dimension names to run (subset of registry keys).",
    )
    parallel: bool = Field(default=True, description="Run dimensions in parallel when True.")
    fusion_strategy: str = Field(default="weighted", description="Fusion strategy: weighted, attention, hierarchical, ensemble.")


class AnalyzeRequest(BaseModel):
    """POST /analyze request body."""

    text: str = Field(..., min_length=1, description="User input text.")
    config: Optional[AnalyzeConfig] = Field(default=None)
    model: Optional[str] = Field(default=None, description="NVIDIA model to use for agent processing.")
    debug: bool = Field(default=False, description="Include debug timings and raw dimension outputs.")


class DimensionOutput(BaseModel):
    """Structured output from a single dimension processor."""

    name: str
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    time: float = Field(..., description="Execution time in seconds.")
    error: Optional[str] = Field(default=None, description="Set if processing failed.")


class AgentOutput(BaseModel):
    """Agent payload (also accepted as a plain dict on responses)."""

    input: str
    response: str


class FinalResponse(BaseModel):
    """Complete API response for /analyze."""

    request_id: str = Field(..., description="Unique id for this analysis run.")
    dimensions: List[DimensionOutput]
    agent: Dict[str, Any] = Field(
        ...,
        description="Agent result, typically keys input and response.",
    )
    final_output: str
    total_time: float = Field(..., description="End-to-end pipeline time in seconds.")
    adjustments: List[str] = Field(
        default_factory=list,
        description="Consistency rules applied after dimension extraction.",
    )
    cached: bool = Field(default=False, description="True if served from in-memory cache.")
    debug: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Present when request.debug=true.",
    )
