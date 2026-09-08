export interface PoolRiskScore {
  pool_id: string;
  chain: string;
  project: string;
  symbol: string;
  headline_apy: number;
  rolling_30d_avg_apy: number;
  rolling_30d_volatility: number | null;
  tvl_usd: number;
  pool_age_days: number | null;
  tvl_score: number;
  age_score: number;
  volatility_score: number;
  chain_risk_score: number;
  bridge_score: number;
  risk_multiplier: number;
  composite_score: number;
  risk_adjusted_apy: number;
  explanation: string;
  scored_at: string;
}

export interface TradeHopEvent {
  date: string;
  day_index: number;
  from_pool_id: string;
  to_pool_id: string;
  from_protocol: string;
  to_protocol: string;
  from_chain: string;
  to_chain: string;
  fee_usd: number;
  old_apy: number;
  new_apy: number;
  apy_delta: number;
  capital_before: number;
  capital_after: number;
}

export interface DailyEquityPoint {
  date: string;
  day_index: number;
  strategy_equity: number;
  benchmark_equity: number;
  strategy_daily_return: number;
  benchmark_daily_return: number;
  active_pool_id: string;
  active_protocol: string;
  active_chain: string;
  active_apy: number;
  benchmark_apy: number;
  strategy_drawdown_pct: number;
  benchmark_drawdown_pct: number;
}

export interface BacktestMetrics {
  initial_equity: number;
  final_equity: number;
  total_return_pct: number;
  cagr_pct: number;
  annualized_volatility_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  max_drawdown_duration_days: number;
  worst_daily_return_pct: number;
  total_hops: number;
  total_fees_usd: number;
}

export interface BacktestResult {
  config: {
    initial_capital: number;
    days: number;
    rebalance_frequency_days: number;
    min_holding_period_days: number;
    per_tx_fee_usd: number;
    bridge_fee_pct: number;
    churn_penalty_threshold: number;
    benchmark_pool_id: string;
  };
  start_date: string;
  end_date: string;
  total_days: number;
  strategy_metrics: BacktestMetrics;
  benchmark_metrics: BacktestMetrics;
  net_alpha_pct: number;
  net_profit_difference_usd: number;
  equity_curve: DailyEquityPoint[];
  trade_log: TradeHopEvent[];
  thesis_validated: boolean;
  summary_verdict: string;
}

export interface SystemHealth {
  status: string;
  environment: string;
  execution_capability: string;
  monitored_pools: number;
  historical_snapshots: number;
  latest_data_point: string | null;
}
