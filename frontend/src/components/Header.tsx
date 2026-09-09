"use client";

import React from "react";
import { Wallet, Sparkles, Zap } from "lucide-react";
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
  const { address, isConnected, isConnecting, isDemoMode, connectWallet, disconnectWallet, simulateDemoWallet } = useWeb3();

  return (
    <header className="animate-in pb-6">
      {/* Top row: Logo + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo mark */}
        <div className="flex items-center gap-3.5">
          {/* Custom SVG mark */}
          <div className="relative">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
              <path d="M10 22L14 13H18L14 22H10Z" fill="white" fillOpacity="0.9"/>
              <path d="M16 22L20 13H24L20 22H16Z" fill="white" fillOpacity="0.6"/>
              <path d="M22 22L26 13H28L24 22H22Z" fill="white" fillOpacity="0.35"/>
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2dd4bf"/>
                  <stop offset="1" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                STAVLOS
              </h1>
              <span className="text-[10px] font-mono font-medium tracking-widest uppercase px-2 py-[3px] rounded-md bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                v0.1
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 tracking-wide">
              Cross-chain yield intelligence & backtesting
            </p>
          </div>
        </div>

        {/* Right side: chain selector, status, wallet */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Home Chain — Segmented Control */}
          <div className="segmented-control" id="home-chain-selector">
            {CHAINS.map((chain) => (
              <button
                key={chain}
                onClick={() => onHomeChainChange(chain)}
                className={chain === selectedHomeChain ? "active" : ""}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`chain-dot chain-dot-${chain.toLowerCase()}`} />
                  <span className="hidden sm:inline">{chain}</span>
                  <span className="sm:hidden">{chain.slice(0, 3)}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px]">
            <Zap className="w-3 h-3 text-accent-emerald" />
            <span className="font-mono text-[var(--text-tertiary)]">
              {health?.status === "healthy" ? "Online" : "Sim"}
            </span>
          </div>

          {/* Wallet */}
          {isConnected && address ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-accent-teal/20 text-[11px]">
              <span className="w-[5px] h-[5px] rounded-full bg-accent-emerald animate-pulse" />
              <span className="font-mono text-accent-teal font-medium">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              {isDemoMode && (
                <span className="text-[9px] px-1.5 py-[1px] rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-medium">
                  Demo
                </span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-[var(--text-muted)] hover:text-accent-rose ml-1 transition-colors text-xs leading-none"
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold
                  bg-gradient-to-r from-accent-teal/90 to-accent-cyan/80
                  hover:from-accent-teal hover:to-accent-cyan
                  text-[#06090f] shadow-sm transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? "Connecting…" : "Connect"}</span>
              </button>
              <button
                onClick={() => simulateDemoWallet()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                  bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)]
                  text-[var(--text-secondary)] border border-[var(--border-subtle)]
                  hover:border-[var(--border-default)] transition-all cursor-pointer"
                title="Simulate a read-only institutional portfolio"
              >
                <Sparkles className="w-3 h-3 text-accent-amber" />
                <span>Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
    </header>
  );
};
