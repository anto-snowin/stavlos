"""
Unit tests for the Phase 5 Advisory Alerting Service.
Tests TVL contraction, APY spikes, score thresholds, dispatchers, and synthetic simulations.
"""
from datetime import datetime, timezone
import pytest
from unittest.mock import MagicMock, patch

from src.alerting.dispatchers import (
    ConsoleDispatcher,
    DatabaseDispatcher,
    InMemoryDispatcher,
    WebhookDispatcher,
)
from src.alerting.models import (
    AlertEvent,
    AlertRuleConfig,
    AlertSeverity,
    AlertTriggerType,
)
from src.alerting.rules import AlertRuleEvaluator
from src.alerting.service import AlertService
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository


@pytest.fixture
def test_repo():
    db_mgr = DatabaseManager(db_path=":memory:")
    db_mgr.initialize_schema()
    return YieldRepository(db_mgr)


@pytest.fixture
def rule_evaluator():
    config = AlertRuleConfig(
        tvl_drop_pct_threshold=15.0,
        apy_spike_abs_threshold=5.0,
        apy_spike_rel_threshold=0.50,
        score_floor_threshold=40.0,
        score_target_threshold=75.0,
    )
    return AlertRuleEvaluator(config=config)


def test_tvl_contraction_trigger_critical(rule_evaluator):
    """Verify that a >= 15% TVL contraction triggers a CRITICAL alert."""
    prev = {
        "pool_id": "test-pool-1",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "tvl_usd": 100_000_000.0,
        "apy": 4.5,
    }
    curr = {
        "pool_id": "test-pool-1",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "tvl_usd": 80_000_000.0,  # 20% drop
        "apy": 4.5,
    }

    events = rule_evaluator.evaluate(current=curr, previous=prev)
    assert len(events) == 1
    ev = events[0]
    assert ev.trigger_type == AlertTriggerType.TVL_CONTRACTION
    assert ev.severity == AlertSeverity.CRITICAL
    assert ev.metrics["tvl_delta_pct"] == -20.0
    assert "20.0%" in ev.message


def test_apy_spike_trigger_warning(rule_evaluator):
    """Verify that an absolute APY jump >= 5.0% triggers a WARNING alert."""
    prev = {
        "pool_id": "test-pool-2",
        "chain": "Arbitrum",
        "project": "uniswap-v3",
        "symbol": "USDT",
        "tvl_usd": 50_000_000.0,
        "apy": 3.0,
    }
    curr = {
        "pool_id": "test-pool-2",
        "chain": "Arbitrum",
        "project": "uniswap-v3",
        "symbol": "USDT",
        "tvl_usd": 50_000_000.0,
        "apy": 9.5,  # +6.5% spike
    }

    events = rule_evaluator.evaluate(current=curr, previous=prev)
    assert len(events) == 1
    ev = events[0]
    assert ev.trigger_type == AlertTriggerType.APY_SPIKE
    assert ev.severity == AlertSeverity.WARNING
    assert ev.metrics["apy_delta_abs"] == 6.5
    assert "+6.50%" in ev.message


def test_score_floor_and_target_triggers(rule_evaluator):
    """Verify composite score dropping below floor (40) or crossing target (75)."""
    pool = {
        "pool_id": "test-pool-3",
        "chain": "Optimism",
        "project": "curve",
        "symbol": "USDC",
        "tvl_usd": 40_000_000.0,
        "apy": 5.0,
    }

    # Score floor breach (<40)
    events_floor = rule_evaluator.evaluate(current=pool, previous=None, composite_score=35.0)
    assert any(e.trigger_type == AlertTriggerType.SCORE_DROP and e.severity == AlertSeverity.WARNING for e in events_floor)

    # Score target crossing (>= 75)
    events_target = rule_evaluator.evaluate(current=pool, previous=None, composite_score=82.0)
    assert any(e.trigger_type == AlertTriggerType.SCORE_SURGE and e.severity == AlertSeverity.INFO for e in events_target)


def test_database_and_in_memory_dispatchers(test_repo):
    """Verify that events are successfully dispatched to in-memory and SQLite database."""
    in_memory = InMemoryDispatcher()
    db_disp = DatabaseDispatcher(test_repo)
    console_disp = ConsoleDispatcher()

    ev = AlertEvent(
        pool_id="pool-test-id",
        project="sparklend",
        symbol="USDS",
        chain="Ethereum",
        trigger_type=AlertTriggerType.TVL_CONTRACTION,
        severity=AlertSeverity.CRITICAL,
        title="CRITICAL: Liquidity Drain",
        message="TVL contracted by 25%",
        metrics={"tvl_change_pct": -25.0},
    )

    assert in_memory.dispatch(ev) is True
    assert len(in_memory.dispatched) == 1
    assert in_memory.dispatched[0].pool_id == "pool-test-id"

    assert db_disp.dispatch(ev) is True
    persisted = test_repo.get_recent_alert_events(limit=5)
    assert len(persisted) == 1
    assert persisted[0]["pool_id"] == "pool-test-id"
    assert persisted[0]["trigger_type"] == "TVL_CONTRACTION"
    assert persisted[0]["severity"] == "CRITICAL"

    # Console dispatcher check (should print without raising exception)
    assert console_disp.dispatch(ev) is True


def test_webhook_dispatcher_mocked():
    """Verify WebhookDispatcher sends POST request with correct payload format."""
    dispatcher = WebhookDispatcher(webhook_url="https://hooks.example.com/alerts", timeout=3.0)
    ev = AlertEvent(
        pool_id="pool-wh-1",
        project="aave-v3",
        symbol="USDC",
        chain="Base",
        trigger_type=AlertTriggerType.APY_SPIKE,
        severity=AlertSeverity.WARNING,
        title="WARNING: APY Surge",
        message="APY increased by +7.2%",
        metrics={"apy_diff": 7.2},
    )

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_client.__enter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_cls.return_value = mock_client

        success = dispatcher.dispatch(ev)
        assert success is True
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args[1]
        assert call_kwargs["json"]["pool"]["id"] == "pool-wh-1"
        assert "advisoryNotice" in call_kwargs["json"]


def test_simulate_synthetic_alerts(test_repo):
    """Verify Phase 5 Checkpoint: Synthetic threshold-breaching market shocks fire properly."""
    in_memory = InMemoryDispatcher()
    service = AlertService(
        config=AlertRuleConfig(),
        dispatchers=[in_memory, DatabaseDispatcher(test_repo)],
        repository=test_repo,
    )

    events = service.simulate_synthetic_alerts()
    assert len(events) >= 3  # TVL contraction, APY spike, and score triggers

    triggers = {e.trigger_type for e in events}
    assert AlertTriggerType.TVL_CONTRACTION in triggers
    assert AlertTriggerType.APY_SPIKE in triggers
    assert AlertTriggerType.SCORE_DROP in triggers or AlertTriggerType.SCORE_SURGE in triggers

    # Verify persisted in database
    db_events = test_repo.get_recent_alert_events(limit=10)
    assert len(db_events) == len(events)
