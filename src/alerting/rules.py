"""
Alerting Rule Evaluator.
Detects TVL contractions, APY spikes, and risk-adjusted score threshold transitions.
"""
from datetime import datetime, timezone
import logging
from typing import Any

from src.alerting.models import (
    AlertEvent,
    AlertRuleConfig,
    AlertSeverity,
    AlertTriggerType,
)

logger = logging.getLogger(__name__)


class AlertRuleEvaluator:
    """
    Stateless evaluator comparing current pool metrics against historical baseline or fixed thresholds.
    """

    def __init__(self, config: AlertRuleConfig | None = None):
        self.config = config or AlertRuleConfig()

    def evaluate(
        self,
        current: dict[str, Any],
        previous: dict[str, Any] | None = None,
        composite_score: float | None = None,
    ) -> list[AlertEvent]:
        """
        Evaluates a pool for risk anomalies and threshold events.
        """
        events: list[AlertEvent] = []
        pool_id = str(current["pool_id"])
        project = str(current.get("project", "protocol")).title()
        symbol = str(current.get("symbol", "USDC")).upper()
        chain = str(current.get("chain", "Ethereum"))
        curr_tvl = float(current.get("tvl_usd") or 0.0)
        curr_apy = float(current.get("apy") or 0.0)

        # 1. TVL Contraction Check (Exploit / Bank-Run / Depeg Indicator)
        if previous and previous.get("tvl_usd"):
            prev_tvl = float(previous["tvl_usd"])
            if prev_tvl > 0:
                tvl_delta_pct = ((curr_tvl - prev_tvl) / prev_tvl) * 100.0
                if tvl_delta_pct <= -self.config.tvl_drop_pct_threshold:
                    events.append(
                        AlertEvent(
                            pool_id=pool_id,
                            project=project,
                            symbol=symbol,
                            chain=chain,
                            trigger_type=AlertTriggerType.TVL_CONTRACTION,
                            severity=AlertSeverity.CRITICAL,
                            title=f"CRITICAL TVL DRAIN: {project} {symbol} ({chain})",
                            message=(
                                f"Liquidity contracted by {tvl_delta_pct:.1f}% (${prev_tvl/1e6:.1f}M -> "
                                f"${curr_tvl/1e6:.1f}M). Early exploit or depeg liquidity drain warning."
                            ),
                            metrics={
                                "previous_tvl_usd": prev_tvl,
                                "current_tvl_usd": curr_tvl,
                                "tvl_delta_pct": round(tvl_delta_pct, 2),
                            },
                        )
                    )

        # 2. APY Spike Check (Reserve Depletion / Liquidity Squeeze Indicator)
        if previous and previous.get("apy") is not None:
            prev_apy = float(previous["apy"])
            apy_delta_abs = curr_apy - prev_apy
            apy_delta_rel = (apy_delta_abs / max(prev_apy, 0.5)) if prev_apy > 0 else 0.0

            if (
                apy_delta_abs >= self.config.apy_spike_abs_threshold
                or apy_delta_rel >= self.config.apy_spike_rel_threshold
            ):
                events.append(
                    AlertEvent(
                        pool_id=pool_id,
                        project=project,
                        symbol=symbol,
                        chain=chain,
                        trigger_type=AlertTriggerType.APY_SPIKE,
                        severity=AlertSeverity.WARNING,
                        title=f"SUDDEN APY SURGE: {project} {symbol} ({chain})",
                        message=(
                            f"Lending rate surged by +{apy_delta_abs:.2f}% ({prev_apy:.2f}% -> "
                            f"{curr_apy:.2f}%). Potential reserve depletion or incentive inflation trap."
                        ),
                        metrics={
                            "previous_apy": prev_apy,
                            "current_apy": curr_apy,
                            "apy_delta_abs": round(apy_delta_abs, 2),
                            "apy_delta_rel": round(apy_delta_rel * 100.0, 1),
                        },
                    )
                )

        # 3. Composite Score Floor Breach (Risk Quality Deterioration)
        if composite_score is not None:
            if composite_score < self.config.score_floor_threshold:
                events.append(
                    AlertEvent(
                        pool_id=pool_id,
                        project=project,
                        symbol=symbol,
                        chain=chain,
                        trigger_type=AlertTriggerType.SCORE_DROP,
                        severity=AlertSeverity.WARNING,
                        title=f"RISK GRADE DEGRADED: {project} {symbol} ({chain})",
                        message=(
                            f"Risk-adjusted score dropped to {composite_score:.1f}/100 "
                            f"(below safety threshold of {self.config.score_floor_threshold:.1f})."
                        ),
                        metrics={"composite_score": composite_score},
                    )
                )
            elif composite_score >= self.config.score_target_threshold:
                events.append(
                    AlertEvent(
                        pool_id=pool_id,
                        project=project,
                        symbol=symbol,
                        chain=chain,
                        trigger_type=AlertTriggerType.SCORE_SURGE,
                        severity=AlertSeverity.INFO,
                        title=f"TOP OPPORTUNITY SURGE: {project} {symbol} ({chain})",
                        message=(
                            f"Risk-adjusted score reached {composite_score:.1f}/100 "
                            f"(exceeds target threshold of {self.config.score_target_threshold:.1f})."
                        ),
                        metrics={"composite_score": composite_score},
                    )
                )

        return events
