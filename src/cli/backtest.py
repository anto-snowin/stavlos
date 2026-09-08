"""
Standalone Backtest Runner CLI.
Simulates cross-chain stablecoin yield hopping strategies against passive holding.
Evaluates net returns after realistic gas, bridge friction, minimum holding periods, and churn hurdles.

Usage:
    python -m src.cli.backtest
    python -m src.cli.backtest --days 180 --rebalance-freq 7 --min-holding 7 --churn-penalty 0.75
    python -m src.cli.backtest --sync-history
"""
import argparse
from datetime import datetime, timezone, timedelta
import json
import logging
from pathlib import Path
import sys

from src.backtest.engine import BacktestEngine
from src.backtest.models import BacktestConfig
from src.backtest.visualizer import (
    format_comparison_report,
    format_trade_log,
    generate_ascii_equity_chart,
)
from src.config import config
from src.ingestion.client import DeFiLlamaClient
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository

logger = logging.getLogger("backtest_cli")

# Benchmark pool: Aave v3 USDC on Ethereum
DEFAULT_BENCHMARK_POOL = "aa70268e-4b52-42bf-a116-608b370f9501"

# Representative high-liquidity pools across chains for historical backfill
CORE_BACKTEST_POOLS = [
    "aa70268e-4b52-42bf-a116-608b370f9501",  # Aave v3 USDC (Ethereum) [Benchmark]
    "d9fa8e14-0447-4207-9ae8-7810199dfa1f",  # Aave v3 USDC (Arbitrum)
    "7da72d09-56ca-4ec5-a45f-59114353e487",  # Compound v3 USDC (Ethereum)
    "54e9b138-3146-4c1f-8dce-1cb948f5ef96",  # Sparklend USDS (Ethereum)
    "43641cf5-a92e-416b-bce9-27113d3c0db6",  # Maple USDC (Ethereum)
    "8edfdf02-cdbb-43f7-bca6-954e5fe56813",  # Maple USDT (Ethereum)
    "a5d67f7e-5b51-4a9d-969d-caf051a7f5a4",  # Spark Savings USDT (Ethereum)
    "c5c74dd1-995c-4445-9d84-3e710bad7d52",  # Spark Savings USDC (Ethereum)
    "d783c8df-e2ed-44b4-8317-161ccc1b5f06",  # Jupiter Lend USDC (Solana)
]


def sync_historical_pool_data(repository: YieldRepository, pool_ids: list[str]) -> int:
    """Fetches and caches daily historical charts for the target pool universe."""
    client = DeFiLlamaClient()
    total_points = 0
    print(f"[*] Syncing historical daily data from DeFiLlama for {len(pool_ids)} pools...")

    for pid in pool_ids:
        try:
            chart_data = client.fetch_pool_chart_sync(pid)
            if chart_data:
                saved = repository.backfill_historical_chart_data(pid, chart_data)
                total_points += saved
                print(f"  - Pool {pid[:8]}... : synced {saved} daily snapshots.")
        except Exception as e:
            print(f"  ! Warning: could not sync history for pool {pid[:8]}: {e}")

    print(f"[+] Historical sync complete: {total_points} daily observations stored.\n")
    return total_points


