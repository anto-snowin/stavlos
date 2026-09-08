# Cross-Chain Stablecoin Yield Optimizer: Portfolio Case Study & Quantitative Write-Up

## Executive Summary

The **Cross-Chain Stablecoin Yield Optimizer** (`stavlos`) is an institutional-grade, simulation-only DeFi yield analytics platform designed to solve a core capital allocation challenge: **Does active yield rotation across decentralized lending markets generate genuine risk-adjusted alpha over passive single-protocol holding after accounting for real-world transaction friction, bridge fees, and lockup penalties?**

Rather than treating high nominal APYs as free alpha, this platform implements an end-to-end quantitative pipeline—spanning automated data ingestion, multi-factor risk scoring, historical time-series replay, and advisory alerting—to separate authentic sustainable yield from ephemeral incentive traps and protocol vulnerabilities.

---

## 1. What This Project Demonstrates Technically

### A. Production Data Engineering & Resilience
- **High-Throughput Ingestion with Failure Isolation**: Engineered a resilient client integrating DeFiLlama's live and historical endpoints (`/pools` and `/chart/{pool_id}`). Handled external rate limits, transient HTTP 5xx errors, and network disconnects using an exponential backoff loop with jitter via `tenacity`.
- **Strict Boundary Normalization & Validation**: Enforced strict Pydantic v2 schemas at the system boundary. Ingestion normalizes and validates tens of thousands of pools across 20+ chains down to institutional stablecoin assets (`USDC`, `USDT`, `DAI`, `USDS`, `USDe`) with a liquidity depth floor ($\ge \$20\text{M}$ TVL), eliminating micro-cap pools susceptible to oracle manipulation.
- **Idempotent Time-Series Architecture**: Configured SQLite with Write-Ahead Logging (WAL), normalized foreign key cascades, and compound unique constraints on `(pool_id, timestamp)`. Re-running ingestion or historical synchronization is completely idempotent (`ON CONFLICT DO UPDATE`), preventing duplicate data entries.

### B. Quantitative Financial Risk Modeling
High headline APY in DeFi is almost always compensation for unpriced risks. The system decomposes pool yields through a pure, stateless multi-factor penalty engine:
1. **Liquidity Depth Factor ($S_{\text{TVL}} \in [0.10, 1.00]$)**: Log-scaled penalty reflecting capital exit capacity and market depth between $\$20\text{M}$ and $\$1\text{B}$.
2. **Protocol Maturity & Track Record ($S_{\text{Age}} \in [0.20, 1.00]$)**: Linear scale penalizing unbattle-tested protocols under 365 days of tracked history against economic exploits.
3. **Trailing 30-Day APY Volatility Drag ($P_{\text{Vol}} \in [0.20, 1.00]$)**: Measures rate variance and coefficient of variation ($CV = \sigma / \mu$) over rolling 30-day windows, discounting short-lived liquidity squeezes and token emission surges.
4. **Chain Settlement & Security Tier ($S_{\text{Chain}} \in [0.45, 1.00]$)**: Quantifies underlying consensus finality and validator security (Ethereum L1 = 1.00; Canonical Rollups = 0.85; Alternate L1s = 0.45–0.70).
5. **Cross-Chain Bridge Friction & Complexity ($S_{\text{Bridge}} \in [0.65, 1.00]$)**: Models transfer risk relative to an institution's configured `home_chain`.
- **Composite Risk Score & Risk-Adjusted APY**:
  $$\text{Risk Multiplier} = 0.25 S_{\text{TVL}} + 0.20 S_{\text{Age}} + 0.20 P_{\text{Vol}} + 0.20 S_{\text{Chain}} + 0.15 S_{\text{Bridge}}$$
  $$\text{Composite Score} = \text{clip}\left(\text{Headline APY} \times \text{Risk Multiplier} \times 10,\, 0,\, 100\right)$$
- **Deterministic Explainability**: Generates human-readable plain-English audit trails decomposing why a specific pool was penalized, essential for institutional investment committees.

