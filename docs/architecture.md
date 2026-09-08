# Cross-Chain Stablecoin Yield Optimizer — System Architecture & Specification

## 1. Executive Summary & Design Philosophy
The **Cross-Chain Stablecoin Yield Optimizer** is an institutional-grade, simulation-only analytics platform designed to evaluate, rank, and simulate yield strategies across decentralized finance (DeFi) protocols and blockchain networks. It tracks lending APYs for major stablecoins (USDC, USDT, DAI, USDS, USDe) across protocols such as Aave, Compound, Morpho, and Spark.

### Design Principles:
1. **Separation of Concerns**: Ingestion, normalization, storage, risk modeling, backtesting, and presentation are strictly decoupled. No component directly queries across another's boundary.
2. **Zero Execution Footprint by Architecture**: The system explicitly contains **no private key management, no Web3 transaction signing, and no broadcast mechanisms**. It is mathematically and architecturally incapable of moving live capital.
3. **Idempotency & Reconstructability**: Every risk score and backtest simulation is fully auditable and deterministic based on stored time-series snapshots and model weights.
4. **Resilience & Failure Isolation**: External API outages or rate limits degrade gracefully via cached/stale data flagging rather than crashing downstream engines.

---

## 2. Component Inventory

| Component | Single Responsibility | Inputs | Outputs | Explicit Non-Goals |
| :--- | :--- | :--- | :--- | :--- |
| **Ingestion Worker** (`src/ingestion/`) | Pulls raw pool yields and metadata from external APIs on schedule with retry/backoff. | External API endpoints (DeFiLlama yields), schedule trigger, HTTP config. | Raw API payloads stamped with fetch timestamp and source metadata. | Does NOT validate schemas, filter tokens, compute metrics, or write to domain DB tables. |
| **Normalizer / Validator** (`src/normalizer/`) | Sanitizes heterogeneous schema formats, filters allowed stablecoins and minimum TVL, deduplicates. | Raw API payloads, filter thresholds (`min_tvl`, allowed symbols). | Validated, strongly-typed `NormalizedPool` and `NormalizedSnapshot` objects. | Does NOT fetch data, calculate risk rankings, or manage persistent database connections. |
| **Time-Series Store** (`src/storage/`) | Manages relational and time-series persistence, ensuring idempotent writes and time-window queries. | Normalized pool metadata and snapshot records; date/window query parameters. | Persisted database records, historical series slices. | Does NOT alter data, compute financial metrics, or expose public HTTP endpoints. |
| **Risk Scoring Engine** (`src/scoring/`) | Stateless computation layer calculating composite risk-adjusted yields penalizing low TVL, age, volatility, and chain risk. | Historical snapshot slices (e.g., trailing 30d), parameter weights, chain risk matrix. | Ranked pool scores with breakdown of sub-penalties and plain-English rationale. | Does NOT pull directly from external APIs, does NOT hold persistent state, does NOT trigger notifications. |
| **Backtest Engine** (`src/backtest/`) | Simulates historical capital allocation strategies (e.g. chain-hopping vs. benchmark static holding) accounting for friction. | Historical scored time-series, strategy parameters (rebalance freq, gas/bridge costs, churn buffer). | Cumulative returns, Sharpe ratio, drawdown profiles, transaction logs, benchmark comparison. | Does NOT execute live swaps, does NOT run on automated cron (on-demand only). |
| **Alerting Service** (`src/alerting/`) | Monitors scores, APY spikes, and sudden TVL contractions for early risk detection. | Computed risk scores, threshold configuration, notification targets (Webhook/Email). | Dispatched advisory alerts with metric deltas. | Does NOT execute defensive withdrawals or trade actions. Advisory only. |
| **API Layer** (`src/api/`) | High-performance FastAPI interface exposing sanitized analytical queries to client applications. | Client HTTP requests, query parameters (chain, symbol, date range). | JSON API responses conforming to external contracts. | Does NOT allow write access from clients, does NOT expose raw database queries. |
| **Frontend Dashboard** (`src/frontend/`) | Next.js App Router presentation dashboard rendering rankings, charts, and strategy backtests. | API responses from FastAPI Gateway. | Interactive UI (sortable tables, Recharts visualizations, disclaimer banners). | Does NOT access DB directly, does NOT talk to third-party DeFi APIs, contains no trading widgets. |

---

## 3. Interaction Map & Sequence

