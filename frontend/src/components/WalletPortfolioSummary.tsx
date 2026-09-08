"use client";

import React from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { PoolRiskScore } from "@/types";
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  Coins,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

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

  // Active positive balances
  const activeHoldings = balances.filter((b) => b.formatted > 0);
  const displayTokens = activeHoldings.length > 0 ? activeHoldings : balances.slice(0, 4);

  // Top ranked opportunity across the system
  const topOpportunity = pools.length > 0 ? pools[0] : null;

  return (
    <div className="glass-panel p-5 rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-slate-900/60 space-y-4 my-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Connected Portfolio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Read-Only Active
              </span>
              {isDemoMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  Demo Simulated Wallet
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {chainName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshBalances()}
            disabled={isLoadingBalances}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingBalances ? "animate-spin" : ""}`} />
            <span>{isLoadingBalances ? "Reading..." : "Refresh Balances"}</span>
          </button>
          <button
            onClick={() => disconnectWallet()}
            className="px-2.5 py-1 text-xs rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Non-Custodial Read-Only Guarantee:</strong> Connected via public JSON-RPC.
          The platform never accesses private keys, cannot construct transactions, and cannot move funds.
        </p>
      </div>

      {/* Multi-Chain Balances & Opportunity Cross-Reference */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-sky-400" />
          Multi-Chain Holdings & Yield Optimization Recommendations
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayTokens.map(({ token, formatted }) => {
            // Find top matching pool for this asset in Phase 2 scoring
            const assetPools = pools.filter(
              (p) => p.symbol.toUpperCase() === token.symbol.toUpperCase()
            );
            const bestPool = assetPools.length > 0 ? assetPools[0] : topOpportunity;
            const currentYield = 0.0; // Idle wallet asset
            const potentialYield = bestPool?.headline_apy || 0.0;
            const pickupDelta = potentialYield - currentYield;

            return (
              <div
                key={`${token.chainId}-${token.address}`}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{token.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {token.chain}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold font-mono text-slate-100">
                    {isLoadingBalances ? (
                      <span className="text-slate-500 text-xs">Querying RPC...</span>
                    ) : (
                      `${formatted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol}`
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Current Wallet Yield: 0.00% (Idle)</p>
                </div>

                {bestPool && (
                  <div className="pt-2 border-t border-slate-900 text-[11px] space-y-1">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Top Target:</span>
                      <span className="text-sky-300 font-semibold">{bestPool.project} ({bestPool.chain})</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-semibold">
                      <span>Available APY:</span>
                      <span>+{bestPool.headline_apy.toFixed(2)}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Risk Grade:</span>
                      <span className="text-indigo-300">{bestPool.composite_score.toFixed(1)}/100</span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-900/80 text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Yield Pickup: +{pickupDelta.toFixed(2)}% p.a.</span>
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
