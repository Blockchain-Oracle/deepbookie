# DeepBookie Docs Site — Designer Brief

**Deliverable:** the full visual + UX design for **`docs.deepbookie.xyz`** — DeepBookie's
public documentation site. Build framework is **Nextra v4** (Next.js App Router), so the
design slots into a proven, responsive docs shell — but **everything is on our brand and
several components are bespoke** (see §6–§7). This brief details every screen, state, and
component you need to design.

> **Read alongside:** the existing app design system (`Design system exploration (5)/*.dc.html`
> + `Brand Logos/` + `screenshots/`). This docs site must feel like a sibling of the app, not a
> generic docs theme. Same brand, same warmth, same "receipt as the signature object" identity.

---

## 1. What this is (context)

**DeepBookie** is an AI agent for trading **DeepBook Predict** — Sui's expiry-based prediction
market (testnet). You talk to it in plain language; it prices bets off a live volatility model,
**proposes** an unsigned transaction, and **you sign** every trade in your own wallet. The agent
holds no key.

The product ships as **one tool registry → four surfaces**: a generative-UI **web app**, an **MCP
server** (Claude Desktop / Cursor / Claude Code), a **CLI**, and a **Claude skill** — plus a
public **npm SDK** (`@deepbookie/predict-client`).

**The docs must do three jobs:**
1. **Convert** — a calm, premium landing that forks visitors by intent (try the app / install MCP / CLI / SDK).
2. **Teach** — concepts (the architecture, the SVI→N(d2) pricing model, the sign-at-edge trust model).
3. **Reference** — exhaustive, accurate reference for all **44 tools**, the SDK API, and every surface's install/config.

**Tone:** confident, editorial, precise — a financial instrument with a friendly face. Docs voice
is *calm* (loud marketing lives on the product landing page, not here).

**Inspiration to study:** **Mem0 docs** (`docs.mem0.ai`) for IA and the card-grid home that forks
by intent; **Nextra's own docs** (`nextra.site`) and the **SWR** site for the shell mechanics
(navbar + collapsible sidebar + scroll-spy TOC + Cmd-K search + mobile drawer). Borrow their
*structure*; none of their *look* — ours is warm-paper editorial, not cold SaaS.

---

## 2. Hard rules (non-negotiable)

