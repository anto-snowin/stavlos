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
  { key: "aave-v3_USDC_Ethereum", name: "Aave v3 · USDC · ETH", color: "#2dd4bf" },
  { key: "compound-v3_USDC_Ethereum", name: "Compound v3 · USDC · ETH", color: "#818cf8" },
  { key: "maple_USDC_Ethereum", name: "Maple · USDC · ETH", color: "#34d399" },
  { key: "aave-v3_USDC_Arbitrum", name: "Aave v3 · USDC · ARB", color: "#22d3ee" },
  { key: "jupiter-lend_USDC_Solana", name: "Jupiter · USDC · SOL", color: "#a78bfa" },
];

export const HistoricalYieldChart: React.FC<HistoricalYieldChartProps> = ({ data }) => {
  const [lookbackDays, setLookbackDays] = useState<number>(90);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-lookbackDays);
  }, [data, lookbackDays]);

  return (
    <div className="card p-5 sm:p-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-accent-teal" />
            Historical APY Trends
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Daily lending rates across core pools
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
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                domain={["auto", "auto"]}
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
                itemStyle={{ padding: "2px 0" }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
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
            <div className="text-center">
              <div className="shimmer w-48 h-3 rounded-full mx-auto mb-3" />
              <div className="shimmer w-32 h-3 rounded-full mx-auto" />
              <p className="text-[11px] text-[var(--text-muted)] mt-3">Loading time series…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
