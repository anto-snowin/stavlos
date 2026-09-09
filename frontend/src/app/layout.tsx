import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Stavlos | Quantitative Risk-Scoring Dashboard",
  description: "Bespoke quantitative risk-adjusted yield intelligence for cross-chain stablecoin lending. Glass clarity grounded in risk confidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col antialiased">
        {/* Top Advisory Banner — Glass hairline treatment without neon glows */}
        <div className="w-full bg-white/[0.03] backdrop-blur-[6px] border-b border-[var(--glass-border-subtle)] px-4 py-1.5 flex items-center justify-center text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[var(--text-secondary)] font-medium">Read-Only Advisory</span>
            <span>·</span>
            <span>Non-custodial</span>
            <span>·</span>
            <span>Zero private key access</span>
            <span>·</span>
            <span>Deterministic simulation only</span>
          </div>
        </div>

        <Web3Provider>
          <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </Web3Provider>

        {/* Footer */}
        <footer className="border-t border-[var(--glass-border-subtle)] mt-auto bg-white/[0.02]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)] font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white uppercase">Stavlos</span>
              <span>·</span>
              <span>Quantitative Risk Engine</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Data via DeFiLlama</span>
              <span>·</span>
              <span>USDC · USDT · DAI · USDS · USDe</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
