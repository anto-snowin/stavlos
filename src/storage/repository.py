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
    PoolRiskScore,
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
            il_risk, mu, sigma, count, apy_pct_1d, apy_pct_7d, apy_pct_30d, apy_mean_30d
        ) VALUES (
            :pool_id, :timestamp, :tvl_usd, :apy, :apy_base, :apy_reward,
            :il_risk, :mu, :sigma, :count, :apy_pct_1d, :apy_pct_7d, :apy_pct_30d, :apy_mean_30d
        )
        ON CONFLICT(pool_id, timestamp) DO UPDATE SET
            tvl_usd = excluded.tvl_usd,
            apy = excluded.apy,
            apy_base = excluded.apy_base,
            apy_reward = excluded.apy_reward,
            il_risk = excluded.il_risk,
            mu = excluded.mu,
            sigma = excluded.sigma,
            count = excluded.count,
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
                "count": s.count,
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
            s.timestamp, s.tvl_usd, s.apy, s.apy_base, s.apy_reward, s.sigma, s.mu, s.count, s.apy_mean_30d
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

    def save_pool_scores(self, scores: list[PoolRiskScore]) -> int:
        """
        Persists evaluated pool risk scores with auditability.
        Idempotent on (pool_id, scored_at).
        """
        if not scores:
            return 0

        query = """
        INSERT INTO pool_scores (
            pool_id, scored_at, chain, project, symbol, headline_apy,
            rolling_30d_avg_apy, rolling_30d_volatility, tvl_usd, pool_age_days,
            tvl_score, age_score, volatility_score, chain_risk_score,
            bridge_score, risk_multiplier, composite_score, risk_adjusted_apy, explanation
        ) VALUES (
            :pool_id, :scored_at, :chain, :project, :symbol, :headline_apy,
            :rolling_30d_avg_apy, :rolling_30d_volatility, :tvl_usd, :pool_age_days,
            :tvl_score, :age_score, :volatility_score, :chain_risk_score,
            :bridge_score, :risk_multiplier, :composite_score, :risk_adjusted_apy, :explanation
        )
        ON CONFLICT(pool_id, scored_at) DO UPDATE SET
            headline_apy = excluded.headline_apy,
            rolling_30d_avg_apy = excluded.rolling_30d_avg_apy,
            rolling_30d_volatility = excluded.rolling_30d_volatility,
            tvl_usd = excluded.tvl_usd,
            pool_age_days = excluded.pool_age_days,
            tvl_score = excluded.tvl_score,
            age_score = excluded.age_score,
            volatility_score = excluded.volatility_score,
            chain_risk_score = excluded.chain_risk_score,
            bridge_score = excluded.bridge_score,
            risk_multiplier = excluded.risk_multiplier,
            composite_score = excluded.composite_score,
            risk_adjusted_apy = excluded.risk_adjusted_apy,
            explanation = excluded.explanation;
        """

        records = [
            {
                "pool_id": s.pool_id,
                "scored_at": s.scored_at.isoformat(),
                "chain": s.chain,
                "project": s.project,
                "symbol": s.symbol,
                "headline_apy": s.headline_apy,
                "rolling_30d_avg_apy": s.rolling_30d_avg_apy,
                "rolling_30d_volatility": s.rolling_30d_volatility,
                "tvl_usd": s.tvl_usd,
                "pool_age_days": s.pool_age_days,
                "tvl_score": s.tvl_score,
                "age_score": s.age_score,
                "volatility_score": s.volatility_score,
                "chain_risk_score": s.chain_risk_score,
                "bridge_score": s.bridge_score,
                "risk_multiplier": s.risk_multiplier,
                "composite_score": s.composite_score,
                "risk_adjusted_apy": s.risk_adjusted_apy,
                "explanation": s.explanation,
            }
            for s in scores
        ]

        with self.db.get_connection() as conn:
            conn.executemany(query, records)
            conn.commit()

        logger.debug("Persisted %d pool risk scores", len(records))
        return len(records)

    def get_latest_scores(self, limit: int = 100) -> list[dict[str, Any]]:
        """
        Retrieves the latest scored ranking.
        """
        query = """
        SELECT * FROM pool_scores
        WHERE scored_at = (SELECT MAX(scored_at) FROM pool_scores)
        ORDER BY composite_score DESC
        LIMIT :limit;
        """
        with self.db.get_connection() as conn:
            cursor = conn.execute(query, {"limit": limit})
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

    def backfill_historical_chart_data(
        self, pool_id: str, chart_records: list[dict[str, Any]]
    ) -> int:
        """
        Idempotently inserts historical daily snapshots from DeFiLlama chart data.
        Normalizes timestamps to daily midnight UTC (YYYY-MM-DDT00:00:00+00:00).
        """
        if not chart_records:
            return 0

        insert_query = """
        INSERT INTO pool_snapshots (
            pool_id, timestamp, tvl_usd, apy, apy_base, apy_reward, il_risk
        ) VALUES (
            :pool_id, :timestamp, :tvl_usd, :apy, :apy_base, :apy_reward, 'no'
        )
        ON CONFLICT(pool_id, timestamp) DO UPDATE SET
            tvl_usd = excluded.tvl_usd,
            apy = excluded.apy,
            apy_base = excluded.apy_base,
            apy_reward = excluded.apy_reward;
        """

        records = []
        for item in chart_records:
            try:
                raw_ts = item.get("timestamp")
                if not raw_ts:
                    continue
                # Parse ISO timestamp
                if isinstance(raw_ts, str):
                    dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                elif isinstance(raw_ts, (int, float)):
                    dt = datetime.fromtimestamp(raw_ts, tz=timezone.utc)
                else:
                    continue

                daily_ts = dt.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
                tvl = float(item.get("tvlUsd") or 0.0)
                apy = float(item.get("apy") or 0.0)

                records.append({
                    "pool_id": pool_id,
                    "timestamp": daily_ts,
                    "tvl_usd": tvl,
                    "apy": apy,
                    "apy_base": float(item.get("apyBase")) if item.get("apyBase") is not None else None,
                    "apy_reward": float(item.get("apyReward")) if item.get("apyReward") is not None else None,
                })
            except Exception as e:
                logger.debug("Skipping invalid chart point for pool %s: %s", pool_id, e)

        if not records:
            return 0

        with self.db.get_connection() as conn:
            conn.executemany(insert_query, records)
            conn.commit()

        logger.info("Backfilled %d historical points for pool %s", len(records), pool_id)
        return len(records)

    def get_daily_time_series(
        self, pool_ids: list[str], start_date: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Retrieves synchronized daily time-series records for specified pools.
        Returns rows sorted chronologically by timestamp, then pool_id.
        """
        if not pool_ids:
            return []

        placeholders = ",".join("?" for _ in pool_ids)
        query = f"""
        SELECT 
            s.timestamp, s.pool_id, s.apy, s.tvl_usd,
            p.chain, p.project, p.symbol
        FROM pool_snapshots s
        JOIN pools p ON s.pool_id = p.pool_id
        WHERE s.pool_id IN ({placeholders})
        """
        params: list[Any] = list(pool_ids)

        if start_date:
            query += " AND s.timestamp >= ?"
            params.append(start_date)

        query += " ORDER BY s.timestamp ASC, s.tvl_usd DESC;"

        with self.db.get_connection() as conn:
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]


