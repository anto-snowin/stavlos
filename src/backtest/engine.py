"""
Backtest Engine.
Simulates cross-chain stablecoin yield hopping against a passive blue-chip benchmark.
Accurately accounts for transaction gas fees, bridge slippage, minimum holding periods,
and churn hurdle thresholds.
"""
from datetime import datetime
import logging
import math
from typing import Any

from src.backtest.models import (
    BacktestConfig,
    BacktestMetrics,
    BacktestResult,
    DailyEquityPoint,
    TradeHopEvent,
)
from src.scoring.config import ScoringConfig
from src.scoring.engine import RiskScorer

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    Stateless backtesting execution engine.
    Takes historical time-series matrices and parameter configuration,
    and runs a chronological daily simulation.
    """

    def __init__(
        self,
        config: BacktestConfig | None = None,
        scoring_config: ScoringConfig | None = None,
    ):
        self.config = config or BacktestConfig()
        self.scorer = RiskScorer(config=scoring_config or ScoringConfig())

    def _calculate_metrics(
        self,
        initial_capital: float,
        final_capital: float,
        daily_returns: list[float],
        drawdowns: list[float],
        total_hops: int,
        total_fees: float,
        days: int,
        risk_free_rate: float = 0.03,
    ) -> BacktestMetrics:
        """Computes comprehensive quantitative performance and risk metrics."""
        total_return_pct = ((final_capital - initial_capital) / initial_capital) * 100.0

        # CAGR
        years = max(days / 365.25, 0.01)
        cagr = (math.pow(max(final_capital / initial_capital, 0.0001), 1.0 / years) - 1.0) * 100.0

        # Annualized Volatility
        if len(daily_returns) > 1:
            mean_ret = sum(daily_returns) / len(daily_returns)
            variance = sum((r - mean_ret) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
            daily_vol = math.sqrt(variance)
            annual_vol_pct = daily_vol * math.sqrt(365) * 100.0
        else:
            annual_vol_pct = 0.0

        # Sharpe Ratio
        if annual_vol_pct > 0.0001:
            sharpe = (cagr - (risk_free_rate * 100.0)) / annual_vol_pct
        else:
            sharpe = 0.0

        # Sortino Ratio (Downside deviation)
        downside_sq = [r ** 2 for r in daily_returns if r < 0]
        if downside_sq:
            downside_vol = math.sqrt(sum(downside_sq) / len(daily_returns)) * math.sqrt(365) * 100.0
            sortino = (cagr - (risk_free_rate * 100.0)) / downside_vol if downside_vol > 0.0001 else 0.0
        else:
            sortino = sharpe * 1.5 if sharpe > 0 else 0.0

        # Drawdown analysis
        max_dd = abs(min(drawdowns)) if drawdowns else 0.0

        # Max drawdown duration
        max_dd_duration = 0
        current_dd_duration = 0
        for dd in drawdowns:
            if dd < -0.001:
                current_dd_duration += 1
                max_dd_duration = max(max_dd_duration, current_dd_duration)
            else:
                current_dd_duration = 0

        worst_daily_ret = min(daily_returns) * 100.0 if daily_returns else 0.0

        return BacktestMetrics(
            initial_equity=round(initial_capital, 2),
            final_equity=round(final_capital, 2),
            total_return_pct=round(total_return_pct, 3),
            cagr_pct=round(cagr, 3),
            annualized_volatility_pct=round(annual_vol_pct, 3),
            sharpe_ratio=round(sharpe, 3),
            sortino_ratio=round(sortino, 3),
            max_drawdown_pct=round(max_dd, 3),
            max_drawdown_duration_days=max_dd_duration,
            worst_daily_return_pct=round(worst_daily_ret, 3),
            total_hops=total_hops,
            total_fees_usd=round(total_fees, 2),
        )

    def run_simulation(
        self,
        daily_records: list[dict[str, Any]],
        pools_metadata: dict[str, dict[str, Any]],
    ) -> BacktestResult:
        """
        Executes daily simulation across the synchronized time-series.
        `daily_records` must contain chronologically sorted records with keys:
        timestamp, pool_id, apy, tvl_usd.
        """
        if not daily_records:
            raise ValueError("No historical daily records provided for backtest.")

        # Group records by date
        date_groups: dict[str, dict[str, dict[str, Any]]] = {}
        for r in daily_records:
            date_key = str(r["timestamp"])[:10]
            if date_key not in date_groups:
                date_groups[date_key] = {}
            date_groups[date_key][str(r["pool_id"])] = r

        sorted_dates = sorted(date_groups.keys())
        if len(sorted_dates) < 2:
            raise ValueError("Insufficient historical dates for backtesting (minimum 2 days required).")

        # Cap dates to requested config.days
        if len(sorted_dates) > self.config.days:
            sorted_dates = sorted_dates[-self.config.days :]

        benchmark_pool_id = self.config.benchmark_pool_id
        strat_equity = self.config.initial_capital
        bench_equity = self.config.initial_capital

        strat_hwm = strat_equity
        bench_hwm = bench_equity

        strat_returns: list[float] = []
        bench_returns: list[float] = []
        strat_drawdowns: list[float] = []
        bench_drawdowns: list[float] = []

        equity_curve: list[DailyEquityPoint] = []
        trade_log: list[TradeHopEvent] = []

        # Pick initial active pool on Day 0
        first_date_pools = date_groups[sorted_dates[0]]
        active_pool_id = benchmark_pool_id
        if benchmark_pool_id not in first_date_pools and first_date_pools:
            # Fallback to pool with highest TVL on day 0
            active_pool_id = max(
                first_date_pools.keys(),
                key=lambda pid: float(first_date_pools[pid].get("tvl_usd") or 0.0),
            )

        days_held = 0
        total_hops = 0
        total_fees = 0.0

        for day_idx, date_str in enumerate(sorted_dates):
            current_date_pools = date_groups[date_str]

            # 1. Obtain daily rates
            # Benchmark rate
            if benchmark_pool_id in current_date_pools:
                bench_apy = float(current_date_pools[benchmark_pool_id].get("apy") or 0.0)
            else:
                # Benchmark fallback to conservative 3.5%
                bench_apy = 3.5

            # Active pool rate
            if active_pool_id in current_date_pools:
                strat_apy = float(current_date_pools[active_pool_id].get("apy") or 0.0)
            else:
                strat_apy = bench_apy

            # 2. Accrue daily interest
            # Daily rate = (1 + APY/100)^(1/365) - 1
            r_bench = math.pow(1.0 + max(bench_apy, 0.0) / 100.0, 1.0 / 365.25) - 1.0
            r_strat = math.pow(1.0 + max(strat_apy, 0.0) / 100.0, 1.0 / 365.25) - 1.0

            bench_equity *= 1.0 + r_bench
            strat_equity *= 1.0 + r_strat
            days_held += 1

            strat_returns.append(r_strat)
            bench_returns.append(r_bench)

            # 3. Check for periodic rebalancing
            if (
                day_idx > 0
                and (day_idx % self.config.rebalance_frequency_days == 0)
                and (days_held >= self.config.min_holding_period_days)
            ):
                # Evaluate candidates
                candidate_pools = []
                for pid, pdata in current_date_pools.items():
                    meta = pools_metadata.get(pid, {})
                    chain = meta.get("chain", pdata.get("chain", "Ethereum"))
                    project = meta.get("project", pdata.get("project", "protocol"))
                    symbol = meta.get("symbol", pdata.get("symbol", "USDC"))
                    apy = float(pdata.get("apy") or 0.0)
                    tvl = float(pdata.get("tvl_usd") or 0.0)

                    # Filter candidate health: positive APY, TVL >= $20M
                    if apy > 0.5 and tvl >= 20_000_000.0:
                        # Compute risk-adjusted score
                        score_obj = self.scorer.score_pool({
                            "pool_id": pid,
                            "chain": chain,
                            "project": project,
                            "symbol": symbol,
                            "apy": apy,
                            "tvl_usd": tvl,
                            "apy_mean_30d": apy,
                            "sigma": 0.03,
                            "count": 300,
                        })
                        candidate_pools.append((score_obj, pid, apy, chain, project))

                if candidate_pools:
                    # Sort candidates by risk-adjusted expected APY
                    candidate_pools.sort(key=lambda x: x[0].risk_adjusted_apy, reverse=True)
                    best_score_obj, best_pid, best_apy, best_chain, best_project = candidate_pools[0]

                    # Check churn penalty hurdle
                    current_active_score = (
                        self.scorer.score_pool({
                            "pool_id": active_pool_id,
                            "chain": pools_metadata.get(active_pool_id, {}).get("chain", "Ethereum"),
                            "project": pools_metadata.get(active_pool_id, {}).get("project", "protocol"),
                            "symbol": pools_metadata.get(active_pool_id, {}).get("symbol", "USDC"),
                            "apy": strat_apy,
                            "tvl_usd": float(current_date_pools.get(active_pool_id, {}).get("tvl_usd") or 50_000_000),
                            "apy_mean_30d": strat_apy,
                            "sigma": 0.03,
                            "count": 300,
                        }).risk_adjusted_apy
                    )

                    apy_delta = best_score_obj.risk_adjusted_apy - current_active_score

                    if best_pid != active_pool_id and apy_delta >= self.config.churn_penalty_threshold:
                        # Calculate friction fees
                        current_chain = pools_metadata.get(active_pool_id, {}).get("chain", "Ethereum")
                        is_cross_chain = current_chain.lower() != best_chain.lower()

                        bridge_fee = (
                            self.config.bridge_fee_pct * strat_equity if is_cross_chain else 0.0
                        )
                        total_fee = self.config.per_tx_fee_usd + bridge_fee

                        if strat_equity > total_fee:
                            capital_before = strat_equity
                            strat_equity -= total_fee
                            total_fees += total_fee
                            total_hops += 1

                            from_meta = pools_metadata.get(active_pool_id, {})
                            trade_log.append(
                                TradeHopEvent(
                                    date=date_str,
                                    day_index=day_idx,
                                    from_pool_id=active_pool_id,
                                    to_pool_id=best_pid,
                                    from_protocol=from_meta.get("project", "protocol"),
                                    to_protocol=best_project,
                                    from_chain=current_chain,
                                    to_chain=best_chain,
                                    fee_usd=round(total_fee, 2),
                                    old_apy=round(strat_apy, 2),
                                    new_apy=round(best_apy, 2),
                                    apy_delta=round(best_apy - strat_apy, 2),
                                    capital_before=round(capital_before, 2),
                                    capital_after=round(strat_equity, 2),
                                )
                            )

                            logger.debug(
                                "Day %d: Hopped from %s (%s) to %s (%s). Delta APY: +%.2f%%, Fee: $%.2f",
                                day_idx,
                                from_meta.get("project", "protocol"),
                                current_chain,
                                best_project,
                                best_chain,
                                best_apy - strat_apy,
                                total_fee,
                            )

                            active_pool_id = best_pid
                            days_held = 0

            # 4. Drawdowns and high-water marks
            strat_hwm = max(strat_hwm, strat_equity)
            bench_hwm = max(bench_hwm, bench_equity)

            strat_dd = ((strat_equity - strat_hwm) / strat_hwm) * 100.0
            bench_dd = ((bench_equity - bench_hwm) / bench_hwm) * 100.0

            strat_drawdowns.append(strat_dd)
            bench_drawdowns.append(bench_dd)

            active_meta = pools_metadata.get(active_pool_id, {})
            equity_curve.append(
                DailyEquityPoint(
                    date=date_str,
                    day_index=day_idx,
                    strategy_equity=round(strat_equity, 2),
                    benchmark_equity=round(bench_equity, 2),
                    strategy_daily_return=round(r_strat, 6),
                    benchmark_daily_return=round(r_bench, 6),
                    active_pool_id=active_pool_id,
                    active_protocol=active_meta.get("project", "unknown"),
                    active_chain=active_meta.get("chain", "unknown"),
                    active_apy=round(strat_apy, 3),
                    benchmark_apy=round(bench_apy, 3),
                    strategy_drawdown_pct=round(strat_dd, 3),
                    benchmark_drawdown_pct=round(bench_dd, 3),
                )
            )

        # Compute summary metrics
        strat_metrics = self._calculate_metrics(
            initial_capital=self.config.initial_capital,
            final_capital=strat_equity,
            daily_returns=strat_returns,
            drawdowns=strat_drawdowns,
            total_hops=total_hops,
            total_fees=total_fees,
            days=len(sorted_dates),
        )

        bench_metrics = self._calculate_metrics(
            initial_capital=self.config.initial_capital,
            final_capital=bench_equity,
            daily_returns=bench_returns,
            drawdowns=bench_drawdowns,
            total_hops=0,
            total_fees=0.0,
            days=len(sorted_dates),
        )

        alpha_pct = round(strat_metrics.total_return_pct - bench_metrics.total_return_pct, 3)
        profit_diff = round(strat_metrics.final_equity - bench_metrics.final_equity, 2)
        thesis_validated = alpha_pct > 0.0

        if thesis_validated:
            verdict = (
                f"Thesis Validated: Active risk-adjusted hopping outperformed the blue-chip benchmark "
                f"by +{alpha_pct:.2f}% (+${profit_diff:,.2f}) net of ${total_fees:,.2f} in fees across {total_hops} hops."
            )
        else:
            verdict = (
                f"Thesis Refuted: Passive holding beat active hopping by {abs(alpha_pct):.2f}% "
                f"due to friction costs (${total_fees:,.2f} in fees) and lockup constraints."
            )

        return BacktestResult(
            config=self.config,
            start_date=sorted_dates[0],
            end_date=sorted_dates[-1],
            total_days=len(sorted_dates),
            strategy_metrics=strat_metrics,
            benchmark_metrics=bench_metrics,
            net_alpha_pct=alpha_pct,
            net_profit_difference_usd=profit_diff,
            equity_curve=equity_curve,
            trade_log=trade_log,
            thesis_validated=thesis_validated,
            summary_verdict=verdict,
        )
