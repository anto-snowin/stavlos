"use client";

import React from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { PoolRiskScore } from "@/types";
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface WalletPortfolioSummaryProps {
  pools: PoolRiskScore[];
}

const TOKEN_ACCENTS: Record<string, { border: string; text: string; bg: string }> = {
  USDC: { border: "border-[#2775ca]/20", text: "text-[#5a9ddb]", bg: "bg-[#2775ca]/6" },
  USDT: { border: "border-[#26a17b]/20", text: "text-[#4cc9a0]", bg: "bg-[#26a17b]/6" },
  DAI: { border: "border-[#f5ac37]/20", text: "text-[#f5c563]", bg: "bg-[#f5ac37]/6" },
  USDS: { border: "border-[#8b5cf6]/20", text: "text-[#a78bfa]", bg: "bg-[#8b5cf6]/6" },
  USDe: { border: "border-[#2dd4bf]/20", text: "text-[#5ae8d5]", bg: "bg-[#2dd4bf]/6" },
};

const DEFAULT_ACCENT = { border: "border-[var(--border-subtle)]", text: "text-[var(--text-tertiary)]", bg: "bg-[var(--bg-surface-raised)]" };

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
    <div className="card p-5 border-accent-teal/15 bg-gradient-to-b from-accent-teal/[0.02] to-transparent space-y-4 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-accent-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">Connected Portfolio</span>
              <span className="text-[9px] px-1.5 py-[2px] rounded-md bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 font-mono font-medium flex items-center gap-1">
                <span className="w-[4px] h-[4px] rounded-full bg-accent-emerald animate-pulse" />
                Read-Only
              </span>
              {isDemoMode && (
                <span className="text-[9px] px-1.5 py-[2px] rounded-md bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-mono font-medium">
                  Demo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{chainName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => refreshBalances()}
            disabled={isLoadingBalances}
            className="px-2.5 py-1 text-[11px] rounded-md bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-overlay)]
              text-[var(--text-secondary)] transition-colors border border-[var(--border-subtle)]
              flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingBalances ? "animate-spin" : ""}`} />
            <span>{isLoadingBalances ? "Reading…" : "Refresh"}</span>
          </button>
          <button
            onClick={() => disconnectWallet()}
            className="px-2.5 py-1 text-[11px] rounded-md bg-accent-rose/8 hover:bg-accent-rose/15
              text-accent-rose transition-colors border border-accent-rose/15
              flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-accent-teal shrink-0 mt-0.5" />
        <p>
          <span className="text-[var(--text-secondary)] font-medium">Non-Custodial.</span>{" "}
          Connected via public JSON-RPC. No private key access. Cannot construct or sign transactions.
        </p>
      </div>

      {/* Holdings */}
      <div>
        <h4 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
          Holdings & Yield Recommendations
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 stagger">
          {displayTokens.map(({ token, formatted }) => {
            const accent = TOKEN_ACCENTS[token.symbol] || DEFAULT_ACCENT;
            const assetPools = pools.filter(
              (p) => p.symbol.toUpperCase() === token.symbol.toUpperCase()
            );
            const bestPool = assetPools.length > 0 ? assetPools[0] : topOpportunity;
            const potentialYield = bestPool?.headline_apy || 0.0;

            return (
              <div
                key={`${token.chainId}-${token.address}`}
                className={`card-raised p-3.5 ${accent.border} animate-in space-y-2.5`}
              >
                {/* Token header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-md ${accent.bg} flex items-center justify-center text-[9px] font-bold font-mono ${accent.text}`}>
                      {token.symbol.slice(0, 2)}
                    </span>
                    <span className="font-semibold text-white text-[13px]">{token.symbol}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-[2px] rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-mono">
                    {token.chain}
                  </span>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-base font-bold font-mono text-white">
                    {isLoadingBalances ? (
                      <span className="shimmer inline-block w-24 h-4 rounded" />
                    ) : (
                      formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">Wallet yield: 0.00% (idle)</p>
                </div>

                {/* Recommendation */}
                {bestPool && (
                  <div className="pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Best target</span>
                      <span className="text-accent-teal font-medium font-mono">{bestPool.project} · {bestPool.chain}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Available APY</span>
                      <span className="text-accent-emerald font-bold font-mono">+{bestPool.headline_apy.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Risk grade</span>
                      <span className="text-accent-indigo font-mono">{bestPool.composite_score.toFixed(1)}/100</span>
                    </div>

                    {/* Visual pickup bar */}
                    <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[var(--border-subtle)]">
                      <TrendingUp className="w-3 h-3 text-accent-emerald shrink-0" />
                      <div className="flex-1 score-bar">
                        <div
                          className="score-bar-fill bg-gradient-to-r from-accent-emerald to-accent-teal"
                          style={{ width: `${Math.min(100, potentialYield * 8)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-accent-emerald">
                        +{potentialYield.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
