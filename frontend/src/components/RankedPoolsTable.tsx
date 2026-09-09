"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, Info, ChevronDown, ChevronUp, Layers, Search } from "lucide-react";
import { PoolRiskScore } from "@/types";

interface RankedPoolsTableProps {
  pools: PoolRiskScore[];
}

type SortField = "composite_score" | "headline_apy" | "rolling_30d_avg_apy" | "tvl_usd" | "pool_age_days";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "chain-dot-ethereum",
  Arbitrum: "chain-dot-arbitrum",
  Optimism: "chain-dot-optimism",
  Base: "chain-dot-base",
  Solana: "chain-dot-solana",
  Polygon: "chain-dot-polygon",
  BSC: "chain-dot-bsc",
};

const CHAIN_TAG_STYLES: Record<string, string> = {
  Ethereum: "bg-[#627eea]/10 text-[#8b9eff] border-[#627eea]/20",
  Arbitrum: "bg-[#28a0f0]/10 text-[#5ec2ff] border-[#28a0f0]/20",
  Optimism: "bg-[#ff0420]/8 text-[#ff6b7a] border-[#ff0420]/15",
  Base: "bg-[#0052ff]/10 text-[#6b9fff] border-[#0052ff]/20",
  Solana: "bg-[#9945ff]/10 text-[#b87aff] border-[#9945ff]/20",
};

function getScoreColor(score: number): string {
  if (score >= 60) return "bg-accent-emerald";
  if (score >= 45) return "bg-accent-teal";
  return "bg-accent-amber";
}

function getScoreGradient(score: number): string {
  if (score >= 60) return "from-accent-emerald/80 to-accent-teal/60";
  if (score >= 45) return "from-accent-teal/80 to-accent-cyan/60";
  return "from-accent-amber/80 to-accent-amber/40";
}

