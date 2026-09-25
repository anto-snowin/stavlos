"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { KpiMetrics } from "@/components/KpiMetrics";
import { RankedPoolsTable } from "@/components/RankedPoolsTable";
import { HistoricalYieldChart } from "@/components/HistoricalYieldChart";
import { BacktestSection } from "@/components/BacktestSection";
import { WalletPortfolioSummary } from "@/components/WalletPortfolioSummary";
import { AIOptimizerAgent } from "@/components/AIOptimizerAgent";
import { PoolRiskScore, BacktestResult, SystemHealth } from "@/types";
import {
  Layers,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Award,
  Bot,
} from "lucide-react";

interface DashboardClientProps {
  initialPools: PoolRiskScore[];
  initialBacktest: BacktestResult | null;
  initialTrends: any[];
  initialHealth: SystemHealth | null;
}

type TabId = "opportunities" | "agent" | "backtest" | "architecture" | "case-study";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "opportunities", label: "OPPORTUNITIES", icon: <Layers className="w-4 h-4 stroke-[2.5]" /> },
  { id: "agent", label: "AI ROTATION AGENT", icon: <Bot className="w-4 h-4 stroke-[2.5]" /> },
  { id: "backtest", label: "180D BACKTEST", icon: <TrendingUp className="w-4 h-4 stroke-[2.5]" /> },
  { id: "architecture", label: "RISK MODEL", icon: <ShieldCheck className="w-4 h-4 stroke-[2.5]" /> },
  { id: "case-study", label: "CASE STUDY", icon: <BookOpen className="w-4 h-4 stroke-[2.5]" /> },
];

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
  const [activeTab, setActiveTab] = useState<TabId>("opportunities");
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
      <Header
        health={health}
        selectedHomeChain={homeChain}
        onHomeChainChange={handleHomeChainChange}
      />

      <WalletPortfolioSummary pools={pools} />

      <KpiMetrics pools={pools} backtest={backtest} />

      {/* ─── Step 7: Adjacent Thick-Bordered Rectangular Tabs ─── */}
      <div className="pt-2">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-black">
          {/* Rectangular Adjacent Tabs with Full Color Inversion */}
          <div className="flex flex-wrap items-center">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 font-mono font-black text-xs uppercase
                    border-2 border-black -mb-[2px] -mr-[2px] transition-all cursor-pointer select-none
                    ${isActive
                      ? "bg-black text-white shadow-[0px_-2px_0px_#000] z-10"
                      : "bg-white text-black hover:bg-[#FAF8F5]"
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#FFE600] border-2 border-black text-xs font-mono font-black text-black mb-1">
              <RefreshCw className="w-3.5 h-3.5 stroke-[3] animate-spin" />
              <span>RECALCULATING RISK MATRICES…</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Tab Content Panes ─── */}
      <div className="pt-1">
        {/* Tab 1: Opportunities & Historical Trends */}
        {activeTab === "opportunities" && (
          <div className="space-y-6" key="opportunities">
            <RankedPoolsTable pools={pools} />
            <HistoricalYieldChart data={trends} />
          </div>
        )}

        {/* Tab 2: AI Rotation Agent (NEW!) */}
        {activeTab === "agent" && (
          <div key="agent">
            <AIOptimizerAgent />
          </div>
        )}

        {/* Tab 3: Backtest Results */}
        {activeTab === "backtest" && (
          <div key="backtest">
            <BacktestSection backtest={backtest} />
          </div>
        )}

        {/* Tab 4: Step 6 Risk Model Specification */}
        {activeTab === "architecture" && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 sm:p-8 space-y-8" key="architecture">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 bg-black text-[#00E575] flex items-center justify-center font-mono font-black">
                  §
                </span>
                <h3 className="text-2xl font-display font-black text-black uppercase">
                  RISK MODEL SPECIFICATION
                </h3>
              </div>
              <p className="text-xs text-[#444] font-mono font-bold max-w-2xl leading-relaxed mt-1">
                Deterministic 5-factor penalty model penalizing fragile, spiky, and thin yield signals. Every composite score is fully decomposable and verifiable.
              </p>
            </div>

            {/* Five-Factor Penalty Model (Solid Color Blocks, Blocky Stepped Indicators) */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black text-black uppercase tracking-wider">
                FIVE-FACTOR PENALTY ARCHITECTURE
              </h4>
              <div className="space-y-3">
                {[
                  { name: "TVL Depth", weight: "25%", desc: "Log-scaled liquidity anchor ($20M floor to $1B benchmark) preventing thin pool manipulation.", step: "■■■■■" },
                  { name: "Protocol Age", weight: "20%", desc: "Track record factor with 0–365+ day maturity curve rewarding battle-tested protocols.", step: "■■■■□" },
                  { name: "Volatility Drag", weight: "20%", desc: "Trailing 30-day coefficient of variation (σ/μ) discounting incentive-driven yield spikes.", step: "■■■■□" },
                  { name: "Chain Risk Tier", weight: "20%", desc: "Consensus security tiering: Tier 1 (Ethereum), Tier 2 (Arbitrum/Optimism/Base), Tier 3 (Alt-L1s).", step: "■■■■□" },
                  { name: "Bridge Friction", weight: "15%", desc: "Cross-chain complexity and smart-contract bridge cost from selected Home Chain.", step: "■■■□□" },
                ].map((factor) => (
                  <div key={factor.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#FAF8F5] border-2 border-black shadow-[2px_2px_0px_#000]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black bg-[#00E575] text-black px-2 py-0.5 border border-black">
                        {factor.weight}
                      </span>
                      <span className="text-sm font-display font-black text-black uppercase">{factor.name}</span>
                    </div>
                    <p className="text-xs text-black font-sans font-bold sm:max-w-md">{factor.desc}</p>
                    <span className="text-xs font-mono font-black text-black tracking-widest">{factor.step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Tiers Block Display */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black text-black uppercase tracking-wider">
                CONSENSUS SECURITY TIERS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs font-bold">
                <div className="p-3 border-2 border-black bg-[#00E575] text-black shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-sm uppercase">TIER 1 · L1 SETTLEMENT</div>
                  <div className="mt-1 font-bold">Ethereum Mainnet</div>
                  <div className="text-[11px] mt-1">Consensus anchor · Maximum battle-testing</div>
                </div>

                <div className="p-3 border-2 border-black bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-sm uppercase">TIER 2 · L2 ROLLUPS</div>
                  <div className="mt-1 font-bold">Arbitrum · Optimism · Base</div>
                  <div className="text-[11px] mt-1">L1 data availability · Fast finality</div>
                </div>

                <div className="p-3 border-2 border-black bg-[#FF4949] text-white shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-sm uppercase">TIER 3 · ALT-L1 NETWORKS</div>
                  <div className="mt-1 font-bold">Solana · Monolithic Chains</div>
                  <div className="text-[11px] mt-1">Independent consensus · Higher volatility</div>
                </div>
              </div>
            </div>

            {/* Non-execution constraint */}
            <div className="border-3 border-black p-5 bg-[#FFE600] shadow-[5px_5px_0px_0px_#000]">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-black stroke-[3]" />
                <h4 className="text-sm font-display font-black text-black uppercase">
                  STRUCTURAL NON-EXECUTION CONSTRAINT & HUMAN CONSENT
                </h4>
              </div>
              <p className="text-xs text-black font-mono font-bold leading-relaxed max-w-3xl">
                By architectural design, this codebase contains no autonomous private key signers.
                The autonomous AI agent computes the optimal rotation route, but transfers can strictly execute
                ONLY when the user grants explicit consent through the consent authorization modal (&quot;with the user&apos;s concern alone&quot;).
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Step 7 Case Study */}
        {activeTab === "case-study" && (
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 sm:p-8 space-y-8" key="case-study">
            <div className="max-w-3xl">
              <div className="inline-block bg-black text-[#FFE600] px-2 py-0.5 text-xs font-mono font-black uppercase tracking-wider mb-2 border border-black">
                EMPIRICAL CASE STUDY
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-black uppercase leading-tight">
                CROSS-CHAIN STABLECOIN YIELD OPTIMIZER
              </h3>
              <p className="text-xs text-[#444] font-mono font-bold mt-1.5 leading-relaxed">
                Evaluating whether active cross-chain yield rotation beats passive blue-chip lending
                after transaction costs, bridge friction, lockup periods, and churn hurdles.
              </p>
            </div>

            {/* Three analytical columns (Stark Solid Brutalist Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Technical Rigor */}
              <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
                <div className="bg-[#00E575] text-black font-display font-black text-xs uppercase p-3 border-b-2 border-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  TECHNICAL RIGOR
                </div>
                <div className="divide-y-2 divide-black text-xs font-mono">
                  {[
                    { title: "Production Data Engineering", desc: "Resilient HTTP client with exponential backoff, Pydantic schemas, and idempotent SQLite time-series storage." },
                    { title: "Quantitative Risk Modeling", desc: "Decomposed nominal APYs into 5 distinct penalties with deterministic explainability." },
                    { title: "Empirical Backtesting", desc: "180d historical replay verifying +0.53% net alpha after gas, bridge fees, and a +0.75% churn hurdle." },
                  ].map((item) => (
                    <div key={item.title} className="p-3 bg-white">
                      <div className="text-black font-black uppercase">{item.title}</div>
                      <div className="text-[11px] text-[#444] font-bold mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Known Limitations */}
              <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
                <div className="bg-[#FF4949] text-white font-display font-black text-xs uppercase p-3 border-b-2 border-black flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 stroke-[3]" />
                  KNOWN LIMITATIONS
                </div>
                <div className="divide-y-2 divide-black text-xs font-mono">
                  {[
                    { title: "Human Authorization Required", desc: "Zero autonomous fund movement without explicit user confirmation. Eliminates protocol custody hazard." },
                    { title: "Constant Slippage Assumption", desc: "Assumes fixed 0.05% bridge fee without modeling dynamic pool dilution or AMM price impact." },
                    { title: "Daily Snapshot Resolution", desc: "Captures multi-month trends; sub-minute flash loan events require sub-second mempool listeners." },
                  ].map((item) => (
                    <div key={item.title} className="p-3 bg-white">
                      <div className="text-black font-black uppercase">{item.title}</div>
                      <div className="text-[11px] text-[#444] font-bold mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Alignment */}
              <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
                <div className="bg-[#FFE600] text-black font-display font-black text-xs uppercase p-3 border-b-2 border-black flex items-center gap-2">
                  <Award className="w-4 h-4 stroke-[3]" />
                  ROLE ALIGNMENT
                </div>
                <div className="divide-y-2 divide-black text-xs font-mono">
                  {[
                    { title: "Quant Research & Trading", desc: "Carry cost, volatility drag, friction hurdles, and benchmark-relative alpha attribution." },
                    { title: "Data Engineering & Analytics", desc: "Robust pipelines, 40 unit tests, time-series idempotency, schema enforcement, alerting." },
                    { title: "AI Agents & MCP Standards", desc: "Exposes Model Context Protocol server for autonomous agents to safely query yield & seek user consent." },
                  ].map((item) => (
                    <div key={item.title} className="p-3 bg-white">
                      <div className="text-black font-black uppercase">{item.title}</div>
                      <div className="text-[11px] text-[#444] font-bold mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
