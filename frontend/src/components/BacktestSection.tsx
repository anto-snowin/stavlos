"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, CheckCircle, ArrowRight, History, ChevronDown, ChevronUp } from "lucide-react";
import { BacktestResult } from "@/types";

interface BacktestSectionProps {
  backtest: BacktestResult | null;
}

export const BacktestSection: React.FC<BacktestSectionProps> = ({ backtest }) => {
  const [showTrades, setShowTrades] = useState<boolean>(false);

  if (!backtest) {
    return (
      <div className="glass-panel p-8 my-4 text-center animate-rack-focus">
        <p className="text-xs text-[var(--text-muted)] font-mono">Loading backtest engine…</p>
      </div>
    );
  }

  const s = backtest.strategy_metrics;
  const b = backtest.benchmark_metrics;

  return (
    <section className="glass-panel p-5 sm:p-6 my-4 space-y-6 animate-rack-focus" aria-label="Strategy Backtest">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#35C48F]" />
            <h3 className="text-base font-semibold text-white">
              Strategy Backtest — 180-Day Simulation
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-xl leading-relaxed">
            Active risk-adjusted rotation vs. static benchmark, net of all gas, bridge fees, and churn hurdles.
          </p>
        </div>

        {/* Config tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[var(--text-secondary)]">
          {[
            `$${backtest.config.initial_capital.toLocaleString()}`,
            `${backtest.config.rebalance_frequency_days}d rebalance`,
            `${backtest.config.min_holding_period_days}d lockup`,
            `+${backtest.config.churn_penalty_threshold}% hurdle`,
          ].map((tag) => (
            <span key={tag} className="glass-pill">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Core Finding / Verdict */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--glass-border)] bg-white/[0.03]">
        <CheckCircle className="w-5 h-5 text-[#35C48F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-mono font-semibold text-[#35C48F] uppercase tracking-wider mb-1">
            Core Analytical Finding
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {backtest.summary_verdict}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            label: "Total Return",
            value: `+${s.total_return_pct.toFixed(2)}%`,
            sub: `vs +${b.total_return_pct.toFixed(2)}% BM`,
            color: "text-[#35C48F]",
          },
          {
            label: "Net Alpha",
            value: `+${backtest.net_alpha_pct.toFixed(2)}%`,
            sub: `+$${backtest.net_profit_difference_usd.toFixed(2)}`,
            color: "text-[#35C48F]",
          },
          {
            label: "CAGR",
            value: `${s.cagr_pct.toFixed(2)}%`,
            sub: `vs ${b.cagr_pct.toFixed(2)}% BM`,
            color: "text-white",
          },
          {
            label: "Sharpe",
            value: s.sharpe_ratio.toFixed(2),
            sub: `vs ${b.sharpe_ratio.toFixed(2)} BM`,
            color: "text-white",
          },
          {
            label: "Hops",
            value: `${s.total_hops}`,
            sub: `$${s.total_fees_usd.toFixed(2)} fees`,
            color: "text-white",
          },
          {
            label: "Max Drawdown",
            value: `-${s.max_drawdown_pct.toFixed(2)}%`,
            sub: `${s.max_drawdown_duration_days}d duration`,
            color: "text-[var(--text-secondary)]",
          },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-lg border border-[var(--glass-border-subtle)] bg-white/[0.02]">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {m.label}
            </div>
            <div className={`text-lg font-bold font-mono ${m.color} tabular-nums tracking-tight`}>
              {m.value}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
          Cumulative Growth: Strategy vs. Benchmark
        </h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={backtest.equity_curve} margin={{ top: 10, right: 12, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#35C48F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#35C48F" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickFormatter={(val) => (val ? val.slice(5) : "")}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0D1321",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  padding: "10px 14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                }}
                formatter={(val: any, name: any) => [
                  `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name,
                ]}
                labelFormatter={(label) => label}
                labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", marginBottom: "6px" }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                  fontFamily: "JetBrains Mono, monospace",
                  paddingTop: "16px",
                  color: "rgba(255,255,255,0.5)",
                }}
                iconType="plainline"
              />
              <Area
                type="monotone"
                dataKey="strategy_equity"
                name="Strategy (Active Rotation)"
                stroke="#35C48F"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorStrategy)"
              />
              <Area
                type="monotone"
                dataKey="benchmark_equity"
                name="Benchmark (Aave USDC)"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Log */}
      <div className="border-t border-[var(--glass-border-subtle)] pt-4">
        <button
          onClick={() => setShowTrades(!showTrades)}
          className="flex items-center gap-2 text-xs font-mono font-medium text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-[#35C48F]" />
          <span>Execution Replay Log</span>
          <span className="text-[var(--text-muted)]">({backtest.trade_log.length} hops)</span>
          {showTrades ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTrades && (
          <div className="overflow-x-auto rounded-lg border border-[var(--glass-border-subtle)] mt-3 animate-fade">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">From</th>
                  <th className="py-2.5 px-3">To</th>
                  <th className="py-2.5 px-3">Prior APY</th>
                  <th className="py-2.5 px-3">New APY</th>
                  <th className="py-2.5 px-3">Delta</th>
                  <th className="py-2.5 px-3">Friction</th>
                  <th className="py-2.5 px-3">Portfolio Capital</th>
                </tr>
              </thead>
              <tbody>
                {backtest.trade_log.map((t, idx) => (
                  <tr key={idx} className="border-b border-[var(--glass-border-subtle)] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[var(--text-muted)]">{t.date}</td>
                    <td className="py-2.5 px-3 capitalize text-[var(--text-secondary)]">
                      {t.from_protocol} · {t.from_chain}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-medium text-white">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-[#35C48F]" />
                        {t.to_protocol} · {t.to_chain}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-muted)] tabular-nums">{t.old_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-[#35C48F] font-semibold tabular-nums">{t.new_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-[#35C48F] tabular-nums">+{t.apy_delta.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)] tabular-nums">${t.fee_usd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono text-white font-semibold tabular-nums">
                      ${t.capital_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
