"""
Advisory Alerting Service package (Phase 5).
Monitors score threshold crossings, APY spikes, and sudden TVL contractions.
"""
from src.alerting.dispatchers import (
    BaseDispatcher,
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

__all__ = [
    "AlertEvent",
    "AlertRuleConfig",
    "AlertSeverity",
    "AlertTriggerType",
    "AlertRuleEvaluator",
    "AlertService",
    "BaseDispatcher",
    "ConsoleDispatcher",
    "DatabaseDispatcher",
    "InMemoryDispatcher",
    "WebhookDispatcher",
]
