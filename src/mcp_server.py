"""
Model Context Protocol (MCP) Server for Stavlos Quant Yield Engine.
Enables AI Agents to analyze cross-chain yields, discover the highest performing chain,
and execute stablecoin transfers strictly with explicit user consent ('with the user's concern alone').
"""
import sys
import os
from typing import Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from mcp.server.fastmcp import FastMCP
from src.agent.chain_optimizer import ChainOptimizerAgent

# Initialize FastMCP Server
mcp = FastMCP(
    "stavlos-yield-optimizer",
    dependencies=["pydantic", "fastapi", "web3"]
)

# Instantiate backend agent
agent = ChainOptimizerAgent()


@mcp.tool()
def analyze_chains_yield(symbol: str = "USDC", min_tvl: float = 20_000_000.0) -> dict[str, Any]:
    """
    Analyzes and compares stablecoin yield metrics across supported blockchains
    (Ethereum, Arbitrum, Optimism, Base, Solana).
    Returns rankings, TVL depth, risk scores, and the top recommended pool on each chain.
    """
    analysis = agent.analyze_chains(symbol=symbol, min_tvl=min_tvl)
    return analysis.model_dump(mode="json")


@mcp.tool()
def get_best_performing_chain(symbol: str = "USDC") -> dict[str, Any]:
    """
    Determines the single best performing blockchain for stablecoin yield allocation,
    combining risk-adjusted score, TVL depth, consensus security tier, and APY.
    """
    analysis = agent.analyze_chains(symbol=symbol)
    best_chain = analysis.best_chain
    best_pool_info = {
        "best_chain": best_chain,
        "best_pool": analysis.best_pool_name,
        "headline_apy": analysis.best_pool_apy,
        "risk_score": analysis.best_pool_score,
        "quant_rationale": analysis.quant_rationale,
    }
    return best_pool_info


@mcp.tool()
def simulate_stablecoin_transfer(
    source_chain: str,
    destination_chain: str,
    token: str = "USDC",
    amount: float = 10_000.0,
) -> dict[str, Any]:
    """
    Simulates a cross-chain transfer of stablecoins from source_chain to destination_chain.
    Calculates gas costs, bridge fees (5 bps), yield delta, and break-even payback days.
    """
    sim = agent.simulate_transfer(
        source_chain=source_chain,
        destination_chain=destination_chain,
        token=token,
        amount=amount,
    )
    return sim.model_dump(mode="json")


@mcp.tool()
def request_transfer_authorization(
    source_chain: str,
    destination_chain: str,
    token: str = "USDC",
    amount: float = 10_000.0,
) -> dict[str, Any]:
    """
    Creates an authorization request for stablecoin rotation that awaits human review.
    Mandatory step before execution: funds CANNOT be moved without explicit user consent.
    """
    req = agent.request_authorization(
        source_chain=source_chain,
        destination_chain=destination_chain,
        token=token,
        amount=amount,
    )
    return req.model_dump(mode="json")


@mcp.tool()
def execute_chain_transfer(
    auth_id: str,
    user_consent: bool,
    wallet_address: str = "",
) -> dict[str, Any]:
    """
    Executes or simulates the transfer of stablecoins to the best performing chain.
    CRITICAL CONSTRAINT: Requires user_consent=True.
    If user_consent is False, the transfer is refused immediately and zero capital is moved.
    """
    res = agent.execute_transfer_with_user_consent(
        auth_id=auth_id,
        user_consent=user_consent,
        wallet_address=wallet_address or None,
    )
    return res.model_dump(mode="json")


@mcp.resource("stavlos://chains/supported")
def get_supported_chains() -> str:
    """Returns the list of monitored chains and security tiers."""
    return (
        "Supported Chains:\n"
        "1. Ethereum (Tier 1 - L1 Settlement & Consensus Anchor)\n"
        "2. Arbitrum (Tier 2 - Nitro Optimistic Rollup)\n"
        "3. Optimism (Tier 2 - OP Stack Rollup)\n"
        "4. Base (Tier 2 - OP Stack Rollup, Coinbase Sequencer)\n"
        "5. Solana (Tier 3 - Monolithic Proof of History)"
    )


if __name__ == "__main__":
    # Run the MCP server via standard stdio transport
    mcp.run()
