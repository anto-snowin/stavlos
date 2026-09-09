"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Layers, Info } from "lucide-react";
import { PoolRiskScore } from "@/types";
import { getRiskBlurPx, getRiskBlur } from "@/config/riskBlur";

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

  return (
    <section className="space-y-4" aria-label="Ranked Opportunities">
      {/* ─── Control Bar: Filters & Sorters ─── */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#35C48F]" />
            Ranked Opportunities
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Glass clarity reflects risk confidence · Frosted glass encodes uncertainty
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {/* Chain filter */}
          <div className="segmented-control" id="chain-filter-group">
            {chains.slice(0, 6).map((c) => (
              <button
                key={c}
                id={c === "ALL" ? "chain-filter-all" : `chain-filter-${c.toLowerCase()}`}
                onClick={() => setSelectedChain(c)}
                className={selectedChain === c ? "active" : ""}
              >
                {c === "ALL" ? "All Chains" : c}
              </button>
            ))}
          </div>

          {/* Asset filter */}
          <div className="segmented-control" id="symbol-filter-group">
            {symbols.map((s) => (
              <button
                key={s}
                id={s === "ALL" ? "asset-filter-all" : `asset-filter-${s.toLowerCase()}`}
                onClick={() => setSelectedSymbol(s)}
                className={selectedSymbol === s ? "active" : ""}
              >
                {s === "ALL" ? "All Assets" : s}
              </button>
            ))}
          </div>

          <span className="text-[var(--text-muted)] font-mono text-[11px] ml-1">
            {processedPools.length}/{pools.length}
          </span>
        </div>
      </div>

      {/* ─── Column Legend / Header ─── */}
      <div className="hidden lg:grid lg:grid-cols-12 px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
        <div className="col-span-1"># Rank</div>
        <div className="col-span-3">Protocol & Asset</div>
        <div className="col-span-2">Chain</div>
        <div
          className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
          onClick={() => handleSort("headline_apy")}
        >
          <span>Headline APY</span>
          <ArrowUpDown className="w-3 h-3 text-[#35C48F]" />
        </div>
        <div
          className="col-span-1 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
          onClick={() => handleSort("tvl_usd")}
        >
          <span>TVL</span>
          <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
        </div>
        <div
          className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
          onClick={() => handleSort("composite_score")}
        >
          <span>Risk Score & Blur</span>
          <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]" />
        </div>
        <div className="col-span-1 text-right">Details</div>
      </div>

      {/* ─── Stack of Individual Glass Panels ─── */}
      <div className="space-y-2.5 stagger-panels">
        {processedPools.map((pool, idx) => {
          const isExpanded = expandedPoolId === pool.pool_id;
          const globalRank = idx + 1;
          const isHero = globalRank === 1 && selectedChain === "ALL" && selectedSymbol === "ALL";
          const blurRadius = getRiskBlur(pool.composite_score);
          const blurPx = getRiskBlurPx(pool.composite_score);

          return (
            <div
              key={pool.pool_id}
              className={`risk-panel animate-rack-focus ${isHero ? "risk-panel-hero" : ""}`}
            >
              {/* ─── Background Frosted Glass Substrate (Dynamic Blur via Risk Score) ─── */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-300"
                style={{
                  backgroundColor: isHero ? "rgba(217, 162, 75, 0.04)" : "var(--glass-fill)",
                  backdropFilter: `blur(${blurRadius})`,
                  WebkitBackdropFilter: `blur(${blurRadius})`,
                }}
              />

              {/* ─── Foreground Content Layer (Unblurred, Pin-Sharp Numerals) ─── */}
              <div className="risk-panel-content p-4 sm:p-4.5">
                <div
                  className="grid grid-cols-2 lg:grid-cols-12 items-center gap-3 lg:gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(pool.pool_id)}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center gap-2">
                    {isHero ? (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-[#D9A24B]/40 bg-[#D9A24B]/15 text-[#D9A24B]">
                        #1
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        #{globalRank}
                      </span>
                    )}
                  </div>

                  {/* Protocol & Asset */}
                  <div className="col-span-1 lg:col-span-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm capitalize">
                        {pool.project}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-secondary)] border border-white/10">
                        {pool.symbol}
                      </span>
                      {isHero && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#D9A24B] border border-[#D9A24B]/30 px-1 rounded">
                          Hero
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chain badge (Glass-fill pill, no per-chain rainbow border) */}
                  <div className="col-span-1 lg:col-span-2">
                    <span className="glass-pill">
                      <span>{pool.chain}</span>
                    </span>
                  </div>

                  {/* Headline APY */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="text-sm sm:text-base font-bold font-mono text-[#35C48F] tabular-nums">
                      {pool.headline_apy.toFixed(2)}%
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      30d avg {pool.rolling_30d_avg_apy.toFixed(2)}%
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="col-span-1 lg:col-span-1">
                    <div className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] tabular-nums">
                      ${(pool.tvl_usd / 1e6).toFixed(1)}M
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {pool.pool_age_days ? `${pool.pool_age_days}d age` : "mature"}
                    </div>
                  </div>

                  {/* Risk Score & Ambient Blur Value */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-white text-sm sm:text-base tabular-nums">
                        {pool.composite_score.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        /100
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] border border-white/10 px-1 py-0.5 rounded">
                        blur({blurPx}px)
                      </span>
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <div className="col-span-2 lg:col-span-1 flex justify-end">
                    <button
                      className="p-1 text-[var(--text-muted)] hover:text-white transition-colors"
                      aria-label="Toggle factor breakdown"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ─── Expanded Decomposed Risk Factors ─── */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--glass-border-subtle)] space-y-3 animate-fade">
                    {/* Five factor breakdown tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { label: "TVL Depth", weight: "25%", value: pool.tvl_score },
                        { label: "Protocol Age", weight: "20%", value: pool.age_score, extra: pool.pool_age_days ? `${pool.pool_age_days}d` : undefined },
                        { label: "Stability", weight: "20%", value: pool.volatility_score, extra: pool.rolling_30d_volatility ? `σ ${pool.rolling_30d_volatility.toFixed(3)}` : undefined },
                        { label: "Chain Tier", weight: "20%", value: pool.chain_risk_score },
                        { label: "Bridge Friction", weight: "15%", value: pool.bridge_score },
                      ].map((factor) => (
                        <div
                          key={factor.label}
                          className="p-2.5 rounded-lg border border-[var(--glass-border-subtle)] bg-white/[0.02]"
                        >
                          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
                            {factor.label} ({factor.weight})
                          </div>
                          <div className="text-sm font-mono font-semibold text-white mt-1 tabular-nums">
                            {(factor.value * 100).toFixed(1)}%
                          </div>
                          {factor.extra && (
                            <div className="text-[9px] font-mono text-[var(--text-tertiary)] mt-0.5">
                              {factor.extra}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Audit Rationale */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--glass-border-subtle)] bg-white/[0.02] text-xs text-[var(--text-secondary)]">
                      <Info className="w-4 h-4 text-[#35C48F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Audit Rationale: </span>
                        {pool.explanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
