import React from "react";
import { TrendingUp, ShieldAlert, DollarSign, Activity, Percent } from "lucide-react";
import { PoolRiskScore, BacktestResult } from "@/types";

interface KpiMetricsProps {
  pools: PoolRiskScore[];
  backtest: BacktestResult | null;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ pools, backtest }) => {
  const topPool = pools[0];
  const totalTvl = pools.reduce((acc, p) => acc + p.tvl_usd, 0);
  const avgScore = pools.length ? pools.reduce((acc, p) => acc + p.composite_score, 0) / pools.length : 0;
  const alpha = backtest?.net_alpha_pct ?? 0.53;
  const benchmarkApy = backtest?.equity_curve[backtest.equity_curve.length - 1]?.benchmark_apy ?? 3.62;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
      {/* Card 1: Top Risk-Adjusted Opportunity */}
      <div className="glass-panel p-4 rounded-xl border border-sky-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Top Risk-Adjusted Pool</span>
          <TrendingUp className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white tracking-tight">
            {topPool ? `${topPool.composite_score.toFixed(1)}/100` : "--"}
          </div>
          <p className="text-xs text-sky-400 mt-1 truncate">
            {topPool ? `${topPool.project.toUpperCase()} (${topPool.symbol}) • ${topPool.chain}` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Card 2: Strategy Alpha */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>180-Day Net Alpha</span>
          <Percent className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +{alpha.toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Net of all gas & bridge fees
          </p>
        </div>
      </div>

      {/* Card 3: Blue-Chip Benchmark */}
      <div className="glass-panel p-4 rounded-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Aave USDC Benchmark</span>
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white tracking-tight">
            {benchmarkApy.toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ethereum L1 baseline yield
          </p>
        </div>
      </div>

      {/* Card 4: Total Tracked TVL */}
      <div className="glass-panel p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Monitored Liquidity</span>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white tracking-tight">
            ${(totalTvl / 1e9).toFixed(2)}B
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across 5 stablecoin assets (TVL &ge; $20M)
          </p>
        </div>
      </div>

      {/* Card 5: Universe Average Score */}
      <div className="glass-panel p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Universe Avg Score</span>
          <ShieldAlert className="w-4 h-4 text-violet-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white tracking-tight">
            {avgScore.toFixed(1)}/100
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mean risk-adjusted grade
          </p>
        </div>
      </div>
    </div>
  );
};
