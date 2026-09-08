import React from "react";
import { ShieldCheck, Database, Cpu, Compass } from "lucide-react";
import { SystemHealth } from "@/types";

interface HeaderProps {
  health: SystemHealth | null;
  selectedHomeChain: string;
  onHomeChainChange: (chain: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  selectedHomeChain,
  onHomeChainChange,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              STAVLOS
              <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Quant Yield Engine
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Cross-chain risk-adjusted stablecoin lending analytics & backtesting
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Home Chain Selector */}
        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
          <span className="text-slate-400">Home Chain:</span>
          <select
            id="home-chain-select"
            value={selectedHomeChain}
            onChange={(e) => onHomeChainChange(e.target.value)}
            className="bg-slate-900 text-sky-300 font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="Ethereum">Ethereum</option>
            <option value="Arbitrum">Arbitrum</option>
            <option value="Optimism">Optimism</option>
            <option value="Base">Base</option>
            <option value="Solana">Solana</option>
          </select>
        </div>

        {/* System Health Badges */}
        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{health?.status === "healthy" ? "Engine Operational" : "Live Simulation"}</span>
        </div>

        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>{health?.monitored_pools ?? 49} Institutional Pools</span>
        </div>

        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-Execution Mode</span>
        </div>
      </div>
    </header>
  );
};
