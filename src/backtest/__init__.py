"""
Backtest Engine package.
"""
from src.backtest.models import (
    BacktestConfig,
    BacktestMetrics,
    BacktestResult,
    DailyEquityPoint,
    TradeHopEvent,
)
from src.backtest.engine import BacktestEngine
from src.backtest.visualizer import (
    format_comparison_report,
    format_trade_log,
    generate_ascii_equity_chart,
)

__all__ = [
    "BacktestConfig",
    "BacktestMetrics",
    "BacktestResult",
    "DailyEquityPoint",
    "TradeHopEvent",
    "BacktestEngine",
    "format_comparison_report",
    "format_trade_log",
    "generate_ascii_equity_chart",
]
