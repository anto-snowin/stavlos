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

export const HistoricalYieldChart: React.FC<HistoricalYieldChartProps> = ({ data }) => {
  const [lookbackDays, setLookbackDays] = useState<number>(90);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-lookbackDays);
  }, [data, lookbackDays]);

  const series = [
    { key: "aave-v3_USDC_Ethereum", name: "Aave v3 USDC (Ethereum)", color: "#38bdf8" },
    { key: "compound-v3_USDC_Ethereum", name: "Compound v3 USDC (Ethereum)", color: "#818cf8" },
    { key: "maple_USDC_Ethereum", name: "Maple USDC (Ethereum)", color: "#34d399" },
    { key: "aave-v3_USDC_Arbitrum", name: "Aave v3 USDC (Arbitrum)", color: "#f59e0b" },
    { key: "jupiter-lend_USDC_Solana", name: "Jupiter Lend USDC (Solana)", color: "#c084fc" },
  ];

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-sky-400" />
            Cross-Chain Historical APY Trends
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized multi-month daily lending rates across core protocol pools
          </p>
        </div>

        {/* Lookback Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1 text-xs">
          {[30, 90, 180].map((days) => (
            <button
              key={days}
              onClick={() => setLookbackDays(days)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                lookbackDays === days
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                tickFormatter={(val) => `${val.toFixed(1)}%`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                iconType="circle"
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Loading historical APY time series...
          </div>
        )}
      </div>
    </div>
  );
};
