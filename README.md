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

### 4. Run Backtesting Engine (Phase 3)
Replay historical multi-month time-series and simulate capital allocation vs. static Aave USDC holding:
```bash
python -m src.cli.backtest --days 180 --rebalance-freq 7 --min-holding 7 --churn-penalty 0.75
```

Custom options:
```bash
# Sync multi-month daily history from DeFiLlama first
python -m src.cli.backtest --sync-history --days 180

# Save daily equity curve to CSV
python -m src.cli.backtest --days 180 --save-csv data/equity_curve.csv

# Output full simulation statistics as JSON
python -m src.cli.backtest --json
```

### 5. Run Web Dashboard (Phase 4)
Start the FastAPI backend and the Next.js App Router frontend:

1. **Start the FastAPI Backend**:
```bash
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000
```

2. **Start the Next.js Frontend**:
```bash
cd frontend
npm run dev
# Or run the optimized production bundle:
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

### 6. Run Advisory Alerting Service (Phase 5)
Monitor pools for sudden TVL contractions, APY spikes, and risk grade transitions:

```bash
# Run synthetic market shock simulation (Phase 5 Checkpoint verification):
python -m src.cli.alert --simulate

# Run live anomaly detection across stored active pools:
python -m src.cli.alert --check

# Run with custom Webhook and sensitivity thresholds:
python -m src.cli.alert --check --webhook-url https://hooks.slack.com/... --tvl-drop 15 --apy-spike 5.0
```

### 7. Run Automated Tests
Run the comprehensive 35-test suite covering ingestion, normalization, storage, scoring, backtesting, FastAPI endpoints, and alerting:
```bash
python -m pytest -v
```

---

## Phase Status & Checkpoints

- [x] **Phase 0 — Scope & Architecture**: Written architecture document (`docs/architecture.md`), Mermaid sequence & component diagrams, modular repository scaffolding.
- [x] **Phase 1 — Data Ingestion Layer**: Resilient DeFiLlama client with retries, Pydantic normalizer with $\ge \$20\text{M}$ TVL and stablecoin filtering, idempotent SQLite time-series storage, CLI runner, and 11 unit tests.
- [x] **Phase 2 — Risk Scoring Model**: Pure stateless scoring engine penalizing low TVL, short protocol age, 30d APY volatility, chain risk tiers, and bridge friction; deterministic plain-English explanations; CLI table generator; 18 unit tests.
- [x] **Phase 3 — Backtesting Engine**: Replays historical yields; models gas friction, bridge fees, minimum lockup, and churn hurdles; outputs side-by-side performance reports, trade logs, and ASCII equity curves; 23 unit tests.
- [x] **Phase 4 — Dashboard (Next.js)**: Full-stack institutional dashboard; FastAPI analytical gateway; sortable ranked pool table with quantitative audit drawers; Recharts historical APY trends; interactive 180d backtest visualizer; persistent non-execution disclaimer banner.
- [x] **Phase 5 — Alerting**: Automated monitoring service detecting TVL contractions ($\le -15\%$), APY surges ($\ge +5\%$), and risk grade drops; multi-channel dispatchers (Console, SQLite DB, Webhook); synthetic market shock test suite with 35 passing tests.
- [ ] **Phase 6 — Portfolio Positioning**

