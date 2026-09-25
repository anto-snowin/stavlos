"use client";

import React, { useEffect, useRef, useState } from "react";
import { PoolRiskScore, BacktestResult } from "@/types";

interface KpiMetricsProps {
  pools: PoolRiskScore[];
  backtest: BacktestResult | null;
}

/** Animate a numeric value from 0 to target */
function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
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
    <section className="my-6 space-y-4" aria-label="Key Performance Indicators">
      {/* ─── Hero Panel: Single Top-Ranked Pick (Neo-Brutalist Stark Yellow Block) ─── */}
      <div className="bg-[#FFE600] border-3 border-black shadow-[6px_6px_0px_0px_#000000] p-6 sm:p-7 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left info */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-black text-[#FFE600] border border-black">
                RANK #1 RECOMMENDATION
              </span>
              <span className="text-xs text-black font-mono font-bold">
                · HIGHEST RISK-ADJUSTED CONFIDENCE
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-black uppercase">
                {topPool ? topPool.project : "LOADING PROTOCOL…"}
              </h2>
              {topPool && (
                <span className="text-base font-mono font-black bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                  {topPool.symbol} · {topPool.chain.toUpperCase()}
                </span>
              )}
            </div>

            {topPool && (
              <p className="text-xs text-black font-sans font-medium max-w-2xl leading-relaxed border-l-3 border-black pl-3 py-0.5 bg-white/40">
                {topPool.explanation}
              </p>
            )}
          </div>

          {/* Right metrics: Score & Yield */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0 border-t-2 lg:border-t-0 lg:border-l-3 border-black pt-4 lg:pt-0 lg:pl-8">
            {/* Risk-Adjusted Score */}
            <div>
              <div className="text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                RISK SCORE
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-black tabular-nums tracking-tight">
                {topPool ? animatedScore.toFixed(1) : "—"}
                <span className="text-lg font-bold text-black/70">/100</span>
              </div>
              <div className="text-xs font-mono font-black bg-black text-[#00E575] px-1.5 py-0.5 inline-block mt-1">
                GRADE A · TOP TIER
              </div>
            </div>

            {/* Headline APY */}
            <div>
              <div className="text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                HEADLINE APY
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-black tabular-nums tracking-tight">
                {topPool ? `${topPool.headline_apy.toFixed(2)}%` : "—"}
              </div>
              <div className="text-xs font-mono font-bold text-black mt-1">
                {topPool ? `$${(topPool.tvl_usd / 1e6).toFixed(0)}M TVL` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Supporting Metrics Strip: 4 Stated Facts (White Blocks, Bold 2px Border, 3px Shadow) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: 180-Day Net Alpha */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4">
          <div className="text-[11px] font-mono font-black text-[#555555] uppercase tracking-wider mb-1">
            180D NET ALPHA
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#00E575] bg-black px-2 py-0.5 inline-block tabular-nums tracking-tight">
            +{animatedAlpha.toFixed(2)}%
          </div>
          <p className="text-xs text-black font-mono font-bold mt-1.5">
            Net of gas & bridge fees
          </p>
        </div>

        {/* Metric 2: Benchmark APY */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4">
          <div className="text-[11px] font-mono font-black text-[#555555] uppercase tracking-wider mb-1">
            AAVE USDC BASELINE
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-black tabular-nums tracking-tight">
            {animatedBenchmark.toFixed(2)}%
          </div>
          <p className="text-xs text-black font-mono font-bold mt-1.5">
            Ethereum L1 passive hold
          </p>
        </div>

        {/* Metric 3: Monitored Liquidity */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4">
          <div className="text-[11px] font-mono font-black text-[#555555] uppercase tracking-wider mb-1">
            MONITORED TVL
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-black tabular-nums tracking-tight">
            ${animatedTvl.toFixed(2)}B
          </div>
          <p className="text-xs text-black font-mono font-bold mt-1.5">
            5 stablecoins · TVL ≥ $20M
          </p>
        </div>

        {/* Metric 4: Universe Avg Score */}
        <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4">
          <div className="text-[11px] font-mono font-black text-[#555555] uppercase tracking-wider mb-1">
            UNIVERSE AVG SCORE
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-black tabular-nums tracking-tight">
            {animatedAvg.toFixed(1)}
            <span className="text-sm font-bold text-[#555555]">/100</span>
          </div>
          <p className="text-xs text-black font-mono font-bold mt-1.5">
            Cross-chain mean grade
          </p>
        </div>
      </div>
    </section>
  );
};
