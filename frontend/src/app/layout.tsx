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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F5F3EF] text-black antialiased font-sans">
        {/* Top Advisory Banner — Neo-Brutalist High-Contrast Caution Stripe */}
        <div className="w-full bg-[#FFE600] border-b-2 border-black px-4 py-2 flex items-center justify-center text-xs font-mono font-bold text-black uppercase tracking-wider">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="bg-black text-[#FFE600] px-1.5 py-0.5">READ-ONLY ADVISORY</span>
            <span>·</span>
            <span>NON-CUSTODIAL</span>
            <span>·</span>
            <span>ZERO PRIVATE KEY ACCESS</span>
            <span>·</span>
            <span>AUTONOMOUS AGENT REQUIRES USER APPROVAL</span>
          </div>
        </div>

        <Web3Provider>
          <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </Web3Provider>

        {/* Footer — Stark Neo-Brutalist Block */}
        <footer className="border-t-2 border-black mt-auto bg-white">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-black">
            <div className="flex items-center gap-2">
              <span className="bg-black text-white px-2 py-0.5 font-display text-sm tracking-wider uppercase">STAVLOS</span>
              <span>·</span>
              <span>QUANTITATIVE RISK ENGINE & MCP AGENT</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-[#00E575] border border-black px-1.5 py-0.5">LIVE DEFIAUDIT</span>
              <span>·</span>
              <span>USDC · USDT · DAI · USDS · USDE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
