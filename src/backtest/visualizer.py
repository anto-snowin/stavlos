"""
Backtest Visualizer and Report Formatter.
Renders clean terminal ASCII equity curve charts, side-by-side performance comparisons,
and detailed trade execution logs.
"""
from src.backtest.models import BacktestResult, DailyEquityPoint, TradeHopEvent


def generate_ascii_equity_chart(
    equity_curve: list[DailyEquityPoint],
    width: int = 75,
    height: int = 14,
) -> str:
    """
    Renders an institutional ASCII equity curve comparing Strategy (*) vs. Benchmark (.).
    """
    if not equity_curve:
        return "No equity points to plot."

    # Sample points down to chart width
    step = max(1, len(equity_curve) // width)
    sampled = equity_curve[::step]
    if sampled[-1] != equity_curve[-1]:
        sampled.append(equity_curve[-1])

    strat_vals = [p.strategy_equity for p in sampled]
    bench_vals = [p.benchmark_equity for p in sampled]

    min_val = min(min(strat_vals), min(bench_vals))
    max_val = max(max(strat_vals), max(bench_vals))
    val_range = max(max_val - min_val, 1.0)

    # Initialize grid
    grid = [[" " for _ in range(len(sampled))] for _ in range(height)]

    for col_idx, (s_val, b_val) in enumerate(zip(strat_vals, bench_vals)):
        # Normalize to row index (height - 1 is bottom, 0 is top)
        s_row = height - 1 - int(((s_val - min_val) / val_range) * (height - 1))
        b_row = height - 1 - int(((b_val - min_val) / val_range) * (height - 1))

        s_row = max(0, min(height - 1, s_row))
        b_row = max(0, min(height - 1, b_row))

        if s_row == b_row:
            grid[s_row][col_idx] = "$"  # Overlap
        else:
            grid[b_row][col_idx] = "."  # Benchmark
            grid[s_row][col_idx] = "*"  # Strategy

    lines = []
    lines.append("  Equity ($)")
    for r in range(height):
        row_val = max_val - (r / (height - 1)) * val_range
        row_str = "".join(grid[r])
        lines.append(f"{row_val:>10,.0f} | {row_str}")

    axis_sep = " " * 11 + "+-" + "-" * len(sampled)
    lines.append(axis_sep)

    start_d = sampled[0].date
    mid_d = sampled[len(sampled) // 2].date
    end_d = sampled[-1].date
    spacing = (len(sampled) - len(start_d) - len(mid_d) - len(end_d)) // 2
    date_axis = " " * 13 + start_d + " " * max(1, spacing) + mid_d + " " * max(1, spacing) + end_d
    lines.append(date_axis)
    lines.append(" " * 13 + "Legend: [*] Strategy (Active Hopping)   [.] Benchmark (Aave USDC)   [$] Convergence")

    return "\n".join(lines)


def format_comparison_report(result: BacktestResult) -> str:
    """Formats an executive summary table comparing Strategy vs. Benchmark side-by-side."""
    s = result.strategy_metrics
    b = result.benchmark_metrics

    alpha_sign = "+" if result.net_alpha_pct >= 0 else ""
    profit_sign = "+" if result.net_profit_difference_usd >= 0 else ""

    headers = ["Metric", "Strategy (Active Hopping)", "Benchmark (Aave USDC)", "Net Alpha / Delta"]
    rows = [
        ["Initial Capital", f"${s.initial_equity:,.2f}", f"${b.initial_equity:,.2f}", "$0.00"],
        ["Final Capital", f"${s.final_equity:,.2f}", f"${b.final_equity:,.2f}", f"{profit_sign}${result.net_profit_difference_usd:,.2f}"],
        ["Total Net Return", f"{s.total_return_pct:+.2f}%", f"{b.total_return_pct:+.2f}%", f"{alpha_sign}{result.net_alpha_pct:.2f}%"],
        ["Annualized Return (CAGR)", f"{s.cagr_pct:.2f}%", f"{b.cagr_pct:.2f}%", f"{alpha_sign}{s.cagr_pct - b.cagr_pct:.2f}%"],
        ["Annualized Volatility", f"{s.annualized_volatility_pct:.2f}%", f"{b.annualized_volatility_pct:.2f}%", f"{s.annualized_volatility_pct - b.annualized_volatility_pct:+.2f}%"],
        ["Sharpe Ratio (rf=3%)", f"{s.sharpe_ratio:.2f}", f"{b.sharpe_ratio:.2f}", f"{s.sharpe_ratio - b.sharpe_ratio:+.2f}"],
        ["Sortino Ratio", f"{s.sortino_ratio:.2f}", f"{b.sortino_ratio:.2f}", f"{s.sortino_ratio - b.sortino_ratio:+.2f}"],
        ["Max Drawdown", f"-{s.max_drawdown_pct:.2f}%", f"-{b.max_drawdown_pct:.2f}%", f"{b.max_drawdown_pct - s.max_drawdown_pct:+.2f}%"],
        ["Max Drawdown Duration", f"{s.max_drawdown_duration_days} days", f"{b.max_drawdown_duration_days} days", f"{s.max_drawdown_duration_days - b.max_drawdown_duration_days:+d} days"],
        ["Worst 1-Day Return", f"{s.worst_daily_return_pct:.2f}%", f"{b.worst_daily_return_pct:.2f}%", "-"],
        ["Total Protocol Hops", f"{s.total_hops}", "0 (Static)", f"+{s.total_hops}"],
        ["Total Fees Paid (Gas+Bridge)", f"${s.total_fees_usd:,.2f}", "$0.00", f"-${s.total_fees_usd:,.2f}"],
    ]

    col_widths = [len(h) for h in headers]
    for r in rows:
        for i, val in enumerate(r):
            col_widths[i] = max(col_widths[i], len(val))

    sep = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
    header_line = "| " + " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths)) + " |"
    table_lines = [sep, header_line, sep]
    for r in rows:
        table_lines.append("| " + " | ".join(f"{v:<{w}}" for v, w in zip(r, col_widths)) + " |")
    table_lines.append(sep)

    return "\n".join(table_lines)


def format_trade_log(trade_log: list[TradeHopEvent]) -> str:
    """Formats chronological log of capital moves."""
    if not trade_log:
        return "No capital reallocations executed (holding threshold or churn hurdles prevented hops)."

    headers = ["Date", "From Protocol (Chain)", "To Protocol (Chain)", "Old APY", "New APY", "Delta", "Fee ($)", "Capital After"]
    rows = []
    for t in trade_log:
        from_str = f"{t.from_protocol.title()} ({t.from_chain})"
        to_str = f"{t.to_protocol.title()} ({t.to_chain})"
        rows.append([
            t.date,
            from_str,
            to_str,
            f"{t.old_apy:.2f}%",
            f"{t.new_apy:.2f}%",
            f"+{t.apy_delta:.2f}%",
            f"${t.fee_usd:.2f}",
            f"${t.capital_after:,.2f}",
        ])

    col_widths = [len(h) for h in headers]
    for r in rows:
        for i, val in enumerate(r):
            col_widths[i] = max(col_widths[i], len(val))

    sep = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
    header_line = "| " + " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths)) + " |"
    table_lines = [sep, header_line, sep]
    for r in rows:
        table_lines.append("| " + " | ".join(f"{v:<{w}}" for v, w in zip(r, col_widths)) + " |")
    table_lines.append(sep)

    return "\n".join(table_lines)
