"""
Risk Scoring Engine.
Stateless computation layer that evaluates raw stablecoin yields, TVL depth,
protocol maturity, trailing 30-day APY stability, chain security tiers,
and bridging complexity to produce risk-adjusted scores and human-readable audit rationales.
"""
from datetime import datetime, timezone
import logging
import math
from typing import Any

from src.scoring.config import ScoringConfig
from src.shared_schemas.models import PoolRiskScore

logger = logging.getLogger(__name__)


class RiskScorer:
    """
    Pure computational scoring engine.
    Does not maintain database connections or network sockets.
    Can be tested and swapped in total isolation.
    """

    def __init__(self, config: ScoringConfig | None = None):
        self.config = config or ScoringConfig()

    def calculate_tvl_score(self, tvl_usd: float) -> float:
        """
        Calculates TVL depth factor on a logarithmic scale.
        Penalizes thin, manipulable pools ($20M) relative to deep institutional pools ($1B).
        Returns value in [0.10, 1.00].
        """
        if tvl_usd <= self.config.tvl_floor_usd:
            return 0.10
        if tvl_usd >= self.config.tvl_anchor_usd:
            return 1.00

        ln_val = math.log(tvl_usd)
        ln_min = math.log(self.config.tvl_floor_usd)
        ln_max = math.log(self.config.tvl_anchor_usd)

        scaled = (ln_val - ln_min) / (ln_max - ln_min)
        return max(0.10, min(1.00, round(0.10 + 0.90 * scaled, 4)))

    def calculate_age_score(self, age_days: int | float | None) -> float:
        """
        Calculates protocol maturity factor based on tracked days of operation.
        Penalizes newer, un-battle-tested pools (< 90 days) compared to 365+ days.
        Returns value in [0.20, 1.00].
        """
        if age_days is None or age_days <= 0:
            return 0.20  # Minimum floor for unrecorded/brand-new pools

        ratio = float(age_days) / self.config.mature_age_days
        return max(0.20, min(1.00, round(ratio, 4)))

    def calculate_volatility_score(
        self,
        sigma: float | None,
        apy_mean_30d: float | None,
        headline_apy: float,
    ) -> float:
        """
        Calculates yield stability factor over the trailing 30-day window.
        Penalizes erratic, spiky, or incentive-inflated rates.
        Returns value in [0.20, 1.00].
        """
        if sigma is None or math.isnan(sigma) or sigma < 0.0001:
            # If no volatility metric is recorded, assume moderate stability
            return 0.80

        reference_mean = (
            apy_mean_30d
            if (apy_mean_30d is not None and not math.isnan(apy_mean_30d) and apy_mean_30d > 0.1)
            else max(headline_apy, 1.0)
        )

        # Coefficient of Variation: sigma / reference_mean
        cv = sigma / reference_mean

        # A CV of 0.05 (5% variation) gives 0.90, CV of 0.40 gives ~0.20
        penalty_factor = 1.0 - (2.0 * cv)
        return max(0.20, min(1.00, round(penalty_factor, 4)))

    def generate_explanation(
        self,
        chain: str,
        project: str,
        symbol: str,
        headline_apy: float,
        apy_mean_30d: float,
        tvl_usd: float,
        pool_age_days: int | None,
        tvl_score: float,
        age_score: float,
        vol_score: float,
        chain_score: float,
        bridge_score: float,
        composite_score: float,
    ) -> str:
        """
        Generates a crisp, deterministic, plain-English one-line explanation of why the pool scored as it did.
        """
        strengths = []
        drags = []

        # TVL commentary
        if tvl_usd >= 500_000_000:
            strengths.append(f"deep ${tvl_usd / 1e9:.2f}B liquidity")
        elif tvl_usd >= 100_000_000:
            strengths.append(f"solid ${tvl_usd / 1e6:.0f}M TVL")
        else:
            drags.append(f"thinner liquidity (${tvl_usd / 1e6:.0f}M TVL)")

        # Age commentary
        if pool_age_days and pool_age_days >= 365:
            strengths.append(f"battle-tested ({pool_age_days}d history)")
        elif pool_age_days and pool_age_days < 90:
            drags.append(f"young pool ({pool_age_days}d)")

        # Volatility commentary
        if vol_score >= 0.85:
            strengths.append("stable 30d APY")
        elif vol_score <= 0.60:
            drags.append("elevated 30d APY volatility")

        # Chain / Bridge commentary
        if bridge_score == 1.0:
            strengths.append(f"native on {chain} (0 bridge friction)")
        else:
            drags.append(f"bridge friction to {chain} (tier score {chain_score:.2f})")

        # APY divergence note
        if headline_apy > apy_mean_30d * 1.35 and headline_apy > 5.0:
            drags.append(f"headline rate ({headline_apy:.2f}%) exceeds 30d avg ({apy_mean_30d:.2f}%)")

        pos_str = ", ".join(strengths[:2]) if strengths else "moderate fundamentals"
        neg_str = "; penalized by " + ", ".join(drags[:2]) if drags else "; minimal risk deductions"

        return f"{project.title()} {symbol} on {chain}: {pos_str}{neg_str} (Score: {composite_score:.1f}/100)."

    def score_pool(self, raw_pool_data: dict[str, Any]) -> PoolRiskScore:
        """
        Scores an individual pool record and returns a typed PoolRiskScore contract.
        """
        pool_id = str(raw_pool_data["pool_id"])
        chain = str(raw_pool_data["chain"])
        project = str(raw_pool_data["project"])
        symbol = str(raw_pool_data["symbol"]).upper()
        headline_apy = float(raw_pool_data["apy"])
        tvl_usd = float(raw_pool_data["tvl_usd"])

        # 30d mean APY fallback to headline rate if not tracked
        apy_mean_30d = (
            float(raw_pool_data["apy_mean_30d"])
            if raw_pool_data.get("apy_mean_30d") is not None
            else headline_apy
        )
        sigma = (
            float(raw_pool_data["sigma"])
            if raw_pool_data.get("sigma") is not None
            else None
        )
        age_days = (
            int(raw_pool_data["count"])
            if raw_pool_data.get("count") is not None
            else None
        )

        # 1. Base expected yield signal (blend of current headline and 30-day mean)
        base_yield = (
            self.config.headline_yield_weight * headline_apy
            + self.config.mean_yield_weight * apy_mean_30d
        )
        # Bounded floor on base yield for scoring
        effective_base_yield = max(0.1, base_yield)

        # 2. Compute 5 risk sub-factors [0.0 - 1.0]
        tvl_score = self.calculate_tvl_score(tvl_usd)
        age_score = self.calculate_age_score(age_days)
        vol_score = self.calculate_volatility_score(sigma, apy_mean_30d, headline_apy)
        chain_score = self.config.get_chain_score(chain)
        bridge_score = self.config.get_bridge_score(chain)

        # 3. Aggregate Risk Multiplier [0.0 - 1.0]
        risk_multiplier = (
            self.config.tvl_weight * tvl_score
            + self.config.age_weight * age_score
            + self.config.volatility_weight * vol_score
            + self.config.chain_risk_weight * chain_score
            + self.config.bridge_weight * bridge_score
        )
        risk_multiplier = round(max(0.05, min(1.00, risk_multiplier)), 4)

        # 4. Risk-adjusted yield and composite score (0-100 scale)
        risk_adjusted_apy = round(effective_base_yield * risk_multiplier, 4)

        # Composite score normalized so a solid 5% yield with 0.80 multiplier maps to ~40.0
        # and top yields with great risk factors approach 80-95.
        raw_composite = (effective_base_yield * 10.0) * risk_multiplier
        composite_score = round(max(0.0, min(100.0, raw_composite)), 2)

        # 5. One-line audit explanation
        explanation = self.generate_explanation(
            chain=chain,
            project=project,
            symbol=symbol,
            headline_apy=headline_apy,
            apy_mean_30d=apy_mean_30d,
            tvl_usd=tvl_usd,
            pool_age_days=age_days,
            tvl_score=tvl_score,
            age_score=age_score,
            vol_score=vol_score,
            chain_score=chain_score,
            bridge_score=bridge_score,
            composite_score=composite_score,
        )

        return PoolRiskScore(
            pool_id=pool_id,
            chain=chain,
            project=project,
            symbol=symbol,
            headline_apy=round(headline_apy, 3),
            rolling_30d_avg_apy=round(apy_mean_30d, 3),
            rolling_30d_volatility=round(sigma, 4) if sigma is not None else None,
            tvl_usd=tvl_usd,
            pool_age_days=age_days,
            tvl_score=tvl_score,
            age_score=age_score,
            volatility_score=vol_score,
            chain_risk_score=chain_score,
            bridge_score=bridge_score,
            risk_multiplier=risk_multiplier,
            composite_score=composite_score,
            risk_adjusted_apy=risk_adjusted_apy,
            explanation=explanation,
            scored_at=datetime.now(timezone.utc),
        )

    def score_pools(
        self, pools_data: list[dict[str, Any]]
    ) -> list[PoolRiskScore]:
        """
        Batch scores all pools and returns a ranked list sorted by composite_score DESC.
        """
        scores = [self.score_pool(pool) for pool in pools_data]
        scores.sort(key=lambda s: s.composite_score, reverse=True)
        return scores
