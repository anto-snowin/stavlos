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
  accent: string;
}

const TABS: TabDef[] = [
  { id: "opportunities", label: "Opportunities", icon: <Layers className="w-3.5 h-3.5" />, accent: "var(--accent-teal)" },
  { id: "backtest", label: "Backtest", icon: <TrendingUp className="w-3.5 h-3.5" />, accent: "var(--accent-emerald)" },
  { id: "architecture", label: "Risk Model", icon: <ShieldCheck className="w-3.5 h-3.5" />, accent: "var(--accent-indigo)" },
  { id: "case-study", label: "Case Study", icon: <BookOpen className="w-3.5 h-3.5" />, accent: "var(--accent-amber)" },
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

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-2">
      <Header
        health={health}
        selectedHomeChain={homeChain}
        onHomeChainChange={handleHomeChainChange}
      />

      <WalletPortfolioSummary pools={pools} />

      <KpiMetrics pools={pools} backtest={backtest} />

      {/* ─── Tab Navigation ─── */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div ref={tabsRef} className="relative flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-[12px] font-medium
                  transition-colors duration-200 cursor-pointer
                  ${activeTab === tab.id
                    ? "text-white bg-[var(--bg-surface)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}

            {/* Sliding underline indicator */}
            <div
              className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300 ease-out"
              style={{
                ...indicatorStyle,
                backgroundColor: currentTab.accent,
              }}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-accent-teal animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="font-mono">Scoring…</span>
            </div>
          )}
        </div>

        {/* Separator line that connects to the active tab */}
        <div className="h-px bg-[var(--border-subtle)]" />
      </div>

      {/* ─── Tab Content ─── */}
      <div className="animate-fade pt-2">
        {/* Tab 1: Opportunities & Historical Trends */}
        {activeTab === "opportunities" && (
          <div className="space-y-4" key="opportunities">
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

        {/* Tab 3: Architecture */}
        {activeTab === "architecture" && (
          <div className="card p-6 sm:p-8 my-4 space-y-8 animate-in" key="architecture">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-accent-indigo" />
                <h3 className="text-lg font-semibold text-white">
                  Risk Model Specification
                </h3>
              </div>
              <p className="text-[13px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Composite scoring methodology penalizing fragile yield signals. Every score is fully decomposable and auditable.
              </p>
            </div>

            {/* Risk factors — editorial list, not a grid */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-mono font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                Five-Factor Penalty Model
              </h4>
              <div className="space-y-3">
                {[
                  { name: "TVL Depth", weight: 25, color: "text-accent-teal", desc: "Log-scaled liquidity anchor. $20M floor to $1B benchmark prevents thin pool manipulation." },
                  { name: "Protocol Age", weight: 20, color: "text-accent-cyan", desc: "Operational track record factor. 0–365+ day maturity curve rewards battle-tested protocols." },
                  { name: "Volatility Drag", weight: 20, color: "text-accent-amber", desc: "Trailing 30-day coefficient of variation (σ/μ). Discounts spiky incentive-driven rates." },
                  { name: "Chain Risk Tier", weight: 20, color: "text-accent-indigo", desc: "Consensus security tiering. Tier 1 (Ethereum), Tier 2 (Arbitrum/Optimism/Base), Tier 3 (Alt-L1s)." },
                  { name: "Bridge Friction", weight: 15, color: "text-accent-violet", desc: "Cross-chain complexity and smart-contract bridge risk from selected Home Chain." },
                ].map((factor) => (
                  <div key={factor.name} className="flex items-start gap-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className={`${factor.color} font-mono font-semibold text-sm`}>{factor.weight}%</span>
                      <span className="text-[13px] text-white font-medium">{factor.name}</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{factor.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-execution constraint */}
            <div className="border border-[var(--border-default)] rounded-xl p-5 bg-[var(--bg-surface-raised)]/30">
              <h4 className="text-[11px] font-mono font-semibold text-accent-emerald uppercase tracking-widest mb-2">
                Structural Non-Execution Constraint
              </h4>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                By architectural design, this codebase contains no Web3 transaction signers, no RPC broadcast logic, and no private key holders.
                All capital movements are purely simulated to showcase quantitative research rigor without smart-contract custody risk.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Case Study */}
        {activeTab === "case-study" && (
          <div className="card p-6 sm:p-8 my-4 space-y-8 animate-in" key="case-study">
            {/* Title */}
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-accent-amber text-[11px] font-mono font-semibold uppercase tracking-widest mb-2">
                <Award className="w-4 h-4" />
                Portfolio Case Study
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">
                Cross-Chain Stablecoin Yield Optimizer
              </h3>
              <p className="text-[13px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Evaluating whether active cross-chain yield rotation beats passive blue-chip lending
                after transaction costs, bridge friction, lockup periods, and churn hurdles.
              </p>
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1: Technical */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-teal text-[13px] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Technical Rigor
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Production Data Engineering", desc: "Resilient HTTP client with jittered exponential backoff, Pydantic v2 schemas, and idempotent WAL SQLite time-series storage." },
                    { title: "Quantitative Risk Modeling", desc: "Decomposed nominal APYs into 5 distinct penalties with deterministic explainability." },
                    { title: "Empirical Backtesting", desc: "180d historical replay verifying +0.53% net alpha after realistic gas ($20), bridge fees (0.05%), and a +0.75% churn hurdle." },
                  ].map((item) => (
                    <div key={item.title} className="py-3 border-b border-[var(--border-subtle)] last:border-b-0">
                      <h5 className="text-[13px] font-medium text-white">{item.title}</h5>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 2: Limitations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-rose text-[13px] font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Known Limitations
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Simulation-Only by Design", desc: "Zero private keys, no Web3 wallets, and no transaction signing. Avoids custody risk." },
                    { title: "Constant Slippage Assumption", desc: "Assumes fixed 0.05% bridge fee without modeling dynamic pool dilution or AMM price impact." },
                    { title: "Daily Snapshot Resolution", desc: "Captures multi-month trends, but sub-minute flash-loan attacks require real-time mempool listeners." },
                  ].map((item) => (
                    <div key={item.title} className="py-3 border-b border-[var(--border-subtle)] last:border-b-0">
                      <h5 className="text-[13px] font-medium text-white">{item.title}</h5>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: Role Alignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-amber text-[13px] font-semibold">
                  <Award className="w-4 h-4" />
                  Role Alignment
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Quant Research & Trading", desc: "Carry cost, volatility drag, friction hurdles, and benchmark-relative alpha attribution." },
                    { title: "Data Engineering & Analytics", desc: "Robust pipelines, 35 unit tests, time-series idempotency, schema enforcement, alerting." },
                    { title: "Fintech Platform Engineering", desc: "Clean decoupled architecture separating Python analytical services from Next.js 14 App Router UI." },
                  ].map((item) => (
                    <div key={item.title} className="py-3 border-b border-[var(--border-subtle)] last:border-b-0">
                      <h5 className="text-[13px] font-medium text-white">{item.title}</h5>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{item.desc}</p>
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
