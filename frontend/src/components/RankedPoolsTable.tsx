"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Layers, Info, ShieldAlert, ShieldCheck } from "lucide-react";
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
      {/* ─── Control Bar: Filters & Sorters (Neo-Brutalist Block) ─── */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-black text-black uppercase flex items-center gap-2">
            <span className="w-5 h-5 bg-black text-[#00E575] flex items-center justify-center text-xs">
              #
            </span>
            RANKED OPPORTUNITIES
          </h2>
          <p className="text-xs text-[#555555] font-mono font-bold mt-0.5">
            5-Factor Quantitative Risk Model · Strict Churn Protection
          </p>
        </div>

        {/* Filter controls: Solid blocky buttons with black outline */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Chain filter */}
          <div className="segmented-control" id="chain-filter-group">
            {chains.slice(0, 6).map((c) => (
              <button
                key={c}
                id={c === "ALL" ? "chain-filter-all" : `chain-filter-${c.toLowerCase()}`}
                onClick={() => setSelectedChain(c)}
                className={selectedChain === c ? "active" : ""}
              >
                {c === "ALL" ? "ALL CHAINS" : c.toUpperCase()}
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
                {s === "ALL" ? "ALL ASSETS" : s}
              </button>
            ))}
          </div>

          <span className="bg-black text-[#FFE600] font-mono font-black text-xs px-2 py-1 border border-black shadow-[1.5px_1.5px_0px_#000]">
            {processedPools.length}/{pools.length}
          </span>
        </div>
      </div>

      {/* ─── Column Legend / Header ─── */}
      <div className="hidden lg:grid lg:grid-cols-12 px-4 py-2.5 bg-black text-white font-mono font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000]">
        <div className="col-span-1"># RANK</div>
        <div className="col-span-3">PROTOCOL & ASSET</div>
        <div className="col-span-2">CHAIN</div>
        <div
          className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-[#00E575] transition-colors"
          onClick={() => handleSort("headline_apy")}
        >
          <span>HEADLINE APY</span>
          <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div
          className="col-span-1 cursor-pointer flex items-center gap-1 hover:text-[#00E575] transition-colors"
          onClick={() => handleSort("tvl_usd")}
        >
          <span>TVL</span>
          <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div
          className="col-span-2 cursor-pointer flex items-center gap-1 hover:text-[#00E575] transition-colors"
          onClick={() => handleSort("composite_score")}
        >
          <span>RISK GRADE</span>
          <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="col-span-1 text-right">AUDIT</div>
      </div>

      {/* ─── Stack of Individual Solid Brutalist Panels ─── */}
      <div className="space-y-3">
        {processedPools.map((pool, idx) => {
          const isExpanded = expandedPoolId === pool.pool_id;
          const globalRank = idx + 1;
          const isHero = globalRank === 1 && selectedChain === "ALL" && selectedSymbol === "ALL";
          
          // Risk Tier color block
          const score = pool.composite_score;
          const tierColor = score >= 85 ? "bg-[#00E575] text-black" : (score >= 75 ? "bg-[#FFE600] text-black" : "bg-[#FF4949] text-white");
          const tierLabel = score >= 85 ? "TIER 1 · SAFE" : (score >= 75 ? "TIER 2 · BALANCED" : "TIER 3 · CAUTION");

          // Row background: flat alternating
          const rowBg = isHero ? "bg-[#FFFCE0]" : (idx % 2 === 0 ? "bg-white" : "bg-[#FAF7EE]");

          return (
            <div
              key={pool.pool_id}
              className={`
                border-2 border-black transition-transform duration-75 select-none
                ${isHero ? "border-3 shadow-[5px_5px_0px_0px_#000]" : "shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000]"}
                ${rowBg}
              `}
            >
              {/* Foreground Content */}
              <div className="p-4 sm:p-4.5">
                <div
                  className="grid grid-cols-2 lg:grid-cols-12 items-center gap-3 lg:gap-4 cursor-pointer"
                  onClick={() => toggleExpand(pool.pool_id)}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center gap-2">
                    {isHero ? (
                      <span className="font-mono text-xs font-black px-2 py-0.5 border-2 border-black bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]">
                        #1 TOP
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-black px-1.5 py-0.5 border border-black bg-black text-white">
                        #{globalRank}
                      </span>
                    )}
                  </div>

                  {/* Protocol & Asset */}
                  <div className="col-span-1 lg:col-span-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-black font-display font-black text-base capitalize">
                        {pool.project}
                      </span>
                      <span className="text-xs font-mono font-black px-1.5 py-0.5 bg-black text-white border border-black">
                        {pool.symbol}
                      </span>
                      {isHero && (
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FFE600] text-black border border-black px-1">
                          HERO PICK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chain badge (Solid block with black border) */}
                  <div className="col-span-1 lg:col-span-2">
                    <span className="inline-block bg-white text-black font-mono font-bold text-xs px-2 py-0.5 border-1.5 border-black shadow-[1.5px_1.5px_0px_#000]">
                      {pool.chain.toUpperCase()}
                    </span>
                  </div>

                  {/* Headline APY (High-contrast Monospace) */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="inline-block bg-[#00E575] text-black border border-black px-2 py-0.5 font-mono font-black text-base sm:text-lg tabular-nums shadow-[1.5px_1.5px_0px_#000]">
                      {pool.headline_apy.toFixed(2)}%
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#555555] mt-0.5">
                      30D AVG: {pool.rolling_30d_avg_apy.toFixed(2)}%
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="col-span-1 lg:col-span-1">
                    <div className="text-sm font-mono font-black text-black tabular-nums">
                      ${(pool.tvl_usd / 1e6).toFixed(1)}M
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#555555]">
                      {pool.pool_age_days ? `${pool.pool_age_days}D AGE` : "MATURE"}
                    </div>
                  </div>

                  {/* Risk Score (Solid Color Block) */}
                  <div className="col-span-1 lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border border-black font-mono font-black text-xs shadow-[1.5px_1.5px_0px_#000] ${tierColor}`}>
                        {pool.composite_score.toFixed(1)}/100
                      </span>
                      <span className="text-[10px] font-mono font-bold text-black hidden sm:inline">
                        {tierLabel}
                      </span>
                    </div>
                  </div>

                  {/* Expand Chevron (Solid brutalist button) */}
                  <div className="col-span-2 lg:col-span-1 flex justify-end">
                    <div className="p-1 border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[1px_1px_0px_#000]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Expanded Decomposed Risk Factors ─── */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t-2 border-black space-y-3">
                    {/* Five factor breakdown tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { label: "TVL DEPTH", weight: "25%", value: pool.tvl_score },
                        { label: "PROTOCOL AGE", weight: "20%", value: pool.age_score, extra: pool.pool_age_days ? `${pool.pool_age_days}d` : undefined },
                        { label: "STABILITY", weight: "20%", value: pool.volatility_score, extra: pool.rolling_30d_volatility ? `σ ${pool.rolling_30d_volatility.toFixed(3)}` : undefined },
                        { label: "CHAIN TIER", weight: "20%", value: pool.chain_risk_score },
                        { label: "BRIDGE FRICTION", weight: "15%", value: pool.bridge_score },
                      ].map((factor) => (
                        <div
                          key={factor.label}
                          className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000]"
                        >
                          <div className="text-[10px] text-[#555555] font-mono font-black uppercase">
                            {factor.label} ({factor.weight})
                          </div>
                          <div className="text-base font-mono font-black text-black mt-1 tabular-nums">
                            {(factor.value * 100).toFixed(1)}%
                          </div>
                          {factor.extra && (
                            <div className="text-[10px] font-mono font-bold text-black mt-0.5">
                              {factor.extra}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Audit Rationale */}
                    <div className="flex items-start gap-2.5 p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono">
                      <Info className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
                      <div className="text-black leading-relaxed">
                        <span className="font-black bg-black text-[#FFE600] px-1 py-0.5 mr-1.5">
                          AUDIT RATIONALE
                        </span>
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
