"""
FastAPI Analytical Gateway Main Entrypoint.
Provides read-only access to stablecoin yield rankings, time-series, and backtesting simulations.
Enforces architectural non-execution constraints (no wallet connection, no transaction signing).
"""
from datetime import datetime, timezone
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import backtest, pools
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_gateway")

app = FastAPI(
    title="Cross-Chain Stablecoin Yield Optimizer API",
    description=(
        "Institutional-grade read-only REST API for tracking, risk-scoring, "
        "and simulating cross-chain stablecoin lending yields. "
        "Strictly advisory and simulation-only (no execution capability)."
    ),
    version="1.0.0",
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Mount Route Handlers under /api/v1
app.include_router(pools.router, prefix="/api/v1")
app.include_router(backtest.router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["system"])
def health_check() -> dict:
    """Returns system status, active database counts, and latest data timestamp."""
    try:
        repo = YieldRepository(DatabaseManager())
        pool_count = repo.get_pool_count()
        snap_count = repo.get_snapshot_count()
        latest_snaps = repo.get_latest_snapshots()
        latest_ts = latest_snaps[0]["timestamp"] if latest_snaps else None

        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": "production-simulation",
            "execution_capability": "none (strictly read-only)",
            "monitored_pools": pool_count,
            "historical_snapshots": snap_count,
            "latest_data_point": latest_ts,
        }
    except Exception as e:
        logger.error("Health check error: %s", e)
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@app.get("/", tags=["system"])
def root_info() -> dict:
    return {
        "project": "Cross-Chain Stablecoin Yield Optimizer",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
        "health": "/api/v1/health",
        "ranked_pools": "/api/v1/pools/ranked",
        "backtest_run": "/api/v1/backtest/run",
        "disclaimer": "Informational and simulation only. No live fund movement.",
    }
