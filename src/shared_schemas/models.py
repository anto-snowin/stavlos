"""
Domain models and validation schemas for Cross-Chain Stablecoin Yield Optimizer.
Enforces strict contracts between Ingestion, Normalizer, Storage, and Scoring layers.
"""
from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class RawPoolRecord(BaseModel):
    """Raw record structure from external DeFiLlama yields API."""
    model_config = ConfigDict(extra="ignore")

    pool: str = Field(..., description="Unique pool UUID")
    chain: str = Field(..., description="Blockchain name")
    project: str = Field(..., description="Protocol/project identifier")
    symbol: str = Field(..., description="Asset symbol or pool ticker")
    tvlUsd: float | None = Field(default=None, description="Total Value Locked in USD")
    apy: float | None = Field(default=None, description="Current total net APY (%)")
    apyBase: float | None = Field(default=None, description="Base lending yield (%)")
    apyReward: float | None = Field(default=None, description="Incentive reward yield (%)")
    rewardTokens: list[str] | None = Field(default=None)
    underlyingTokens: list[str] | None = Field(default=None)
    poolMeta: str | None = Field(default=None)
    ilRisk: str | None = Field(default="no")
    exposure: str | None = Field(default="single")
    mu: float | None = Field(default=None)
    sigma: float | None = Field(default=None)
    count: int | None = Field(default=None)
    outlier: bool | None = Field(default=False)
    apyPct1D: float | None = Field(default=None)
    apyPct7D: float | None = Field(default=None)
    apyPct30D: float | None = Field(default=None)
    apyMean30d: float | None = Field(default=None)


class NormalizedPool(BaseModel):
    """
    Normalized static/slowly-changing pool dimension.
    Identified uniquely by `pool_id`.
    """
    model_config = ConfigDict(frozen=True)

    pool_id: str = Field(..., description="Canonical pool UUID")
    chain: str = Field(..., description="Standardized chain name")
    project: str = Field(..., description="Standardized protocol name")
    symbol: str = Field(..., description="Normalized uppercase stablecoin symbol")
    underlying_tokens: list[str] = Field(default_factory=list)
    pool_meta: str | None = Field(default=None)
    exposure: str = Field(default="single")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("symbol", mode="before")
    @classmethod
    def uppercase_symbol(cls, v: Any) -> str:
        return str(v).strip().upper() if v else ""


class NormalizedSnapshot(BaseModel):
    """
    Time-series snapshot representing pool state at a specific point in time.
    Idempotent key: (pool_id, timestamp).
    """
    model_config = ConfigDict(frozen=True)

    pool_id: str = Field(..., description="Foreign key to NormalizedPool")
    timestamp: datetime = Field(..., description="Snapshot UTC timestamp")
    tvl_usd: float = Field(..., ge=0.0, description="TVL in USD")
    apy: float = Field(..., description="Net APY in percentage")
    apy_base: float | None = Field(default=None)
    apy_reward: float | None = Field(default=None)
    il_risk: str = Field(default="no")
    mu: float | None = Field(default=None)
    sigma: float | None = Field(default=None)
    count: int | None = Field(default=None, description="Days of historical tracking / age in days")
    apy_pct_1d: float | None = Field(default=None)
    apy_pct_7d: float | None = Field(default=None)
    apy_pct_30d: float | None = Field(default=None)
    apy_mean_30d: float | None = Field(default=None)


class PoolRiskScore(BaseModel):
    """
    Evaluated risk-adjusted score and breakdown for a stablecoin pool.
    Pure output of the Risk Scoring Engine.
    """
    model_config = ConfigDict(frozen=True)

    pool_id: str = Field(..., description="Canonical pool UUID")
    chain: str = Field(..., description="Blockchain name")
    project: str = Field(..., description="Protocol/project name")
    symbol: str = Field(..., description="Stablecoin symbol")
    headline_apy: float = Field(..., description="Current net headline APY (%)")
    rolling_30d_avg_apy: float = Field(..., description="Trailing 30-day average APY (%)")
    rolling_30d_volatility: float | None = Field(default=None, description="Trailing 30-day sigma/volatility")
    tvl_usd: float = Field(..., ge=0.0, description="Total Value Locked in USD")
    pool_age_days: int | None = Field(default=None, description="Age in days from observation count")

    # Risk sub-components [0.0 - 1.0]
    tvl_score: float = Field(..., ge=0.0, le=1.0, description="TVL depth factor")
    age_score: float = Field(..., ge=0.0, le=1.0, description="Protocol/pool maturity factor")
    volatility_score: float = Field(..., ge=0.0, le=1.0, description="Yield stability factor")
    chain_risk_score: float = Field(..., ge=0.0, le=1.0, description="Chain consensus & security factor")
    bridge_score: float = Field(..., ge=0.0, le=1.0, description="Bridge friction/risk factor from home chain")

    # Composite metrics
    risk_multiplier: float = Field(..., ge=0.0, le=1.0, description="Aggregate risk weight (0.0-1.0)")
    composite_score: float = Field(..., ge=0.0, le=100.0, description="Composite risk-adjusted score (0-100)")
    risk_adjusted_apy: float = Field(..., description="Risk-adjusted expected yield (%)")
    explanation: str = Field(..., description="Deterministic plain-English rationale")
    scored_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IngestionRunSummary(BaseModel):
    """Audit summary of an ingestion cycle."""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_raw_records: int
    matched_stablecoin_records: int
    persisted_pools: int
    persisted_snapshots: int
    min_tvl_threshold: float
    duration_seconds: float
    success: bool
    error_message: str | None = None

