"""
Stavlos Autonomous Chain Optimizer Agent.
Analyzes cross-chain stablecoin yields, identifies the best performing chain,
and executes rotation ONLY with explicit user consent.
"""
from src.agent.chain_optimizer import ChainOptimizerAgent

__all__ = ["ChainOptimizerAgent"]
