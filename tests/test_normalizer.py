"""
Unit tests for PoolNormalizer filtering, validation, and deduplication logic.
"""
from datetime import datetime, timezone
import pytest
from src.normalizer.validator import PoolNormalizer


@pytest.fixture
def normalizer():
    return PoolNormalizer(
        min_tvl_usd=20_000_000.0,
        allowed_symbols={"USDC", "USDT", "DAI", "USDS", "USDE"},
    )


def test_filters_out_non_stablecoins(normalizer):
    raw_data = [
        {
            "pool": "pool-eth",
            "chain": "Ethereum",
            "project": "lido",
            "symbol": "STETH",
            "tvlUsd": 500_000_000.0,
            "apy": 3.2,
        },
        {
            "pool": "pool-wbtc",
            "chain": "Arbitrum",
            "project": "aave-v3",
            "symbol": "WBTC",
            "tvlUsd": 50_000_000.0,
            "apy": 1.5,
        },
        {
            "pool": "pool-usdc",
            "chain": "Ethereum",
            "project": "aave-v3",
            "symbol": "USDC",
            "tvlUsd": 100_000_000.0,
            "apy": 5.4,
        },
    ]

    pools, snapshots = normalizer.process_raw_pools(raw_data)
    assert len(pools) == 1
    assert len(snapshots) == 1
    assert pools[0].symbol == "USDC"
    assert pools[0].pool_id == "pool-usdc"


def test_filters_pools_below_tvl_threshold(normalizer):
    raw_data = [
        {
            "pool": "pool-small",
            "chain": "Optimism",
            "project": "velodrome",
            "symbol": "USDC",
            "tvlUsd": 5_000_000.0,  # Below $20M
            "apy": 12.0,
        },
        {
            "pool": "pool-large",
            "chain": "Optimism",
            "project": "aave-v3",
            "symbol": "USDC",
            "tvlUsd": 25_000_000.0,  # Above $20M
            "apy": 4.5,
        },
    ]

    pools, snapshots = normalizer.process_raw_pools(raw_data)
    assert len(pools) == 1
    assert pools[0].pool_id == "pool-large"
    assert snapshots[0].tvl_usd == 25_000_000.0


def test_accepts_all_target_stablecoins(normalizer):
    target_stables = ["USDC", "USDT", "DAI", "USDS", "USDE"]
    raw_data = [
        {
            "pool": f"pool-{sym.lower()}",
            "chain": "Ethereum",
            "project": "test-protocol",
            "symbol": sym.lower(),  # Lowercase to test normalization
            "tvlUsd": 30_000_000.0,
            "apy": 4.0,
        }
        for sym in target_stables
    ]

    pools, snapshots = normalizer.process_raw_pools(raw_data)
    assert len(pools) == 5
    symbols_found = {p.symbol for p in pools}
    assert symbols_found == set(target_stables)


def test_rejects_malformed_records(normalizer):
    raw_data = [
        {
            # Missing pool ID
            "chain": "Ethereum",
            "project": "aave",
            "symbol": "USDC",
            "tvlUsd": 50_000_000.0,
            "apy": 5.0,
        },
        {
            # Null APY
            "pool": "pool-null-apy",
            "chain": "Ethereum",
            "project": "aave",
            "symbol": "USDC",
            "tvlUsd": 50_000_000.0,
            "apy": None,
        },
        {
            # Valid record
            "pool": "pool-good",
            "chain": "Ethereum",
            "project": "aave",
            "symbol": "USDC",
            "tvlUsd": 50_000_000.0,
            "apy": 5.2,
        },
    ]

    pools, snapshots = normalizer.process_raw_pools(raw_data)
    assert len(pools) == 1
    assert pools[0].pool_id == "pool-good"


def test_deduplicates_duplicate_pool_ids(normalizer):
    raw_data = [
        {
            "pool": "duplicate-pool",
            "chain": "Ethereum",
            "project": "spark",
            "symbol": "DAI",
            "tvlUsd": 30_000_000.0,
            "apy": 4.0,
        },
        {
            "pool": "duplicate-pool",
            "chain": "Ethereum",
            "project": "spark",
            "symbol": "DAI",
            "tvlUsd": 60_000_000.0,  # Higher TVL should supersede
            "apy": 4.2,
        },
    ]

    pools, snapshots = normalizer.process_raw_pools(raw_data)
    assert len(pools) == 1
    assert snapshots[0].tvl_usd == 60_000_000.0
    assert snapshots[0].apy == 4.2
