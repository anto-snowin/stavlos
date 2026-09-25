# Stavlos UI Transformation Prompt: Neo-Brutalism

Use this as a direct prompt for an AI coding tool (Claude Code, Cursor, v0, etc.) to restyle the Stavlos "Quant Yield Engine" dashboard.

---

## Prompt

> Redesign the UI of my Stavlos dashboard (ranked pool table, 180-day backtest chart, risk model panel, and case study tabs) in a **Neo-Brutalism** style. Keep all existing functionality and data bindings untouched — this is a visual/CSS transformation only, not a rebuild of logic or components. Work through the steps below in order, and after each step, show me the diff before moving to the next.

---

## Core Neo-Brutalism Principles to Apply

1. **Raw over polished** — no gradients, no soft drop shadows, no rounded corners (or very minimal, deliberate rounding). Structure should be visible, not hidden.
2. **High-contrast, flat color blocking** — a small, stark palette (e.g., off-white/cream base, black text and borders, 1–2 saturated accent colors) instead of muted or gradient tones.
3. **Thick black borders** — every card, table, button, and tab gets a bold outline (2–4px), not a subtle 1px hairline.
4. **Hard offset shadows** — replace blurred `box-shadow` with solid, non-blurred shadows offset a fixed distance (e.g., `4px 4px 0px #000`), no blur radius.
5. **Bold, oversized typography** — a heavy grotesque/display sans for headings, a monospace font for numeric/financial data. Type should feel loud, not refined.
6. **Function over decoration** — nothing hidden behind hover states or subtlety; data and controls should be immediately visible and legible.
7. **Deliberate asymmetry / visual tension** — avoid the safe, centered, evenly-padded SaaS look; allow blocky, slightly off-grid placement where it doesn't hurt usability.
8. **Flat, no skeuomorphism** — buttons and inputs look like solid blocks, not like they're trying to simulate physical depth beyond the hard-shadow "pressed" effect.

---

## Step-by-Step Transformation

### Step 1 — Establish the design tokens
- Define a CSS variable set: base background (off-white/cream), foreground (near-black), border color (pure black), 1–2 accent colors (e.g., acid green for positive yield/CTAs, red or amber for risk warnings), border width, and shadow offset.
- Pick two fonts: a heavy display sans for headings/labels (e.g., Archivo Black, Space Grotesk) and a monospace for all numeric data — APY%, balances, risk scores (e.g., JetBrains Mono, IBM Plex Mono).

### Step 2 — Typography pass
- Increase heading sizes noticeably beyond typical dashboard scale; headings should feel oversized and confident.
- Set all financial figures (APY, TVL, risk scores) in the monospace font so numbers align and read as "data," not prose.
- Remove any letter-spacing/line-height choices that soften the type; keep it tight and blocky.

### Step 3 — Borders, shadows, and containers
- Apply a thick black border to every card, panel, table, and the chart container.
- Replace all soft `box-shadow` with hard offset shadows (no blur).
- Reduce or remove border-radius across the board (Neo-Brutalism reads as boxy, not soft).

### Step 4 — Ranked pool table
- Thick borders on the table outline and between rows/columns (not just bottom hairlines).
- Use flat, alternating background colors for rows instead of subtle gray striping.
- APY and risk-adjusted return columns in monospace, right-aligned, high-contrast.
- Sort/filter controls styled as solid blocky buttons, not ghost/text links.

### Step 5 — 180-day backtest chart
- Flat fills under lines (solid color, no gradient fade).
- Bold, visible axis lines and gridlines instead of faint gray guides.
- Thicker data line stroke; consider a single accent color rather than a smooth multi-color gradient line.
- Tooltip on hover: solid box, thick border, hard shadow — no blur/translucency.

### Step 6 — Risk model panel
- Represent risk tiers as solid color blocks (e.g., green/amber/red) with black borders rather than soft badges or icons.
- Avoid circular gauges or soft radial meters; prefer blocky bar or stepped indicators consistent with the aesthetic.

### Step 7 — Case study tabs
- Style tabs as thick-bordered rectangular blocks sitting directly adjacent (no floating underline indicator).
- Active tab: full color inversion (black background, white/cream text) rather than a subtle highlight.
- Inactive tabs: outline only, flat background.

### Step 8 — Buttons and interactive elements
- All buttons: solid fill, thick border, hard offset shadow.
- On press/click: shift the button slightly toward the shadow's direction and remove the shadow, simulating a "pressed into the page" effect.
- Avoid hover states that rely on opacity fades — use color inversion or border-weight changes instead.

### Step 9 — Layout and spacing review
- Check that panels/cards don't default back to a soft, centered SaaS grid — allow blocky, slightly asymmetric placement where it reinforces hierarchy (e.g., the pool table or backtest chart can dominate the grid unevenly).
- Confirm spacing is generous enough that the bold borders and type don't feel cramped.

### Step 10 — Final consistency pass
- Verify the same border width, shadow offset, and accent colors are used everywhere (no stray soft shadows or rounded corners left over from the previous style).
- Check contrast ratios remain readable despite the stark palette — this should look bold, not illegible.
- Confirm no functional behavior (sorting, tab switching, backtest range selection) was altered — only styling.

---

## Quick Reference Checklist
- [ ] No gradients anywhere
- [ ] No blurred shadows — only hard offset shadows
- [ ] Every container has a visible thick border
- [ ] Numeric data in monospace, prose/labels in bold display sans
- [ ] Active states use color inversion, not opacity/fade
- [ ] Risk tiers shown as solid color blocks, not soft badges
- [ ] Buttons have a visible "pressed" interaction
