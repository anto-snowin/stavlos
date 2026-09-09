"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { LineChart as ChartIcon } from "lucide-react";

interface HistoricalYieldChartProps {
  data: any[];
}

const LOOKBACK_OPTIONS = [30, 90, 180];

const SERIES = [
  { key: "aave-v3_USDC_Ethereum", name: "Aave v3 · USDC · ETH", color: "#35C48F" },
  { key: "compound-v3_USDC_Ethereum", name: "Compound v3 · USDC · ETH", color: "#94A3B8" },
  { key: "maple_USDC_Ethereum", name: "Maple · USDC · ETH", color: "#D9A24B" },
  { key: "aave-v3_USDC_Arbitrum", name: "Aave v3 · USDC · ARB", color: "#64748B" },
  { key: "jupiter-lend_USDC_Solana", name: "Jupiter · USDC · SOL", color: "#A78BFA" },
];

export const HistoricalYieldChart: React.FC<HistoricalYieldChartProps> = ({ data }) => {
  const [lookbackDays, setLookbackDays] = useState<number>(90);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-lookbackDays);
  }, [data, lookbackDays]);

  return (
    <section className="glass-panel p-5 sm:p-6 animate-rack-focus space-y-6" aria-label="Historical APY Trends">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-[#35C48F]" />
            Historical APY Trends
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
            Daily historical yield performance across monitored pools
          </p>
        </div>

        {/* Period selector */}
        <div className="segmented-control">
          {LOOKBACK_OPTIONS.map((days) => (
            <button
              key={days}
              onClick={() => setLookbackDays(days)}
              className={lookbackDays === days ? "active" : ""}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
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
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                domain={["auto", "auto"]}
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
                itemStyle={{ padding: "2px 0" }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
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
                iconSize={12}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-[var(--text-muted)] font-mono">Loading time series…</p>
          </div>
        )}
      </div>
    </section>
  );
};
