"""
CLI Scorer Command.
Reads the latest stored pool snapshots, computes composite risk-adjusted scores
incorporating TVL, age, 30d volatility, chain tier, and bridge friction,
and outputs an institutional-grade ranked table.

Usage:
    python -m src.cli.score
    python -m src.cli.score --home-chain Arbitrum --limit 20
"""
import argparse
import json
import logging
from pathlib import Path
import sys

from src.config import config
from src.scoring.config import ScoringConfig
from src.scoring.engine import RiskScorer
from src.storage.database import DatabaseManager
from src.storage.repository import YieldRepository


def format_table(ranked_scores: list, limit: int = 25) -> str:
    """Generates an aligned ASCII table for ranked pool scores."""
    headers = [
        "Rank",
        "Protocol",
        "Symbol",
        "Chain",
        "Headline APY",
        "30d Avg APY",
        "TVL ($M)",
        "Score",
        "Explanation",
    ]

    rows = []
    for i, s in enumerate(ranked_scores[:limit], start=1):
        tvl_str = f"${s.tvl_usd / 1_000_000:,.1f}M"
        rows.append([
            f"#{i}",
            s.project,
            s.symbol,
            s.chain,
            f"{s.headline_apy:.2f}%",
            f"{s.rolling_30d_avg_apy:.2f}%",
            tvl_str,
            f"{s.composite_score:.1f}",
            s.explanation,
        ])

    # Calculate column widths
    col_widths = [len(h) for h in headers]
    for row in rows:
        for idx, val in enumerate(row):
            # Limit explanation width in display if necessary, but keep it readable
            col_widths[idx] = max(col_widths[idx], len(str(val)))

    # Cap explanation column width for terminal wrapping
    col_widths[-1] = min(col_widths[-1], 90)

    sep_line = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
    header_line = "| " + " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths)) + " |"

    formatted_rows = []
    for row in rows:
        formatted_row = "| " + " | ".join(f"{str(v):<{w}}" for v, w in zip(row, col_widths)) + " |"
        formatted_rows.append(formatted_row)

    return "\n".join([sep_line, header_line, sep_line] + formatted_rows + [sep_line])


def run_scorer(
    db_path: Path | str | None = None,
    home_chain: str = "Ethereum",
    limit: int = 25,
    persist_scores: bool = True,
    output_json: bool = False,
) -> int:
    """Loads pools, evaluates risk scores, and outputs ranked recommendations."""
    target_db = Path(db_path) if db_path else config.default_db_path
    if not target_db.exists():
        print(
            f"Database '{target_db}' not found. Please run 'python -m src.cli.ingest' first to populate data.",
            file=sys.stderr,
        )
        return 1

    db_manager = DatabaseManager(db_path=target_db)
    db_manager.initialize_schema()
    repository = YieldRepository(db_manager)

    raw_snapshots = repository.get_latest_snapshots()
    if not raw_snapshots:
        print("No pool snapshots found in database. Run ingestion first.", file=sys.stderr)
        return 1

    scoring_cfg = ScoringConfig(home_chain=home_chain)
    scorer = RiskScorer(config=scoring_cfg)

    ranked_scores = scorer.score_pools(raw_snapshots)

    if persist_scores:
        repository.save_pool_scores(ranked_scores)

    if output_json:
        out = [s.model_dump(mode="json") for s in ranked_scores[:limit]]
        print(json.dumps(out, indent=2))
        return 0

    print("\n" + "=" * 115)
    print(f" CROSS-CHAIN STABLECOIN YIELD OPTIMIZER -- RISK-ADJUSTED RANKINGS (Home Chain: {home_chain})")
    print("=" * 115)
    print(format_table(ranked_scores, limit=limit))

    # Summary analytics
    avg_score = sum(s.composite_score for s in ranked_scores) / len(ranked_scores)
    top = ranked_scores[0]
    print(f"\nAnalyzed {len(ranked_scores)} pools. Top Ranked: {top.project.title()} {top.symbol} on {top.chain}")
    print(f"Top Score: {top.composite_score:.1f}/100 | Headline APY: {top.headline_apy:.2f}% | Risk-Adjusted: {top.risk_adjusted_apy:.2f}%")
    print(f"Universe Avg Score: {avg_score:.1f}/100 | Min TVL Filter: ${config.default_min_tvl_usd / 1e6:.0f}M\n")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cross-Chain Stablecoin Yield Optimizer — Risk Scoring Engine"
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default=str(config.default_db_path),
        help="Path to SQLite database",
    )
    parser.add_argument(
        "--home-chain",
        type=str,
        default="Ethereum",
        help="Home chain for cross-chain bridge friction analysis (default: Ethereum)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Number of ranked pools to display in the table (default: 25)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON array of scored pools",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Do not persist evaluated scores to database",
    )

    args = parser.parse_args()
    return run_scorer(
        db_path=args.db_path,
        home_chain=args.home_chain,
        limit=args.limit,
        persist_scores=not args.no_save,
        output_json=args.json,
    )


if __name__ == "__main__":
    sys.exit(main())
