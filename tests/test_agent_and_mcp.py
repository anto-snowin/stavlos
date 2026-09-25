"""
Tests for Chain Yield Optimizer Agent and Model Context Protocol (MCP) Server.
Verifies autonomous chain analysis and strict human consent enforcement.
"""
import pytest
from fastapi.testclient import TestClient

from src.agent.chain_optimizer import ChainOptimizerAgent
from src.api.main import app
from src.mcp_server import (
    analyze_chains_yield,
    get_best_performing_chain,
    simulate_stablecoin_transfer,
    request_transfer_authorization,
    execute_chain_transfer,
)


@pytest.fixture
def agent():
    return ChainOptimizerAgent()


@pytest.fixture
def client():
    return TestClient(app)


def test_agent_analyze_chains(agent):
    res = agent.analyze_chains(symbol="USDC")
    assert res.best_chain is not None
    assert len(res.chains) > 0
    assert res.best_pool_score >= 0.0
    assert "best performing" in res.quant_rationale.lower() or len(res.quant_rationale) > 10


def test_agent_simulate_transfer(agent):
    sim = agent.simulate_transfer(
        source_chain="Ethereum",
        destination_chain="Arbitrum",
        token="USDC",
        amount=50_000.0,
    )
    assert sim.source_chain == "Ethereum"
    assert sim.destination_chain == "Arbitrum"
    assert sim.amount == 50_000.0
    assert sim.total_friction_usd > 0
    assert sim.bridge_fee_usd == 50_000.0 * 0.0005


def test_agent_consent_enforcement(agent):
    # Request authorization
    auth = agent.request_authorization(
        source_chain="Ethereum",
        destination_chain="Arbitrum",
        token="USDC",
        amount=25_000.0,
    )
    assert auth.auth_id.startswith("auth_")
    assert auth.status == "PENDING_USER_APPROVAL"
    assert "WITHOUT YOUR EXPLICIT AUTHORIZATION" in auth.consent_required_message.upper()

    # Attempt execution with consent=False -> Must reject!
    denied = agent.execute_transfer_with_user_consent(auth.auth_id, user_consent=False)
    assert denied.executed is False
    assert denied.status == "ABORTED_NO_USER_CONSENT"
    assert "Zero funds moved" in denied.message

    # Attempt execution with consent=True -> Must succeed!
    auth2 = agent.request_authorization("Ethereum", "Arbitrum", "USDC", 25_000.0)
    approved = agent.execute_transfer_with_user_consent(auth2.auth_id, user_consent=True)
    assert approved.executed is True
    assert approved.status == "CONFIRMED_SUCCESS"
    assert approved.tx_hash is not None
    assert approved.tx_hash.startswith("0x")


def test_api_agent_endpoints(client):
    # 1. Analyze
    r_an = client.get("/api/v1/agent/analyze?symbol=USDC")
    assert r_an.status_code == 200
    data_an = r_an.json()
    assert "best_chain" in data_an
    assert "chains" in data_an

    # 2. Simulate
    r_sim = client.post(
        "/api/v1/agent/simulate",
        json={
            "source_chain": "Ethereum",
            "destination_chain": "Arbitrum",
            "token": "USDC",
            "amount": 10000.0,
        },
    )
    assert r_sim.status_code == 200
    data_sim = r_sim.json()
    assert "total_friction_usd" in data_sim

    # 3. Request Auth
    r_req = client.post(
        "/api/v1/agent/request-auth",
        json={
            "source_chain": "Ethereum",
            "destination_chain": "Arbitrum",
            "token": "USDC",
            "amount": 10000.0,
        },
    )
    assert r_req.status_code == 200
    auth_id = r_req.json()["auth_id"]

    # 4. Denied without consent
    r_exec_denied = client.post(
        "/api/v1/agent/execute",
        json={"auth_id": auth_id, "user_consent": False},
    )
    assert r_exec_denied.status_code == 200
    assert r_exec_denied.json()["executed"] is False

    # 5. Approved with consent
    r_req2 = client.post(
        "/api/v1/agent/request-auth",
        json={
            "source_chain": "Ethereum",
            "destination_chain": "Arbitrum",
            "token": "USDC",
            "amount": 10000.0,
        },
    )
    auth_id2 = r_req2.json()["auth_id"]
    r_exec_ok = client.post(
        "/api/v1/agent/execute",
        json={"auth_id": auth_id2, "user_consent": True},
    )
    assert r_exec_ok.status_code == 200
    assert r_exec_ok.json()["executed"] is True
    assert r_exec_ok.json()["tx_hash"] is not None


def test_mcp_tools():
    # Verify MCP tools return valid dicts
    chains = analyze_chains_yield()
    assert "best_chain" in chains

    best = get_best_performing_chain()
    assert "best_chain" in best
    assert "headline_apy" in best

    sim = simulate_stablecoin_transfer("Ethereum", "Arbitrum", "USDC", 20000.0)
    assert sim["source_chain"] == "Ethereum"

    auth = request_transfer_authorization("Ethereum", "Arbitrum", "USDC", 20000.0)
    auth_id = auth["auth_id"]

    denied = execute_chain_transfer(auth_id, user_consent=False)
    assert denied["executed"] is False

    auth2 = request_transfer_authorization("Ethereum", "Arbitrum", "USDC", 20000.0)
    approved = execute_chain_transfer(auth2["auth_id"], user_consent=True)
    assert approved["executed"] is True
