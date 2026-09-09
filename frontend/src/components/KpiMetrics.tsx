"use client";

import React, { useEffect, useRef, useState } from "react";
import { PoolRiskScore, BacktestResult } from "@/types";

interface KpiMetricsProps {
  pools: PoolRiskScore[];
  backtest: BacktestResult | null;
}

/** Animate a numeric value from 0 to target */
function useCountUp(target: number, duration = 650) {
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
    <section className="my-6 space-y-3 stagger-panels" aria-label="Key Performance Indicators">
      {/* ─── Hero Panel: Single Top-Ranked Pick (Copper Accent, Sharp Glass) ─── */}
      <div className="glass-hero p-6 sm:p-7 animate-rack-focus relative overflow-hidden">
        {/* Subtle copper corner accent line */}
        <div className="absolute top-0 left-0 w-24 h-[2px] bg-[#D9A24B]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-[#D9A24B]/30 bg-[#D9A24B]/10 text-[#D9A24B] font-semibold">
                Rank #1 Recommendation
              </span>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                Sharp Glass · Highest Risk-Adjusted Confidence
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white capitalize">
                {topPool ? topPool.project : "Loading protocol…"}
              </h2>
              {topPool && (
                <span className="text-sm font-mono text-[var(--text-secondary)]">
                  {topPool.symbol} · {topPool.chain}
                </span>
              )}
            </div>

            {topPool && (
              <p className="text-xs text-[var(--text-muted)] max-w-xl leading-relaxed">
                {topPool.explanation}
              </p>
            )}
          </div>

          {/* Right metrics: Score & Yield */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--glass-border)] pt-4 lg:pt-0 lg:pl-8">
            {/* Risk-Adjusted Score */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Risk Score
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white tabular-nums tracking-tight">
                {topPool ? animatedScore.toFixed(1) : "—"}
                <span className="text-base font-normal text-[var(--text-tertiary)]">/100</span>
              </div>
              <div className="text-[11px] font-mono text-[#D9A24B] mt-0.5 font-medium">
                Grade A · Near-clear
              </div>
            </div>

            {/* Headline APY */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Headline APY
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-[#35C48F] tabular-nums tracking-tight">
                {topPool ? `${topPool.headline_apy.toFixed(2)}%` : "—"}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">
                {topPool ? `$${(topPool.tvl_usd / 1e6).toFixed(0)}M TVL` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Supporting Metrics Strip: 4 Stated Facts (Near-Clear Glass, 6px Blur) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: 180-Day Net Alpha */}
        <div className="glass-metric animate-rack-focus">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            180d Net Alpha
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#35C48F] tabular-nums tracking-tight">
            +{animatedAlpha.toFixed(2)}%
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
            Net of all gas & bridge friction
          </p>
        </div>

        {/* Metric 2: Benchmark APY */}
        <div className="glass-metric animate-rack-focus">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Aave USDC Baseline
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            {animatedBenchmark.toFixed(2)}%
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
            Ethereum L1 passive hold
          </p>
        </div>

        {/* Metric 3: Monitored Liquidity */}
        <div className="glass-metric animate-rack-focus">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Monitored TVL
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            ${animatedTvl.toFixed(2)}B
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
            5 stablecoins · TVL ≥ $20M
          </p>
        </div>

        {/* Metric 4: Universe Avg Score */}
        <div className="glass-metric animate-rack-focus">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Universe Avg Score
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            {animatedAvg.toFixed(1)}
            <span className="text-xs font-normal text-[var(--text-tertiary)]">/100</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
            Cross-chain mean risk grade
          </p>
        </div>
      </div>
    </section>
  );
};
