"""
FastAPI Routes for AI Chain Optimizer Agent.
Provides endpoints for autonomous yield analysis, transfer simulation,
and user-authorized cross-chain rotation.
"""
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.agent.chain_optimizer import ChainOptimizerAgent
from src.storage.database import DatabaseManager

router = APIRouter(prefix="/agent", tags=["agent"])
agent_instance = ChainOptimizerAgent(DatabaseManager())


class SimulateRequest(BaseModel):
    source_chain: str = Field(default="Ethereum")
    destination_chain: str = Field(default="Arbitrum")
    token: str = Field(default="USDC")
    amount: float = Field(default=10_000.0, ge=1.0)


class AuthorizeRequestPayload(BaseModel):
    source_chain: str
    destination_chain: str
    token: str = "USDC"
    amount: float = 10_000.0


class ExecuteConsentPayload(BaseModel):
    auth_id: str
    user_consent: bool = Field(..., description="Explicit user confirmation to transfer funds")
    wallet_address: str | None = None


@router.get("/analyze")
def analyze_chains(
    symbol: str | None = Query(default=None, description="Optional symbol filter e.g. USDC, USDT"),
    min_tvl: float = Query(default=20_000_000.0, description="Minimum TVL"),
) -> dict[str, Any]:
    """
    Returns the agent's evaluation of the best performing chain and competitive breakdown.
    """
    res = agent_instance.analyze_chains(symbol=symbol, min_tvl=min_tvl)
    return res.model_dump(mode="json")


@router.post("/simulate")
def simulate_rotation(payload: SimulateRequest) -> dict[str, Any]:
    """
    Simulates rotating stablecoins from source to destination chain.
    Calculates gas, bridge fees, APY gain, and payback period.
    """
    sim = agent_instance.simulate_transfer(
        source_chain=payload.source_chain,
        destination_chain=payload.destination_chain,
        token=payload.token,
        amount=payload.amount,
    )
    return sim.model_dump(mode="json")


@router.post("/request-auth")
def request_rotation_auth(payload: AuthorizeRequestPayload) -> dict[str, Any]:
    """
    Prepares an authorization request that requires explicit human consent.
    """
    req = agent_instance.request_authorization(
        source_chain=payload.source_chain,
        destination_chain=payload.destination_chain,
        token=payload.token,
        amount=payload.amount,
    )
    return req.model_dump(mode="json")


@router.post("/execute")
def execute_rotation(payload: ExecuteConsentPayload) -> dict[str, Any]:
    """
    Executes transfer ONLY if user_consent is True.
    If user_consent is False, immediately rejects execution and safeguards funds.
    """
    res = agent_instance.execute_transfer_with_user_consent(
        auth_id=payload.auth_id,
        user_consent=payload.user_consent,
        wallet_address=payload.wallet_address,
    )
    return res.model_dump(mode="json")