### End-to-End Workflow Diagram
```mermaid
flowchart TD
    subgraph External["External World"]
        DeFiLlama["DeFiLlama Yields API"]
    end

    subgraph IngestionBoundary["Ingestion & Normalization Layer"]
        Cron["Cron / CLI Scheduler"] -->|Triggers| IngestionWorker["Ingestion Worker\n(src/ingestion)"]
        IngestionWorker -->|HTTP GET with Retries| DeFiLlama
        DeFiLlama -.->|Raw JSON| IngestionWorker
        IngestionWorker -->|Raw Payload Stream| Normalizer["Normalizer & Validator\n(src/normalizer)"]
        Normalizer -->|Filters: TVL >= $20M & Stables| Normalizer
    end

    subgraph StorageBoundary["Storage Layer (Data Core)"]
        Normalizer -->|Idempotent Upsert| TimeSeriesStore[("Time-Series Store\n(SQLite / PostgreSQL)")]
    end

    subgraph AnalyticalBoundary["Analytical & Modeling Layer (Stateless)"]
        ScoringEngine["Risk Scoring Engine\n(src/scoring)"] -->|Queries Trailing Snapshots| TimeSeriesStore
        ScoringEngine -->|Persists Computed Scores| TimeSeriesStore
        BacktestEngine["Backtest Engine\n(src/backtest)"] -->|Reads Historical Rates| TimeSeriesStore
    end

    subgraph ServingBoundary["Serving & Presentation Layer"]
        FastAPI["FastAPI Analytical Gateway\n(src/api)"] -->|Read-Only Queries| TimeSeriesStore
        FastAPI -->|On-Demand Simulation Run| BacktestEngine
        Dashboard["Next.js 14 Dashboard\n(src/frontend)"] -->|HTTP / JSON (Read-Only)| FastAPI
        Alerting["Advisory Alerting Service\n(src/alerting)"] -->|Polls Anomaly Signals| TimeSeriesStore
    end

    classDef core fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef storage fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef ext fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#fff;
    class IngestionWorker,Normalizer,ScoringEngine,BacktestEngine,FastAPI,Alerting,Dashboard core;
    class TimeSeriesStore storage;
    class DeFiLlama ext;
```

### Execution Flow Sequence:
1. **Scheduled Ingestion**: An isolated runner triggers the `IngestionWorker`.
2. **Resilient Pull**: `IngestionWorker` calls DeFiLlama yields endpoint with exponential backoff (tenacity), circuit breaking, and user-agent spoof prevention.
3. **Pipelined Normalization**: The raw payload is passed to `Normalizer`.
4. **Validation & Filtering**: The normalizer discards records that fail contract validation, have $< \$20\text{M}$ TVL, or are not in the approved stablecoin registry (`USDC`, `USDT`, `DAI`, `USDS`, `USDe`).
5. **Idempotent Persistence**: The `TimeSeriesStore` performs atomic upserts on static pool dimensions and appends timestamped snapshots with unique constraints `(pool_id, timestamp)`.
6. **Stateless Scoring**: The `RiskScoringEngine` reads trailing $N$ days of snapshots to calculate rolling volatility ($\sigma_{\text{APY}}$), protocol age, TVL fragility, and composite scores.
7. **Serving & Presentation**: The `API Layer` queries indexed snapshots and scores, presenting clean data contracts to the `Frontend`.

---

## 4. Data Contracts & Schemas

### Boundary 1: Ingestion $\rightarrow$ Normalizer (Raw Payload)
```json
{
  "pool": "747c1d2a-c668-4682-b9f9-296708a3dd90",
  "chain": "Ethereum",
  "project": "aave-v3",
  "symbol": "USDC",
  "tvlUsd": 125000000.0,
  "apy": 5.42,
  "apyBase": 5.10,
  "apyReward": 0.32,
  "ilRisk": "no",
  "underlyingTokens": ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
  "poolMeta": "Core Instance",
  "mu": 5.2,
  "sigma": 0.15,
  "apyPct1D": 0.05,
  "apyPct7D": -0.12,
  "apyPct30D": 0.45,
  "apyMean30d": 5.18
}
```

