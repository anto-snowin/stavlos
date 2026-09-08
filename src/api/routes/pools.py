"""
Pools API routes.
Serves current ranked risk-adjusted pools and historical APY trend series.
"""
from typing import Any
from fastapi import APIRouter, HTTPException, Query

from src.scoring.config import ScoringConfig
from src.scoring.engine import RiskScorer
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository

router = APIRouter(prefix="/pools", tags=["pools"])


@router.get("/ranked")
def get_ranked_pools(
    chain: str | None = Query(default=None, description="Filter by canonical blockchain name"),
    symbol: str | None = Query(default=None, description="Filter by stablecoin symbol (e.g. USDC, USDT, DAI)"),
    min_tvl: float = Query(default=20_000_000.0, description="Minimum TVL in USD"),
    home_chain: str = Query(default="Ethereum", description="Home chain for bridging friction"),
    limit: int = Query(default=50, ge=1, le=200, description="Max records to return"),
) -> list[dict[str, Any]]:
    """
    Retrieves latest stablecoin pool snapshots ranked by composite risk score.
    """
    repo = YieldRepository(DatabaseManager())
    snapshots = repo.get_latest_snapshots()
    if not snapshots:
        raise HTTPException(status_code=404, detail="No pool snapshots available in database.")

    # Filter candidates
    filtered = []
    for s in snapshots:
        if s.get("tvl_usd", 0) < min_tvl:
            continue
        if chain and s.get("chain", "").lower() != chain.lower():
            continue
        if symbol and s.get("symbol", "").upper() != symbol.upper():
            continue
        filtered.append(s)

    scorer = RiskScorer(config=ScoringConfig(home_chain=home_chain))
    ranked = scorer.score_pools(filtered)
    return [score.model_dump(mode="json") for score in ranked[:limit]]


@router.get("/historical")
def get_historical_trends(
    days: int = Query(default=90, ge=14, le=730, description="Lookback days"),
) -> list[dict[str, Any]]:
    """
    Returns time-series APY data aggregated across major pools for trendline charting.
    """
    repo = YieldRepository(DatabaseManager())
    core_pools = [
        "aa70268e-4b52-42bf-a116-608b370f9501",  # Aave v3 USDC (Ethereum)
        "d9fa8e14-0447-4207-9ae8-7810199dfa1f",  # Aave v3 USDC (Arbitrum)
        "7da72d09-56ca-4ec5-a45f-59114353e487",  # Compound v3 USDC (Ethereum)
        "43641cf5-a92e-416b-bce9-27113d3c0db6",  # Maple USDC (Ethereum)
        "d783c8df-e2ed-44b4-8317-161ccc1b5f06",  # Jupiter Lend USDC (Solana)
        "54e9b138-3146-4c1f-8dce-1cb948f5ef96",  # Sparklend USDS (Ethereum)
    ]
    records = repo.get_daily_time_series(core_pools)
    if not records:
        return []

    # Group by date for multi-series chart compatibility
    date_map: dict[str, dict[str, Any]] = {}
    for r in records:
        d = str(r["timestamp"])[:10]
        if d not in date_map:
            date_map[d] = {"date": d}
        key = f"{r['project']}_{r['symbol']}_{r['chain']}"
        date_map[d][key] = round(float(r["apy"]), 2)

    sorted_dates = sorted(date_map.keys())
    if len(sorted_dates) > days:
        sorted_dates = sorted_dates[-days:]

    return [date_map[d] for d in sorted_dates]
