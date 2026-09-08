"""
Unit tests for DatabaseManager and YieldRepository persistence & idempotency.
"""
from datetime import datetime, timezone
import pytest
from src.shared_schemas.models import (
    IngestionRunSummary,
    NormalizedPool,
    NormalizedSnapshot,
)
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository


@pytest.fixture
def repo():
    db_mgr = DatabaseManager(db_path=":memory:")
    db_mgr.initialize_schema()
    return YieldRepository(db_mgr)


def test_upsert_pools_and_idempotency(repo):
    now = datetime.now(timezone.utc)
    pool1 = NormalizedPool(
        pool_id="pool-1",
        chain="Ethereum",
        project="aave-v3",
        symbol="USDC",
        underlying_tokens=["0xa0b8..."],
        pool_meta="Core",
        created_at=now,
        updated_at=now,
    )

    # Initial insert
    count = repo.upsert_pools([pool1])
    assert count == 1
    assert repo.get_pool_count() == 1

    # Re-insert with updated metadata (should update, not duplicate)
    pool1_updated = NormalizedPool(
        pool_id="pool-1",
        chain="Ethereum",
        project="aave-v3",
        symbol="USDC",
        underlying_tokens=["0xa0b8..."],
        pool_meta="Core Instance Updated",
        created_at=now,
        updated_at=now,
    )
    repo.upsert_pools([pool1_updated])
    assert repo.get_pool_count() == 1


def test_insert_snapshots_idempotency(repo):
    now = datetime(2026, 9, 8, 12, 0, 0, tzinfo=timezone.utc)
    pool = NormalizedPool(
        pool_id="p-100",
        chain="Arbitrum",
        project="compound-v3",
        symbol="USDC",
        created_at=now,
        updated_at=now,
    )
    repo.upsert_pools([pool])

    snap1 = NormalizedSnapshot(
        pool_id="p-100",
        timestamp=now,
        tvl_usd=50_000_000.0,
        apy=4.5,
    )

    # 1. First insert
    repo.insert_snapshots([snap1])
    assert repo.get_snapshot_count() == 1

    # 2. Re-inserting identical (pool_id, timestamp) with updated APY
    snap1_revised = NormalizedSnapshot(
        pool_id="p-100",
        timestamp=now,
        tvl_usd=51_000_000.0,
        apy=4.8,
    )
    repo.insert_snapshots([snap1_revised])
    # Count should STILL be 1, not 2
    assert repo.get_snapshot_count() == 1

    # Verify latest value reflects the updated record
    latest = repo.get_latest_snapshots()
    assert len(latest) == 1
    assert latest[0]["apy"] == 4.8
    assert latest[0]["tvl_usd"] == 51_000_000.0


def test_historical_snapshots_query(repo):
    t1 = datetime(2026, 9, 1, 12, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 9, 2, 12, 0, 0, tzinfo=timezone.utc)

    pool = NormalizedPool(
        pool_id="p-series",
        chain="Ethereum",
        project="spark",
        symbol="DAI",
        created_at=t1,
        updated_at=t1,
    )
    repo.upsert_pools([pool])

    repo.insert_snapshots([
        NormalizedSnapshot(pool_id="p-series", timestamp=t1, tvl_usd=30_000_000.0, apy=5.0),
        NormalizedSnapshot(pool_id="p-series", timestamp=t2, tvl_usd=32_000_000.0, apy=5.2),
    ])

    history = repo.get_historical_snapshots("p-series")
    assert len(history) == 2
    assert history[0]["apy"] == 5.0
    assert history[1]["apy"] == 5.2


def test_log_ingestion_run(repo):
    summary = IngestionRunSummary(
        total_raw_records=1000,
        matched_stablecoin_records=50,
        persisted_pools=50,
        persisted_snapshots=50,
        min_tvl_threshold=20_000_000.0,
        duration_seconds=1.25,
        success=True,
    )
    repo.log_ingestion_run(summary)

    with repo.db.get_connection() as conn:
        row = conn.execute("SELECT * FROM ingestion_logs").fetchone()
        assert row is not None
        assert row["total_raw_records"] == 1000
        assert row["matched_stablecoin_records"] == 50
        assert row["success"] == 1