export const RankedPoolsTable: React.FC<RankedPoolsTableProps> = ({ pools }) => {
  const [selectedChain, setSelectedChain] = useState<string>("ALL");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("composite_score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null);

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

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="py-3 px-4 cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-accent-teal" : "text-[var(--text-muted)]"}`} />
      </div>
    </th>
  );

  return (
    <div className="card overflow-hidden animate-in">
      {/* Header */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-teal" />
            Ranked Opportunities
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Sorted by composite risk-adjusted score
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="segmented-control">
            {chains.slice(0, 6).map((c) => (
              <button
                key={c}
                id={c === "ALL" ? "chain-filter-all" : `chain-filter-${c.toLowerCase()}`}
                onClick={() => setSelectedChain(c)}
                className={selectedChain === c ? "active" : ""}
              >
                {c === "ALL" ? (
                  "All"
                ) : (
                  <span className="flex items-center gap-1">
                    <span className={`chain-dot ${CHAIN_COLORS[c] || ""}`} />
                    <span className="hidden sm:inline">{c}</span>
                    <span className="sm:hidden">{c.slice(0, 3)}</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="segmented-control">
            {symbols.map((s) => (
              <button
                key={s}
                id={s === "ALL" ? "asset-filter-all" : `asset-filter-${s.toLowerCase()}`}
                onClick={() => setSelectedSymbol(s)}
                className={selectedSymbol === s ? "active" : ""}
              >
                {s === "ALL" ? "All" : s}
              </button>
            ))}
          </div>

          <span className="text-[var(--text-muted)] font-mono ml-1">
            {processedPools.length}/{pools.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <tr>
              <th className="py-3 px-4 w-14 text-center">#</th>
              <th className="py-3 px-4">Protocol</th>
              <th className="py-3 px-4">Chain</th>
              <SortHeader field="headline_apy">APY</SortHeader>
              <SortHeader field="rolling_30d_avg_apy">30d Avg</SortHeader>
              <SortHeader field="tvl_usd">TVL</SortHeader>
              <SortHeader field="composite_score">Score</SortHeader>
              <th className="py-3 px-4">Rationale</th>
              <th className="py-3 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {processedPools.map((pool, idx) => {
              const isExpanded = expandedPoolId === pool.pool_id;
              const globalRank = idx + 1;

              return (
                <React.Fragment key={pool.pool_id}>
                  <tr
                    className="table-row-hover cursor-pointer border-b border-[var(--border-subtle)]"
                    onClick={() => toggleExpand(pool.pool_id)}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      {globalRank <= 3 ? (
                        <span className={`rank-badge rank-${globalRank}`}>
                          {globalRank}
                        </span>
                      ) : (
                        <span className="font-mono text-[12px] text-[var(--text-muted)]">
                          {globalRank}
                        </span>
                      )}
                    </td>

                    {/* Protocol + Asset */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium capitalize">{pool.project}</span>
                        <span className="text-[10px] font-mono px-1.5 py-[2px] rounded bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                          {pool.symbol}
                        </span>
                      </div>
                    </td>

                    {/* Chain */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-medium border ${CHAIN_TAG_STYLES[pool.chain] || "bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)] border-[var(--border-subtle)]"}`}>
                        <span className={`chain-dot ${CHAIN_COLORS[pool.chain] || ""}`} />
                        {pool.chain}
                      </span>
                    </td>

                    {/* Headline APY */}
                    <td className="py-3 px-4 font-mono font-semibold text-accent-emerald">
                      {pool.headline_apy.toFixed(2)}%
                    </td>

                    {/* 30d Avg */}
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      {pool.rolling_30d_avg_apy.toFixed(2)}%
                    </td>

                    {/* TVL */}
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      ${(pool.tvl_usd / 1e6).toFixed(1)}M
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="score-bar w-16">
                          <div
                            className={`score-bar-fill bg-gradient-to-r ${getScoreGradient(pool.composite_score)}`}
                            style={{ width: `${Math.min(100, pool.composite_score)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-[13px]">
                          {pool.composite_score.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Explanation */}
                    <td className="py-3 px-4 text-[11px] text-[var(--text-muted)] max-w-[200px] truncate">
                      {pool.explanation}
                    </td>

                    {/* Chevron */}
                    <td className="py-3 px-4 text-[var(--text-muted)]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <tr className="border-b border-accent-teal/10">
                      <td colSpan={9} className="p-0">
                        <div className="bg-[var(--bg-surface-raised)] px-5 py-4 animate-fade">
                          {/* Score breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                            {[
                              { label: "TVL Depth", value: pool.tvl_score, weight: "25%", color: "text-accent-teal" },
                              { label: "Protocol Age", value: pool.age_score, weight: "20%", color: "text-accent-cyan", extra: pool.pool_age_days ? `${pool.pool_age_days}d` : undefined },
                              { label: "Stability", value: pool.volatility_score, weight: "20%", color: "text-accent-amber", extra: pool.rolling_30d_volatility ? `σ ${pool.rolling_30d_volatility.toFixed(3)}` : undefined },
                              { label: "Chain Tier", value: pool.chain_risk_score, weight: "20%", color: "text-accent-indigo" },
                              { label: "Bridge Cost", value: pool.bridge_score, weight: "15%", color: "text-accent-violet" },
                            ].map((factor) => (
                              <div key={factor.label} className="bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                                <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase mb-1">
                                  {factor.label} · {factor.weight}
                                </div>
                                <div className={`text-base font-bold font-mono ${factor.color}`}>
                                  {(factor.value * 100).toFixed(1)}%
                                </div>
                                {factor.extra && (
                                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{factor.extra}</div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Audit rationale */}
                          <div className="flex items-start gap-2.5 bg-accent-teal/5 border border-accent-teal/10 p-3 rounded-lg text-[12px] text-[var(--text-secondary)]">
                            <Info className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-accent-teal">Audit Rationale: </span>
                              {pool.explanation}
                            </div>
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
