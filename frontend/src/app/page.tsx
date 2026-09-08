import { DashboardClient } from "@/components/DashboardClient";
import { PoolRiskScore, BacktestResult, SystemHealth } from "@/types";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

async function getInitialData() {
  try {
    const [poolsRes, backtestRes, trendsRes, healthRes] = await Promise.all([
      fetch(`${API_BASE}/pools/ranked?limit=50`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/backtest/run?days=180&rebalance_freq=7&min_holding=7&churn_penalty=0.75`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE}/pools/historical?days=90`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE}/health`, { next: { revalidate: 60 } }),
    ]);

    const pools: PoolRiskScore[] = poolsRes.ok ? await poolsRes.json() : [];
    const backtest: BacktestResult | null = backtestRes.ok ? await backtestRes.json() : null;
    const trends: any[] = trendsRes.ok ? await trendsRes.json() : [];
    const health: SystemHealth | null = healthRes.ok ? await healthRes.json() : null;

    return { pools, backtest, trends, health };
  } catch (error) {
    console.error("Failed fetching initial SSR data from FastAPI:", error);
    return { pools: [], backtest: null, trends: [], health: null };
  }
}

export default async function HomePage() {
  const { pools, backtest, trends, health } = await getInitialData();

  return (
    <DashboardClient
      initialPools={pools}
      initialBacktest={backtest}
      initialTrends={trends}
      initialHealth={health}
    />
  );
}