### C. Empirical Backtesting Rigor & Alpha Attribution
- **Thesis Validation**: Tested whether active multi-hop capital rebalancing outperforms a static position in `Aave v3 USDC (Ethereum)` across 180 days of daily historical yield observations (5,609 synchronized data points).
- **Realistic Friction Modeling**:
  - Fixed gas cost: $\$20.00$ per transaction.
  - Bridge slippage: $0.05\%$ per cross-chain transfer.
  - Churn hurdle threshold: Strategy requires a minimum $+0.75\%$ annualized yield delta before authorizing a capital shift.
  - Minimum lockup holding period: 7-day lockup prevents overtrading and high-frequency friction bleed.
- **Empirical Backtest Result**:
  - **Active Strategy**: $+2.31\%$ 180d net return (Annualized: $+4.68\%$) across 3 strategic hops with $\$70.00$ total friction.
  - **Aave USDC Benchmark**: $+1.78\%$ 180d net return (Annualized: $+3.62\%$).
  - **Net Alpha Generated**: $+0.53\%$ net alpha over benchmark after all fees, verifying that disciplined, friction-aware hopping generates authentic risk-adjusted outperformance.

### D. Full-Stack Systems Architecture & Advisory Alerting
- **Analytical Microservice & Dashboard**: Decoupled Python analytical engine served via FastAPI (`/api/v1/pools/ranked`, `/api/v1/pools/historical`, `/api/v1/backtest/run`) and consumed by a high-performance Next.js 14 App Router dashboard with Recharts interactive visualizations.
- **Automated Advisory Alerting**: Rule-based detection service with multi-channel dispatchers (Console, SQLite audit log, Webhooks) flagging critical market events:
  - Liquidity Drains (TVL drop $\le -15\%$).
  - Rate Squeezes (APY spike $\ge +5\%$).
  - Institutional Degradation (Score floor breach $<40/100$).

### E. Non-Custodial Read-Only Multi-Chain Wallet Integration (Phase 7 Stage A)
The platform integrates browser-based Web3 wallet connectivity strictly for **read-only portfolio telemetry and yield opportunity discovery**, without custody risk or transactional capabilities.

#### Under the Hood: EIP-1193, `eth_requestAccounts`, and `eth_call`
Modern Web3 libraries (e.g. Wagmi, Viem) wrap standard browser primitives and JSON-RPC specifications. Here is how the system operates under the hood:

1. **EIP-1193 Injected Provider Protocol (`window.ethereum`)**:
   - Modern browser wallets (MetaMask, Rabby, Rainbow, Coinbase Wallet) inject an EIP-1193 compliant JavaScript object at `window.ethereum`.
   - The interface standardizes interaction via a single method: `ethereum.request({ method: string, params?: Array<any> | Record<string, any> })`.
   - The application detects the presence of this provider without embedding any wallet software, SDKs with telemetry, or private key generation code.

2. **Account Discovery via `eth_requestAccounts`**:
   - When the user clicks **Connect Wallet**, the application issues:
     ```javascript
     const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
     ```
   - This prompts the browser wallet extension to display its permission modal. The user explicitly approves granting read access to their public hexadecimal account address (e.g., `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`).
   - **Crucial Non-Custodial Guarantee**: At no point in this handshake is the private key, mnemonic seed phrase, or signature capability exposed to the application. The application runtime only ever receives the public address string.

3. **Cross-Chain Read-Only Balance Queries via `eth_call` & Public JSON-RPC**:
   - To query token balances across 5 distinct chains (Ethereum Mainnet, Arbitrum, Optimism, Base, Sepolia), the application **does not force the user to switch networks** in their wallet.
   - Instead, the application instantiates stateless, public `viem` clients configured with decentralized public JSON-RPC endpoints:
     ```typescript
     const client = createPublicClient({ chain, transport: http() });
     const rawBalance = await client.readContract({
       address: tokenContractAddress,
       abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
       functionName: 'balanceOf',
       args: [userAddress],
     });
     ```
   - Under the hood, this compiles to a raw JSON-RPC `eth_call` HTTP request:
     - Method: `"eth_call"`
     - Parameters: `[{ to: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", data: "0x70a08231000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045" }, "latest"]`
     - The function selector `0x70a08231` corresponds to the first 4 bytes of `keccak256("balanceOf(address)")`.
     - Because `eth_call` executes entirely within the virtual machine state of the remote node without creating an on-chain transaction or state mutation, **it consumes 0 gas, requires 0 signatures, and cannot move funds**.

