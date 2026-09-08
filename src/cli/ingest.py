"""
Standalone Cron-Ready Ingestion Runner.
Fetches, normalizes, filters, and persists stablecoin yield pools into the time-series store.

Usage:
    python -m src.cli.ingest
    python -m src.cli.ingest --min-tvl 25000000 --db-path data/yields.db
"""
import argparse
from datetime import datetime, timezone
import logging
from pathlib import Path
import sys
import time

from src.config import config
from src.ingestion.client import DeFiLlamaClient
from src.normalizer.validator import PoolNormalizer
from src.shared_schemas.models import IngestionRunSummary
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository


def setup_logging(level_name: str = "INFO") -> None:
    """Configures structured console logging."""
    logging.basicConfig(
        level=getattr(logging, level_name.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def run_ingestion(
    min_tvl_usd: float | None = None,
    db_path: Path | str | None = None,
    allowed_symbols: set[str] | None = None,
) -> IngestionRunSummary:
    """
    Executes a single end-to-end ingestion cycle.
    Idempotent and safe for cron invocation.
    """
    start_time = time.time()
    logger = logging.getLogger("ingestion_runner")
    logger.info("=== Starting Stablecoin Yield Ingestion Run ===")

    effective_min_tvl = min_tvl_usd if min_tvl_usd is not None else config.default_min_tvl_usd
    target_db = Path(db_path) if db_path else config.default_db_path

    # Initialize persistence
    db_manager = DatabaseManager(db_path=target_db)
    db_manager.initialize_schema()
    repository = YieldRepository(db_manager)

    client = DeFiLlamaClient()
    normalizer = PoolNormalizer(min_tvl_usd=effective_min_tvl, allowed_symbols=allowed_symbols)

    raw_count = 0
    matched_count = 0
    persisted_pools = 0
    persisted_snapshots = 0
    success = False
    error_msg = None

    try:
        # Step 1: Resilient Fetch
        raw_pools = client.fetch_yield_pools_sync()
        raw_count = len(raw_pools)

        # Step 2: Validate, Filter & Normalize
        snapshot_time = datetime.now(timezone.utc)
        normalized_pools, normalized_snapshots = normalizer.process_raw_pools(
            raw_records=raw_pools, snapshot_time=snapshot_time
        )
        matched_count = len(normalized_pools)

        # Step 3: Transactional, Idempotent Storage
        persisted_pools = repository.upsert_pools(normalized_pools)
        persisted_snapshots = repository.insert_snapshots(normalized_snapshots)
        success = True

        duration = time.time() - start_time
        logger.info(
            "=== Ingestion Complete in %.2fs: %d raw -> %d stablecoin pools with TVL >= $%gM ===",
            duration,
            raw_count,
            persisted_pools,
            effective_min_tvl / 1_000_000.0,
        )

    except Exception as e:
        duration = time.time() - start_time
        error_msg = str(e)
        logger.exception("Ingestion run failed after %.2fs: %s", duration, e)
        success = False

    summary = IngestionRunSummary(
        total_raw_records=raw_count,
        matched_stablecoin_records=matched_count,
        persisted_pools=persisted_pools,
        persisted_snapshots=persisted_snapshots,
        min_tvl_threshold=effective_min_tvl,
        duration_seconds=round(time.time() - start_time, 3),
        success=success,
        error_message=error_msg,
    )

    try:
        repository.log_ingestion_run(summary)
    except Exception as log_err:
        logger.error("Failed to write to ingestion audit log: %s", log_err)

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cross-Chain Stablecoin Yield Optimizer — Ingestion Worker"
    )
    parser.add_argument(
        "--min-tvl",
        type=float,
        default=config.default_min_tvl_usd,
        help="Minimum TVL threshold in USD (default: 20000000.0)",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default=str(config.default_db_path),
        help="Path to SQLite database file",
    )
    parser.add_argument(
        "--symbols",
        type=str,
        default=",".join(config.allowed_symbols),
        help="Comma-separated allowed stablecoin symbols (e.g., USDC,USDT,DAI,USDS,USDE)",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level",
    )

    args = parser.parse_args()
    setup_logging(args.log_level)

    allowed = {s.strip().upper() for s in args.symbols.split(",") if s.strip()}
    summary = run_ingestion(
        min_tvl_usd=args.min_tvl,
        db_path=args.db_path,
        allowed_symbols=allowed,
    )

    return 0 if summary.success else 1


if __name__ == "__main__":
    sys.exit(main())
