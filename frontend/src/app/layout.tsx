import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Stavlos | Cross-Chain Stablecoin Yield Optimizer",
  description: "Institutional-grade DeFi risk-adjusted yield intelligence, cross-chain simulation, and strategy backtesting platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col">
        {/* Minimal read-only indicator — subtle top bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-accent-teal/40 to-transparent" />
        <div className="px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-[5px] h-[5px] rounded-full bg-accent-teal/60 animate-pulse" />
            <span className="font-medium text-[var(--text-tertiary)]">Read-Only Advisory</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>Non-custodial</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>No private key access</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>Simulation only</span>
          </span>
        </div>

        <Web3Provider>
          <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </Web3Provider>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] mt-auto">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">Stavlos</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[11px] text-[var(--text-muted)]">Quantitative Yield Research Platform</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              <span>Data via DeFiLlama</span>
              <span>·</span>
              <span className="font-mono">USDC · USDT · DAI · USDS · USDe</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
