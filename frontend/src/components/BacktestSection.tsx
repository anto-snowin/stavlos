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
      <div className="card p-8 my-4 text-center animate-in">
        <div className="shimmer w-48 h-3 rounded-full mx-auto mb-3" />
        <div className="shimmer w-32 h-3 rounded-full mx-auto" />
        <p className="text-[11px] text-[var(--text-muted)] mt-4">Loading backtest engine…</p>
      </div>
    );
  }

  const s = backtest.strategy_metrics;
  const b = backtest.benchmark_metrics;

  return (
    <div className="card p-5 sm:p-6 my-4 space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <TrendingUp className="w-5 h-5 text-accent-emerald" />
            <h3 className="text-base font-semibold text-white">
              Strategy Backtest — 180 Day Simulation
            </h3>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] max-w-xl leading-relaxed">
            Active risk-adjusted chain-hopping vs. static Aave USDC holding, net of gas fees, bridge costs, and churn hurdles.
          </p>
        </div>

        {/* Config tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
          {[
            `$${backtest.config.initial_capital.toLocaleString()}`,
            `${backtest.config.rebalance_frequency_days}d rebal`,
            `${backtest.config.min_holding_period_days}d lock`,
            `+${backtest.config.churn_penalty_threshold}% hurdle`,
          ].map((tag) => (
            <span key={tag} className="px-2 py-1 rounded-md bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-emerald/5 border border-accent-emerald/10">
        <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-mono font-semibold text-accent-emerald uppercase tracking-wider mb-1">
            Core Finding
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {backtest.summary_verdict}
          </p>
        </div>
      </div>

      {/* Metrics Grid — asymmetric */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            label: "Total Return",
            value: `+${s.total_return_pct.toFixed(2)}%`,
            sub: `vs +${b.total_return_pct.toFixed(2)}% BM`,
            color: "text-accent-emerald",
            accent: "accent-emerald",
          },
          {
            label: "Net Alpha",
            value: `+${backtest.net_alpha_pct.toFixed(2)}%`,
            sub: `+$${backtest.net_profit_difference_usd.toFixed(2)}`,
            color: "text-accent-emerald",
            accent: "accent-emerald",
          },
          {
            label: "CAGR",
            value: `${s.cagr_pct.toFixed(2)}%`,
            sub: `vs ${b.cagr_pct.toFixed(2)}% BM`,
            color: "text-white",
            accent: "accent-teal",
          },
          {
            label: "Sharpe",
            value: s.sharpe_ratio.toFixed(2),
            sub: `vs ${b.sharpe_ratio.toFixed(2)} BM`,
            color: "text-accent-teal",
            accent: "accent-teal",
          },
          {
            label: "Hops",
            value: `${s.total_hops}`,
            sub: `$${s.total_fees_usd.toFixed(2)} fees`,
            color: "text-white",
            accent: "accent-amber",
          },
          {
            label: "Max Drawdown",
            value: `-${s.max_drawdown_pct.toFixed(2)}%`,
            sub: `${s.max_drawdown_duration_days}d duration`,
            color: "text-accent-amber",
            accent: "accent-amber",
          },
        ].map((m) => (
          <div key={m.label} className={`card-metric ${m.accent} p-3`}>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {m.label}
            </div>
            <div className={`text-lg font-bold font-mono ${m.color} tracking-tight`}>
              {m.value}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div>
        <h4 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
          Cumulative Growth: Strategy vs. Benchmark
        </h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={backtest.equity_curve} margin={{ top: 10, right: 12, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.08)"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickFormatter={(val) => (val ? val.slice(5) : "")}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.08)"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface-raised)",
                  borderColor: "var(--border-emphasis)",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  padding: "10px 14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
                formatter={(val: any, name: any) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                labelFormatter={(label) => label}
                labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginBottom: "6px" }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                  fontFamily: "JetBrains Mono, monospace",
                  paddingTop: "16px",
                  color: "rgba(255,255,255,0.4)",
                }}
                iconType="plainline"
              />
              <Area
                type="monotone"
                dataKey="strategy_equity"
                name="Strategy (Active)"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorStrategy)"
              />
              <Area
                type="monotone"
                dataKey="benchmark_equity"
                name="Benchmark (Aave USDC)"
                stroke="#818cf8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorBenchmark)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Log */}
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <button
          onClick={() => setShowTrades(!showTrades)}
          className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer group"
        >
          <History className="w-3.5 h-3.5 text-accent-teal" />
          <span>Trade Log</span>
          <span className="font-mono text-[var(--text-muted)]">({backtest.trade_log.length} hops)</span>
          {showTrades ? (
            <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-white" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-white" />
          )}
        </button>

        {showTrades && (
          <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)] mt-3 animate-fade">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">From</th>
                  <th className="py-2.5 px-3">To</th>
                  <th className="py-2.5 px-3">Old APY</th>
                  <th className="py-2.5 px-3">New APY</th>
                  <th className="py-2.5 px-3">Delta</th>
                  <th className="py-2.5 px-3">Fee</th>
                  <th className="py-2.5 px-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {backtest.trade_log.map((t, idx) => (
                  <tr key={idx} className="table-row-hover border-b border-[var(--border-subtle)]">
                    <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">{t.date}</td>
                    <td className="py-2.5 px-3 capitalize text-[var(--text-secondary)]">
                      {t.from_protocol} · {t.from_chain}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-medium text-white">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-accent-emerald" />
                        {t.to_protocol} · {t.to_chain}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-muted)]">{t.old_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-accent-emerald font-semibold">{t.new_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-accent-emerald">+{t.apy_delta.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-accent-amber">${t.fee_usd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono text-white font-semibold">${t.capital_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
