"use client";

import React from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { PoolRiskScore } from "@/types";
import { Wallet, ShieldCheck, LogOut, RefreshCw } from "lucide-react";

interface WalletPortfolioSummaryProps {
  pools: PoolRiskScore[];
}

export const WalletPortfolioSummary: React.FC<WalletPortfolioSummaryProps> = ({ pools }) => {
  const {
    address,
    isConnected,
    chainName,
    isDemoMode,
    balances,
    isLoadingBalances,
    disconnectWallet,
    refreshBalances,
  } = useWeb3();

  if (!isConnected || !address) {
    return null;
  }

  const activeHoldings = balances.filter((b) => b.formatted > 0);
  const displayTokens = activeHoldings.length > 0 ? activeHoldings : balances.slice(0, 4);
  const topOpportunity = pools.length > 0 ? pools[0] : null;

  return (
    <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 space-y-4" aria-label="Connected Portfolio">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black text-white flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000]">
            <Wallet className="w-5 h-5 text-[#FFE600] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-display font-black text-black uppercase">CONNECTED PORTFOLIO</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono font-bold uppercase">
                READ-ONLY
              </span>
              {isDemoMode && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#FFE600] text-black border border-black font-mono font-black uppercase">
                  SIMULATED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs font-bold text-[#444444]">
              <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
              <span>·</span>
              <span className="uppercase">{chainName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshBalances()}
            disabled={isLoadingBalances}
            className="neo-btn font-mono text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBalances ? "animate-spin" : ""}`} />
            <span>{isLoadingBalances ? "READING RPC…" : "REFRESH"}</span>
          </button>
          <button
            onClick={() => disconnectWallet()}
            className="neo-btn bg-[#FF4949] text-white hover:bg-[#E03636] font-mono text-xs"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>DISCONNECT</span>
          </button>
        </div>
      </div>

      {/* Advisory Security Notice (Stark Yellow Warning Strip) */}
      <div className="flex items-start gap-2.5 p-3 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black">
        <ShieldCheck className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
        <p>
          <span className="bg-black text-[#FFE600] px-1 py-0.2 mr-1">NON-CUSTODIAL SAFEGUARD</span>
          Zero private key access. Cannot sign or execute transactions autonomously. All capital rotations require your explicit authorization.
        </p>
      </div>

      {/* Token Holdings & Optimization targets */}
      <div>
        <h3 className="text-xs font-mono font-black text-black uppercase tracking-wider mb-3">
          HOLDINGS & RECOMMENDED ALLOCATIONS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayTokens.map(({ token, formatted }) => {
            const assetPools = pools.filter(
              (p) => p.symbol.toUpperCase() === token.symbol.toUpperCase()
            );
            const bestPool = assetPools.length > 0 ? assetPools[0] : topOpportunity;

            return (
              <div
                key={`${token.chainId}-${token.address}`}
                className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4 space-y-3"
              >
                {/* Token identity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-black text-white border border-black flex items-center justify-center text-xs font-black font-mono">
                      {token.symbol.slice(0, 2)}
                    </span>
                    <span className="font-display font-black text-black text-base">{token.symbol}</span>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-[#FAF8F5] text-black border border-black px-1.5 py-0.5 uppercase">
                    {token.chain}
                  </span>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-xl font-black font-mono text-black tabular-nums">
                    {isLoadingBalances ? (
                      <span className="inline-block w-20 h-5 bg-black/10 animate-pulse" />
                    ) : (
                      formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    )}
                  </div>
                  <p className="text-[11px] text-[#555555] mt-0.5 font-mono font-bold">Idle yield: 0.00%</p>
                </div>

                {/* Target recommendation */}
                {bestPool && (
                  <div className="pt-2.5 border-t-2 border-black space-y-1.5 text-xs font-mono font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">TARGET</span>
                      <span className="text-black capitalize">{bestPool.project} · {bestPool.chain}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">AVAILABLE APY</span>
                      <span className="bg-[#00E575] border border-black px-1 text-black font-black">
                        +{bestPool.headline_apy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">RISK GRADE</span>
                      <span className="text-black font-black">{bestPool.composite_score.toFixed(1)}/100</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
