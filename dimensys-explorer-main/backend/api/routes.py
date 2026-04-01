"""FastAPI route definitions."""

from fastapi import APIRouter, HTTPException

from backend.engine.engine import run_analysis
from backend.models.schemas import AnalyzeRequest, FinalResponse
from backend.utils.logger import get_logger

logger = get_logger("dimensys.api")

router = APIRouter()


@router.post("/analyze", response_model=FinalResponse)
async def analyze(body: AnalyzeRequest) -> FinalResponse:
    """Run multi-dimensional analysis on the given text."""
    logger.info("POST /analyze received")
    try:
        return await run_analysis(body.text, body.config, model=body.model, debug=body.debug)
    except ValueError as exc:
        logger.warning("Invalid request parameters: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid request: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Analysis failed: %s", exc)
        raise HTTPException(
            status_code=500, 
            detail="Analysis service temporarily unavailable. Please try again."
        ) from exc