def run_backtest_cli(
    db_path: Path | str | None = None,
    days: int = 180,
    initial_capital: float = 100_000.0,
    rebalance_freq: int = 7,
    min_holding: int = 7,
    per_tx_fee: float = 20.0,
    bridge_fee_pct: float = 0.0005,
    churn_penalty: float = 0.75,
    benchmark_pool_id: str = DEFAULT_BENCHMARK_POOL,
    sync_history: bool = False,
    output_json: bool = False,
    save_csv: str | None = None,
) -> int:
    """Main execution workflow for backtesting."""
    target_db = Path(db_path) if db_path else config.default_db_path
    db_manager = DatabaseManager(db_path=target_db)
    db_manager.initialize_schema()
    repository = YieldRepository(db_manager)

    # Check if historical data exists or sync is requested
    if sync_history:
        sync_historical_pool_data(repository, CORE_BACKTEST_POOLS)

    # Check available date range for core pools
    records = repository.get_daily_time_series(CORE_BACKTEST_POOLS)
    if len(records) < 30:
        print("[*] Local database has insufficient daily history. Running initial historical sync...")
        sync_historical_pool_data(repository, CORE_BACKTEST_POOLS)
        records = repository.get_daily_time_series(CORE_BACKTEST_POOLS)

    if not records:
        print("Error: No historical records available to run backtest.", file=sys.stderr)
        return 1

    # Load pool metadata
    latest_snaps = repository.get_latest_snapshots()
    pools_meta = {
        s["pool_id"]: {
            "chain": s["chain"],
            "project": s["project"],
            "symbol": s["symbol"],
        }
        for s in latest_snaps
    }

    # Ensure benchmark pool is mapped
    if benchmark_pool_id not in pools_meta:
        pools_meta[benchmark_pool_id] = {
            "chain": "Ethereum",
            "project": "aave-v3",
            "symbol": "USDC",
        }

    backtest_config = BacktestConfig(
        initial_capital=initial_capital,
        days=days,
        rebalance_frequency_days=rebalance_freq,
        min_holding_period_days=min_holding,
        per_tx_fee_usd=per_tx_fee,
        bridge_fee_pct=bridge_fee_pct,
        churn_penalty_threshold=churn_penalty,
        benchmark_pool_id=benchmark_pool_id,
    )

    engine = BacktestEngine(config=backtest_config)
    result = engine.run_simulation(daily_records=records, pools_metadata=pools_meta)

    if output_json:
        print(result.model_dump_json(indent=2))
        return 0

    # Save CSV if requested
    if save_csv:
        csv_path = Path(save_csv)
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("date,day_index,strategy_equity,benchmark_equity,active_protocol,active_chain,active_apy,benchmark_apy\n")
            for p in result.equity_curve:
                f.write(
                    f"{p.date},{p.day_index},{p.strategy_equity},{p.benchmark_equity},"
                    f"{p.active_protocol},{p.active_chain},{p.active_apy},{p.benchmark_apy}\n"
                )
        print(f"[*] Exported equity curve to {csv_path}")

    # Display Report
    print("\n" + "=" * 105)
    print(f" BACKTEST SIMULATION REPORT: {result.total_days} DAYS ({result.start_date} -> {result.end_date})")
    print(f" Initial Capital: ${result.config.initial_capital:,.2f} | Rebalance: Every {result.config.rebalance_frequency_days}d | Lockup: {result.config.min_holding_period_days}d | Churn Hurdle: +{result.config.churn_penalty_threshold:.2f}%")
    print("=" * 105)

    print("\n--- 1. EQUITY CURVE (Strategy [*] vs Benchmark [.]) ---")
    print(generate_ascii_equity_chart(result.equity_curve))

    print("\n--- 2. PERFORMANCE & RISK SUMMARY ---")
    print(format_comparison_report(result))

    print("\n--- 3. TRADE REALLOCATION LOG ---")
    print(format_trade_log(result.trade_log))

    print("\n--- 4. CORE THESIS VERDICT ---")
    print(f">> {result.summary_verdict}\n")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cross-Chain Stablecoin Yield Optimizer — Backtesting Engine"
    )
    parser.add_argument("--days", type=int, default=180, help="Lookback days for simulation (default: 180)")
    parser.add_argument("--initial-capital", type=float, default=100000.0, help="Initial capital in USD (default: 100000.0)")
    parser.add_argument("--rebalance-freq", type=int, default=7, help="Rebalance check frequency in days (default: 7)")
    parser.add_argument("--min-holding", type=int, default=7, help="Minimum days in a pool before hopping (default: 7)")
    parser.add_argument("--per-tx-fee", type=float, default=20.0, help="Fixed transaction gas fee in USD (default: 20.0)")
    parser.add_argument("--bridge-fee-pct", type=float, default=0.0005, help="Bridge fee/slippage fraction (default: 0.0005)")
    parser.add_argument("--churn-penalty", type=float, default=0.75, help="Min APY delta %% required to hop (default: 0.75)")
    parser.add_argument("--benchmark-pool", type=str, default=DEFAULT_BENCHMARK_POOL, help="Benchmark pool ID")
    parser.add_argument("--db-path", type=str, default=str(config.default_db_path), help="Path to SQLite database")
    parser.add_argument("--sync-history", action="store_true", help="Sync multi-month historical data from DeFiLlama first")
    parser.add_argument("--json", action="store_true", help="Output full result as JSON")
    parser.add_argument("--save-csv", type=str, default=None, help="File path to save daily equity curve CSV")

    args = parser.parse_args()
    return run_backtest_cli(
        db_path=args.db_path,
        days=args.days,
        initial_capital=args.initial_capital,
        rebalance_freq=args.rebalance_freq,
        min_holding=args.min_holding,
        per_tx_fee=args.per_tx_fee,
        bridge_fee_pct=args.bridge_fee_pct,
        churn_penalty=args.churn_penalty,
        benchmark_pool_id=args.benchmark_pool,
        sync_history=args.sync_history,
        output_json=args.json,
        save_csv=args.save_csv,
    )


if __name__ == "__main__":
    sys.exit(main())
