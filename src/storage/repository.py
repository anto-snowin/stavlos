"""
Time-Series Yield Repository.
Provides transactional methods for storing and querying pools and historical snapshots.
Guarantees write idempotency through SQLite ON CONFLICT clauses.
"""
from datetime import datetime, timezone
import json
import logging
from typing import Any

from src.shared_schemas.models import (
    IngestionRunSummary,
    NormalizedPool,
    NormalizedSnapshot,
)
from src.storage.database import DatabaseManager

logger = logging.getLogger(__name__)


class YieldRepository:
    """Data Access Layer for pools, snapshots, and ingestion logs."""

    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def upsert_pools(self, pools: list[NormalizedPool]) -> int:
        """
        Upserts pool dimensions. If pool exists, updates metadata and updated_at.
        Returns count of touched pools.
        """
        if not pools:
            return 0

        upsert_query = """
        INSERT INTO pools (
            pool_id, chain, project, symbol, underlying_tokens,
            pool_meta, exposure, created_at, updated_at
        ) VALUES (
            :pool_id, :chain, :project, :symbol, :underlying_tokens,
            :pool_meta, :exposure, :created_at, :updated_at
        )
        ON CONFLICT(pool_id) DO UPDATE SET
            chain = excluded.chain,
            project = excluded.project,
            symbol = excluded.symbol,
            underlying_tokens = excluded.underlying_tokens,
            pool_meta = excluded.pool_meta,
            exposure = excluded.exposure,
            updated_at = excluded.updated_at;
        """

        records = [
            {
                "pool_id": p.pool_id,
                "chain": p.chain,
                "project": p.project,
                "symbol": p.symbol,
                "underlying_tokens": json.dumps(p.underlying_tokens),
                "pool_meta": p.pool_meta,
                "exposure": p.exposure,
                "created_at": p.created_at.isoformat(),
                "updated_at": p.updated_at.isoformat(),
            }
            for p in pools
        ]

        with self.db.get_connection() as conn:
            conn.executemany(upsert_query, records)
            conn.commit()

        logger.debug("Upserted %d pool dimension records", len(records))
        return len(records)

    def insert_snapshots(self, snapshots: list[NormalizedSnapshot]) -> int:
        """
        Inserts time-series snapshots with idempotency.
        If a snapshot for (pool_id, timestamp) already exists, updates metrics.
        Returns count of processed snapshots.
        """
        if not snapshots:
            return 0

        insert_query = """
        INSERT INTO pool_snapshots (
            pool_id, timestamp, tvl_usd, apy, apy_base, apy_reward,
            il_risk, mu, sigma, apy_pct_1d, apy_pct_7d, apy_pct_30d, apy_mean_30d
        ) VALUES (
            :pool_id, :timestamp, :tvl_usd, :apy, :apy_base, :apy_reward,
            :il_risk, :mu, :sigma, :apy_pct_1d, :apy_pct_7d, :apy_pct_30d, :apy_mean_30d
        )
        ON CONFLICT(pool_id, timestamp) DO UPDATE SET
            tvl_usd = excluded.tvl_usd,
            apy = excluded.apy,
            apy_base = excluded.apy_base,
            apy_reward = excluded.apy_reward,
            il_risk = excluded.il_risk,
            mu = excluded.mu,
            sigma = excluded.sigma,
            apy_pct_1d = excluded.apy_pct_1d,
            apy_pct_7d = excluded.apy_pct_7d,
            apy_pct_30d = excluded.apy_pct_30d,
            apy_mean_30d = excluded.apy_mean_30d;
        """

        records = [
            {
                "pool_id": s.pool_id,
                "timestamp": s.timestamp.isoformat(),
                "tvl_usd": s.tvl_usd,
                "apy": s.apy,
                "apy_base": s.apy_base,
                "apy_reward": s.apy_reward,
                "il_risk": s.il_risk,
                "mu": s.mu,
                "sigma": s.sigma,
                "apy_pct_1d": s.apy_pct_1d,
                "apy_pct_7d": s.apy_pct_7d,
                "apy_pct_30d": s.apy_pct_30d,
                "apy_mean_30d": s.apy_mean_30d,
            }
            for s in snapshots
        ]

        with self.db.get_connection() as conn:
            conn.executemany(insert_query, records)
            conn.commit()

        logger.debug("Persisted %d time-series snapshots (idempotent)", len(records))
        return len(records)

    def log_ingestion_run(self, summary: IngestionRunSummary) -> None:
        """Persists ingestion run metadata for operational observability."""
        query = """
        INSERT INTO ingestion_logs (
            timestamp, total_raw_records, matched_stablecoin_records,
            persisted_pools, persisted_snapshots, min_tvl_threshold,
            duration_seconds, success, error_message
        ) VALUES (
            :timestamp, :total_raw_records, :matched_stablecoin_records,
            :persisted_pools, :persisted_snapshots, :min_tvl_threshold,
            :duration_seconds, :success, :error_message
        );
        """
        with self.db.get_connection() as conn:
            conn.execute(
                query,
                {
                    "timestamp": summary.timestamp.isoformat(),
                    "total_raw_records": summary.total_raw_records,
                    "matched_stablecoin_records": summary.matched_stablecoin_records,
                    "persisted_pools": summary.persisted_pools,
                    "persisted_snapshots": summary.persisted_snapshots,
                    "min_tvl_threshold": summary.min_tvl_threshold,
                    "duration_seconds": summary.duration_seconds,
                    "success": 1 if summary.success else 0,
                    "error_message": summary.error_message,
                },
            )
            conn.commit()

    def get_pool_count(self) -> int:
        """Returns total distinct pools registered."""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) AS c FROM pools")
            return int(cursor.fetchone()["c"])

    def get_snapshot_count(self) -> int:
        """Returns total historical snapshots stored."""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) AS c FROM pool_snapshots")
            return int(cursor.fetchone()["c"])

    def get_latest_snapshots(self) -> list[dict[str, Any]]:
        """
        Retrieves the most recent snapshot for each active pool joined with pool metadata.
        """
        query = """
        SELECT 
            p.pool_id, p.chain, p.project, p.symbol, p.pool_meta, p.exposure,
            s.timestamp, s.tvl_usd, s.apy, s.apy_base, s.apy_reward, s.sigma, s.mu, s.apy_mean_30d
        FROM pools p
        INNER JOIN pool_snapshots s ON p.pool_id = s.pool_id
        WHERE s.timestamp = (
            SELECT MAX(s2.timestamp)
            FROM pool_snapshots s2
            WHERE s2.pool_id = p.pool_id
        )
        ORDER BY s.tvl_usd DESC;
        """
        with self.db.get_connection() as conn:
            cursor = conn.execute(query)
            return [dict(row) for row in cursor.fetchall()]

    def get_historical_snapshots(
        self, pool_id: str, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Retrieves chronological snapshots for a given pool."""
        query = """
        SELECT * FROM pool_snapshots
        WHERE pool_id = :pool_id
        ORDER BY timestamp ASC
        LIMIT :limit;
        """
        with self.db.get_connection() as conn:
            cursor = conn.execute(query, {"pool_id": pool_id, "limit": limit})
            return [dict(row) for row in cursor.fetchall()]
