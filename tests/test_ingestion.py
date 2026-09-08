"""
Unit tests for DeFiLlamaClient network resilience and retry handling.
"""
import httpx
import pytest
from unittest.mock import patch, MagicMock
from src.ingestion.client import DeFiLlamaClient, IngestionError


def test_fetch_yield_pools_success():
    client = DeFiLlamaClient(base_url="https://mock.yields.llama.fi/pools")
    mock_payload = {
        "status": "success",
        "data": [
            {"pool": "p1", "chain": "Ethereum", "project": "aave", "symbol": "USDC", "tvlUsd": 100_000_000, "apy": 5.0}
        ]
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = mock_payload
    mock_resp.raise_for_status.return_value = None

    with patch("httpx.Client.get", return_value=mock_resp):
        pools = client.fetch_yield_pools_sync()
        assert len(pools) == 1
        assert pools[0]["pool"] == "p1"


def test_fetch_yield_pools_retries_on_server_error():
    client = DeFiLlamaClient(base_url="https://mock.yields.llama.fi/pools")
    mock_payload = {
        "status": "success",
        "data": [{"pool": "p-retry", "chain": "Arbitrum", "symbol": "USDC", "tvlUsd": 50_000_000, "apy": 4.0}]
    }

    error_resp = MagicMock()
    error_resp.status_code = 500
    error_resp.raise_for_status.side_effect = httpx.HTTPStatusError("Server Error", request=MagicMock(), response=error_resp)

    success_resp = MagicMock()
    success_resp.json.return_value = mock_payload
    success_resp.raise_for_status.return_value = None

    # Fails once with 500, then succeeds
    with patch("httpx.Client.get", side_effect=[error_resp.raise_for_status.side_effect, success_resp]) as mock_get:
        pools = client.fetch_yield_pools_sync()
        assert len(pools) == 1
        assert pools[0]["pool"] == "p-retry"
        assert mock_get.call_count == 2
