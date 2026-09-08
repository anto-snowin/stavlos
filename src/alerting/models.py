"""
Domain models and contracts for the Advisory Alerting Service.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertTriggerType(str, Enum):
    TVL_CONTRACTION = "TVL_CONTRACTION"
    APY_SPIKE = "APY_SPIKE"
    SCORE_DROP = "SCORE_DROP"
    SCORE_SURGE = "SCORE_SURGE"


class AlertRuleConfig(BaseModel):
    """Configurable alert anomaly thresholds and watched pools."""
    model_config = ConfigDict(frozen=True)

    tvl_drop_pct_threshold: float = Field(default=15.0, description="TVL percentage drop triggering CRITICAL (default: 15%)")
    apy_spike_abs_threshold: float = Field(default=5.0, description="Absolute APY increase triggering WARNING (default: +5.0%)")
    apy_spike_rel_threshold: float = Field(default=0.50, description="Relative APY jump triggering WARNING (default: +50%)")
    score_floor_threshold: float = Field(default=40.0, description="Composite score falling below floor (default: 40.0)")
    score_target_threshold: float = Field(default=75.0, description="Composite score crossing above target (default: 75.0)")
    watched_pools: list[str] = Field(default_factory=list, description="Explicit watched pool IDs")
    webhook_url: str | None = Field(default=None, description="Optional Webhook endpoint (Slack/Discord/Incident endpoint)")


class AlertEvent(BaseModel):
    """Immutable record of a detected market anomaly or score transition."""
    model_config = ConfigDict(frozen=True)

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pool_id: str
    project: str
    symbol: str
    chain: str
    trigger_type: AlertTriggerType
    severity: AlertSeverity
    title: str
    message: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    dispatched_channels: list[str] = Field(default_factory=list)
