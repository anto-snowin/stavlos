"use client";

import React, { useState, useRef, useEffect } from "react";
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

type TabId = "opportunities" | "backtest" | "architecture" | "case-study";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "opportunities", label: "Opportunities", icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "backtest", label: "Backtest", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "architecture", label: "Risk Model", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: "case-study", label: "Case Study", icon: <BookOpen className="w-3.5 h-3.5" /> },
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

  // Track indicator position
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab]);

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
    <div className="space-y-4">
      <Header
        health={health}
        selectedHomeChain={homeChain}
        onHomeChainChange={handleHomeChainChange}
      />

      <WalletPortfolioSummary pools={pools} />

      <KpiMetrics pools={pools} backtest={backtest} />

      {/* ─── Tab Navigation (Glass-fill segmented styling) ─── */}
      <div className="relative pt-2">
        <div className="flex items-center justify-between">
          <div ref={tabsRef} className="relative flex items-center gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-mono font-medium
                  transition-colors duration-150 cursor-pointer
                  ${activeTab === tab.id
                    ? "text-white bg-white/[0.06] border-t border-x border-[var(--glass-border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}

            {/* Quiet Jade underline indicator */}
            <div
              className="absolute bottom-0 h-[2px] rounded-full bg-[#35C48F] transition-all duration-250 ease-out"
              style={indicatorStyle}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-[#35C48F] font-mono animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Recalculating risk…</span>
            </div>
          )}
        </div>

        <div className="h-px bg-[var(--glass-border-subtle)]" />
      </div>

      {/* ─── Tab Content ─── */}
      <div className="animate-fade pt-1">
        {/* Tab 1: Opportunities & Historical Trends */}
        {activeTab === "opportunities" && (
          <div className="space-y-6" key="opportunities">
            <RankedPoolsTable pools={pools} />
            <HistoricalYieldChart data={trends} />
          </div>
        )}

        {/* Tab 2: Backtest Results */}
        {activeTab === "backtest" && (
          <div key="backtest">
            <BacktestSection backtest={backtest} />
          </div>
        )}

        {/* Tab 3: Risk Model Specification */}
        {activeTab === "architecture" && (
          <div className="glass-panel p-6 sm:p-8 space-y-8 animate-rack-focus" key="architecture">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-[#35C48F]" />
                <h3 className="text-lg font-semibold text-white">
                  Risk Model Specification
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Deterministic 5-factor penalty model penalizing fragile, spiky, and thin yield signals. Every composite score is fully decomposable and verifiable.
              </p>
            </div>

            {/* Five-Factor Penalty Model */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                Five-Factor Penalty Architecture
              </h4>
              <div className="space-y-2.5">
                {[
                  { name: "TVL Depth", weight: "25%", desc: "Log-scaled liquidity anchor ($20M floor to $1B benchmark) preventing thin pool manipulation." },
                  { name: "Protocol Age", weight: "20%", desc: "Track record factor with 0–365+ day maturity curve rewarding battle-tested protocols." },
                  { name: "Volatility Drag", weight: "20%", desc: "Trailing 30-day coefficient of variation (σ/μ) discounting incentive-driven yield spikes." },
                  { name: "Chain Risk Tier", weight: "20%", desc: "Consensus security tiering: Tier 1 (Ethereum), Tier 2 (Arbitrum/Optimism/Base), Tier 3 (Alt-L1s)." },
                  { name: "Bridge Friction", weight: "15%", desc: "Cross-chain complexity and smart-contract bridge cost from selected Home Chain." },
                ].map((factor) => (
                  <div key={factor.name} className="flex items-start gap-4 p-3 rounded-lg border border-[var(--glass-border-subtle)] bg-white/[0.02]">
                    <div className="min-w-[130px]">
                      <span className="font-mono text-xs font-semibold text-[#35C48F] mr-2">{factor.weight}</span>
                      <span className="text-xs text-white font-medium">{factor.name}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{factor.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-execution constraint */}
            <div className="border border-[var(--glass-border)] rounded-xl p-5 bg-white/[0.02]">
              <h4 className="text-[11px] font-mono font-semibold text-white uppercase tracking-wider mb-1.5">
                Structural Non-Execution Constraint
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                By architectural design, this codebase contains no Web3 transaction signers, no RPC broadcast logic, and no private key holders.
                All capital movements are purely simulated to showcase quantitative research rigor without smart-contract custody risk.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Case Study */}
        {activeTab === "case-study" && (
          <div className="glass-panel p-6 sm:p-8 space-y-8 animate-rack-focus" key="case-study">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[#D9A24B] text-[10px] font-mono font-semibold uppercase tracking-widest mb-1.5">
                <Award className="w-4 h-4" />
                Case Study
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">
                Cross-Chain Stablecoin Yield Optimizer
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Evaluating whether active cross-chain yield rotation beats passive blue-chip lending
                after transaction costs, bridge friction, lockup periods, and churn hurdles.
              </p>
            </div>

            {/* Three analytical columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Technical Rigor */}
              <div className="space-y-3 p-4 rounded-xl border border-[var(--glass-border-subtle)] bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#35C48F] text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Technical Rigor
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { title: "Production Data Engineering", desc: "Resilient HTTP client with exponential backoff, Pydantic schemas, and idempotent SQLite time-series storage." },
                    { title: "Quantitative Risk Modeling", desc: "Decomposed nominal APYs into 5 distinct penalties with deterministic explainability." },
                    { title: "Empirical Backtesting", desc: "180d historical replay verifying +0.53% net alpha after gas, bridge fees, and a +0.75% churn hurdle." },
                  ].map((item) => (
                    <div key={item.title} className="pt-2 border-t border-[var(--glass-border-subtle)] first:border-t-0 first:pt-0">
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Known Limitations */}
              <div className="space-y-3 p-4 rounded-xl border border-[var(--glass-border-subtle)] bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#E5484D] text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Known Limitations
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { title: "Simulation-Only by Design", desc: "Zero private keys, no Web3 wallets, and no transaction signing. Avoids custody risk." },
                    { title: "Constant Slippage Assumption", desc: "Assumes fixed 0.05% bridge fee without modeling dynamic pool dilution or AMM price impact." },
                    { title: "Daily Snapshot Resolution", desc: "Captures multi-month trends, but sub-minute flash-loan attacks require real-time mempool listeners." },
                  ].map((item) => (
                    <div key={item.title} className="pt-2 border-t border-[var(--glass-border-subtle)] first:border-t-0 first:pt-0">
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Alignment */}
              <div className="space-y-3 p-4 rounded-xl border border-[var(--glass-border-subtle)] bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#D9A24B] text-xs font-semibold">
                  <Award className="w-4 h-4" />
                  Role Alignment
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { title: "Quant Research & Trading", desc: "Carry cost, volatility drag, friction hurdles, and benchmark-relative alpha attribution." },
                    { title: "Data Engineering & Analytics", desc: "Robust pipelines, 35 unit tests, time-series idempotency, schema enforcement, alerting." },
                    { title: "Fintech Platform Engineering", desc: "Clean decoupled architecture separating Python analytical services from Next.js 14 App Router UI." },
                  ].map((item) => (
                    <div key={item.title} className="pt-2 border-t border-[var(--glass-border-subtle)] first:border-t-0 first:pt-0">
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.desc}</div>
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
