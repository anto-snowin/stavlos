"use client";

import React from "react";
import { Wallet, Sparkles, Terminal } from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import { SystemHealth } from "@/types";

interface HeaderProps {
  health: SystemHealth | null;
  selectedHomeChain: string;
  onHomeChainChange: (chain: string) => void;
}

const CHAINS = ["Ethereum", "Arbitrum", "Optimism", "Base", "Solana"];

export const Header: React.FC<HeaderProps> = ({
  health,
  selectedHomeChain,
  onHomeChainChange,
}) => {
  const {
    address,
    isConnected,
    isConnecting,
    isDemoMode,
    connectWallet,
    disconnectWallet,
    simulateDemoWallet,
  } = useWeb3();

  return (
    <header className="pb-5 border-b-2 border-black" aria-label="Dashboard Header">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity: Bold Neo-Brutalist Block & Oversized Grotesque Typography */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black text-[#FFE600] border-2 border-black shadow-[3px_3px_0px_0px_#FFE600] flex items-center justify-center shrink-0">
            <span className="font-display font-black text-xl tracking-tighter">ST</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-black uppercase leading-none">
                STAVLOS
              </h1>
              <span className="bg-[#00E575] text-black font-mono font-black text-[10px] px-1.5 py-0.5 border border-black uppercase tracking-wider">
                v2.0 BRUTAL
              </span>
            </div>
            <p className="text-xs text-[#333333] font-mono font-semibold tracking-normal mt-0.5">
              QUANTITATIVE RISK ENGINE · DEFI ROTATION AGENT
            </p>
          </div>
        </div>

        {/* Right side controls: Chain selector, health, wallet actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Home Chain Segmented Control (Solid blocky buttons) */}
          <div className="segmented-control" id="home-chain-selector">
            {CHAINS.map((chain) => (
              <button
                key={chain}
                onClick={() => onHomeChainChange(chain)}
                className={chain === selectedHomeChain ? "active" : ""}
              >
                <span>{chain.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* System Status Pill */}
          <div className="neo-pill bg-white px-2.5 py-1 text-[11px] font-mono font-bold text-black border-2 border-black shadow-[2px_2px_0px_#000]">
            <span
              className={`w-2 h-2 rounded-none border border-black ${
                health?.status === "healthy" ? "bg-[#00E575]" : "bg-[#FFE600]"
              }`}
            />
            <span>{health?.status === "healthy" ? "LIVE FEED" : "SIM"}</span>
          </div>

          {/* Wallet Actions */}
          {isConnected && address ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-mono">
              <span className="text-black font-black">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              {isDemoMode && (
                <span className="text-[10px] font-mono px-1 py-0.2 bg-[#FFE600] text-black border border-black font-black uppercase">
                  Demo
                </span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-black hover:bg-[#FF4949] hover:text-white px-1 font-black transition-colors"
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
                className="neo-btn neo-btn-primary border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold"
              >
                <Wallet className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{isConnecting ? "CONNECTING…" : "CONNECT WALLET"}</span>
              </button>

              <button
                onClick={() => simulateDemoWallet()}
                className="neo-btn neo-btn-yellow border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold"
                title="Simulate read-only institutional portfolio"
              >
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                <span>DEMO PORTFOLIO</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
