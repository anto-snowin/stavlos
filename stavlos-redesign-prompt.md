# Stavlos Redesign Prompt — Glassmorphism, Grounded in Risk

## Part 1 — What's actually reading as "AI-generated"

Nothing here is broken. It's legible, it works, and the information is all there. What reads as generated is that every choice is the *default* one — the thing any component library gives you for free — rather than a choice made for this specific product. Specifically:

1. **The palette is the single most common "AI dashboard" combo right now**: a near-black blue background with one bright cyan/green accent. It's not wrong, it's just unowned — thousands of dashboards ship this exact combination.
2. **The top row is the "SaaS-card kit"**: five identical rounded cards, same border, same soft shadow, same icon-in-the-top-right pattern (chart / percent / pulse / dollar / shield). When every card is interchangeable, none of them look considered.
3. **Template chrome**: the tracked-out all-caps "QUANT YIELD ENGINE" pill next to the logo, and the icon+label pattern repeated identically across all four tabs. This is decorative labeling, not something that comes from your actual content.
4. **Default component primitives, color-swapped but not redesigned**: rounded pill badges for chain names, a thin bolted-on progress bar next to the risk score, a yellow alert banner strip.
5. **One typeface carrying every job**: the same system sans-serif sets the headline numbers, labels, table data, and buttons, with hierarchy coming only from size and color, never from the type itself.

## Part 2 — Glassmorphism, but with a reason to exist

One flag first: frosted-glass panels are *extremely* common in web3/crypto dashboards already — arguably as templated by now as the acid-green-on-black look you currently have. Using glass and still ending up looking handcrafted requires one thing every generic glass UI skips: a reason the glass is there beyond "it looks nice." 

**The idea**: glass clarity *is* risk clarity. A pool's panel is only as sharp as the pool is well-understood. High-TVL, long-tenured, low-volatility pools render as near-clear glass — you can see straight through to the data. Thin, new, volatile pools render heavily frosted — you're squinting at something uncertain. The blur radius becomes a second, ambient encoding of the risk score, on top of the number itself. That's the one distinctive thing everything else stays quiet around.

**Color**
| Token | Value | Use |
|---|---|---|
| Backdrop | radial gradient `#0D1321` → `#16213E` | the surface the glass refracts against — not flat, but subtle, so blur has something to catch |
| Glass fill | `rgba(255,255,255,0.06)` | panel base — never higher opacity than this |
| Glass border | `rgba(255,255,255,0.12)`, 1px | panel edge, no glow, no gradient stroke |
| Jade | `#35C48F` | positive deltas, primary data — reserved, not wallpapered |
| Copper | `#D9A24B` | the single top-ranked / hero panel only |
| Alert red | `#E5484D` | risk warnings and negative deltas only |

Blur itself is a token, mapped to risk score, not a flat constant: roughly `blur(6px)` at the top of the score range down to `blur(28px)` at the bottom. This is the thing that makes it glassmorphism *for this product* rather than glassmorphism because everyone's doing it.

**Type** — same logic as before, glass doesn't change this: a tabular monospace (IBM Plex Mono / JetBrains Mono) for every number, a plain grotesk for labels and body. Numbers need to stay crisp even inside a blurred panel, so render the number layer *above* the blur, never blurred itself — only the panel background frosts, never the figure sitting on it.

**Layout**
- The five headline metrics: don't make them five identical glass tiles. The top metric (top risk-adjusted pool) gets one larger hero panel, sharp glass, copper accent; the other four sit as a slimmer supporting strip beneath it, all near-clear (they're stated facts, not variable-confidence data, so they don't blur).
- The ranked table becomes a stack of individual glass panels, one per pool, each blurred per its own risk score as described above — the table *is* the visualization now, not a plain list below the fold.
- Chain badges: small pill, but glass-fill rather than flat-fill, no separate border color per chain — let the label text do the differentiating, not decorative color-coding.

**Principles**
- Blur communicates something real (risk) on every panel — never used purely as decoration.
- One accent (copper) marks the single best pick; everything else stays jade/neutral.
- No neon glow halos under panels, no rainbow gradient borders — those are the generic web3-glass tells. Keep the glass itself quiet; let the blur-as-risk idea be the only unusual thing.
- One deliberate motion: on load, panels rack into focus from heavy blur to their resting blur value, like a lens finding focus — this doubles as an entrance animation and a demonstration of the concept. No hover-blur-shift on every row after that.

