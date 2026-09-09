"use client";

import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, ShieldAlert, DollarSign, Activity, Percent } from "lucide-react";
import { PoolRiskScore, BacktestResult } from "@/types";

interface KpiMetricsProps {
  pools: PoolRiskScore[];
  backtest: BacktestResult | null;
}

/** Animate a number from 0 to target */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        ref.current = target;
      }
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ pools, backtest }) => {
  const topPool = pools[0];
  const totalTvl = pools.reduce((acc, p) => acc + p.tvl_usd, 0);
  const avgScore = pools.length ? pools.reduce((acc, p) => acc + p.composite_score, 0) / pools.length : 0;
  const alpha = backtest?.net_alpha_pct ?? 0.53;
  const benchmarkApy = backtest?.equity_curve[backtest.equity_curve.length - 1]?.benchmark_apy ?? 3.62;

  const animatedScore = useCountUp(topPool?.composite_score ?? 0);
  const animatedAlpha = useCountUp(alpha);
  const animatedBenchmark = useCountUp(benchmarkApy);
  const animatedTvl = useCountUp(totalTvl / 1e9);
  const animatedAvg = useCountUp(avgScore);

  return (
    <div className="my-6 stagger">
      {/* Row 1: Featured card + Alpha — 2 column asymmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
        {/* Featured: Top Pool — spans 3 cols */}
        <div className="lg:col-span-3 card-featured p-5 animate-in">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Top Risk-Adjusted Opportunity
              </div>
              <div className="text-3xl font-bold text-white font-mono tracking-tight animate-count">
                {topPool ? `${animatedScore.toFixed(1)}` : "—"}
                <span className="text-lg text-[var(--text-tertiary)] font-normal">/100</span>
              </div>
              <p className="text-sm text-accent-teal mt-1.5 font-medium">
                {topPool ? `${topPool.project}` : "Loading…"}
                {topPool && (
                  <span className="text-[var(--text-tertiary)] font-normal">
                    {" "}· {topPool.symbol} · {topPool.chain}
                  </span>
                )}
              </p>
              {topPool && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {topPool.headline_apy.toFixed(2)}% headline · ${(topPool.tvl_usd / 1e6).toFixed(0)}M TVL
                </p>
              )}
            </div>
            <div className="p-2 rounded-lg bg-accent-teal/8">
              <TrendingUp className="w-5 h-5 text-accent-teal" />
            </div>
          </div>
        </div>

        {/* Alpha card — spans 2 cols */}
        <div className="lg:col-span-2 card-metric accent-emerald p-5 animate-in">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                180-Day Net Alpha
              </div>
              <div className="text-3xl font-bold text-accent-emerald font-mono tracking-tight animate-count">
                +{animatedAlpha.toFixed(2)}%
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
                Net of all gas & bridge fees
              </p>
            </div>
            <div className="p-2 rounded-lg bg-accent-emerald/8">
              <Percent className="w-5 h-5 text-accent-emerald" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Three even cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Benchmark */}
        <div className="card-metric accent-indigo p-4 animate-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Aave USDC Benchmark</span>
            <Activity className="w-3.5 h-3.5 text-accent-indigo" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {animatedBenchmark.toFixed(2)}%
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Ethereum L1 baseline yield
          </p>
        </div>

        {/* TVL */}
        <div className="card-metric accent-amber p-4 animate-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Monitored Liquidity</span>
            <DollarSign className="w-3.5 h-3.5 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            ${animatedTvl.toFixed(2)}B
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            5 stablecoins · TVL ≥ $20M
          </p>
        </div>

        {/* Avg Score */}
        <div className="card-metric accent-violet p-4 animate-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Universe Avg Score</span>
            <ShieldAlert className="w-3.5 h-3.5 text-accent-violet" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {animatedAvg.toFixed(1)}<span className="text-base text-[var(--text-tertiary)] font-normal">/100</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Mean risk-adjusted grade
          </p>
        </div>
      </div>
    </div>
  );
};
