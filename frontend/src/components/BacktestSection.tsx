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
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-8 my-4 text-center">
        <p className="text-xs text-black font-mono font-bold">LOADING BACKTEST ENGINE…</p>
      </div>
    );
  }

  const s = backtest.strategy_metrics;
  const b = backtest.benchmark_metrics;

  return (
    <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 sm:p-6 my-4 space-y-6" aria-label="Strategy Backtest">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 bg-black text-[#00E575] flex items-center justify-center font-mono font-black text-sm">
              ▲
            </span>
            <h3 className="text-xl font-display font-black text-black uppercase">
              STRATEGY BACKTEST — 180-DAY SIMULATION
            </h3>
          </div>
          <p className="text-xs text-[#444444] font-mono font-bold max-w-xl leading-relaxed">
            Active risk-adjusted rotation vs. static benchmark, net of all gas, bridge fees, and churn hurdles.
          </p>
        </div>

        {/* Config tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
          {[
            `$${backtest.config.initial_capital.toLocaleString()}`,
            `${backtest.config.rebalance_frequency_days}D REBALANCE`,
            `${backtest.config.min_holding_period_days}D LOCKUP`,
            `+${backtest.config.churn_penalty_threshold}% HURDLE`,
          ].map((tag) => (
            <span key={tag} className="bg-white text-black border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Core Finding / Verdict (Solid Yellow Box with 3px shadow) */}
      <div className="flex items-start gap-3 p-4 bg-[#FFE600] border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        <CheckCircle className="w-5 h-5 text-black shrink-0 mt-0.5 stroke-[2.5]" />
        <div>
          <div className="text-[11px] font-mono font-black text-black uppercase tracking-wider mb-1">
            CORE ANALYTICAL VERDICT
          </div>
          <p className="text-xs text-black font-sans font-bold leading-relaxed">
            {backtest.summary_verdict}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "TOTAL RETURN",
            value: `+${s.total_return_pct.toFixed(2)}%`,
            sub: `vs +${b.total_return_pct.toFixed(2)}% BM`,
            bg: "bg-[#00E575] text-black",
          },
          {
            label: "NET ALPHA",
            value: `+${backtest.net_alpha_pct.toFixed(2)}%`,
            sub: `+$${backtest.net_profit_difference_usd.toFixed(2)}`,
            bg: "bg-black text-[#00E575]",
          },
          {
            label: "CAGR",
            value: `${s.cagr_pct.toFixed(2)}%`,
            sub: `vs ${b.cagr_pct.toFixed(2)}% BM`,
            bg: "bg-white text-black",
          },
          {
            label: "SHARPE",
            value: s.sharpe_ratio.toFixed(2),
            sub: `vs ${b.sharpe_ratio.toFixed(2)} BM`,
            bg: "bg-white text-black",
          },
          {
            label: "HOPS",
            value: `${s.total_hops}`,
            sub: `$${s.total_fees_usd.toFixed(2)} fees`,
            bg: "bg-white text-black",
          },
          {
            label: "MAX DRAWDOWN",
            value: `-${s.max_drawdown_pct.toFixed(2)}%`,
            sub: `${s.max_drawdown_duration_days}d duration`,
            bg: "bg-white text-[#FF4949]",
          },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-white border-2 border-black shadow-[3px_3px_0px_#000]">
            <div className="text-[10px] font-mono font-black text-[#555555] uppercase tracking-wider mb-1">
              {m.label}
            </div>
            <div className={`text-xl font-mono font-black tabular-nums tracking-tight px-1 py-0.5 inline-block border border-black ${m.bg}`}>
              {m.value}
            </div>
            <div className="text-[10px] text-black font-mono font-bold mt-1.5">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve (Flat Fills, Bold Visible Gridlines & Axes, Solid Tooltip) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono font-black text-black uppercase tracking-wider flex items-center gap-2">
          <span>CUMULATIVE GROWTH: STRATEGY VS. BENCHMARK</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-normal">FLAT AUDIT</span>
        </h4>
        <div className="h-80 w-full border-2 border-black p-3 bg-[#FAF8F5] shadow-[3px_3px_0px_#000]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={backtest.equity_curve} margin={{ top: 10, right: 12, left: 15, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#D1CABE"
                strokeWidth={1.5}
                vertical={true}
              />
              <XAxis
                dataKey="date"
                stroke="#000000"
                strokeWidth={2}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                tickFormatter={(val) => (val ? val.slice(5) : "")}
                tickLine={true}
                axisLine={true}
              />
              <YAxis
                stroke="#000000"
                strokeWidth={2}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                tickLine={true}
                axisLine={true}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  borderRadius: "0px",
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: "bold",
                  padding: "10px 14px",
                  boxShadow: "4px 4px 0px #000000",
                  color: "#000000",
                }}
                formatter={(val: any, name: any) => [
                  `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name,
                ]}
                labelFormatter={(label) => `DATE: ${label}`}
                labelStyle={{ color: "#000000", fontSize: "11px", fontWeight: "900", marginBottom: "6px" }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: "bold",
                  paddingTop: "14px",
                  color: "#000000",
                }}
                iconType="rect"
              />
              <Area
                type="monotone"
                dataKey="strategy_equity"
                name="Strategy (Active Rotation)"
                stroke="#000000"
                strokeWidth={3}
                fill="#00E575"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="benchmark_equity"
                name="Benchmark (Aave USDC)"
                stroke="#777777"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="#FFE600"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Log */}
      <div className="border-t-2 border-black pt-4">
        <button
          onClick={() => setShowTrades(!showTrades)}
          className="neo-btn flex items-center gap-2 text-xs font-mono font-black"
        >
          <History className="w-4 h-4 stroke-[2.5]" />
          <span>EXECUTION REPLAY LOG</span>
          <span className="bg-black text-[#FFE600] px-1 py-0.5">({backtest.trade_log.length} HOPS)</span>
          {showTrades ? <ChevronUp className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
        </button>

        {showTrades && (
          <div className="overflow-x-auto border-2 border-black mt-3 shadow-[3px_3px_0px_#000]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-white text-[11px] font-mono font-black uppercase tracking-wider border-b-2 border-black">
                <tr>
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">FROM</th>
                  <th className="py-2.5 px-3">TO</th>
                  <th className="py-2.5 px-3">PRIOR APY</th>
                  <th className="py-2.5 px-3">NEW APY</th>
                  <th className="py-2.5 px-3">DELTA</th>
                  <th className="py-2.5 px-3">FRICTION</th>
                  <th className="py-2.5 px-3">PORTFOLIO CAPITAL</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black bg-white">
                {backtest.trade_log.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7EE] transition-colors font-mono">
                    <td className="py-2.5 px-3 font-bold text-black">{t.date}</td>
                    <td className="py-2.5 px-3 capitalize font-bold text-[#444444]">
                      {t.from_protocol} · {t.from_chain}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-black text-black">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5 text-black stroke-[3]" />
                        {t.to_protocol} · {t.to_chain}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#555555] tabular-nums">{t.old_apy.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-black text-black tabular-nums">
                      <span className="bg-[#00E575] border border-black px-1.5 py-0.5">
                        {t.new_apy.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-black tabular-nums">+{t.apy_delta.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-bold text-black tabular-nums">${t.fee_usd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-black text-black tabular-nums">
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
