"""
Domain contracts and data models for the Backtesting Engine.
Defines simulation configurations, trade transition events, equity curves, and performance statistics.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class BacktestConfig(BaseModel):
    """Configuration parameters governing the backtesting simulation."""
    model_config = ConfigDict(frozen=True)

    initial_capital: float = Field(default=100_000.0, ge=1000.0, description="Initial investment in USD")
    days: int = Field(default=180, ge=14, le=1000, description="Historical lookback window in days")
    rebalance_frequency_days: int = Field(default=7, ge=1, le=90, description="Cadence for evaluating rebalances")
    min_holding_period_days: int = Field(default=7, ge=1, le=90, description="Lockup period before moving again")
    per_tx_fee_usd: float = Field(default=20.0, ge=0.0, description="Fixed transaction gas fee per hop")
    bridge_fee_pct: float = Field(default=0.0005, ge=0.0, le=0.05, description="Variable bridge fee/slippage (0.05%)")
    churn_penalty_threshold: float = Field(default=0.75, ge=0.0, description="Minimum APY delta (%) required to hop")
    benchmark_pool_id: str = Field(
        default="aa70268e-4b52-42bf-a116-608b370f9501",
        description="Blue-chip benchmark pool (default: Aave v3 USDC Ethereum)"
    )


class TradeHopEvent(BaseModel):
    """Represents a simulated capital reallocation between protocols/chains."""
    model_config = ConfigDict(frozen=True)

    date: str
    day_index: int
    from_pool_id: str
    to_pool_id: str
    from_protocol: str
    to_protocol: str
    from_chain: str
    to_chain: str
    fee_usd: float
    old_apy: float
    new_apy: float
    apy_delta: float
    capital_before: float
    capital_after: float


class DailyEquityPoint(BaseModel):
    """Daily time-series observation of portfolio value, benchmark value, and drawdown."""
    model_config = ConfigDict(frozen=True)

    date: str
    day_index: int
    strategy_equity: float
    benchmark_equity: float
    strategy_daily_return: float
    benchmark_daily_return: float
    active_pool_id: str
    active_protocol: str
    active_chain: str
    active_apy: float
    benchmark_apy: float
    strategy_drawdown_pct: float
    benchmark_drawdown_pct: float


class BacktestMetrics(BaseModel):
    """Quantitative performance and risk profile."""
    model_config = ConfigDict(frozen=True)

    initial_equity: float
    final_equity: float
    total_return_pct: float
    cagr_pct: float
    annualized_volatility_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown_pct: float
    max_drawdown_duration_days: int
    worst_daily_return_pct: float
    total_hops: int
    total_fees_usd: float


class BacktestResult(BaseModel):
    """Complete deliverable from a backtest execution."""
    model_config = ConfigDict(frozen=True)

    config: BacktestConfig
    start_date: str
    end_date: str
    total_days: int
    strategy_metrics: BacktestMetrics
    benchmark_metrics: BacktestMetrics
    net_alpha_pct: float
    net_profit_difference_usd: float
    equity_curve: list[DailyEquityPoint]
    trade_log: list[TradeHopEvent]
    thesis_validated: bool
    summary_verdict: str
