"""
CLI Alerting Runner.
Evaluates monitored stablecoin pools for sudden TVL contractions, APY surges, and score breaches.
Supports synthetic market shock simulations to test threshold triggering (Phase 5 Checkpoint).

Usage:
    python -m src.cli.alert --simulate
    python -m src.cli.alert --check
"""
import argparse
import sys

from src.alerting.dispatchers import ConsoleDispatcher, DatabaseDispatcher, WebhookDispatcher
from src.alerting.models import AlertRuleConfig
from src.alerting.service import AlertService
from src.config import config
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository


def run_alert_cli(
    simulate: bool = False,
    webhook_url: str | None = None,
    tvl_drop: float = 15.0,
    apy_spike: float = 5.0,
    score_floor: float = 40.0,
    score_target: float = 75.0,
) -> int:
    db_manager = DatabaseManager()
    db_manager.initialize_schema()
    repo = YieldRepository(db_manager)

    rule_config = AlertRuleConfig(
        tvl_drop_pct_threshold=tvl_drop,
        apy_spike_abs_threshold=apy_spike,
        score_floor_threshold=score_floor,
        score_target_threshold=score_target,
        webhook_url=webhook_url,
    )

    dispatchers = [ConsoleDispatcher(), DatabaseDispatcher(repo)]
    if webhook_url:
        dispatchers.append(WebhookDispatcher(webhook_url=webhook_url))

    service = AlertService(config=rule_config, dispatchers=dispatchers, repository=repo)

    print("\n" + "=" * 95)
    print(" CROSS-CHAIN STABLECOIN YIELD OPTIMIZER -- ADVISORY ALERTING SERVICE")
    print(f" Thresholds: TVL Drop >= -{tvl_drop}% | APY Spike >= +{apy_spike}% | Score Floor < {score_floor}")
    print("=" * 95)

    if simulate:
        print("\n[*] INJECTING SYNTHETIC THRESHOLD-BREACHING MARKET SHOCK EVENTS...")
        events = service.simulate_synthetic_alerts()
        print(f"\n[+] Simulation finished: {len(events)} synthetic alerts successfully triggered and dispatched!")
        return 0

    # Live check against database snapshots
    print("\n[*] Running live anomaly check across active stored pools...")
    latest = repo.get_latest_snapshots()
    if not latest:
        print("No stored pool snapshots found. Run ingestion first.", file=sys.stderr)
        return 1

    # Load latest scores
    scores = repo.get_latest_scores(limit=100)
    scores_map = {s["pool_id"]: s["composite_score"] for s in scores}

    events = service.evaluate_and_dispatch(
        current_pools=latest,
        previous_pools_map=None,
        scores_map=scores_map,
    )

    if not events:
        print("\n[OK] All monitored pools within normal operating thresholds. No critical anomalies detected.")
    else:
        print(f"\n[!] Dispatched {len(events)} advisory notifications.")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Cross-Chain Stablecoin Yield Optimizer — Alerting Service")
    parser.add_argument("--simulate", action="store_true", help="Run synthetic threshold-breaching simulation (Checkpoint)")
    parser.add_argument("--check", action="store_true", help="Check current database snapshots for anomalies")
    parser.add_argument("--webhook-url", type=str, default=None, help="Webhook URL for external notifications")
    parser.add_argument("--tvl-drop", type=float, default=15.0, help="TVL drop %% threshold (default: 15.0)")
    parser.add_argument("--apy-spike", type=float, default=5.0, help="APY spike delta %% threshold (default: 5.0)")
    parser.add_argument("--score-floor", type=float, default=40.0, help="Composite score floor threshold (default: 40.0)")
    parser.add_argument("--score-target", type=float, default=75.0, help="Score target threshold (default: 75.0)")

    args = parser.parse_args()

    # Default to simulate if neither check nor simulate explicitly requested
    simulate_mode = args.simulate or (not args.check)

    return run_alert_cli(
        simulate=simulate_mode,
        webhook_url=args.webhook_url,
        tvl_drop=args.tvl_drop,
        apy_spike=args.apy_spike,
        score_floor=args.score_floor,
        score_target=args.score_target,
    )


if __name__ == "__main__":
    sys.exit(main())