### Boundary 2: Normalizer $\rightarrow$ Time-Series Store (Domain Entities)
```python
class NormalizedPool(BaseModel):
    pool_id: str                      # UUID from external source
    chain: str                        # Canonical chain name (e.g., 'Ethereum', 'Arbitrum')
    project: str                      # Canonical protocol name (e.g., 'aave-v3')
    symbol: str                       # Normalized uppercase symbol ('USDC')
    underlying_tokens: list[str] = [] # Contract addresses
    pool_meta: str | None = None      # Market variant / tier
    created_at: datetime
    updated_at: datetime

class NormalizedSnapshot(BaseModel):
    pool_id: str
    timestamp: datetime               # ISO 8601 UTC timestamp
    tvl_usd: float                    # Total Value Locked in USD
    apy: float                        # Net annual percentage yield (%)
    apy_base: float | None = None     # Base organic lending yield (%)
    apy_reward: float | None = None   # Token incentive reward yield (%)
    il_risk: str = "no"               # Impermanent loss flag
    mu: float | None = None           # Moving average metric
    sigma: float | None = None        # Volatility metric
    apy_pct_1d: float | None = None
    apy_pct_7d: float | None = None
    apy_pct_30d: float | None = None
    apy_mean_30d: float | None = None
```

### Boundary 3: Store $\rightarrow$ Scoring Engine $\rightarrow$ API
```python
class PoolRiskScore(BaseModel):
    pool_id: str
    symbol: str
    project: str
    chain: str
    headline_apy: float
    rolling_30d_avg_apy: float
    rolling_30d_volatility: float
    tvl_usd: float
    tvl_score: float                  # 0.0 - 1.0 (penalizes low TVL)
    volatility_penalty: float         # Penalty deduction based on APY standard deviation
    chain_risk_tier: str              # Tier 1 (L1), Tier 2 (Major L2), Tier 3 (Alt L1)
    chain_risk_score: float           # Penalty weight
    composite_score: float            # Final normalized risk-adjusted score (0-100)
    explanation: str                  # Plain-English human-readable rationale
    scored_at: datetime
```

---

## 5. Non-Functional Requirements (NFRs)

1. **Auditability**:
   - Every composite score is deterministic and reproducible. Given a snapshot dataset and a configuration version of risk weights, the score output is identical.
   - Raw DeFiLlama pool IDs are preserved across all layers to ensure third-party verification against public block explorers and DeFiLlama dashboards.
2. **Idempotency**:
   - Database operations use compound primary/unique keys `(pool_id, timestamp)`.
   - Running the ingestion script multiple times within the same hour/day executes `INSERT OR IGNORE` or updates existing records without duplicating historical series.
3. **Failure Isolation**:
   - External network or API errors are captured and logged with structured context. Downstream components (Scorer, API) operate seamlessly on the most recent valid snapshot rather than terminating.
4. **Structural Non-Execution Constraint**:
   - The application does not import `web3.py`, `eth_account`, or private key management tooling. This structural limitation guarantees that no credentials can be leaked or leveraged for fund transfers.
5. **Extensibility**:
   - Adding alternative yield providers (e.g. direct on-chain RPC calls, Morpho Blue GraphQL API) requires only a new adapter adhering to the `IngestionWorker` protocol.

---

## 6. Tech Stack & Architectural Justification

| Technology | Purpose | Justification for Quant/Fintech Portfolio | Production Alternative |
| :--- | :--- | :--- | :--- |
| **Python 3.12** | Core Backend, Ingestion, Normalization, Scorer | Premier language for quant modeling, data science, and financial backtesting. Enables vectorized numerical logic (NumPy/Pandas). | Rust / Go for ultra-low-latency microsecond execution pipelines. |
| **Pydantic v2** | Contract Validation | Provides compile-time typing, high-speed Rust-based serialization, and strict runtime type safety at system boundaries. | Protobuf / gRPC for cross-service RPC. |
| **SQLite (with WAL mode)** | Time-Series Persistence | Zero-config, file-based persistence for local portfolio reproducibility without requiring Docker/external DB services. | PostgreSQL + TimescaleDB for multi-terabyte distributed time-series. |
| **HTTPX + Tenacity** | Resilient Networking | Modern async/sync HTTP client with connection pooling, retries, and exponential backoff. | Distributed queue worker (Celery + RabbitMQ / AWS SQS). |
| **FastAPI** | REST API Layer | Asynchronous, auto-generating OpenAPI documentation, native Pydantic integration. | Internal gRPC gateway. |
| **Next.js 14 (App Router) + Tailwind + Recharts** | Frontend Presentation | Server-side rendering (SSR), clean responsive UI, interactive financial time-series visualization. | Enterprise React/Next.js dashboard. |
