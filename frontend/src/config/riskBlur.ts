/**
 * Dynamic Risk-Blur Utility for Stavlos
 *
 * Core Concept: Glass clarity IS risk clarity.
 * A pool's panel is only as SHARP as the pool is well-understood.
 * - High-confidence pools (Score ~100): blur(6px) (near-clear glass)
 * - Low-confidence pools  (Score ~0):   blur(28px) (heavily frosted glass)
 */

export function getRiskBlurPx(score: number): number {
  // Ensure score is safely bounded between 0 and 100
  const validScore = typeof score === "number" && !isNaN(score) ? score : 50;
  const clamped = Math.max(0, Math.min(100, validScore));
  
  // Linear scale: at 100 -> 6px, at 0 -> 28px
  return Math.round(28 - (clamped / 100) * 22);
}

export function getRiskBlur(score: number): string {
  return `${getRiskBlurPx(score)}px`;
}

/**
 * Returns a CSS style object with backdropFilter and WebkitBackdropFilter
 */
export function getRiskGlassStyle(score: number, extraStyles: React.CSSProperties = {}): React.CSSProperties {
  const blurVal = getRiskBlur(score);
  return {
    backdropFilter: `blur(${blurVal})`,
    WebkitBackdropFilter: `blur(${blurVal})`,
    ...extraStyles,
  };
}
