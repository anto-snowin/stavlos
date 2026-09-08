# Cross-Chain Stablecoin Yield Optimizer

An institutional-grade, simulation-only DeFi yield analytics platform designed for quant, fintech, and data engineering portfolios. It tracks, normalizes, risk-adjusts, and simulates cross-chain stablecoin lending yields (USDC, USDT, DAI, USDS, USDe) across Aave, Compound, Morpho, Spark, and other major protocols.

> **Architectural Constraint**: This system is strictly analytical and advisory. It contains **no private keys, no Web3 wallet connection, and no transaction broadcast mechanisms**. It cannot sign or move live capital.

---

## System Architecture

```
d:/stavlos/
├── docs/
│   └── architecture.md            # Comprehensive architecture doc & Mermaid diagrams
├── src/
│   ├── config.py                  # Global application & threshold configuration
│   ├── shared_schemas/
│   │   └── models.py              # Pydantic boundary contracts (Pool, Snapshot, Audit)
│   ├── ingestion/
│   │   └── client.py              # DeFiLlama yields API client with retries & backoff
│   ├── normalizer/
│   │   └── validator.py           # Symbol validation, TVL filtering (>= $20M), deduplication
│   ├── storage/
│   │   ├── database.py            # SQLite connection manager with WAL & foreign keys
│   │   └── repository.py          # Idempotent persistence layer for pools & snapshots
│   ├── scoring/                   # Risk scoring engine (Phase 2)
│   ├── backtest/                  # Historical strategy backtester (Phase 3)
│   ├── alerting/                  # Advisory alerting service (Phase 5)
│   ├── api/                       # FastAPI analytical gateway (Phase 4)
│   └── cli/
│       └── ingest.py              # Standalone, cron-ready ingestion entrypoint
├── tests/
│   ├── test_ingestion.py          # Network retry and client resilience tests
│   ├── test_normalizer.py         # Filtering, validation, and deduplication tests
│   └── test_storage.py            # Persistence, idempotency, and query tests
├── requirements.txt               # Dependencies
└── data/
    └── yields.db                  # Local SQLite time-series store (created upon ingestion)
```

---

## Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Ingestion (Phase 1)
Run the standalone cron-ready ingestion script:
```bash
python -m src.cli.ingest
```

Custom options:
```bash
python -m src.cli.ingest --min-tvl 25000000 --db-path data/yields.db --symbols USDC,USDT,DAI,USDS,USDE
```

### 3. Run Risk Scoring Engine (Phase 2)
Evaluate risk-adjusted scores across the 5 penalty dimensions:
```bash
python -m src.cli.score
```

Custom options:
```bash
# Evaluate with Arbitrum as home chain and display top 15
python -m src.cli.score --home-chain Arbitrum --limit 15

# Output JSON format
python -m src.cli.score --json
```

### 4. Run Automated Tests
```bash
python -m pytest -v
```

---

## Phase Status & Checkpoints

- [x] **Phase 0 — Scope & Architecture**: Written architecture document (`docs/architecture.md`), Mermaid sequence & component diagrams, modular repository scaffolding.
- [x] **Phase 1 — Data Ingestion Layer**: Resilient DeFiLlama client with retries, Pydantic normalizer with $\ge \$20\text{M}$ TVL and stablecoin filtering, idempotent SQLite time-series storage, CLI runner, and 11 unit tests.
- [x] **Phase 2 — Risk Scoring Model**: Pure stateless scoring engine penalizing low TVL, short protocol age, 30d APY volatility, chain risk tiers, and bridge friction; deterministic plain-English explanations; CLI table generator; 18 unit tests.
- [ ] **Phase 3 — Backtesting Engine** (Next)
- [ ] **Phase 4 — Dashboard (Next.js)**
- [ ] **Phase 5 — Alerting**
- [ ] **Phase 6 — Portfolio Positioning**
