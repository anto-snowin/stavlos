import React from "react";
import { ShieldCheck, Database, Compass, Wallet, Sparkles } from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
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
  const { address, isConnected, isConnecting, isDemoMode, connectWallet, disconnectWallet, simulateDemoWallet } = useWeb3();

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

        {/* Non-Custodial Web3 Wallet Connector */}
        <div className="flex items-center gap-2">
          {isConnected && address ? (
            <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs border border-sky-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-sky-300">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              {isDemoMode && (
                <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Demo
                </span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-[11px] text-slate-400 hover:text-rose-400 ml-1 transition-colors"
                title="Disconnect wallet"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
              <button
                onClick={() => simulateDemoWallet()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Simulate a read-only institutional portfolio without needing an installed wallet extension"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Wallet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
