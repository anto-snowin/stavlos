"""
Unit tests for FastAPI Analytical Gateway.
"""
from fastapi.testclient import TestClient
import pytest

from src.api.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "monitored_pools" in data
    assert data["execution_capability"] == "none (strictly read-only)"


def test_root_info(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "project" in data
    assert "disclaimer" in data


def test_get_ranked_pools(client):
    response = client.get("/api/v1/pools/ranked?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        pool = data[0]
        assert "composite_score" in pool
        assert "headline_apy" in pool
        assert "explanation" in pool
        assert "tvl_score" in pool


def test_get_ranked_pools_filtered(client):
    response = client.get("/api/v1/pools/ranked?chain=Ethereum&symbol=USDC&limit=5")
    assert response.status_code == 200
    data = response.json()
    for item in data:
        assert item["chain"].lower() == "ethereum"
        assert item["symbol"].upper() == "USDC"


def test_get_historical_trends(client):
    response = client.get("/api/v1/pools/historical?days=30")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_run_backtest_simulation(client):
    response = client.get("/api/v1/backtest/run?days=60&rebalance_freq=7")
    assert response.status_code == 200
    data = response.json()
    assert "strategy_metrics" in data
    assert "benchmark_metrics" in data
    assert "net_alpha_pct" in data
    assert "equity_curve" in data
    assert len(data["equity_curve"]) > 0
