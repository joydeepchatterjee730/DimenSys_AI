"""DimenSys AI — FastAPI application entrypoint."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.utils.logger import get_logger

# Load .env from project root (parent of backend/) or CWD
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)
load_dotenv()

logger = get_logger("dimensys.main")

app = FastAPI(
    title="DimenSys AI",
    description="Modular multi-dimensional AI reasoning API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:60271",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("DimenSys AI backend starting")
