"use client";

import React from "react";
import { Wallet, Sparkles } from "lucide-react";
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
    <header className="pb-5 border-b border-[var(--glass-border-subtle)]" aria-label="Dashboard Header">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity: Custom sharp geometric mark */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg border border-[var(--glass-border)] bg-white/[0.04] backdrop-blur-[6px] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18L10 6H14L8 18H4Z" fill="#F8FAFC" fillOpacity="0.95" />
              <path d="M11 18L17 6H20L14 18H11Z" fill="#35C48F" fillOpacity="0.8" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              STAVLOS
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono tracking-normal">
              Quantitative risk-adjusted stablecoin intelligence
            </p>
          </div>
        </div>

        {/* Right side controls: Chain selector, health, wallet actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Home Chain Segmented Glass Control */}
          <div className="segmented-control" id="home-chain-selector">
            {CHAINS.map((chain) => (
              <button
                key={chain}
                onClick={() => onHomeChainChange(chain)}
                className={chain === selectedHomeChain ? "active" : ""}
              >
                <span>{chain}</span>
              </button>
            ))}
          </div>

          {/* System Status Pill */}
          <div className="glass-pill px-2.5 py-1 text-[11px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health?.status === "healthy" ? "bg-[#35C48F]" : "bg-[#D9A24B]"
              }`}
            />
            <span>{health?.status === "healthy" ? "Live Feed" : "Sim"}</span>
          </div>

          {/* Wallet Actions (Rebuilt with glass-fill + hairline border) */}
          {isConnected && address ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.06] border border-[var(--glass-border)] text-xs">
              <span className="font-mono text-white font-medium">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              {isDemoMode && (
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#D9A24B]/15 text-[#D9A24B] border border-[#D9A24B]/30">
                  Demo
                </span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-[var(--text-muted)] hover:text-[#E5484D] transition-colors ml-1 leading-none font-bold"
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="glass-btn cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{isConnecting ? "Connecting…" : "Connect Wallet"}</span>
              </button>

              <button
                onClick={() => simulateDemoWallet()}
                className="glass-btn cursor-pointer"
                title="Simulate read-only institutional portfolio"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D9A24B]" />
                <span>Demo Portfolio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
