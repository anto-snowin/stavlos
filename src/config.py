"""
Configuration settings for Cross-Chain Stablecoin Yield Optimizer.
Allows environment variable overrides and sensible quant defaults.
"""
from dataclasses import dataclass, field
import os
from pathlib import Path


@dataclass(frozen=True)
class AppConfig:
    # External Endpoints
    defillama_yields_url: str = os.getenv(
        "DEFILLAMA_YIELDS_URL", "https://yields.llama.fi/pools"
    )
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0"))
    max_retries: int = int(os.getenv("MAX_RETRIES", "3"))
    retry_backoff_factor: float = float(os.getenv("RETRY_BACKOFF_FACTOR", "2.0"))

    # Filtering Criteria
    default_min_tvl_usd: float = float(os.getenv("MIN_TVL_USD", "20000000.0"))  # $20M
    allowed_symbols: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            os.getenv("ALLOWED_STABLECOINS", "USDC,USDT,DAI,USDS,USDE").split(",")
        )
    )

    # Persistence
    default_db_path: Path = field(
        default_factory=lambda: Path(os.getenv("DB_PATH", "data/yields.db"))
    )


config = AppConfig()