## Part 3 — The prompt

Copy the block below into your coding agent (Claude Code, Cursor, etc.), working directly in the Stavlos repo. It assumes Next.js + Tailwind + shadcn/ui, since that's what the current component patterns suggest — if that's wrong, tell the agent your actual stack first and it will translate the same steps.

```
You are the design lead on Stavlos, a quantitative risk-scoring dashboard 
for cross-chain stablecoin lending. The current UI works functionally but 
reads as a generic AI/SaaS template: near-black-blue background with a 
cyan/green accent, five identical rounded stat cards with soft shadows, 
an all-caps eyebrow pill next to the logo, and one sans-serif carrying 
every piece of information.

Redesign it as glassmorphism, but grounded in the product's actual 
concept rather than decorative glass: a pool's panel is only as SHARP as 
the pool is well-understood. High-confidence pools (high TVL, long 
tenure, low volatility, high risk score) render as near-clear glass. 
Low-confidence pools (thin, new, volatile, low risk score) render 
heavily frosted. Blur radius becomes a second visual encoding of the 
risk score, layered on top of the number itself.

Work in this order:

STEP 1 — Audit and strip template chrome.
List every element in the current UI that is a default pattern rather 
than something built for this data (uniform card shadows, the eyebrow 
label, identical badge styling). Don't touch code yet — just produce 
the list so we agree on what's changing.

STEP 2 — Establish the token system.
In tailwind.config / globals.css, define:
- Backdrop: radial gradient #0D1321 to #16213E (never flat black — the 
  glass needs something to refract against).
- Glass fill rgba(255,255,255,0.06), glass border rgba(255,255,255,0.12) 
  at 1px, no glow, no gradient stroke.
- Accents: jade #35C48F (positive deltas, primary data), copper #D9A24B 
  (reserved for the single top-ranked panel only), alert red #E5484D 
  (risk warnings / negative deltas only).
- A blur scale mapped to risk score: roughly blur(6px) at the top of the 
  score range down to blur(28px) at the bottom. Define this as a 
  function/utility, not a fixed class, since every panel's blur value 
  will differ by its own data.
- Type: tabular monospace (IBM Plex Mono or JetBrains Mono) for every 
  number, plain grotesk for labels/body. Numbers render on a layer above 
  the blur — the panel background frosts, the figure never does.

STEP 3 — Rebuild the headline metrics.
Replace the five identical cards with one hero panel (top risk-adjusted 
pool — sharp glass, copper accent, larger scale) plus a slimmer 
supporting strip of the other four metrics in near-clear glass (these 
are stated facts, not variable-confidence data, so they don't blur).

STEP 4 — Rebuild the ranked table as stacked glass panels.
Each pool becomes its own glass panel with the blur value computed from 
that pool's risk score, per the scale from step 2. Numbers stay crisp 
(mono face, unblurred layer) even as the panel background frosts behind 
them. Chain badges become glass-fill pills, differentiated by label 
text only, not per-chain border colors.

STEP 5 — Rebuild buttons and the alert banner.
Restyle "Connect Wallet" / "Demo Wallet" and the top alert banner using 
the same glass-fill + hairline-border treatment as the panels — no flat 
solid-color buttons sitting awkwardly on top of a glass UI.

STEP 6 — One motion pass.
On load, panels rack into focus from a heavy uniform blur down to their 
individual resting blur value (staggered, under 600ms total) — this 
doubles as the entrance animation and a demonstration of the blur-equals-
risk concept. Remove any hover-lift or shadow-pop effects — those, plus 
neon glow halos under panels, are the generic web3-glass tells to avoid.

STEP 7 — Accessibility and responsive pass.
Verify text contrast against the blurred backgrounds specifically (worst 
case: heaviest blur, lowest opacity), visible keyboard focus states on 
every interactive element, and that panels stack sensibly on mobile 
where backdrop-filter performance may need a fallback (test on a real 
mobile browser, not just devtools).

STEP 8 — Self-critique.
Take a screenshot. Check it against this brief: does the blur value on 
every panel actually correspond to that pool's risk score, or did any 
panel get a decorative/arbitrary blur? Is copper used ONLY on the single 
top pick? Are numbers crisp even inside frosted panels? If any answer is 
no, fix it before calling this done.

Work through steps in order. After step 2, pause and show me the token 
values and the blur-scale function before touching components, so I can 
approve the direction before you rebuild anything.
```