- **NO dark mode.** Single fixed light brand. No theme toggle anywhere. (Dark mode is disabled in the framework.)
- **Brand fonts only:** Schibsted Grotesk (display/UI/body) + IBM Plex Mono (figures, labels, ids, code, ticks).
- **One accent — green.** Used sparingly for *up / live / signed*. Clay for *down / error*. Direction never relies on color alone (always paired with ↑/↓ + a label).
- **Fully responsive**, mobile-first care (see §9). The sidebar collapses to a drawer; the TOC collapses to a dropdown.
- **Search is required** (Cmd-K). **Sidebar is required.** **"On this page" TOC** on content pages.
- **Showcase real components** (see §6) — the docs literally embed the app's widgets as live demos.
- Files/screens must read truthfully — real prompts, real config, real numbers (we'll supply copy).

---

## 3. Brand foundation (exact — use these values)

### 3.1 Color tokens

| Token | Hex | Use |
|---|---|---|
| **Ink** | `#1A1714` | Primary text, primary buttons, dark surfaces, logo body |
| **Paper** | `#F4F2EC` | Panels / surfaces / inverted text on dark |
| **Canvas** | `#E4E2DC` | **Page background** (warm paper-grey) |
| **Card** | `#FFFFFF` | Raised cards, receipts, code blocks, tables |
| **Signal green** | `#2C5E4A` | **UP / live / signed** — the single accent (links, active nav, primary CTA) |
| **Mint** | `#7FCAA6` | Live-dot, logo dot on light, positive PnL |
| **Clay** | `#B0452B` | **DOWN / error / rejected** |
| **Wallet blue** | `#4DA2FF` | Sui Wallet identity only |
| **Void tan** | `#B0856B` | Dashed "void" receipt top-rule only (one-off) |

**Greys & lines:** ink-soft `#3C3933` · body `#615C53`/`#6F6A60` · muted `#8A857B` · faint
`#9C978D`/`#928D83` · disabled `#A8A298`. Borders: `#E6E1D8` (default), `#DED9CF` (panel/section),
`#EDE9E0`/`#F2EEE6` (inner/table dividers). Skeleton shimmer `#ECE8DF`. Table head `#FAF8F3`.
Inner off-white `#FAFAF7`.

**Semantic tints:** green-bg `#F4F7F4` / green-border `#DCEAE2` · error-bg `#FBF1EC` / error-border
`#E6C9BE` / error-text `#8A2F1C` · warn-text `#9C7A2A` / warn-bg `#FBF6EC` / warn-border `#ECDCBC`.
Dark-section (for any inverted band): bg ink `#1A1714`, line `#2C2823`, body `#CFC9BD`, eyebrow `#7D8A82`.
Asset chips: BTC = Ink, SUI `#19A1A6`, ETH `#6E7BE0`.

### 3.2 Typography

- **Schibsted Grotesk** (400–900) — display, headings, UI, body.
- **IBM Plex Mono** (400–600) — figures, labels, ids, digests, ticks, inline/block code. Always tabular numerals.

| Role | Size | Weight | Tracking | Font |
|---|---|---|---|---|
| Hero display | 52–62px | 800 | -0.04em | Schibsted |
| Page H1 | 30–34px | 700 | -0.03em | Schibsted |
| Section H2 | 22–28px | 700 | -0.03em | Schibsted |
| Sub H3 | 17–19px | 700 | -0.02em | Schibsted |
| Body | 15–16px | 400 | — (1.6 line-height) | Schibsted |
| Big figures | 30–34px | 600 | -0.01em | IBM Plex Mono |
| Eyebrow/label (`.lbl`) | 10–11px | 600 | 0.13em UPPERCASE | mono |
| Section eyebrow (`.sec`) | 11px | 500–600 | 0.10em UPPERCASE, color `#928D83` | mono |
| Code (inline/block) | 13–14px | 400–500 | — | IBM Plex Mono |

### 3.3 Space · radius · elevation · motion

- **Spacing** (4px base): 4 · 8 · 12 · 16 · 24 · 32 · 48. Section padding 64–96px. Content column max-width ~720–760px reading measure.
- **Radius:** card-inner 8px · card 14px · phone 42px · pill 999px.
- **Elevation** (ink-tinted, soft, negative-spread): hairline `1px solid #E6E1D8` (default) · raised `0 18px 40px -22px rgba(26,23,20,.3)` · float `0 28px 64px -26px rgba(26,23,20,.45)`.
- **Motion:** *deliberate* — cards reveal 14px rise + fade, 0.5–0.55s, `cubic-bezier(.22,1,.36,1)`. *The sign* — spinner → wax-stamp slams in with gentle overshoot `cubic-bezier(.34,1.56,.64,1)`. *Live data* — 1.8s pulse on the live dot. Honor `prefers-reduced-motion`.

### 3.4 Signature objects (reuse — these ARE the brand)

- **The receipt** — white card, 3px top-rule that encodes state (**Ink = proposed, Green = signed, dashed tan = void**), mono kicker "TRADE CONFIRMATION", direction pill (UP green / DOWN clay), hairline figure rows, bordered total, an on-chain digest strip (`#FAFAF7` + "Suiscan ↗"), and a **wax-seal "SIGNED" stamp** when signed. The receipt should appear as a recurring docs motif (hero, the sign-at-edge concept page, the Web surface page).
- **The chat-bubble logo mark** — a speech bubble whose stroke line *is* the odds curve, with a green live-dot (Mint `#7FCAA6` on light). At ≤16px the curve drops; only the dot carries it.
- **The wax-seal "SIGNED" stamp** — circular ~56–72px, `1.4px solid #2C5E4A` ring, rotated −9°, green check + mono micro-caps "SIGNED". The trust climax.

---

## 4. Global shell / chrome (design all states)

Nextra gives a responsive docs shell; you're designing **our brand version of it**. Components:

### 4.1 Top navbar (sticky)
- **Left:** logo lockup (chat-bubble mark + "DeepBookie" wordmark, Schibsted 700). Links to `/`.
- **Center/left of search:** primary section links — `Docs`, `Tools`, `Cookbooks` (top-level tabs; active = green underline or pill).
- **Right:** **Search trigger** (a pill input showing "Search… ⌘K"), a **GitHub** icon-link, and a primary **"Open app ↗"** button (green pill) linking to the web app. **No theme toggle.**
- Hairline bottom border `#DED9CF`; canvas/paper background with a subtle blur on scroll.
- **Mobile:** logo + hamburger + search icon only; section links + the rest move into the drawer.

### 4.2 Left sidebar (the nav tree)
- Full content tree grouped into sections (see §8). **Group headers** = mono eyebrow `.sec` style (uppercase, muted). **Items** = Schibsted 15px; **active item** = green text + a 2px green left-rule or a paper pill; **hover** = subtle paper fill.
- **Collapsible groups** (chevron). Nested one level (e.g. Tool Reference → Predict → families). Long tree scrolls independently; sticky.
- A small footer area: version tag (mono pill, e.g. "testnet · v0.1"), link to `llms.txt`.
- **Mobile:** slides in as a left **drawer** over a scrim; close on item tap or scrim tap.

### 4.3 Right "On this page" TOC
- Mono eyebrow "ON THIS PAGE"; nested H2/H3 list; **scroll-spy active item in green**; thin track.
- Hidden < ~1100px; on tablet/mobile becomes a collapsible "On this page" dropdown above the content.

### 4.4 Content column
- Max reading width ~720–760px, centered between sidebar and TOC. Generous vertical rhythm.
- **Breadcrumb** at top (Section / Page, mono, muted) + the H1 + a one-line description (muted) + a hairline divider, then content.
- **Prev / Next pagination** footer (two cards: ← previous title, next title →).
- **"Edit this page" / "Last updated"** small links (optional, muted).

### 4.5 Footer
- Calm, paper background. Columns: Product (App, GitHub), Docs (Quickstart, Tools, SDK), Community (X, Discord if any). DeepBookie wordmark + "Built on DeepBook · Sui testnet" + the small DeepBook attribution logo. © line in mono.

> **Design these shell states:** default, scrolled (sticky/blur), sidebar group collapsed/expanded, active nav, search-open, mobile drawer open, mobile TOC dropdown.

---

## 5. Page templates (design each)

Design a representative screen for **each** template; the rest of the pages reuse them.

**A. Docs home / landing (`/`)** — the centerpiece. Hero: logo lockup + mono eyebrow "DEEPBOOKIE
DOCS" + display headline **"Real odds. Priced live. You sign."** + one-line subhead + a **product-verb
primary CTA** "Start trading by talking →" and a secondary "Read the docs". Below: a **6-card intent
grid** (each card = icon + title + one-line blurb + arrow), forking by audience:
*Try the web app · MCP server · CLI · `@deepbookie/predict-client` SDK · Tool reference (44) · How it works.*
Optionally a "How a trade works" 4-step strip and a quiet "built on DeepBook / Sui" line. Use a
**receipt** visual somewhere in the hero. (Reference: Mem0's `introduction` card-grid home.)

**B. Standard content page** — show full typographic system in situ: H1–H4, body, ordered/unordered
lists, links (green, underlined on hover), **inline code** (mono, paper chip), **blockquote**,
**tables** (zebra-free, hairline rows, mono numerals, head `#FAF8F3`), **images in a Frame** (white
card, hairline, caption), **code block** (dark or paper? — see §7.3) with copy button + filename tab,
**callouts** (Note / Tip / Warning — see §7.2), and **Steps** (numbered vertical rail).

**C. Concept page with a diagram** — e.g. *Architecture: one registry, four surfaces* (a custom
diagram: the registry box → 4 surface lanes → "unsigned tx → sign at edge"). And *Pricing: SVI →
N(d2)* (a probability-smile curve visual — reuse the OddsCurveCard look). Design the diagram style:
hairline boxes, mono labels, green for the "signed/live" path, clay for nothing-here.

**D. Surface page (e.g. MCP server)** — heavier on code. A hero line + an install block, then
**tabbed config** (Claude Desktop / Cursor / Claude Code) each showing a JSON `mcpServers` block,
then a "local key" explainer, then a worked example. Design the **code-group tabs** and the
**copy-config** affordance. (CLI page = command reference cards; Web page = screenshots + the
propose→sign→receipt flow.)

**E. Quickstart page** — linear **numbered Steps**, "⏱ under 5 minutes" chip, ending in a real
result (a digest, or a rendered widget). Code blocks with copy. This is the most-used page — make it sing.

**F. Tool Reference catalog (`/tools`)** — the **44 tools**. A filterable/searchable catalog grouped
into **8 families** (Predict: Markets & odds · Trading · Account · Vault; Spot: Pools & prices ·
Trading · Account · Governance & rewards). Each tool = a row/card with: **mono name**, a **kind pill**
(`read` = neutral · `you sign` = green), a **surface tag** (predict/spot), one-line description, and
expandable **inputs/returns**. Design: the family group headers, the pills, a sticky family filter,
the per-tool expanded state, and the empty/"no match" search state. This is dense — make it scannable
and beautiful (think a well-set API index).

**G. SDK / API reference module page** — signature tables (function · params · returns · one-line),
a runnable-looking code sample, a "browser-safe" note. Calm and reference-grade.

**H. Cookbook / recipe page** — outcome-named ("Will BTC be above $X in 30 minutes?"). A short intro,
a result preview (a receipt/widget), then numbered Steps mixing prose + code + an embedded widget.

**I. Reference table page** — e.g. *Testnet facts & addresses*: a dense table of constants
(package id, registry, dUSDC type, clock, indexer URL, scaling) with **copy-to-clipboard** on each
mono value, plus a "provisional — changes at mainnet" banner.

**J. Search modal (Cmd-K)** — centered overlay on a scrim. Mono "Search docs…" input, grouped
results (section → page → heading), keyboard-highlighted active row (green), `↑↓ to navigate · ↵ to
open · esc` legend. Design empty, typing, results, and no-results states.

**K. Utility screens** — 404 (branded, "this page redeemed early" pun-light), and any loading/skeleton
(shimmer `#ECE8DF`).

---

## 6. The signature custom component — `<PromptDemo>` (prompt → component showcase)

This is the docs' **killer differentiator** and a hero of your design. It proves DeepBookie's
"talk to it, it renders a widget" thesis *inside the docs*.

**Concept:** a two-panel card pairing **the natural-language prompt a user would type** with **the
real widget the agent renders back**.

**Anatomy (design it):**
- A brand **Card** (white, radius 14, hairline, optional `raised` shadow on hover).
- **Top panel — the prompt:** a faux chat-input row: the small chat-bubble mark + the user's prompt
  text (Schibsted), and a **mono tool pill** on the right (e.g. `get_odds`). Reads exactly like the app's chat input.
- **Divider:** a hairline with a tiny centered mono label "renders ↓".
- **Bottom panel — the live widget:** the actual app component, rendered with realistic data.
- **(Future) a "Run live" toggle** in the card header (segmented: `Example | Run live`) — design it but
  it's **disabled/"soon" in v1**. Show both the default and the disabled-toggle states.

**Widgets to showcase** (these are real app components — we embed them; design the card framing around
each, and note any that are tall/wide for mobile stacking):

| Prompt (example) | Widget | Notes |
|---|---|---|
| "What are the odds BTC closes above $70k Friday?" | **OddsCurveCard** | probability-smile curve — the marquee |
| "Bet $50 that BTC is above $70k" | **SignReceipt** | design **all 6 states**: loading · proposed · signing · **signed (wax-seal)** · failed · cancelled (void). Present as a 6-up strip or a stepper. |
| "How much to buy $100 of BTC-up at $68k?" | **QuotePreview** | cost + payout |
| "Price a band: BTC between $66k and $70k" | **RangePayoff** | range payoff shape |
| "Show me the BTC market" | **MarketHeader** | spot/forward/expiry |
| "List the active markets" | **MarketTable** | table of markets |
| "How's the liquidity vault doing?" | **VaultCard** | APR / utilization |
| "What's my portfolio worth?" | **PortfolioRollup** | account value + PnL |
| "Show my open positions" | **PositionCard** | per-position cost/PnL |
| "What are people betting on right now?" | **ActivityTape** | live trade tape |
| (empty chat home) | **Category carousel** | the welcome starters |

**The marquee narrative:** a "How a trade works" walkthrough page that uses the **SignReceipt state
array** (loading → proposed → signing → signed) as a storyboard — the four-step propose→sign→receipt
loop, live.

---

## 7. Other components to style

- **7.1 Cards / CardGroup** — the spine of the home + reference indexes. Icon + title + one-line + arrow; hover = `raised` lift + green arrow.
- **7.2 Callouts** — Note (paper, ink), Tip (green tint `#F4F7F4`/`#DCEAE2`), Warning (warn tint `#FBF6EC`/`#ECDCBC`), Danger (error tint `#FBF1EC`/`#E6C9BE`). Mono label + icon + body. Used heavily for footguns (testnet-only, dUSDC operator-gated, key safety).
- **7.3 Code blocks** — decide ink-dark vs paper-light (recommend a soft **ink** `#1A1714` block with paper text + mint/green syntax accents, OR a paper block — show both options). Mono, filename tab, **copy button**, and **language/surface tabs** (a "CodeGroup": TS · CLI · cURL). Inline code = paper chip.
- **7.4 Tool pills** — `read` (neutral hairline) vs **`you sign`** (green). Surface tag (predict/spot) as a small mono chip. Direction pill UP (green) / DOWN (clay) with ↑/↓.
- **7.5 Steps** — numbered vertical rail with a green active node; each step = title + body + optional code/widget.
- **7.6 Tables** — hairline rows, mono numerals (tabular), head `#FAF8F3`, copy-on-value for reference tables.
- **7.7 Frame** — image wrapper (white card, hairline, caption) for screenshots.
- **7.8 The receipt motif** — a recurring decorative/explanatory element (hero, sign-at-edge page).
- **7.9 Badges/chips** — "testnet", "v0.1", "keeper-only", "advanced".

---

## 8. Full content / IA (the sitemap — design representative pages, but here's the scope)

Root = `docs.deepbookie.xyz`. Proposed clean routes (no `/docs` prefix; Mem0-style). 🎬 = embeds a
PromptDemo showcase. 📷 = carries screenshots/diagram.

```
/  ............................ Docs home (hero + 6-card intent grid)            🎬

Get Started   (/get-started/…)
  Introduction ................ what DeepBookie is, who it's for, testnet status  🎬
  Why DeepBookie .............. the 4 novelty pillars                             🎬
  How a trade works ........... the four-step propose→sign→receipt loop           🎬
  Product tour ................ annotated web-app screenshots                     📷
  Quickstart: Web app ......... connect → fund → first signed bet                🎬
  Quickstart: MCP ............. install + config in Claude/Cursor
  Quickstart: CLI ............. install + first read + first signed write
  Quickstart: npm SDK ......... read odds + build an unsigned mint PTB

Concepts   (/concepts/…)
  Architecture: one registry, four surfaces ... the core diagram                 📷
  The sign-at-the-edge model .................. unsigned PTB → edge signs         🎬
  Request lifecycle: read vs write
  The tool registry & ToolDef
  ToolContext & identity resolution
  Agent safety guards ......................... managerId override, strike snap
  DeepBook Predict ............................ expiry / strike / oracle (BTC testnet)
  Pricing: SVI → N(d2) ........................ the intellectual core             🎬📷
  Scaling & units ............................. ×1e9, 6dp
  dUSDC & funding ............................. operator-gated, why no buy button
  Managers, positions & PnL
  The PLP liquidity vault

Surfaces   (/surfaces/…)
  Web app ..................................... chat-to-sign, routes, history     🎬📷
  MCP server .................................. install + Claude/Cursor/Claude Code config + local key
  CLI ......................................... install + full command reference + workflows
  Claude skill ................................ what SKILL.md is, install, playbook
  Embed in your own app ....................... consume the registry, sign yourself

Tool Reference   (/tools/…)            ........ catalog of all 44                 🎬
  Overview (auto catalog, filter/search)
  Predict — Markets & odds · Trading · Account · Vault & liquidity
  Spot — Pools & prices · Trading · Account · Governance & rewards

SDK / API   (/sdk/…)
  @deepbookie/predict-client — overview+quickstart · ptb · indexer · quotes · math (SVI→N(d2)) · units · constants · types
  @deepbookie/core — ToolDef · ToolContext · registry · adapter

Cookbooks   (/cookbooks/…)             ........ 8 outcome-named recipes           🎬
  "Will BTC be above $X?" · Bet a price band · Close a bet early · Provide liquidity ·
  Spot: swap & limit orders · A keeper bot · Watchlist agent (read-only) · Embed in your chat app

Reference   (/reference/…)
  Testnet facts & addresses (copyable) · Indexer REST API · Error codes ·
  Security & trust model · Glossary · FAQ · llms.txt · Changelog
```

> The designer doesn't design all ~60 pages — design the **templates in §5** plus the **bespoke
> screens** (home, Tool Reference catalog, PromptDemo showcase, a Surface page with config tabs, a
> Concept page with a diagram, the search modal). Everything else reuses the standard content template.

---

## 9. Responsive / mobile spec

Breakpoints (suggested): mobile < 640 · tablet 640–1024 · desktop 1024–1280 · wide > 1280.

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Navbar | full (logo · links · search pill · GitHub · Open-app) | logo · search · hamburger | logo · search icon · hamburger |
| Sidebar | persistent left rail | off-canvas drawer (hamburger) | off-canvas drawer |
| TOC (right) | persistent | collapsible "On this page" dropdown | collapsible dropdown (or omit) |
| Content width | ~720–760 centered | fluid w/ padding | fluid, 16–20px gutters |
| Home card grid | 3 cols | 2 cols | 1 col |
| PromptDemo | prompt + widget side-by-side OR stacked | stacked | stacked, widget scrolls horizontally if wide |
| Tool Reference | multi-col family grid | 1–2 col | 1 col, sticky family filter as a select |
| Code blocks | full | full, horizontal scroll | horizontal scroll, smaller mono |
| Tables | full | scroll-x | scroll-x with shadow hint |

Design at least: **mobile home, mobile content page (with drawer open), mobile Tool Reference, mobile
PromptDemo, mobile search.**

---

## 10. Imagery & assets (what to use where)

All under `Design system exploration (5)/`.

- **Logos** (`Brand Logos/`): `lockup-stacked.svg` (hero badge), `wordmark.svg`/`wordmark-twotone.svg` (navbar), `mark-primary.svg` (favicon/compact), `mark-green.svg`, `app-icon.svg`, `favicon.svg`. OG/social card → **`banner-link.png`** (1200×630). Page/section hero band → `banner-wide.svg` (1500×500). The DeepBook sponsor logo (`uploads/deepbook_logo.svg`, blue) is **only** for "built on DeepBook" attribution — never as our mark.
- **Screenshots** (`screenshots/`): `receipts.png` (the receipt pair — use on sign-at-edge + hero), `01-04-app2.png` + `app1.png` (chat → Web surface + Product tour), `desktop.png` + `dpages` set (Markets/Positions/Vault/History → Product tour), `01/02-landing.png` + `premium-landing.png` (home accents), `01-foundation.png` (tokens/type if a "design" page), `01-onb.png`/`01-mobonb.png` (onboarding). Wrap all in a **Frame** (white card, hairline, caption).
- If a needed shot doesn't exist (e.g. a clean MCP-in-Claude screenshot), flag it — we'll capture it.

---

## 11. States & interactions to specify

For every interactive element: **default · hover · active/pressed · focus (visible green ring) ·
disabled · loading (shimmer) · empty · error · success/"copied"**. Specifically:
- Nav item: default/hover/active. Sidebar group: collapsed/expanded.
- Search: closed/open/typing/results/no-results.
- Code block + reference value: idle → "copied ✓" (green, 1.2s).
- PromptDemo: default · hover-lift · (disabled "Run live" → tooltip "Coming soon").
- SignReceipt: the full 6-state set.
- Tool Reference row: collapsed/expanded; filter active; no-match.

---

## 12. Accessibility

- Contrast: ink `#1A1714` on canvas/paper passes AA; ensure muted greys on canvas meet AA for body
  (use `#615C53`+ for body text, reserve `#9C978D` for non-essential labels).
- **Visible focus rings** (green `#2C5E4A`, 2px) on all interactive elements; full keyboard nav for
  navbar, sidebar, search, TOC, and the Tool Reference filter.
- Respect `prefers-reduced-motion` (kill the rise/stamp/pulse).
- Direction/state never color-only (always ↑/↓ + label; pills carry text).
- Alt text on every screenshot/diagram.

---

## 13. Deliverables (checklist for the designer)

**Screens (desktop + mobile):**
1. Docs home / landing (hero + 6-card grid)
2. Standard content page (full typographic system, callouts, code, table, Steps, Frame)
3. Concept page with the **Architecture diagram**
4. Concept page with the **SVI→N(d2) pricing curve** visual
5. Surface page (**MCP**) with **config code-group tabs** + local-key section
6. Quickstart page (numbered Steps + result)
7. **Tool Reference catalog** (44 tools, 8 families, pills, filter, expanded row, no-match)
8. SDK/API reference module page (signature tables)
9. Cookbook/recipe page (intro + result + Steps with embedded widget)
10. Reference table page (copyable constants)
11. **Search modal** (Cmd-K, all states)
12. 404

**Components (full state sets):**
- Navbar · Sidebar (groups) · TOC · Footer · Breadcrumb · Prev/Next
- **`<PromptDemo>`** (default, hover, disabled "Run live") + framing for each showcased widget
- Cards/CardGroup · Callouts (4) · Code block + CodeGroup tabs + copy · Tool pills (read/you-sign, surface, direction) · Steps · Tables · Frame · Badges
- The **SignReceipt** 6-state strip (we provide the component; design the docs framing)

**System:** a token sheet confirming colors/type/space/radius/elevation/motion as applied to docs
(so build matches 1:1).

---

## 14. Framework notes (for build alignment — FYI, not design constraints)

We build on **Nextra v4** (Next.js 16 App Router). The shell (navbar + collapsible sidebar +
scroll-spy TOC + Cmd-K search + mobile drawer + prev/next + breadcrumbs) is provided and **fully
restyleable** to this brand; **dark mode is disabled**. Custom React components (the **PromptDemo**,
the **ToolCatalog**, the architecture diagram, the pricing curve, the receipt) are embedded directly
in MDX. So: design freely within the **standard docs anatomy** (it's a solved, accessible, responsive
structure) and go fully bespoke on the **hero, card grid, Tool Reference, and the component showcase**.
Reference builds cloned locally for the team: `/tmp/nextra-src` (Nextra's own docs + `examples/custom-theme`)
and `/tmp/swr-site`.

---

*Questions or missing assets → flag in the file/Figma and we'll supply real copy, numbers, and screenshots.*