4. **Yield Cross-Referencing & Opportunity Detection**:
   - Balances across all chains are mapped and cross-referenced against the active Phase 2 scoring ranking (`GET /api/v1/pools/ranked`).
   - If the user holds idle capital (e.g. 158.02 USDC on Arbitrum yielding 0%), the engine matches the asset with the highest risk-adjusted target pool (e.g. Accountable Monad at +11.48% APY or Sparklend USDS at 16.0% APY) and computes the exact annual yield pickup delta.
   - Disconnecting resets the in-memory React state, with zero persistent storage of address telemetry.

---

## 2. Real-World Limitations & Engineering Trade-Offs

Honesty about system boundaries is what separates senior engineering from hype. The platform makes explicit architectural trade-offs:

1. **Non-Custodial / Read-Only by Design (Stage A)**:
   - The platform strictly separates **analysis from custody**. It reads balances via public RPCs and `eth_call` but contains **zero transaction construction, zero smart contract approvals (`ERC-20 approve`), and zero broadcast facilities**.
   - *Rationale*: Custody management, MEV protection, private key HSMs, and transaction signing introduce extreme attack surfaces and regulatory scrutiny. Providing institutional clarity before any capital is moved is the core mission. Stage B (deposit transaction construction) remains gated until smart contracts undergo formal audits.
2. **Simplified Slippage & Constant Liquidity Depth**:
   - The backtester models capital hops assuming market depth can absorb portfolio reallocation at a fixed $0.05\%$ bridge fee without market impact.
   - *Real-World Impact*: Allocating $\$100\text{M}$ into a $\$40\text{M}$ pool would instantly dilute the APY down to near zero. A production execution system would require dynamic AMM bonding curve integration.
3. **Daily Snapshot Granularity vs. Intraday Volatility**:
   - Data is captured at daily snapshot resolution via DeFiLlama.
   - *Real-World Impact*: Rapid flash-loan attacks or depegging events that occur and resolve within minutes cannot be caught by daily cron jobs; real-time mempool or on-chain event listeners would be required for sub-minute latency.
4. **Off-Chain Fee Approximations vs. Dynamic Gas Spikes**:
   - The backtester uses a fixed $\$20.00$ gas estimate. During severe network congestion or high market volatility (e.g., liquidation cascades), Ethereum L1 gas fees can spike to $\$150+$ per transaction, altering the cost-benefit trade-off of rebalancing.

---

## 3. How This Fits into Target Roles

### For Quantitative Research / Trading Roles (DeFi & Traditional Finance)
- **Signal Quality over Raw Yield**: Demonstrates that you don't naively chase nominal yields; you model cost of carry, friction drag, and tail-risk volatility.
- **Realistic Backtesting Discipline**: Understands lookahead bias, transaction cost drag, minimum holding constraints, and benchmark-relative alpha attribution.
- **Risk Decomposition**: Shows facility in converting qualitative financial intuition (bridge risk, protocol age, liquidity depth) into normalized, backtestable quantitative factors.

### For Data Science & Machine Learning Engineering
- **Robust Feature Engineering**: Built multi-variate statistical metrics (rolling standard deviation, coefficient of variation, log-scale liquidity depth transforms).
- **Clean Architecture & Reproducibility**: Production repository with 35 unit tests, strict schema validation via Pydantic, time-series idempotency, and automated test runners.
- **Anomaly Detection & Outlier Handling**: Developed automated alerting pipelines to detect regime shifts and liquidity contractions.

### For Fintech & Platform Engineering
- **End-to-End Modern Software Craftsmanship**: Clean separation of concerns between headless analytical workers, SQLite time-series storage, FastAPI microservice, and a responsive Next.js 14 frontend.
- **Production Mindset & Operational Clarity**: Explicit configuration management, comprehensive CLI interfaces (`--json`, `--simulate`, `--sync-history`), structured logging, and persistent non-execution safety guardrails.
