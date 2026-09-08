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
import { TrendingUp, CheckCircle, ArrowRight, DollarSign, Activity, History } from "lucide-react";
import { BacktestResult } from "@/types";

interface BacktestSectionProps {
  backtest: BacktestResult | null;
}

export const BacktestSection: React.FC<BacktestSectionProps> = ({ backtest }) => {
  const [showTrades, setShowTrades] = useState<boolean>(true);

  if (!backtest) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-slate-800 my-6 text-center text-slate-500">
        Loading backtest results...
      </div>
    );
  }

  const s = backtest.strategy_metrics;
  const b = backtest.benchmark_metrics;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-xl border border-slate-800 my-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Strategy Backtest Engine (180-Day Simulation)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              Thesis Validated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Replays historical yields simulating active risk-adjusted hopping vs. static Aave USDC holding, net of gas fees, bridge costs, and churn hurdles.
          </p>
        </div>

        {/* Strategy Parameters Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            Capital: <strong>${backtest.config.initial_capital.toLocaleString()}</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            Rebalance: <strong>{backtest.config.rebalance_frequency_days}d</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            Lockup: <strong>{backtest.config.min_holding_period_days}d</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            Hurdle: <strong>+{backtest.config.churn_penalty_threshold}%</strong>
          </span>
        </div>
      </div>

      {/* Thesis Verdict Box */}
      <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl my-5 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
          <strong>Core Research Conclusion: </strong>
          {backtest.summary_verdict}
        </div>
      </div>

      {/* Comparative Performance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Total Net Return</span>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            +{s.total_return_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] text-slate-400">vs +{b.total_return_pct.toFixed(2)}% BM</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Net Alpha</span>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            +{backtest.net_alpha_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] text-emerald-400">+${backtest.net_profit_difference_usd.toFixed(2)}</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Annualized CAGR</span>
          <div className="text-lg font-bold text-white font-mono">
            {s.cagr_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] text-slate-400">vs {b.cagr_pct.toFixed(2)}% BM</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Sharpe Ratio</span>
          <div className="text-lg font-bold text-sky-400 font-mono">
            {s.sharpe_ratio.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">vs {b.sharpe_ratio.toFixed(2)} BM</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Hops Executed</span>
          <div className="text-lg font-bold text-white font-mono">
            {s.total_hops}
          </div>
          <span className="text-[11px] text-slate-400">${s.total_fees_usd.toFixed(2)} fees</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-500 block">Max Drawdown</span>
          <div className="text-lg font-bold text-amber-400 font-mono">
            -{s.max_drawdown_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] text-slate-400">Duration: {s.max_drawdown_duration_days}d</span>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Cumulative Capital Growth: Strategy vs. Benchmark ($)
        </h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={backtest.equity_curve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => (val ? val.slice(5) : "")}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                formatter={(val: any, name: any) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
              <Area
                type="monotone"
                dataKey="strategy_equity"
                name="Strategy (Active Hopping)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorStrategy)"
              />
              <Area
                type="monotone"
                dataKey="benchmark_equity"
                name="Benchmark (Aave USDC Ethereum)"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorBenchmark)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Log Section */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-sky-400" />
            Simulated Trade Reallocations ({backtest.trade_log.length} Hops)
          </h4>
          <button
            onClick={() => setShowTrades(!showTrades)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            {showTrades ? "Hide Hops" : "Show Hops"}
          </button>
        </div>

        {showTrades && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">From Protocol</th>
                  <th className="py-2.5 px-3">To Protocol</th>
                  <th className="py-2.5 px-3">Old APY</th>
                  <th className="py-2.5 px-3">New APY</th>
                  <th className="py-2.5 px-3">Hurdle Delta</th>
                  <th className="py-2.5 px-3">Gas & Bridge Fee</th>
                  <th className="py-2.5 px-3">Portfolio Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {backtest.trade_log.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-slate-300">{t.date}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">
                      {t.from_protocol} ({t.from_chain})
                    </td>
                    <td className="py-2.5 px-3 capitalize font-semibold text-white flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      {t.to_protocol} ({t.to_chain})
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{t.old_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{t.new_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">+{t.apy_delta.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">${t.fee_usd.toFixed(2)}</td>
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
