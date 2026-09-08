"""
DeFiLlama Yields API Ingestion Client.
Provides resilient, retrying HTTP fetching with exponential backoff and structured logging.
"""
import logging
from typing import Any
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)
from src.config import config

logger = logging.getLogger(__name__)


class IngestionError(Exception):
    """Base exception for ingestion client failures."""
    pass


class DeFiLlamaClient:
    """
    HTTP client responsible solely for pulling raw yield datasets from DeFiLlama.
    Explicitly does NOT perform filtering, scoring, or persistence.
    """

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        max_retries: int | None = None,
    ):
        self.base_url = base_url or config.defillama_yields_url
        self.timeout = timeout or config.request_timeout_seconds
        self.max_retries = max_retries or config.max_retries
        self.headers = {
            "User-Agent": "CrossChainStablecoinYieldOptimizer/1.0 (quant-research-system)",
            "Accept": "application/json",
        }

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1.5, min=2.0, max=10.0),
        retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    def fetch_yield_pools_sync(self) -> list[dict[str, Any]]:
        """
        Synchronously fetches raw yield pools from DeFiLlama with retries.
        Returns list of raw pool dictionaries.
        """
        logger.info("Initiating synchronous fetch from %s", self.base_url)
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                response = client.get(self.base_url)
                response.raise_for_status()
                data = response.json()
                
                pools = data.get("data", [])
                logger.info(
                    "Successfully fetched %d raw pools from DeFiLlama (status: %s)",
                    len(pools),
                    data.get("status", "ok"),
                )
                return pools
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error %s when fetching %s: %s", e.response.status_code, self.base_url, e)
            raise
        except httpx.RequestError as e:
            logger.error("Network request error when connecting to %s: %s", self.base_url, e)
            raise
        except Exception as e:
            logger.error("Unexpected error during ingestion: %s", e)
            raise IngestionError(f"Failed to fetch pools from DeFiLlama: {e}") from e

    async def fetch_yield_pools_async(self) -> list[dict[str, Any]]:
        """
        Asynchronously fetches raw yield pools from DeFiLlama with retries.
        """
        logger.info("Initiating async fetch from %s", self.base_url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(self.base_url)
                response.raise_for_status()
                data = response.json()
                pools = data.get("data", [])
                logger.info("Successfully fetched %d raw pools asynchronously", len(pools))
                return pools
        except Exception as e:
            logger.error("Async fetch failed: %s", e)
            raise IngestionError(f"Async fetch failed: {e}") from e
