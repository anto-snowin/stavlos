"""
Alerting Service.
Coordinates anomaly evaluation across monitored stablecoin pools and manages notification dispatching.
"""
from datetime import datetime, timezone
import logging
from typing import Any

from src.alerting.dispatchers import (
    BaseDispatcher,
    ConsoleDispatcher,
    DatabaseDispatcher,
    WebhookDispatcher,
)
from src.alerting.models import AlertEvent, AlertRuleConfig
from src.alerting.rules import AlertRuleEvaluator
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository

logger = logging.getLogger(__name__)


class AlertService:
    """
    Main alerting service managing rule evaluations and notification dispatching.
    """

    def __init__(
        self,
        config: AlertRuleConfig | None = None,
        dispatchers: list[BaseDispatcher] | None = None,
        repository: YieldRepository | None = None,
    ):
        self.config = config or AlertRuleConfig()
        self.evaluator = AlertRuleEvaluator(config=self.config)
        self.repo = repository or YieldRepository(DatabaseManager())

        if dispatchers is not None:
            self.dispatchers = dispatchers
        else:
            self.dispatchers = [
                ConsoleDispatcher(),
                DatabaseDispatcher(self.repo),
            ]
            if self.config.webhook_url:
                self.dispatchers.append(WebhookDispatcher(self.config.webhook_url))

    def evaluate_and_dispatch(
        self,
        current_pools: list[dict[str, Any]],
        previous_pools_map: dict[str, dict[str, Any]] | None = None,
        scores_map: dict[str, float] | None = None,
    ) -> list[AlertEvent]:
        """
        Evaluates current pool records against historical baseline and dispatches any detected events.
        """
        all_events: list[AlertEvent] = []
        prev_map = previous_pools_map or {}
        sc_map = scores_map or {}

        for pool in current_pools:
            pid = str(pool["pool_id"])
            # If explicit watched pools are configured, filter to them
            if self.config.watched_pools and pid not in self.config.watched_pools:
                continue

            prev_record = prev_map.get(pid)
            comp_score = sc_map.get(pid)

            events = self.evaluator.evaluate(
                current=pool,
                previous=prev_record,
                composite_score=comp_score,
            )

            for ev in events:
                # Dispatch across all registered channels
                dispatched_names = []
                for disp in self.dispatchers:
                    try:
                        success = disp.dispatch(ev)
                        if success:
                            dispatched_names.append(disp.__class__.__name__)
                    except Exception as e:
                        logger.error("Dispatcher %s failed: %s", disp.__class__.__name__, e)

                ev.dispatched_channels.extend(dispatched_names)
                all_events.append(ev)

        logger.info("Alert check complete: %d anomalies detected and dispatched", len(all_events))
        return all_events

    def simulate_synthetic_alerts(self) -> list[AlertEvent]:
        """
        Injects realistic synthetic market shock scenarios to verify that alerts
        fire accurately on threshold-breaching data (Phase 5 Checkpoint requirement).
        """
        logger.info("Running synthetic threshold-breaching alert simulation...")

        synthetic_baseline = {
            "pool_id": "synthetic-aave-usdc",
            "chain": "Ethereum",
            "project": "aave-v3",
            "symbol": "USDC",
            "tvl_usd": 150_000_000.0,
            "apy": 4.5,
        }

        # Scenario 1: Critical Liquidity Drain (-35% TVL drop)
        shock_drain = {
            "pool_id": "synthetic-aave-usdc",
            "chain": "Ethereum",
            "project": "aave-v3",
            "symbol": "USDC",
            "tvl_usd": 97_500_000.0,  # 35% contraction
            "apy": 4.8,
        }

        # Scenario 2: Severe APY Surge (+11.5% spike)
        shock_spike = {
            "pool_id": "synthetic-spark-usds",
            "chain": "Ethereum",
            "project": "sparklend",
            "symbol": "USDS",
            "tvl_usd": 80_000_000.0,
            "apy": 16.0,  # Surged from 4.5% to 16.0% (+11.5%)
        }
        baseline_spike = {
            "pool_id": "synthetic-spark-usds",
            "chain": "Ethereum",
            "project": "sparklend",
            "symbol": "USDS",
            "tvl_usd": 85_000_000.0,
            "apy": 4.5,
        }

        current_batch = [shock_drain, shock_spike]
        prev_map = {
            "synthetic-aave-usdc": synthetic_baseline,
            "synthetic-spark-usds": baseline_spike,
        }
        scores_map = {
            "synthetic-aave-usdc": 32.5,  # Sub-40 score floor breach
            "synthetic-spark-usds": 78.2,  # Target threshold surge
        }

        return self.evaluate_and_dispatch(
            current_pools=current_batch,
            previous_pools_map=prev_map,
            scores_map=scores_map,
        )
