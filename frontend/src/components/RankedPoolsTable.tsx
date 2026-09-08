"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, Info, ChevronDown, ChevronUp, Layers, Filter } from "lucide-react";
import { PoolRiskScore } from "@/types";

interface RankedPoolsTableProps {
  pools: PoolRiskScore[];
}

type SortField = "composite_score" | "headline_apy" | "rolling_30d_avg_apy" | "tvl_usd" | "pool_age_days";

export const RankedPoolsTable: React.FC<RankedPoolsTableProps> = ({ pools }) => {
  const [selectedChain, setSelectedChain] = useState<string>("ALL");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("composite_score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null);

  // Derive unique chains and symbols
  const chains = useMemo(() => {
    const set = new Set<string>();
    pools.forEach((p) => set.add(p.chain));
    return ["ALL", ...Array.from(set).sort()];
  }, [pools]);

  const symbols = useMemo(() => {
    const set = new Set<string>();
    pools.forEach((p) => set.add(p.symbol));
    return ["ALL", ...Array.from(set).sort()];
  }, [pools]);

  // Filter & Sort
  const processedPools = useMemo(() => {
    return pools
      .filter((p) => (selectedChain === "ALL" ? true : p.chain === selectedChain))
      .filter((p) => (selectedSymbol === "ALL" ? true : p.symbol === selectedSymbol))
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [pools, selectedChain, selectedSymbol, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleExpand = (poolId: string) => {
    setExpandedPoolId(expandedPoolId === poolId ? null : poolId);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 my-6">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Ranked Stablecoin Lending Opportunities
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by composite risk-adjusted score incorporating TVL depth, maturity, volatility, chain risk, and bridge friction.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Chain:</span>
            <select
              id="chain-filter-select"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-transparent text-sky-400 font-medium focus:outline-none cursor-pointer"
            >
              {chains.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
            <span className="text-slate-400">Asset:</span>
            <select
              id="asset-filter-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-transparent text-sky-400 font-medium focus:outline-none cursor-pointer"
            >
              {symbols.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 ml-2">
            Showing {processedPools.length} of {pools.length} pools
          </span>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">Rank</th>
              <th className="py-3.5 px-4">Protocol & Asset</th>
              <th className="py-3.5 px-4">Chain</th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("headline_apy")}
              >
                <div className="flex items-center gap-1">
                  <span>Headline APY</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("rolling_30d_avg_apy")}
              >
                <div className="flex items-center gap-1">
                  <span>30d Avg APY</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("tvl_usd")}
              >
                <div className="flex items-center gap-1">
                  <span>TVL ($M)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("composite_score")}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">Explanation</th>
              <th className="py-3.5 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {processedPools.map((pool, idx) => {
              const isExpanded = expandedPoolId === pool.pool_id;
              const isTopTier = pool.composite_score >= 55.0;

              return (
                <React.Fragment key={pool.pool_id}>
                  <tr
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isTopTier ? "bg-sky-500/[0.02]" : ""
                    }`}
                    onClick={() => toggleExpand(pool.pool_id)}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white capitalize flex items-center gap-1.5">
                        <span>{pool.project}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                          {pool.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {pool.chain}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {pool.headline_apy.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {pool.rolling_30d_avg_apy.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      ${(pool.tvl_usd / 1e6).toFixed(1)}M
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pool.composite_score >= 60
                                ? "bg-emerald-400"
                                : pool.composite_score >= 45
                                ? "bg-sky-400"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(100, pool.composite_score)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold font-mono text-white">
                          {pool.composite_score.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {pool.explanation}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Breakdown Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-900/80 border-y border-sky-500/20">
                      <td colSpan={9} className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs mb-3">
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="text-slate-400 block">TVL Score (25% wt):</span>
                            <span className="text-sm font-bold text-white font-mono">
                              {(pool.tvl_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="text-slate-400 block">Age Score (20% wt):</span>
                            <span className="text-sm font-bold text-white font-mono">
                              {(pool.age_score * 100).toFixed(1)}% ({pool.pool_age_days ?? "--"}d)
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="text-slate-400 block">Stability (20% wt):</span>
                            <span className="text-sm font-bold text-white font-mono">
                              {(pool.volatility_score * 100).toFixed(1)}% (sigma: {pool.rolling_30d_volatility?.toFixed(3) ?? "N/A"})
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="text-slate-400 block">Chain Tier (20% wt):</span>
                            <span className="text-sm font-bold text-white font-mono">
                              {(pool.chain_risk_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                            <span className="text-slate-400 block">Bridge Score (15% wt):</span>
                            <span className="text-sm font-bold text-white font-mono">
                              {(pool.bridge_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 bg-sky-950/30 border border-sky-500/20 p-3 rounded-lg text-xs text-sky-200">
                          <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Quantitative Audit Rationale:</strong> {pool.explanation}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
