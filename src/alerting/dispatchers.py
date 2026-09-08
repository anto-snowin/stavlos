"""
Alert Notification Dispatchers.
Publishes advisory alerts across Webhook, Database, and Console channels.
"""
from abc import ABC, abstractmethod
import logging
from typing import Any
import httpx

from src.alerting.models import AlertEvent, AlertSeverity
from src.storage.repository import YieldRepository

logger = logging.getLogger(__name__)


class BaseDispatcher(ABC):
    """Abstract interface for notification dispatchers."""

    @abstractmethod
    def dispatch(self, event: AlertEvent) -> bool:
        pass


class ConsoleDispatcher(BaseDispatcher):
    """Prints formatted, color-coded alert notifications to the console."""

    def dispatch(self, event: AlertEvent) -> bool:
        color_prefix = {
            AlertSeverity.CRITICAL: "\033[91m[CRITICAL ALERT]\033[0m",
            AlertSeverity.WARNING: "\033[93m[WARNING ALERT]\033[0m",
            AlertSeverity.INFO: "\033[96m[INFO ALERT]\033[0m",
        }.get(event.severity, "[ALERT]")

        print(f"\n{color_prefix} {event.title}")
        print(f"  Timestamp: {event.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"  Pool:      {event.project} ({event.symbol}) on {event.chain}")
        print(f"  Details:   {event.message}")
        if event.metrics:
            print(f"  Metrics:   {event.metrics}")
        return True


class DatabaseDispatcher(BaseDispatcher):
    """Persists alert events into SQLite for audit logs and frontend consumption."""

    def __init__(self, repository: YieldRepository):
        self.repo = repository

    def dispatch(self, event: AlertEvent) -> bool:
        try:
            self.repo.save_alert_event(event)
            return True
        except Exception as e:
            logger.error("Failed persisting alert event %s to database: %s", event.event_id, e)
            return False


class WebhookDispatcher(BaseDispatcher):
    """
    Dispatches JSON alert payloads to an external webhook endpoint (Slack, Discord, PagerDuty, generic).
    Fails gracefully if the endpoint is unreachable.
    """

    def __init__(self, webhook_url: str | None = None, timeout: float = 5.0):
        self.webhook_url = webhook_url
        self.timeout = timeout

    def dispatch(self, event: AlertEvent) -> bool:
        if not self.webhook_url:
            return False

        payload = {
            "eventId": event.event_id,
            "timestamp": event.timestamp.isoformat(),
            "severity": event.severity.value,
            "trigger": event.trigger_type.value,
            "title": event.title,
            "message": event.message,
            "pool": {
                "id": event.pool_id,
                "project": event.project,
                "symbol": event.symbol,
                "chain": event.chain,
            },
            "metrics": event.metrics,
            "advisoryNotice": "Simulation & advisory signal only. No automated on-chain execution.",
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.webhook_url, json=payload)
                response.raise_for_status()
                logger.info("Successfully dispatched alert %s to webhook", event.event_id)
                return True
        except Exception as e:
            logger.warning("Webhook dispatch failed for alert %s: %s", event.event_id, e)
            return False


class InMemoryDispatcher(BaseDispatcher):
    """Stores events in memory for unit testing."""

    def __init__(self):
        self.dispatched: list[AlertEvent] = []

    def dispatch(self, event: AlertEvent) -> bool:
        self.dispatched.append(event)
        return True
