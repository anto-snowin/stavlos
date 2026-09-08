"""
Database Connection & Schema Manager.
Initializes SQLite with foreign keys, WAL journaling for concurrent reads/writes,
and proper relational indices for time-series analytics.
"""
import logging
from pathlib import Path
import sqlite3
from typing import Generator
from contextlib import contextmanager

from src.config import config

logger = logging.getLogger(__name__)

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pools (
    pool_id TEXT PRIMARY KEY,
    chain TEXT NOT NULL,
    project TEXT NOT NULL,
    symbol TEXT NOT NULL,
    underlying_tokens TEXT,
    pool_meta TEXT,
    exposure TEXT DEFAULT 'single',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pools_symbol ON pools(symbol);
CREATE INDEX IF NOT EXISTS idx_pools_chain ON pools(chain);
CREATE INDEX IF NOT EXISTS idx_pools_project ON pools(project);

CREATE TABLE IF NOT EXISTS pool_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    tvl_usd REAL NOT NULL,
    apy REAL NOT NULL,
    apy_base REAL,
    apy_reward REAL,
    il_risk TEXT DEFAULT 'no',
    mu REAL,
    sigma REAL,
    count INTEGER,
    apy_pct_1d REAL,
    apy_pct_7d REAL,
    apy_pct_30d REAL,
    apy_mean_30d REAL,
    UNIQUE(pool_id, timestamp),
    FOREIGN KEY(pool_id) REFERENCES pools(pool_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_snapshots_pool_time ON pool_snapshots(pool_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshots_time ON pool_snapshots(timestamp);

CREATE TABLE IF NOT EXISTS pool_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id TEXT NOT NULL,
    scored_at TEXT NOT NULL,
    chain TEXT NOT NULL,
    project TEXT NOT NULL,
    symbol TEXT NOT NULL,
    headline_apy REAL NOT NULL,
    rolling_30d_avg_apy REAL NOT NULL,
    rolling_30d_volatility REAL,
    tvl_usd REAL NOT NULL,
    pool_age_days INTEGER,
    tvl_score REAL NOT NULL,
    age_score REAL NOT NULL,
    volatility_score REAL NOT NULL,
    chain_risk_score REAL NOT NULL,
    bridge_score REAL NOT NULL,
    risk_multiplier REAL NOT NULL,
    composite_score REAL NOT NULL,
    risk_adjusted_apy REAL NOT NULL,
    explanation TEXT NOT NULL,
    UNIQUE(pool_id, scored_at),
    FOREIGN KEY(pool_id) REFERENCES pools(pool_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_composite ON pool_scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_time ON pool_scores(scored_at);
CREATE INDEX IF NOT EXISTS idx_scores_pool ON pool_scores(pool_id);

CREATE TABLE IF NOT EXISTS ingestion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    total_raw_records INTEGER NOT NULL,
    matched_stablecoin_records INTEGER NOT NULL,
    persisted_pools INTEGER NOT NULL,
    persisted_snapshots INTEGER NOT NULL,
    min_tvl_threshold REAL NOT NULL,
    duration_seconds REAL NOT NULL,
    success INTEGER NOT NULL,
    error_message TEXT
);
"""


class DatabaseManager:
    """Manages SQLite connection lifecycle and schema setup."""

    def __init__(self, db_path: str | Path | None = None):
        if db_path is None:
            self.db_path = config.default_db_path
        elif str(db_path) == ":memory:":
            self.db_path = ":memory:"
        else:
            self.db_path = Path(db_path)

        self._shared_memory_conn: sqlite3.Connection | None = None
        if self.db_path == ":memory:":
            self._shared_memory_conn = sqlite3.connect(":memory:")
            self._shared_memory_conn.row_factory = sqlite3.Row

    def initialize_schema(self) -> None:
        """Executes DDL to guarantee tables, indices, and schema migrations exist."""
        if isinstance(self.db_path, Path):
            self.db_path.parent.mkdir(parents=True, exist_ok=True)

        with self.get_connection() as conn:
            if self.db_path != ":memory:":
                conn.execute("PRAGMA journal_mode = WAL;")
                conn.execute("PRAGMA synchronous = NORMAL;")
            conn.executescript(SCHEMA_SQL)

            # Migration: Ensure count column exists in pool_snapshots
            columns = [row["name"] for row in conn.execute("PRAGMA table_info(pool_snapshots);").fetchall()]
            if "count" not in columns:
                conn.execute("ALTER TABLE pool_snapshots ADD COLUMN count INTEGER;")

            conn.commit()
        logger.info("Database schema initialized at %s", self.db_path)

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Provides a managed database connection with row factory and pragma enforcement."""
        if self._shared_memory_conn is not None:
            yield self._shared_memory_conn
            return

        conn = sqlite3.connect(
            str(self.db_path),
            timeout=20.0,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        try:
            yield conn
        finally:
            conn.close()
