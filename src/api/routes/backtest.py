"""
Backtest API routes.
Runs on-demand cross-chain yield strategy backtests and serves equity curves.
"""
from typing import Any
from fastapi import APIRouter, HTTPException, Query

from src.backtest.engine import BacktestEngine
from src.backtest.models import BacktestConfig
from src.cli.backtest import CORE_BACKTEST_POOLS, DEFAULT_BENCHMARK_POOL
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.get("/run")
def run_backtest_simulation(
    days: int = Query(default=180, ge=14, le=730, description="Lookback window in days"),
    rebalance_freq: int = Query(default=7, ge=1, le=60, description="Rebalance check frequency in days"),
    min_holding: int = Query(default=7, ge=1, le=60, description="Minimum holding period in days"),
    churn_penalty: float = Query(default=0.75, ge=0.0, description="Minimum APY delta (%) required to hop"),
    initial_capital: float = Query(default=100_000.0, ge=1000.0, description="Initial investment in USD"),
    per_tx_fee: float = Query(default=20.0, ge=0.0, description="Gas fee per hop ($)"),
    bridge_fee_pct: float = Query(default=0.0005, ge=0.0, description="Bridge fee/slippage (0.05%)"),
) -> dict[str, Any]:
    """
    Executes an on-demand backtest simulation comparing active risk-adjusted hopping vs. static benchmark.
    """
    repo = YieldRepository(DatabaseManager())
    records = repo.get_daily_time_series(CORE_BACKTEST_POOLS)

    if not records:
        raise HTTPException(
            status_code=404,
            detail="No historical time-series available. Please run backfill first.",
        )

    # Load metadata
    latest_snaps = repo.get_latest_snapshots()
    pools_meta = {
        s["pool_id"]: {
            "chain": s["chain"],
            "project": s["project"],
            "symbol": s["symbol"],
        }
        for s in latest_snaps
    }
    if DEFAULT_BENCHMARK_POOL not in pools_meta:
        pools_meta[DEFAULT_BENCHMARK_POOL] = {
            "chain": "Ethereum",
            "project": "aave-v3",
            "symbol": "USDC",
        }

    cfg = BacktestConfig(
        initial_capital=initial_capital,
        days=days,
        rebalance_frequency_days=rebalance_freq,
        min_holding_period_days=min_holding,
        churn_penalty_threshold=churn_penalty,
        per_tx_fee_usd=per_tx_fee,
        bridge_fee_pct=bridge_fee_pct,
        benchmark_pool_id=DEFAULT_BENCHMARK_POOL,
    )

    engine = BacktestEngine(config=cfg)
    result = engine.run_simulation(daily_records=records, pools_metadata=pools_meta)
    return result.model_dump(mode="json")
