"""
Normalizer and Validator Module.
Reconciles raw incoming external pool records, enforces schema contracts,
filters target stablecoins and TVL thresholds, and rejects malformed records.
"""
from datetime import datetime, timezone
import logging
import math
from typing import Any

from src.config import config
from src.shared_schemas.models import (
    NormalizedPool,
    NormalizedSnapshot,
    RawPoolRecord,
)

logger = logging.getLogger(__name__)


class PoolNormalizer:
    """
    Pure validation & transformation component.
    Takes raw dictionaries, applies boundary filters and validation rules,
    and returns sanitized (NormalizedPool, NormalizedSnapshot) tuples.
    """

    def __init__(
        self,
        min_tvl_usd: float | None = None,
        allowed_symbols: set[str] | None = None,
    ):
        self.min_tvl_usd = (
            min_tvl_usd if min_tvl_usd is not None else config.default_min_tvl_usd
        )
        self.allowed_symbols = (
            {s.upper() for s in allowed_symbols}
            if allowed_symbols is not None
            else {s.upper() for s in config.allowed_symbols}
        )

    def is_valid_stablecoin_symbol(self, raw_symbol: str | None) -> bool:
        """
        Determines if symbol matches the target stablecoin asset class.
        Matches exact uppercase symbols (e.g. 'USDC', 'USDT', 'DAI', 'USDS', 'USDE').
        """
        if not raw_symbol:
            return False
        clean = raw_symbol.strip().upper()
        return clean in self.allowed_symbols

    def process_raw_pools(
        self,
        raw_records: list[dict[str, Any]],
        snapshot_time: datetime | None = None,
    ) -> tuple[list[NormalizedPool], list[NormalizedSnapshot]]:
        """
        Validates, filters, normalizes, and deduplicates a batch of raw records.
        Returns:
            (list[NormalizedPool], list[NormalizedSnapshot])
        """
        effective_time = snapshot_time or datetime.now(timezone.utc)
        # Round timestamp to top of minute for clean time-series consistency
        normalized_time = effective_time.replace(second=0, microsecond=0)

        pools_map: dict[str, NormalizedPool] = {}
        snapshots_map: dict[str, NormalizedSnapshot] = {}

        rejected_symbol_count = 0
        rejected_tvl_count = 0
        rejected_malformed_count = 0

        for item in raw_records:
            try:
                # 1. Schema-level parsing & validation via Pydantic
                raw = RawPoolRecord.model_validate(item)

                # 2. Stablecoin Symbol Filter
                if not self.is_valid_stablecoin_symbol(raw.symbol):
                    rejected_symbol_count += 1
                    continue

                # 3. TVL Threshold Filter (default >= $20M to exclude thin/manipulable pools)
                tvl = raw.tvlUsd or 0.0
                if tvl < self.min_tvl_usd:
                    rejected_tvl_count += 1
                    continue

                # 4. Numerical Health Sanity Checks
                if raw.apy is None or math.isnan(raw.apy) or math.isinf(raw.apy):
                    rejected_malformed_count += 1
                    continue

                clean_symbol = raw.symbol.strip().upper()
                pool_id = str(raw.pool).strip()

                # Deduplicate within batch: if duplicate, retain one with larger TVL
                if pool_id in snapshots_map:
                    if tvl <= snapshots_map[pool_id].tvl_usd:
                        continue

                pool_dim = NormalizedPool(
                    pool_id=pool_id,
                    chain=str(raw.chain).strip(),
                    project=str(raw.project).strip(),
                    symbol=clean_symbol,
                    underlying_tokens=raw.underlyingTokens or [],
                    pool_meta=str(raw.poolMeta).strip() if raw.poolMeta else None,
                    exposure=str(raw.exposure or "single").strip(),
                    created_at=normalized_time,
                    updated_at=normalized_time,
                )

                snapshot = NormalizedSnapshot(
                    pool_id=pool_id,
                    timestamp=normalized_time,
                    tvl_usd=float(tvl),
                    apy=float(raw.apy),
                    apy_base=float(raw.apyBase) if raw.apyBase is not None else None,
                    apy_reward=float(raw.apyReward) if raw.apyReward is not None else None,
                    il_risk=str(raw.ilRisk or "no"),
                    mu=float(raw.mu) if raw.mu is not None else None,
                    sigma=float(raw.sigma) if raw.sigma is not None else None,
                    count=int(raw.count) if raw.count is not None else None,
                    apy_pct_1d=float(raw.apyPct1D) if raw.apyPct1D is not None else None,
                    apy_pct_7d=float(raw.apyPct7D) if raw.apyPct7D is not None else None,
                    apy_pct_30d=float(raw.apyPct30D) if raw.apyPct30D is not None else None,
                    apy_mean_30d=float(raw.apyMean30d) if raw.apyMean30d is not None else None,
                )

                pools_map[pool_id] = pool_dim
                snapshots_map[pool_id] = snapshot

            except Exception as e:
                rejected_malformed_count += 1
                logger.debug("Failed validating item: %s. Error: %s", item, e)

        logger.info(
            "Normalized %d valid stablecoin pools (Rejected: %d wrong symbol, %d low TVL <$%gM, %d malformed)",
            len(pools_map),
            rejected_symbol_count,
            rejected_tvl_count,
            self.min_tvl_usd / 1_000_000.0,
            rejected_malformed_count,
        )

        return list(pools_map.values()), list(snapshots_map.values())
