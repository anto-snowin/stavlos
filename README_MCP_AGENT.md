# Stavlos MCP Server & Autonomous Yield Agent

This repository provides an institutional-grade **Model Context Protocol (MCP)** server and an **Autonomous Chain Optimizer Agent** designed for cross-chain stablecoin yield rotation.

---

## 🛡️ Core Safety Rule: Human-In-The-Loop Consent
Per the architectural specification:
> **The AI Agent analyzes the best performing chain, but NEVER moves or transfers stablecoins without the user's explicit consent alone ("with the user's concern alone").**

All execution endpoints (`execute_chain_transfer` in MCP and `/api/v1/agent/execute` in REST) strictly verify `user_consent=True`. If consent is withheld or `False`, execution is aborted and zero funds are moved.

---

## 🚀 1. Running the MCP Server

The MCP server is implemented in [src/mcp_server.py](file:///d:/stavlos/src/mcp_server.py) using the official `mcp` library (FastMCP) over `stdio` transport.

### Direct Execution
```bash
python -m src.mcp_server
# or
python src/mcp_server.py
```

### Configuration for Claude Desktop / Cursor / Antigravity
Add this entry to your `claude_desktop_config.json` or MCP settings:

```json
{
  "mcpServers": {
    "stavlos-yield-optimizer": {
      "command": "python",
      "args": [
        "-m",
        "src.mcp_server"
      ],
      "cwd": "D:\\stavlos"
    }
  }
}
```

---

## 🛠️ MCP Tools & Capabilities

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `analyze_chains_yield` | `symbol="USDC"`, `min_tvl=20000000` | Analyzes and ranks Ethereum, Arbitrum, Optimism, Base, and Solana on yields, liquidity depth, and risk scores. |
| `get_best_performing_chain` | `symbol="USDC"` | Returns the single top-performing blockchain for stablecoin yield and quant rationale. |
| `simulate_stablecoin_transfer` | `source_chain`, `destination_chain`, `token`, `amount` | Calculates bridge friction (gas + 5 bps fee), APY delta, net 1st year profit, and payback days. |
| `request_transfer_authorization` | `source_chain`, `destination_chain`, `token`, `amount` | Prepares a formal authorization ticket with explicit risk disclosures awaiting human confirmation. |
| `execute_chain_transfer` | `auth_id`, `user_consent: bool`, `wallet_address` | **Strict safety lock:** If `user_consent` is `False`, execution is denied immediately. If `True`, simulates execution and returns transaction receipt. |

---

## 🎨 Neo-Brutalism Dashboard UI

The Stavlos dashboard has been visually transformed into a bold, high-contrast **Neo-Brutalism** design:
1. **Raw over polished**: Stark off-white canvas (`#F5F3EF`), pure black borders (`2px-3px solid #000`), zero soft blurred gradients.
2. **Hard offset shadows**: `3px 3px 0px #000` and `4px 4px 0px #000` replacing all soft drop-shadows.
3. **Typography**: Heavy grotesque font (Archivo Black / Space Grotesk) for headings; tabular monospace (JetBrains Mono) for all financial metrics.
4. **Adjacent Rectangular Tabs**: Full color inversion on active tabs (Black/White), zero floating underlines.
5. **Interactive AI Agent**: Live tab with interactive route calculator and stark "USER CONSENT REQUIRED" modal confirmation.

---

## 🧪 Testing

Run all unit tests (including the 5 agent & MCP consent tests):
```bash
python -m pytest
```
Result: **40 passed** in under 5 seconds.
