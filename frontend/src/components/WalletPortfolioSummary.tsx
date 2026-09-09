"use client";

import React from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { PoolRiskScore } from "@/types";
import { Wallet, ShieldCheck, TrendingUp, LogOut, RefreshCw } from "lucide-react";

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
    <section className="glass-panel p-5 space-y-4 animate-rack-focus" aria-label="Connected Portfolio">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--glass-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[var(--glass-border)] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Connected Portfolio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[var(--text-secondary)] border border-[var(--glass-border-subtle)] font-mono">
                Read-Only
              </span>
              {isDemoMode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D9A24B]/10 text-[#D9A24B] border border-[#D9A24B]/20 font-mono">
                  Simulated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-[var(--text-muted)]">
              <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
              <span>·</span>
              <span>{chainName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshBalances()}
            disabled={isLoadingBalances}
            className="glass-btn"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingBalances ? "animate-spin" : ""}`} />
            <span>{isLoadingBalances ? "Reading RPC…" : "Refresh"}</span>
          </button>
          <button
            onClick={() => disconnectWallet()}
            className="glass-btn text-[#E5484D] hover:border-[#E5484D]/30"
          >
            <LogOut className="w-3 h-3" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Advisory Security Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-[var(--glass-border-subtle)] text-xs text-[var(--text-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#35C48F] shrink-0 mt-0.5" />
        <p>
          <span className="text-white font-medium">Non-Custodial Architecture.</span>{" "}
          Connected via public JSON-RPC. Zero private key exposure. Cannot construct, execute, or sign transactions.
        </p>
      </div>

      {/* Token Holdings & Optimization targets */}
      <div>
        <h3 className="text-[10px] font-mono font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
          Holdings & Rotation Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 stagger-panels">
          {displayTokens.map(({ token, formatted }) => {
            const assetPools = pools.filter(
              (p) => p.symbol.toUpperCase() === token.symbol.toUpperCase()
            );
            const bestPool = assetPools.length > 0 ? assetPools[0] : topOpportunity;
            const potentialYield = bestPool?.headline_apy || 0.0;

            return (
              <div
                key={`${token.chainId}-${token.address}`}
                className="glass-panel p-4 space-y-3 animate-rack-focus"
              >
                {/* Token identity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-white/[0.08] border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono text-white">
                      {token.symbol.slice(0, 2)}
                    </span>
                    <span className="font-semibold text-white text-sm">{token.symbol}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] border border-white/10 px-1.5 py-0.5 rounded">
                    {token.chain}
                  </span>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    {isLoadingBalances ? (
                      <span className="inline-block w-20 h-4 rounded bg-white/10 animate-pulse" />
                    ) : (
                      formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">Idle yield: 0.00%</p>
                </div>

                {/* Target recommendation */}
                {bestPool && (
                  <div className="pt-2.5 border-t border-[var(--glass-border-subtle)] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Target</span>
                      <span className="text-white capitalize">{bestPool.project} · {bestPool.chain}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Available APY</span>
                      <span className="text-[#35C48F] font-bold">+{bestPool.headline_apy.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Risk Grade</span>
                      <span className="text-[var(--text-secondary)]">{bestPool.composite_score.toFixed(1)}/100</span>
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
