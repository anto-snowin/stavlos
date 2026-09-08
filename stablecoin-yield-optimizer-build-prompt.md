# Build Prompt: Cross-Chain Stablecoin Yield Optimizer

Copy each phase below into your AI coding assistant (Claude Code, Cursor, etc.) one at a time, in order. Each phase builds on the last and ends with a working, testable checkpoint — don't move to the next phase until the current one runs.

---

## Phase 0 — Scope & Architecture

**Prompt:**
> Act as a senior DeFi/backend systems architect. I'm building a "Cross-Chain Stablecoin Yield Optimizer" — a system that tracks stablecoin lending APYs (USDC, USDT, DAI) across multiple chains and protocols (Aave, Compound, Morpho, Spark), scores them on a risk-adjusted basis, and produces recommendations (simulation only — no live fund movement) on where capital should theoretically sit. This is a portfolio project for data science / quant / fintech job applications, so the architecture needs to demonstrate real engineering rigor, not just a script that prints numbers.
>
> Design the full system architecture before writing any code. Work through each of the following in order and don't collapse them together:
>
> **1. Component inventory** — for each component below, specify its single responsibility, its inputs, its outputs, and what it explicitly does NOT do:
>    - **Ingestion Worker** — pulls raw pool data from external APIs on a schedule
>    - **Normalizer/Validator** — reconciles inconsistent fields across sources (different protocols report TVL, chain names, and pool IDs differently), rejects malformed records, deduplicates
>    - **Time-Series Store** — persists every snapshot, not just the latest value, since scoring and backtesting both depend on history
>    - **Risk Scoring Engine** — pure computation layer, stateless, takes a batch of pool records + a config of weights/thresholds and returns ranked scores; must be swappable/testable in isolation from the rest of the system
>    - **Backtest Engine** — replays historical scored data against strategy rules and produces performance metrics; reads from the same store the scoring engine writes to, but runs independently and on-demand rather than on a schedule
>    - **Alerting Service** — subscribes to score/threshold changes and pushes notifications; must not be able to trigger any execution action, only notify
>    - **API Layer** — the only component the frontend is allowed to talk to; wraps the DB and scoring/backtest engines so the frontend never queries the database directly
>    - **Frontend (Next.js dashboard)** — presentation only, no business logic, no direct DB or third-party API access
>
> **2. Interaction map** — describe how data actually flows between these components as a numbered sequence (e.g., "1. Ingestion Worker calls DeFiLlama API on a cron schedule → 2. raw response passed to Normalizer → 3. Normalizer writes validated rows to Time-Series Store → 4. Scoring Engine reads latest N days from Time-Series Store on each run → 5. Scoring Engine writes ranked results to a separate scores table → 6. API Layer reads from scores table (never raw ingestion data) → 7. Frontend polls API Layer"). Call out which interactions are synchronous vs. scheduled/async, and where a failure in one component should NOT be allowed to cascade and break another (e.g., a scoring engine bug should never corrupt raw historical data).
>
> **3. Data contracts** — define the schema/shape of data passed between each component boundary (ingestion→store, store→scoring engine, scoring engine→API, API→frontend), so components can be built and tested independently against an agreed contract rather than against each other's implementation.
>
> **4. Non-functional requirements** — explicitly address:
>    - **Auditability**: every score must be traceable back to the raw inputs and weights that produced it (a reviewer/interviewer should be able to ask "why did pool X rank #1 on date Y" and get a reconstructable answer)
>    - **Idempotency**: re-running ingestion for the same time window should not duplicate data
>    - **Failure isolation**: an external API being down or rate-limiting should degrade gracefully (stale-but-labeled data) rather than crash the pipeline
>    - **No execution capability anywhere in the system**: state explicitly, as an architectural constraint (not just a policy note), that no component holds private keys or can sign/broadcast transactions — this should be structurally true, not just avoided by convention
>    - **Extensibility**: adding a new protocol or chain should mean writing one new adapter, not touching the scoring/backtest/API layers
>
> **5. Tech stack with justification** — Python for ingestion/normalization/scoring/backtesting; Postgres (or SQLite for local dev) for the time-series store, with a schema proposal for the pools and snapshots tables; a thin API layer (FastAPI) between the Python backend and the Next.js frontend; state why each choice fits a portfolio project versus a production system (e.g., where you're intentionally keeping things simple vs. where rigor matters for demonstrating skill).
>
> **6. Deliverables** — a written architecture doc (component inventory + interaction map + data contracts + non-functional requirements as sections), a component/sequence diagram in Mermaid syntax I can render, and a repo folder structure that mirrors the component boundaries (e.g., `/ingestion`, `/scoring`, `/backtest`, `/api`, `/frontend`, `/shared_schemas`).
>
> Do not write implementation code yet — architecture doc, diagram, and folder scaffold only. Flag any place where you had to make an assumption on my behalf so I can confirm or correct it.

**Checkpoint:** You have a written architecture doc, a Mermaid diagram, and a repo skeleton whose folder boundaries match the component boundaries — and you can explain, in your own words, why each component doesn't touch the others directly.

---

## Phase 1 — Data Ingestion Layer

**Prompt:**
> Build the data ingestion module. It should:
> 1. Pull stablecoin pool data (APY, TVL, chain, protocol, pool ID) from the DeFiLlama yields API (`https://yields.llama.fi/pools`)
> 2. Filter to stablecoin pools only (USDC, USDT, DAI, USDS, USDe) with TVL above a configurable minimum threshold (default $20M, to exclude thin/manipulable pools)
> 3. Store a timestamped snapshot in the database on each run — I want historical APY series per pool, not just current rates
> 4. Handle API failures gracefully with retries and logging
>
> Write this as a standalone script I can run on a schedule (cron-ready), plus unit tests for the filtering logic.

**Checkpoint:** Running the script populates the DB with real current pool data.

---

## Phase 2 — Risk Scoring Model

**Prompt:**
> Build a risk-adjusted scoring layer on top of the raw pool data. A pool's raw APY should NOT be the sole ranking signal — build a composite score that penalizes:
> 1. Low TVL (thin pools = fragile, manipulable)
> 2. Very short pool/protocol age (newer = less battle-tested)
> 3. High APY volatility over the trailing 30-day window (a spiky, incentive-driven rate should score lower than a stable one at a lower headline rate)
> 4. Chain risk tier — let me pass in a manual risk tier per chain (e.g., Ethereum mainnet = lowest risk, established L2s = medium, new/unaudited chains = high) since this isn't something an API gives you
> 5. Bridging cost/complexity if moving from a "home chain" I specify to the target chain
>
> Output a ranked table: pool, chain, protocol, headline APY, 30-day avg APY, composite risk-adjusted score, and a plain-English one-line explanation of why it scored the way it did.

**Checkpoint:** Running the scorer on your Phase 1 data produces a sensible ranked list — sanity-check it manually against what you already know about these protocols.

---

## Phase 3 — Backtesting Engine

**Prompt:**
> Build a backtester that answers: "if I had followed this chain-hopping strategy over the last N days versus just holding in one blue-chip pool (e.g., Aave USDC mainnet), what would net returns have looked like after estimated gas/bridge fees and a minimum holding period to avoid excessive churn?"
>
> Parameters to make configurable: rebalance frequency, minimum holding period, per-transaction fee estimate, and a "churn penalty" that discourages moving for small APY gains. Output a comparison chart and summary stats (total return, number of moves, worst drawdown from a depeg or rate collapse event if you can identify one in the historical data).

**Checkpoint:** You have a backtest report showing whether active chain-hopping actually beat a static position after realistic costs — this is the most important phase, since it tests the actual thesis.

---

## Phase 4 — Dashboard (Next.js)

**Prompt:**
> Build the dashboard frontend as a Next.js app (App Router, TypeScript). It should:
> 1. Expose the scoring/backtest data via a simple API layer — either Next.js API routes/route handlers that read from the DB directly, or a small FastAPI backend the Next.js app calls, your call given the rest of the stack is Python
> 2. Show current top-ranked pools by risk-adjusted score in a sortable table
> 3. Show historical APY trend lines per chain (Recharts or a similar charting lib)
> 4. Show the backtest results from Phase 3 (chain-hopping vs. static position, over time)
> 5. Display a clear, persistent disclaimer that this is informational only and not a live trading/lending system
> 6. Use server components for the initial data load and client components only where interactivity (sorting, chain filters) requires it
>
> Keep it read-only — no wallet connection, no transaction signing, in this phase.

**Checkpoint:** You can open the dashboard locally and see live-ish data.

---

## Phase 5 — Alerting (optional)

**Prompt:**
> Add an alerting layer that notifies me (email/Telegram/webhook — your choice) when a pool's risk-adjusted score crosses a threshold I set, or when a pool I'm "watching" has a sudden APY spike or TVL drop (an early depeg/exploit warning signal). This stays read-only/advisory — no automated execution.

**Checkpoint:** Test alert fires correctly on synthetic threshold-breaching data.

---

## Phase 6 — Portfolio Positioning (write-up, not code)

**Prompt:**
> Now step back from code. Using the backtest results, write a one-page summary of: what this project demonstrates technically (data engineering, financial risk modeling, backtesting rigor), what its real-world limitations are (no live execution, simulated fees, no on-chain security audit), and how it fits as a portfolio piece for data science / quant / fintech roles.

**Checkpoint:** You have a project write-up ready to drop into a portfolio or README.

---

### Notes on scope
- This build stays **simulation/advisory only** by design — it never signs or moves real funds. That's a deliberate, defensible portfolio choice: it lets you show the analytical rigor (data engineering + risk modeling + backtesting) without taking on custody, security-audit, or smart-contract-execution risk that a real fund-moving bot would require.
- If you want to extend it later to actual execution, that's a separate, much higher-stakes project (wallet key management, transaction signing, slippage/MEV protection) — treat it as phase 7+ only after the analytics layers above are solid.
