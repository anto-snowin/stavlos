"""
Configuration & Risk Parameters for the Scoring Engine.
Defines default weights, chain risk tier mappings, and bridge penalty matrices.
"""
from dataclasses import dataclass, field
from typing import Mapping


DEFAULT_CHAIN_RISK_TIERS: dict[str, float] = {
    # Tier 1: Supreme economic security / battle-tested L1
    "Ethereum": 1.00,
    # Tier 2: Established Rollups / Canonical L2s
    "Arbitrum": 0.85,
    "Optimism": 0.85,
    "Base": 0.85,
    # Tier 3: Major high-throughput L1s / Sidechains
    "Polygon": 0.70,
    "Avalanche": 0.70,
    "Solana": 0.70,
    "BSC": 0.70,
}

FALLBACK_CHAIN_RISK_SCORE = 0.45  # Tier 4: Unlisted, nascent, or high-risk chains

CANONICAL_L2_CHAINS = {"Arbitrum", "Optimism", "Base"}


@dataclass(frozen=True)
class ScoringConfig:
    """Configurable weights and thresholds for risk-adjusted scoring."""

    # Weights for sub-components (must sum to 1.0)
    tvl_weight: float = 0.25
    age_weight: float = 0.20
    volatility_weight: float = 0.20
    chain_risk_weight: float = 0.20
    bridge_weight: float = 0.15

    # Base yield blend weights (headline vs 30d mean)
    headline_yield_weight: float = 0.50
    mean_yield_weight: float = 0.50

    # Normalization bounds
    tvl_floor_usd: float = 20_000_000.0       # $20M cutoff
    tvl_anchor_usd: float = 1_000_000_000.0   # $1B institutional depth benchmark
    mature_age_days: float = 365.0            # 1 year for full maturity credit

    # Chain risk overrides
    chain_tiers: Mapping[str, float] = field(
        default_factory=lambda: DEFAULT_CHAIN_RISK_TIERS
    )
    fallback_chain_score: float = FALLBACK_CHAIN_RISK_SCORE

    # Bridging parameters
    home_chain: str = "Ethereum"
    canonical_l2_bridge_score: float = 0.90
    cross_ecosystem_bridge_score: float = 0.75
    fallback_bridge_score: float = 0.65

    def get_chain_score(self, chain: str) -> float:
        """Looks up chain risk tier score with case-insensitive matching."""
        normalized = chain.strip()
        for c, score in self.chain_tiers.items():
            if c.lower() == normalized.lower():
                return score
        return self.fallback_chain_score

    def get_bridge_score(self, target_chain: str) -> float:
        """
        Calculates bridge friction/risk factor moving from home_chain to target_chain.
        """
        if target_chain.strip().lower() == self.home_chain.strip().lower():
            return 1.00  # Zero bridge risk / no friction

        target_norm = target_chain.strip().title()
        if target_norm in CANONICAL_L2_CHAINS and self.home_chain.strip().title() == "Ethereum":
            return self.canonical_l2_bridge_score

        if target_norm in {"Solana", "Avalanche", "Polygon", "BSC"}:
            return self.cross_ecosystem_bridge_score

        return self.fallback_bridge_score
