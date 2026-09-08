"""
Unit tests for the Backtesting Engine.
Verifies holding period constraints, churn hurdle rates, fee deduction accuracy,
compounding returns, and quantitative risk metrics.
"""
from datetime import datetime, timedelta
import pytest

from src.backtest.engine import BacktestEngine
from src.backtest.models import BacktestConfig


@pytest.fixture
def sample_pools_metadata():
    return {
        "p-aave": {"chain": "Ethereum", "project": "aave-v3", "symbol": "USDC"},
        "p-comp": {"chain": "Ethereum", "project": "compound-v3", "symbol": "USDC"},
        "p-sol": {"chain": "Solana", "project": "jupiter-lend", "symbol": "USDC"},
    }


def generate_synthetic_records(
    days: int,
    aave_apy: float = 4.0,
    comp_apy: float = 4.5,
    sol_apy: float = 8.0,
) -> list[dict]:
    """Generates synthetic daily time series for testing."""
    records = []
    base_date = datetime(2026, 1, 1)

    for i in range(days):
        dt_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%dT00:00:00+00:00")
        records.extend([
            {"timestamp": dt_str, "pool_id": "p-aave", "apy": aave_apy, "tvl_usd": 150_000_000.0},
            {"timestamp": dt_str, "pool_id": "p-comp", "apy": comp_apy, "tvl_usd": 80_000_000.0},
            {"timestamp": dt_str, "pool_id": "p-sol", "apy": sol_apy, "tvl_usd": 100_000_000.0},
        ])
    return records


def test_churn_penalty_prevents_low_delta_moves(sample_pools_metadata):
    # Comp is 4.5% vs Aave 4.0% (delta = +0.5%). Hurdle is 1.0% -> Should NOT move
    cfg = BacktestConfig(
        initial_capital=100_000.0,
        days=30,
        rebalance_frequency_days=7,
        min_holding_period_days=7,
        churn_penalty_threshold=1.0,  # Hurdle 1.0%
        benchmark_pool_id="p-aave",
    )
    engine = BacktestEngine(config=cfg)
    records = generate_synthetic_records(30, aave_apy=4.0, comp_apy=4.5, sol_apy=4.2)
    result = engine.run_simulation(records, sample_pools_metadata)

    # Because comp only beats aave by 0.5% (less than 1.0% hurdle), 0 hops should occur
    assert result.strategy_metrics.total_hops == 0
    assert len(result.trade_log) == 0


def test_hops_occur_when_hurdle_is_exceeded(sample_pools_metadata):
    # Solana pool offers 8.0% vs Aave 4.0% (delta = +4.0%). Hurdle is 1.0% -> Should hop
    cfg = BacktestConfig(
        initial_capital=100_000.0,
        days=30,
        rebalance_frequency_days=7,
        min_holding_period_days=7,
        churn_penalty_threshold=1.0,
        per_tx_fee_usd=15.0,
        bridge_fee_pct=0.0005,
        benchmark_pool_id="p-aave",
    )
    engine = BacktestEngine(config=cfg)
    records = generate_synthetic_records(30, aave_apy=4.0, comp_apy=4.2, sol_apy=8.0)
    result = engine.run_simulation(records, sample_pools_metadata)

    # Should execute at least 1 hop to high-yield Solana pool
    assert result.strategy_metrics.total_hops >= 1
    assert result.strategy_metrics.total_fees_usd > 0.0
    first_hop = result.trade_log[0]
    assert first_hop.to_pool_id == "p-sol"
    assert first_hop.new_apy > first_hop.old_apy


def test_min_holding_period_enforces_lockup(sample_pools_metadata):
    # Daily rebalance checks (freq=1), but min holding period is 14 days
    cfg = BacktestConfig(
        initial_capital=100_000.0,
        days=20,
        rebalance_frequency_days=1,
        min_holding_period_days=14,
        churn_penalty_threshold=0.5,
        benchmark_pool_id="p-aave",
    )
    engine = BacktestEngine(config=cfg)
    records = generate_synthetic_records(20, aave_apy=4.0, comp_apy=6.0, sol_apy=9.0)
    result = engine.run_simulation(records, sample_pools_metadata)

    # In 20 days with 14-day lockup, at most 1 hop can occur
    assert result.strategy_metrics.total_hops <= 1


def test_fee_deduction_accuracy(sample_pools_metadata):
    cfg = BacktestConfig(
        initial_capital=100_000.0,
        days=15,
        rebalance_frequency_days=7,
        min_holding_period_days=7,
        per_tx_fee_usd=25.0,
        bridge_fee_pct=0.001,  # 0.10% = $100 on $100k
        churn_penalty_threshold=0.5,
        benchmark_pool_id="p-aave",
    )
    engine = BacktestEngine(config=cfg)
    records = generate_synthetic_records(15, aave_apy=4.0, comp_apy=4.0, sol_apy=9.0)
    result = engine.run_simulation(records, sample_pools_metadata)

    if result.trade_log:
        trade = result.trade_log[0]
        # Cross-chain from Ethereum to Solana incurs $25 gas + 0.1% bridge fee
        expected_fee = 25.0 + (0.001 * trade.capital_before)
        assert abs(trade.fee_usd - expected_fee) < 1.0


def test_equity_curve_and_metrics_consistency(sample_pools_metadata):
    cfg = BacktestConfig(
        initial_capital=50_000.0,
        days=60,
        rebalance_frequency_days=7,
        benchmark_pool_id="p-aave",
    )
    engine = BacktestEngine(config=cfg)
    records = generate_synthetic_records(60, aave_apy=5.0, comp_apy=5.0, sol_apy=5.0)
    result = engine.run_simulation(records, sample_pools_metadata)

    assert len(result.equity_curve) == 60
    assert result.strategy_metrics.initial_equity == 50_000.0
    assert result.strategy_metrics.final_equity > 50_000.0
    assert result.strategy_metrics.total_return_pct > 0.0
    assert result.strategy_metrics.sharpe_ratio is not None
    assert result.strategy_metrics.max_drawdown_pct >= 0.0
