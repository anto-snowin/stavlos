"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { KpiMetrics } from "@/components/KpiMetrics";
import { RankedPoolsTable } from "@/components/RankedPoolsTable";
import { HistoricalYieldChart } from "@/components/HistoricalYieldChart";
import { BacktestSection } from "@/components/BacktestSection";
import { WalletPortfolioSummary } from "@/components/WalletPortfolioSummary";
import { PoolRiskScore, BacktestResult, SystemHealth } from "@/types";
import { Layers, TrendingUp, ShieldCheck, RefreshCw, BookOpen, AlertTriangle, CheckCircle2, Award } from "lucide-react";

interface DashboardClientProps {
  initialPools: PoolRiskScore[];
  initialBacktest: BacktestResult | null;
  initialTrends: any[];
  initialHealth: SystemHealth | null;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialPools,
  initialBacktest,
  initialTrends,
  initialHealth,
}) => {
  const [pools, setPools] = useState<PoolRiskScore[]>(initialPools);
  const [backtest, setBacktest] = useState<BacktestResult | null>(initialBacktest);
  const [trends, setTrends] = useState<any[]>(initialTrends);
  const [health, setHealth] = useState<SystemHealth | null>(initialHealth);
  const [homeChain, setHomeChain] = useState<string>("Ethereum");
  const [activeTab, setActiveTab] = useState<"opportunities" | "backtest" | "architecture" | "case-study">("opportunities");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleHomeChainChange = async (newChain: string) => {
    setHomeChain(newChain);
    setIsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/pools/ranked?home_chain=${newChain}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setPools(data);
      }
    } catch (e) {
      console.error("Failed to re-score pools for home chain:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with status badges and home chain selector */}
      <Header
        health={health}
        selectedHomeChain={homeChain}
        onHomeChainChange={handleHomeChainChange}
      />

      {/* Connected Wallet Portfolio & Yield Pickup Intelligence */}
      <WalletPortfolioSummary pools={pools} />

      {/* KPI Cards */}
      <KpiMetrics pools={pools} backtest={backtest} />

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("opportunities")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "opportunities"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            Ranked Opportunities & Trends
          </button>
          <button
            onClick={() => setActiveTab("backtest")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "backtest"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Strategy Backtest (180D)
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "architecture"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Risk Model & Architecture
          </button>
          <button
            onClick={() => setActiveTab("case-study")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "case-study"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Portfolio Case Study (Phase 6)
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-sky-400 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Re-scoring pools...</span>
          </div>
        )}
      </div>

      {/* Tab 1: Opportunities & Historical Trends */}
      {activeTab === "opportunities" && (
        <div className="space-y-6">
          <RankedPoolsTable pools={pools} />
          <HistoricalYieldChart data={trends} />
        </div>
      )}

      {/* Tab 2: Backtest Results */}
      {activeTab === "backtest" && (
        <div>
          <BacktestSection backtest={backtest} />
        </div>
      )}

      {/* Tab 3: System Architecture & Risk Model Documentation */}
      {activeTab === "architecture" && (
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6 my-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Quantitative Risk Model & Architecture Specification
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Institutional methodology penalizing fragile yield signals and preventing live execution risk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <h4 className="font-semibold text-sky-400 uppercase tracking-wide">1. Five-Factor Risk Penalties</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li>• <strong>Low TVL Penalty (25% wt):</strong> Log-scaled liquidity depth anchor ($20M floor to $1B benchmark).</li>
                <li>• <strong>Protocol Age Penalty (20% wt):</strong> Operational track record factor ($0$ to $365+$ days).</li>
                <li>• <strong>Volatility Drag (20% wt):</strong> Trailing 30-day coefficient of variation (sigma/mean) discount.</li>
                <li>• <strong>Chain Risk Tier (20% wt):</strong> Consensus security score (Tier 1: Ethereum, Tier 2: Arbitrum/Optimism/Base, Tier 3: Alt-L1s).</li>
                <li>• <strong>Bridge Friction (15% wt):</strong> Cross-chain complexity and smart-contract bridge risk from Home Chain.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <h4 className="font-semibold text-emerald-400 uppercase tracking-wide">2. Structural Non-Execution Constraint</h4>
              <p className="text-slate-300 leading-relaxed">
                By architectural design, this codebase contains no Web3 transaction signers, no RPC broadcast logic, and no private key holders.
                All capital movements are purely simulated to showcase quantitative research rigor without smart-contract custody risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Portfolio Positioning & Quantitative Case Study */}
      {activeTab === "case-study" && (
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6 my-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Institutional Quantitative Portfolio Case Study
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Cross-Chain Stablecoin Yield Optimizer: Technical Rigor & Quantitative Engineering
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Evaluating whether active cross-chain yield rotation beats passive blue-chip lending after transaction costs, bridge friction, lockup periods, and churn hurdles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Technical Demonstrations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Technical Rigor Demonstrated
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3 text-xs text-slate-300">
                <div>
                  <h5 className="font-semibold text-white">1. Production Data Engineering</h5>
                  <p className="text-slate-400 mt-0.5">Resilient HTTP client with jittered exponential backoff, Pydantic v2 schemas, and idempotent WAL SQLite time-series storage.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">2. Quantitative Risk Factor Modeling</h5>
                  <p className="text-slate-400 mt-0.5">Decomposed nominal APYs into 5 distinct penalties (liquidity depth, age, volatility drag, chain tiers, bridge friction) with deterministic explainability.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">3. Empirical Backtesting Discipline</h5>
                  <p className="text-slate-400 mt-0.5">180d historical replay verifying +0.53% net alpha over Aave USDC after realistic gas ($20), bridge fees (0.05%), and a +0.75% churn hurdle.</p>
                </div>
              </div>
            </div>

            {/* Col 2: Real-World Limitations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Real-World Engineering Limitations
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3 text-xs text-slate-300">
                <div>
                  <h5 className="font-semibold text-white">1. Simulation-Only by Design</h5>
                  <p className="text-slate-400 mt-0.5">Zero private keys, no Web3 wallets, and no transaction signing. Avoids custody and exploit risks while showcasing quant modeling.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">2. Constant Slippage Assumption</h5>
                  <p className="text-slate-400 mt-0.5">Assumes fixed 0.05% bridge fee without modeling dynamic pool dilution or AMM bonding curve price impact for 9-figure allocations.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">3. Daily Snapshot Resolution</h5>
                  <p className="text-slate-400 mt-0.5">Captures multi-month macro trends, but sub-minute flash-loan attacks require real-time on-chain mempool listeners.</p>
                </div>
              </div>
            </div>

            {/* Col 3: Role Alignment */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                <Award className="w-4 h-4" />
                Target Role Alignment
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-3 text-xs text-slate-300">
                <div>
                  <h5 className="font-semibold text-white">Quantitative Research & Trading</h5>
                  <p className="text-slate-400 mt-0.5">Focuses on carry cost, volatility drag, friction hurdles, and benchmark-relative alpha attribution over naive yield chasing.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">Data Engineering & Analytics</h5>
                  <p className="text-slate-400 mt-0.5">Robust pipelines, 35 unit tests, time-series idempotency, schema enforcement, and automated anomaly alerting.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">Fintech & Platform Engineering</h5>
                  <p className="text-slate-400 mt-0.5">Clean decoupled architecture separating Python analytical services from a high-performance Next.js 14 App Router UI.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
