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
  { key: "aave-v3_USDC_Ethereum", name: "Aave v3 · USDC · ETH", color: "#000000" },
  { key: "compound-v3_USDC_Ethereum", name: "Compound v3 · USDC · ETH", color: "#666666" },
  { key: "maple_USDC_Ethereum", name: "Maple · USDC · ETH", color: "#D97706" },
  { key: "aave-v3_USDC_Arbitrum", name: "Aave v3 · USDC · ARB", color: "#00E575" },
  { key: "jupiter-lend_USDC_Solana", name: "Jupiter · USDC · SOL", color: "#7C3AED" },
];

export const HistoricalYieldChart: React.FC<HistoricalYieldChartProps> = ({ data }) => {
  const [lookbackDays, setLookbackDays] = useState<number>(90);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-lookbackDays);
  }, [data, lookbackDays]);

  return (
    <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 sm:p-6 space-y-6" aria-label="Historical APY Trends">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-display font-black text-black uppercase flex items-center gap-2">
            <span className="w-6 h-6 bg-black text-[#FFE600] flex items-center justify-center font-mono font-black text-xs">
              ~
            </span>
            HISTORICAL APY TRENDS
          </h3>
          <p className="text-xs text-[#444444] mt-0.5 font-mono font-bold">
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
      <div className="h-72 w-full border-2 border-black p-3 bg-[#FAF8F5] shadow-[3px_3px_0px_#000]">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: -5, bottom: 5 }}>
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
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                domain={["auto", "auto"]}
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
                itemStyle={{ padding: "2px 0", color: "#000000" }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
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
                iconType="plainline"
                iconSize={16}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#000000", strokeWidth: 2, fill: "#FFE600" }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-black font-mono font-bold">LOADING TIME SERIES…</p>
          </div>
        )}
      </div>
    </section>
  );
};
