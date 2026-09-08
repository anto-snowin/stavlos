import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-background text-slate-100 antialiased flex flex-col">
        {/* Persistent Architectural Constraint & Non-Execution Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>
            <strong>ADVISORY & SIMULATION ONLY:</strong> This system does not connect wallets, manage private keys, or execute on-chain transactions. All strategies are simulated.
          </span>
        </div>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <p>Cross-Chain Stablecoin Yield Optimizer | Quant Research Platform</p>
          <p className="mt-1">Data powered by DeFiLlama Yields API. Tracking USDC, USDT, DAI, USDS, USDe.</p>
        </footer>
      </body>
    </html>
  );
}
