"""
Unit tests for the Risk Scoring Engine.
Verifies TVL scaling, age penalties, volatility drag, chain risk tiers,
bridge friction, and plain-English rationale generation.
"""
import pytest
from src.scoring.config import ScoringConfig
from src.scoring.engine import RiskScorer


@pytest.fixture
def default_scorer():
    return RiskScorer(ScoringConfig(home_chain="Ethereum"))


def test_tvl_penalty_scales_with_liquidity_depth(default_scorer):
    # Base template pool
    template = {
        "pool_id": "test-p1",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "apy": 5.0,
        "apy_mean_30d": 5.0,
        "sigma": 0.02,
        "count": 400,
    }

    low_tvl = {**template, "pool_id": "low-tvl", "tvl_usd": 20_000_000.0}
    high_tvl = {**template, "pool_id": "high-tvl", "tvl_usd": 1_000_000_000.0}

    score_low = default_scorer.score_pool(low_tvl)
    score_high = default_scorer.score_pool(high_tvl)

    assert score_high.tvl_score > score_low.tvl_score
    assert score_high.composite_score > score_low.composite_score
    assert score_high.tvl_score == 1.0
    assert score_low.tvl_score == 0.10


def test_protocol_age_penalizes_untested_pools(default_scorer):
    template = {
        "pool_id": "test-age",
        "chain": "Ethereum",
        "project": "morpho",
        "symbol": "USDC",
        "apy": 5.0,
        "apy_mean_30d": 5.0,
        "tvl_usd": 100_000_000.0,
        "sigma": 0.03,
    }

    young_pool = {**template, "pool_id": "young", "count": 30}
    mature_pool = {**template, "pool_id": "mature", "count": 400}

    score_young = default_scorer.score_pool(young_pool)
    score_mature = default_scorer.score_pool(mature_pool)

    assert score_mature.age_score > score_young.age_score
    assert score_mature.composite_score > score_young.composite_score
    assert score_mature.age_score == 1.0


def test_volatility_drag_penalizes_spiky_rates(default_scorer):
    template = {
        "pool_id": "test-vol",
        "chain": "Ethereum",
        "project": "spark",
        "symbol": "DAI",
        "apy": 7.0,
        "apy_mean_30d": 7.0,
        "tvl_usd": 150_000_000.0,
        "count": 300,
    }

    stable_rate = {**template, "pool_id": "stable", "sigma": 0.02}
    spiky_rate = {**template, "pool_id": "spiky", "sigma": 0.80}

    score_stable = default_scorer.score_pool(stable_rate)
    score_spiky = default_scorer.score_pool(spiky_rate)

    assert score_stable.volatility_score > score_spiky.volatility_score
    assert score_stable.composite_score > score_spiky.composite_score


def test_chain_risk_tier_penalizes_lower_tier_chains(default_scorer):
    template = {
        "project": "aave-v3",
        "symbol": "USDC",
        "apy": 5.0,
        "apy_mean_30d": 5.0,
        "tvl_usd": 200_000_000.0,
        "sigma": 0.03,
        "count": 365,
    }

    eth_pool = {**template, "pool_id": "p-eth", "chain": "Ethereum"}
    arb_pool = {**template, "pool_id": "p-arb", "chain": "Arbitrum"}
    unknown_pool = {**template, "pool_id": "p-unk", "chain": "ExperimentalChain"}

    s_eth = default_scorer.score_pool(eth_pool)
    s_arb = default_scorer.score_pool(arb_pool)
    s_unk = default_scorer.score_pool(unknown_pool)

    assert s_eth.chain_risk_score == 1.00
    assert s_arb.chain_risk_score == 0.85
    assert s_unk.chain_risk_score == 0.45
    assert s_eth.composite_score > s_arb.composite_score > s_unk.composite_score


def test_bridging_penalty_relative_to_home_chain():
    # Home chain = Arbitrum
    scorer_arb = RiskScorer(ScoringConfig(home_chain="Arbitrum"))

    template = {
        "project": "compound-v3",
        "symbol": "USDC",
        "apy": 5.0,
        "apy_mean_30d": 5.0,
        "tvl_usd": 100_000_000.0,
        "sigma": 0.03,
        "count": 300,
    }

    # On Arbitrum (home)
    local_pool = {**template, "pool_id": "p-local", "chain": "Arbitrum"}
    # Remote on Solana
    remote_pool = {**template, "pool_id": "p-remote", "chain": "Solana"}

    s_local = scorer_arb.score_pool(local_pool)
    s_remote = scorer_arb.score_pool(remote_pool)

    assert s_local.bridge_score == 1.00
    assert s_remote.bridge_score < 1.00


def test_batch_scoring_ranks_descending(default_scorer):
    pools = [
        {"pool_id": "p1", "chain": "Ethereum", "project": "maple", "symbol": "USDC", "apy": 3.0, "tvl_usd": 50_000_000, "count": 200, "sigma": 0.05},
        {"pool_id": "p2", "chain": "Ethereum", "project": "aave", "symbol": "USDC", "apy": 6.0, "tvl_usd": 800_000_000, "count": 500, "sigma": 0.01},
        {"pool_id": "p3", "chain": "Solana", "project": "jupiter", "symbol": "USDC", "apy": 4.0, "tvl_usd": 40_000_000, "count": 90, "sigma": 0.15},
    ]

    ranked = default_scorer.score_pools(pools)
    assert len(ranked) == 3
    assert ranked[0].pool_id == "p2"  # Blue-chip Aave with high TVL and yield
    for i in range(len(ranked) - 1):
        assert ranked[i].composite_score >= ranked[i + 1].composite_score


def test_explanation_is_informative(default_scorer):
    pool = {
        "pool_id": "p-exp",
        "chain": "Ethereum",
        "project": "aave-v3",
        "symbol": "USDC",
        "apy": 5.2,
        "apy_mean_30d": 5.1,
        "tvl_usd": 650_000_000.0,
        "count": 450,
        "sigma": 0.02,
    }
    score = default_scorer.score_pool(pool)
    assert "Aave-V3" in score.explanation
    assert "USDC" in score.explanation
    assert "Score:" in score.explanation
