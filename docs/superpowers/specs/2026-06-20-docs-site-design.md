# DeepBookie Documentation Site — Implementation Plan / Design Spec

**Date:** 2026-06-20 · **Author:** planning lead · **Status:** locked for build
**Research brief (do not restate):** `/Users/abu/dev/hackathon/sui-overflow/deepbook-predict-agent/research/docs-site-research.md` — Mem0 inspiration, brand tokens §5, sidebar tree §7. This document is the actionable PLAN that supersedes the brief's best-guesses with verified ground truth.

> Verified-report precedence: where the brief and the verified reports (verify-fumadocs-api, verify-web-components, verify-theme-fonts, verify-tool-registry, verify-predict-client) disagree, **the verified reports win**. The most consequential corrections: **44 tools, not 27/35**; **Fumadocs v16 + Next 16 + React 19.2** API surface; **Spot is a documented trading surface**; canonical domain **docs.deepbookie.xyz** (singular).

---

## 1. Goal & Decisions

**Goal.** Ship `docs.deepbookie.xyz` — a single-brand, light-only Fumadocs site that doubles as DeepBookie's developer reference *and* its product showcase. It documents all **44 tools** (Predict 18 + Spot 26) and the `@deepbookie/predict-client` API, teaches the SVI→N(d2) pricing model, and embeds the real `apps/web` widgets as **static-prop demos** paired with the natural-language prompts that trigger them in the chat agent — proving "talk to it, it renders a widget" without any wallet or network in the docs.

### Locked decisions

| # | Decision | Detail |
|---|---|---|
| 1 | **Document all 44 tools** | Predict 18 (10 read + 8 write) + Spot 26 (10 read + 16 write). Spot is a first-class **documented trading surface**, not read-only context. (`redeem_permissionless` is documented but flagged keeper-only, mirroring the agent's exclusion set.) |
| 2 | **Canonical domain = `docs.deepbookie.xyz`** | SINGULAR "deepbookie". Banner/OG assets (singular) are correct. Any "deepbookies" reference is wrong and must be reconciled (see §10). |
| 3 | **Pragmatic component sharing** | apps/docs imports demo components **directly from `@deepbookie/web`** via workspace dep + path alias. No `packages/ui` extraction now (deferred). Wallet-coupled components get a **static-prop wrapper authored in apps/docs**, never extracted at this stage. |
| 4 | **Static-prop demo fidelity (v1)** | All `<PromptDemo>` instances render mock props — **no network, no wallet, no live indexer**. Build a `runnable` seam for a future "Run live" toggle, but **ship zero live demos in v1**. |

---

## 2. Architecture

### 2.1 New workspace package: `apps/docs`

A new pnpm workspace package, name **`@deepbookie/docs`**, sibling to `@deepbookie/web`. `pnpm-workspace.yaml` already globs `apps/*`, so no edit is needed — just create the folder.

**Pinned stack** (from verify-fumadocs-api + verify-theme-fonts; resolve exact on install):

| Package | Pin | Source |
|---|---|---|
| `next` | `16.x` (match Fumadocs peer) | ⚠️ Fumadocs v16 requires Next **16**; apps/web is on `^15.3.9`. apps/docs runs its **own** Next 16 — they are independent Vercel projects, so no forced web upgrade. |
| `react` / `react-dom` | `^19.2.7` | apps/web pin; satisfies Fumadocs peer `^19.2.0` |
| `fumadocs-ui` | `16.10.5` | verify-fumadocs-api |
| `fumadocs-core` | `16.10.5` | lockstep with -ui |
| `fumadocs-mdx` | `15.0.12` | verify-fumadocs-api (peer `next ^15.3 \|\| ^16`) |
| `@types/mdx` | latest (devDep) | |
| `tailwindcss` / `@tailwindcss/postcss` | `^4.3.1` | apps/web pin (Tailwind v4 CSS-first) |
| `postcss` | `^8.5.15` | |
| `typescript` | `^5.7.0` | |
| `@types/node` `^22.10.0`, `@types/react` `^19.2.17`, `@types/react-dom` `^19.2.3` | apps/web pins | |
| `react-markdown` `^10.1.0` + `remark-gfm` `^4.0.1` | only if embedding `chat/Markdown` showcase | |
| `@deepbookie/web` | `workspace:*` | demo components (pragmatic direct import) |
| `@deepbookie/core` | `workspace:*` | the 44-tool registry (`allTools`) for the reference page |
| `@deepbookie/predict-client` | `workspace:*` | API-reference fixtures + math demos (browser-safe, confirmed) |

`packageManager` stays `pnpm@10.33.0`; `node >=20` (root engine). `postinstall: "fumadocs-mdx"` in apps/docs generates `.source`.

### 2.2 Folder tree

```
apps/docs/
  package.json                      # @deepbookie/docs; scripts postinstall+build (fumadocs-mdx && next build)
  next.config.mjs                   # createMDX from 'fumadocs-mdx/next' + transpilePackages
  source.config.ts                  # defineDocs/defineConfig; providerImportSource '@/components/mdx'
  postcss.config.mjs                # { '@tailwindcss/postcss': {} }  (verbatim from apps/web)
  tsconfig.json                     # paths: @/* -> ./src/* ; @web/* -> ../web/src/*
  lib/
    source.ts                       # loader({ baseUrl:'/docs', source: docs.toFumadocsSource() })
    layout.shared.tsx               # baseOptions(): BaseLayoutProps (nav title, links)
  app/
    layout.tsx                      # next/font (schibsted+plexMono) on <html>; RootProvider theme.enabled=false
    global.css                      # tailwind + fumadocs presets + BRAND OVERRIDE block (§3)
    (home)/page.tsx                 # docs-home card grid + product-verb CTA (§5)
    (docs)/layout.tsx               # DocsLayout tree={source.getPageTree()}
    (docs)/docs/[[...slug]]/page.tsx# DocsPage; MDX body + getMDXComponents()
    api/search/route.ts             # createFromSource(source)  (Orama)
    llms.txt/route.ts               # llms(source).index(); revalidate=false
  src/
    components/
      mdx.tsx                       # getMDXComponents(): defaults + PromptDemo + Tabs/Steps/Files spread
      prompt-demo.tsx               # <PromptDemo> showcase (§4)
      brand/fonts.ts                # copy of apps/web foundation/fonts.ts (schibsted, plexMono)
      wrappers/                     # static-prop wrappers for wallet-coupled components (§2.4)
        PositionsTableStatic.tsx
        CategoryCarousel.tsx        # extracted/mirrored empty-state carousel (pure)
      tool-reference/
        ToolCatalog.tsx             # server comp: maps allTools -> grouped reference table
    fixtures/
      mocks.ts                      # mockOdds, mockMarket, mockQuote… (ported from web gallery)
  content/docs/
    index.mdx … (full IA in §5)
    meta.json (+ per-folder meta.json for sidebar ordering)
```

### 2.3 Importing from `@deepbookie/web` (pragmatic)

apps/web has **no export barrel** and uses alias `@/* → ./src/*`. Two-part strategy:

1. **Path alias in apps/docs `tsconfig.json`:** add `"@web/*": ["../web/src/*"]`. Docs import deep paths, e.g. `import { OddsCurveCard } from '@web/components/widgets/OddsCurveCard'`.
2. **Transpile the workspace source** in `next.config.mjs`: `transpilePackages: ['@deepbookie/web', '@deepbookie/core', '@deepbookie/predict-client']` (web already lists the latter two; we add web itself because we consume its un-built `src/`).

The widgets are Tailwind-utility + CSS-custom-property styled (`bg-canvas`, `text-ink`, `border-line`, `rounded-card`, `--shadow-raised`). **Styling only works because apps/docs replicates the exact `@theme` token block** (§3). Without it the components import fine but render unstyled.

`@deepbookie/core` and `@deepbookie/predict-client` are imported as normal workspace deps (browser-safe; predict-client's sole dep is `@mysten/sui`).

### 2.4 Component-embed strategy (from verify-web-components)

| Component (`@web/components/...`) | Strategy | Notes |
|---|---|---|
| `widgets/OddsCurveCard` | **direct-import** | pure props `status`+`odds`; `onBet?` optional |
| `widgets/SignReceipt` | **direct-import** | pure fn, 6-state union from props alone — the marquee demo |
| `widgets/MarketHeader` | **direct-import** | `market: MarketState` |
| `widgets/MarketTable` | **direct-import** | `markets`, `onPick` |
| `widgets/QuotePreview` | **direct-import** | `quote: Quote` |
| `widgets/RangePayoff` | **direct-import** | `quote: RangeQuote` |
| `widgets/VaultCard` | **direct-import** | `vault: Vault` |
| `widgets/PortfolioRollup` | **direct-import** | `portfolio: Portfolio` |
| `widgets/PositionCard` | **direct-import** | `position: Position` |
| `widgets/ActivityTape` | **direct-import** | `bets: Position[]` |
| `widgets/TradeTape` | **direct-import** (+vendors `SUISCAN_TX` → drags predict-client) | acceptable; predict-client is a docs dep anyway |
| `widgets/VaultPoolCard` | **direct-import** (+`VaultHistory` type) | |
| `widgets/MarketsBoard` | **direct-import** (+`MarketEnriched` type) | |
| `widgets/CoinLogo` | **direct-import** | zero imports |
| `chat/Markdown` | **direct-import** (adds `react-markdown`+`remark-gfm`) | optional |
| `ui/*` (`Card,Skeleton,Pill,Sparkline,Stat,Button,BrandMark`) + `widgets/kit` | **direct-import** | transitive deps of the above |
| `widgets/PositionsTable` | **static-wrapper** → `wrappers/PositionsTableStatic.tsx` | pure except child `RedeemButton` (useTxAction); wrapper renders a presentational static redeem button |
| `chat/MessageList` (category carousel) | **static-wrapper** → `wrappers/CategoryCarousel.tsx` | module statically imports `MessagePart→ReceiptController→@mysten/dapp-kit`; mirror the pure `CATEGORIES`+empty-state into docs, do NOT import `MessageList` |
| `widgets/ReceiptController` | **DO NOT IMPORT** (needs-refactor) | dapp-kit hooks; showcase bare `SignReceipt` instead |
| `widgets/RedeemButton` | **DO NOT IMPORT** | `useTxAction` |
| `widgets/VaultManage` | **DO NOT IMPORT** | `useTxAction`+`useBalances`+fetch |
| `chat/MessagePart` | **DO NOT IMPORT** | transitive dapp-kit |

**Shared surface docs must resolve (via `@web/*` alias):** `lib/bff/types`, `lib/format`, `lib/constants` (only `TradeTape` needs it), `components/ui/*`, `components/widgets/kit`. All are pure type/util modules except `lib/constants` (pulls predict-client — fine).

---

## 3. Brand Layer

Single fixed light theme. **`globals.css` is the live source of truth** (the brief's `--db-*` block is a parallel doc aid — do NOT introduce `--db-*` names). We keep apps/web's `@theme` namespaces (`--color-*`, `--font-*`, `--radius-*`, `--shadow-*`) verbatim so direct-imported widgets style correctly, then map them onto Fumadocs' `--color-fd-*` vars.

**Fonts** (`src/components/brand/fonts.ts`, copied verbatim from `apps/web/src/components/foundation/fonts.ts`): `Schibsted_Grotesk` weights `400,500,600,700,800,900` → `--font-schibsted`; `IBM_Plex_Mono` weights `400,500,600` → `--font-plex-mono`; both `subsets:['latin']`, `display:'swap'`. Wire in `app/layout.tsx`: `<html className={`${schibsted.variable} ${plexMono.variable}`} suppressHydrationWarning>`. Use `next/font/google` (no `@import url(...)`).

**Theme toggle disabled:** `<RootProvider theme={{ enabled: false }}>` — removes the toggle UI, only `:root`/`@theme` light colors apply, `.dark {}` ignored. Pair with `:root { color-scheme: light; }`.

**Body = canvas:** Fumadocs' `--color-fd-background` must resolve to canvas `#e4e2dc` and the `body` base must match apps/web.

**`app/global.css` (concrete override block):**

```css
@import 'tailwindcss';
@import 'fumadocs-ui/css/neutral.css';   /* base theme */
@import 'fumadocs-ui/css/preset.css';     /* if v16 tokens look wrong, swap to preset-legacy.css */

/* ---- DeepBookie brand @theme (verbatim from apps/web globals.css) ---- */
@theme {
  --color-ink: #1a1714;
  --color-paper: #f4f2ec;
  --color-canvas: #e4e2dc;
  --color-card: #ffffff;
  --color-green: #2c5e4a;
  --color-mint: #7fcaa6;
  --color-clay: #b0452b;
  --color-wallet: #4da2ff;
  --color-line: #e6e1d8;
  --color-line-strong: #ded9cf;
  --color-muted: #8a857b;
  --color-faint: #9c978d;
  --color-ink-soft: #3c3933;
  --color-shimmer: #ece8df;

  --font-sans: var(--font-schibsted), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, monospace;

  --radius-card-in: 8px;
  --radius-card: 14px;
  --radius-phone: 42px;
  --radius-pill: 999px;

  --shadow-raised: 0 18px 40px -22px rgb(26 23 20 / 0.3);
  --shadow-float: 0 28px 64px -26px rgb(26 23 20 / 0.45);

  /* ---- Map brand tokens onto Fumadocs UI vars ---- */
  --color-fd-background: var(--color-canvas);          /* page base = warm paper-grey */
  --color-fd-foreground: var(--color-ink);
  --color-fd-card: var(--color-card);
  --color-fd-card-foreground: var(--color-ink);
  --color-fd-popover: var(--color-card);
  --color-fd-popover-foreground: var(--color-ink);
  --color-fd-muted: var(--color-shimmer);
  --color-fd-muted-foreground: var(--color-muted);
  --color-fd-border: var(--color-line-strong);
  --color-fd-primary: var(--color-green);              /* brand accent = green */
  --color-fd-primary-foreground: var(--color-paper);
  --color-fd-secondary: var(--color-paper);
  --color-fd-secondary-foreground: var(--color-ink);
  --color-fd-accent: var(--color-shimmer);
  --color-fd-accent-foreground: var(--color-ink);
  --color-fd-ring: var(--color-green);
}

:root {
  color-scheme: light;
  --fd-layout-width: 1400px;   /* roomier for embedded widgets */
  /* shadcn vars dapp-kit reads — keep for safety even though docs avoid wallet UI */
  --background: #f4f2ec; --foreground: #1a1714; --card: #ffffff;
  --primary: #1a1714; --primary-foreground: #f4f2ec; --border: #ded9cf;
  --ring: #2c5e4a; --radius: 8px;
}

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

@keyframes fade-up { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
.animate-fade-up { animation: fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
```

Use the **live ease `cubic-bezier(0.22, 1, 0.36, 1)`** (NOT brief §5.7's `.22,.61,.36,1`). Pull extra greys / semantic tints from §5.7 only if a prose surface needs them.

---

## 4. The `<PromptDemo>` Showcase Component

The signature artifact: a two-panel card that pairs the **natural-language prompt** a user would type with the **live widget** the agent renders in response — proving DeepBookie's generative-UI thesis, statically.

### 4.1 Architecture (prompt ⇆ component, static-prop)

`src/components/prompt-demo.tsx` (`'use client'`):

```tsx
type PromptDemoProps = {
  prompt: string;            // the chat input that triggers this widget
  tool?: string;             // optional: the tool name it maps to (mono badge)
  children: React.ReactNode; // the statically-propped widget instance
  runnable?: boolean;        // SEAM (default false) — future "Run live" toggle
};
```

Layout: a brand `Card` with (a) a faux chat-input row rendering `prompt` with a `BrandMark` + mono `tool` pill, (b) a "renders" divider, (c) `{children}` — the real widget passed mock props by the MDX author. Reuses brand tokens so it matches `apps/web` chat exactly.

### 4.2 Static-prop pattern

The MDX author imports a widget and the shared fixture, then passes props inline:

```mdx
import { OddsCurveCard } from '@web/components/widgets/OddsCurveCard';
import { mockOdds } from '@/fixtures/mocks';

<PromptDemo prompt="What are the odds BTC closes above $70k this Friday?" tool="get_odds">
  <OddsCurveCard status="open" odds={mockOdds} />
</PromptDemo>
```

Fixtures (`src/fixtures/mocks.ts`) are ported **verbatim from the gallery** at `apps/web/src/app/dev/widgets/page.tsx` lines 34–73 (`mockOdds, mockMarket, mockMarkets, mockQuote, mockRange, mockVault, mockPortfolio, mockPosition, mockBets`). Keep them typed against `@web/lib/bff/types`.

### 4.3 The "Run live" seam (built, not shipped)

`runnable` defaults `false`. When false, no toggle renders. The prop reserves the surface for a future live mode that would swap `{children}`'s mock props for real reads via `@deepbookie/predict-client` indexer/`devInspect` (e.g. `getActiveOracles` → `get_odds` curve). **v1 ships `runnable={false}` everywhere** (indexer perf + no-wallet rule — §10). No live network code is written in v1 beyond the inert prop.

### 4.4 Registration

In `src/components/mdx.tsx`, merge into `getMDXComponents` and set globally via `source.config.ts` `mdxOptions.providerImportSource: '@/components/mdx'`:

```tsx
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { PromptDemo } from '@/components/prompt-demo';

export function getMDXComponents(c) {
  return { ...defaultMdxComponents, ...TabsComponents, Step, Steps, PromptDemo, ...c };
}
export const useMDXComponents = getMDXComponents;
```

### 4.5 v1 demo set (component → triggering prompt)

All from the verified safe-to-embed list; all static-prop:

| # | Component | Triggering prompt | Maps to tool |
|---|---|---|---|
| 1 | `OddsCurveCard` | "What are the odds BTC closes above $70k Friday?" | `get_odds` |
| 2 | `SignReceipt` (×6 states) | "Bet $50 that BTC is above $70k" → proposed→signing→signed | `mint` |
| 3 | `QuotePreview` | "How much to buy $100 of BTC-up at $68k?" | `get_quote` |
| 4 | `RangePayoff` | "Price a band bet: BTC between $66k and $70k" | `get_range_quote` |
| 5 | `MarketHeader` | "Show me the BTC market" | `get_market` |
| 6 | `MarketTable` / `MarketsBoard` | "List the active markets" | `list_markets` |
| 7 | `VaultCard` / `VaultPoolCard` | "How's the liquidity vault doing?" | `get_vault` |
| 8 | `PortfolioRollup` | "What's my portfolio worth?" | `get_portfolio` |
| 9 | `PositionCard` / `PositionsTableStatic` | "Show my open positions" | `get_positions` |
| 10 | `ActivityTape` / `TradeTape` | "What are people betting on right now?" | `get_recent_bets` |
| 11 | `CategoryCarousel` | (empty-state chat home — the welcome carousel) | n/a |

`SignReceipt` is the marquee: render all six states (`loading, proposed, signing, signed, failed, cancelled`) in a `<Steps>` or tab strip to narrate the "you sign every write" contract.

---

## 5. Content / IA

Adopt brief §7, adjusted for **all 44 tools** and **Spot as a trading surface**. 🎬 = page embeds `<PromptDemo>` showcases. Sidebar order via per-folder `meta.json`.

```
Docs home (app/(home)/page.tsx — NOT in tree)
  └─ card grid (6 cards) + product-verb CTA "Start trading by talking →" → /docs/quickstart/web

Getting Started
  Introduction                 index.mdx          🎬 (hero PromptDemo: OddsCurveCard)
  What is DeepBook Predict
  Why DeepBookie (gen-UI thesis) 🎬 (SignReceipt marquee)
  Quickstart: Web (talk to it) 🎬
  Quickstart: MCP
  Quickstart: CLI

Concepts
  Architecture (unsigned-tx-at-edge)
  Surfaces: Predict vs Spot
  Pricing: SVI → N(d2)         🎬 (OddsCurveCard + buildCurve walkthrough)
  Scaling & units (×1e9, 6dp)
  Managers & balance managers
  The "you sign every write" contract

Trading Surfaces
  Predict (expiry binary + range) 🎬
  Spot (DeepBook V3 CLOB)      🎬 (trading surface, NOT read-only)

Guides & Cookbooks
  Place your first bet          🎬
  Provide liquidity (vault)     🎬
  Spot: swap & limit orders     🎬
  Spot: stake DEEP & governance
  Read live odds with predict-client

Tool Reference (44)            🎬 catalog page
  Overview (auto catalog)
  Predict — Markets & odds
  Predict — Trading
  Predict — Account
  Predict — Vault & liquidity
  Spot — Pools & prices
  Spot — Trading
  Spot — Account
  Spot — Governance & rewards

predict-client API
  Overview & quickstart
  ptb (builders)
  indexer (readers)
  quotes (devInspect)
  math (SVI→N(d2))
  units / constants / types

Reference
  Testnet facts & addresses
  llms.txt  (route, linked here)
  Changelog
```

**Docs-home card grid** (Mem0-style): 6 cards — Quickstart, Concepts, Trading Surfaces, Tool Reference (44), predict-client API, Guides. Each: brand `Card`, mono kicker, title, one-line blurb, arrow. **Product-verb CTA** below the grid: a single primary button "Start trading by talking →". **llms.txt** linked in footer + Reference.

---

## 6. Tool Reference Plan (the 44)

**Generate from the live registry — never hand-list.** Port the principle from `apps/web/src/app/(app)/docs/page.tsx`: import `allTools` from `@deepbookie/core` so the catalog can never drift (CLAUDE.md/MEMORY still say 27/35 — **stale; use 44**).

**Mechanism:** a React **server component** `src/components/tool-reference/ToolCatalog.tsx` registered in `mdx.tsx` and dropped into the Overview MDX as `<ToolCatalog />` (and per-family `<ToolCatalog family="spot-trading" />`). MDX can't introspect Zod cleanly, so the server component does it:
- iterate `allTools` (order: predict-reads → predict-writes → spot-reads → spot-writes);
- group by curated **families** (extend the web page's 4 Predict categories with 4 Spot families so nothing lands in "Other"):
  - Predict: *Markets & odds* (`list_markets,get_market,get_odds,get_quote,get_range_quote,get_recent_bets`), *Trading* (`mint,redeem,mint_range,redeem_range`), *Account* (`create_manager,get_portfolio,get_positions`), *Vault & liquidity* (`get_vault,get_vault_history,supply,withdraw`);
  - Spot: *Pools & prices* (`spot_list_pools,spot_mid_price,spot_orderbook,spot_swap_quote,spot_pool_params`), *Trading* (swaps + `spot_place_limit_order,spot_place_market_order,spot_cancel_order,spot_cancel_all_orders,spot_modify_order,spot_withdraw_settled_amounts` + the two `spot_can_place_*` pre-flights), *Account* (`spot_create_balance_manager,spot_deposit,spot_withdraw,spot_balance,spot_account,spot_open_orders`), *Governance & rewards* (`spot_stake,spot_unstake,spot_submit_proposal,spot_vote,spot_claim_rebates`);
- read `inputSchema.shape` to print the input-fields column (richer than the web page).

**Per-tool page/row template:**
```
<name (mono)>  <badge: "read" | "you sign">  <surface: predict|spot>
description (one-line, from ToolDef.description)
Inputs: field · type · required? · range (from inputSchema.shape)
Returns / Builds: read → JSON shape · write → "unsigned Sui Transaction (sign at edge)"
Edge notes: MANAGER_SCOPED / WALLET_SCOPED / keeper-only where applicable
```

**Surfaces framing (port verbatim):** reads → neutral `read` pill; writes → green `you sign` pill. Document the contract: reads run server-side + stream widgets; **writes have no `execute`** — forwarded to the edge, built unsigned, wallet-signed. Note `redeem_permissionless` is **keeper-only** (excluded from the web agent; the agent exposes 43/44). Note the vestigial `margin` surface (declared, unused). Spot is framed throughout as a **trading surface** (place/cancel/modify orders, swaps, stake, governance), not read-only context.

---

## 7. predict-client API Reference Plan

One module page per barrel export (from verify-predict-client). Each page: purpose, signature table, a runnable-looking code block, and a note on browser-safety / scaling.

| Page | Covers | Highlight |
|---|---|---|
| Overview & quickstart | barrel order `constants,types,units,math,indexer,quotes,ptb`; `Num = bigint\|number` | the §8 quickstart snippet verbatim (real export names) |
| `ptb` | `buildCreateManager/Mint/Redeem/RedeemPermissionless/MintRange/RedeemRange/Supply/Withdraw`, `Funding/BinaryParams/RangeParams` | each returns unsigned `Transaction`; `funding` splits+deposits; range builders throw `RangeError` if `lower>=higher` |
| `indexer` | 10 REST readers (`getOracles…getRecentMints`) | browser-safe `fetch`; throws on non-2xx |
| `quotes` | `getTradeAmounts`, `getRangeTradeAmounts`, `TradeAmounts` | devInspect, needs `SuiJsonRpcClient`, no key |
| `math` | `normalCdf,upProbability,downProbability,buildCurve,CurveOptions` | the full SVI→N(d2) formula (powers Pricing concept page) |
| `units` | `fromScaled/toScaled/fromDusdc/toDusdc` | ×1e9 + 6dp; throws on negative/non-finite |
| `constants` / `types` | addresses, `TARGET`, all interfaces | cross-link to "Testnet facts" |

Math demos may import `@deepbookie/predict-client` directly into a static `<PromptDemo runnable={false}>` feeding `buildCurve` output into `OddsCurveCard` — pure, no I/O.

---

## 8. Deployment

Separate **Vercel project** (independent of apps/web), monorepo subdir:

- **Root Directory** = `apps/docs` (Settings → General). Vercel auto-detects Next.js + pnpm.
- **"Include files outside the Root Directory"** = ON (default) so `packages/*` + `apps/web/src` resolve.
- **Install Command:** default (Vercel installs the whole workspace from root `pnpm-lock.yaml`). Pin `packageManager: pnpm@10.33.0` (already in root) so Vercel uses the right pnpm.
- **Build Command:** `fumadocs-mdx && next build` (or rely on `postinstall: fumadocs-mdx` — but make it explicit in build to guarantee `.source` exists). Output `.next`.
- **Domain / CNAME for `docs.deepbookie.xyz`:** in Vercel Project → Settings → Domains, add `docs.deepbookie.xyz`; at the `deepbookie.xyz` DNS provider add a `CNAME docs → cname.vercel-dns.com`; verify + let Vercel issue TLS. Confirm SINGULAR spelling end-to-end (§10).
- **Skip unaffected builds:** set **Ignored Build Step** to a git-diff guard, e.g. `git diff --quiet HEAD^ HEAD -- apps/docs packages/ apps/web/src` (exit 0 = skip). This stops docs rebuilding on unrelated web/CLI commits while still rebuilding when a consumed dependency changes.

---

## 9. Phased Build Plan

Each milestone ships a verifiable slice and is **manually browser-checked** (project rule), with Playwright/Chrome DevTools where useful. Keep every file **≤300 lines** (eslint `max-lines` CI gate); split large MDX/components.

| Phase | Ships | Verify (manual browser check) |
|---|---|---|
| **P0 — Scaffold + brand + deploy skeleton** | `apps/docs` package; Fumadocs v16 manual setup (next.config/source.config/source.ts/layout.shared/mdx.tsx/global.css); brand `@theme` + `--color-fd-*` map; fonts; `theme.enabled:false`; one placeholder MDX; Vercel project + `docs.deepbookie.xyz` CNAME | `pnpm --filter @deepbookie/docs dev` → page is canvas-bg, Schibsted/Plex fonts, NO dark toggle; deploy preview loads at the domain |
| **P1 — Docs-home + intro + architecture** | `(home)/page.tsx` card grid + product-verb CTA; Introduction, What is DeepBook Predict, Architecture, Surfaces, scaling/units, contract concept pages; sidebar `meta.json` | Browser: card grid + CTA route correctly; sidebar tree matches §5; search box appears |
| **P2 — `<PromptDemo>` + showcase set** | `prompt-demo.tsx` (+`runnable` seam, default false); `fixtures/mocks.ts` ported from gallery; `wrappers/PositionsTableStatic` + `wrappers/CategoryCarousel`; all 11 demos (§4.5) embedded in their pages | Browser: every demo renders **styled** with mock data, no console errors, NO wallet/dapp-kit in the bundle (grep build output for `@mysten/dapp-kit`); SignReceipt shows all 6 states |
| **P3 — Quickstarts + concepts** | Web/MCP/CLI quickstarts; Pricing SVI→N(d2) page with `buildCurve`→`OddsCurveCard` demo; Managers & balance managers | Browser: quickstart copy-paste blocks; pricing demo curve renders |
| **P4 — Tool reference (44) + predict-client API** | `ToolCatalog` server comp (reads `allTools`); Overview + 8 family pages; per-tool template; 7 predict-client module pages | Browser: catalog shows **44** tools across 8 families, none in "Other"; read/you-sign pills correct; Spot framed as trading; API signatures match verify-predict-client |
| **P5 — Guides + cookbooks + surfaces** | First bet, provide liquidity, spot swap/limit, spot stake/governance, read-odds-with-client; Predict + Spot surface pages with embedded demos | Browser: each guide's Steps + demo render; Spot surface page documents place/cancel/modify/swap/stake/vote |
| **P6 — Reference + llms.txt + OG + polish** | `api/search/route.ts` (Orama) + `llms.txt/route.ts`; Testnet facts/addresses; Changelog; OG/banner (singular) wired into metadata; reduced-motion + a11y pass; final lint/typecheck | Browser: `/llms.txt` returns page index; search returns results; OG preview shows singular branding; `pnpm lint && pnpm typecheck` green; per-page screenshots |

Review cadence (CLAUDE.md): run `pr-review-toolkit` per phase over the diff; every 2 phases a review workflow then a PR via `gh`; merge to `main` only on green CI.

---

## 10. Risks & Open Items

1. **Fumadocs v16 version churn / Next 16 gate.** Fumadocs v16 *requires* Next 16 + React 19.2; apps/web is on Next 15. Mitigated by apps/docs running its **own** Next 16 (independent Vercel project) — no forced web upgrade. Watch the moved APIs: `createMDX` from `fumadocs-mdx/next`, `source.getPage/generateParams`, `page.data.body/toc`, `fumadocs-ui/layouts/docs(/page)`, `BaseLayoutProps`, `docs.toFumadocsSource()`. If `preset.css` v16 tokens look wrong against the brand, swap to `preset-legacy.css`.
2. **Importing client components from apps/web.** No barrel + `@/*` alias means deep imports via a `@web/*` path alias + `transpilePackages: ['@deepbookie/web']`. Risk: a future web refactor breaks a deep path. Accept for v1 (pragmatic decision #3); the `packages/ui` extraction is the eventual fix. Hard rule: **never import the 4 wallet controllers** (`ReceiptController, RedeemButton, VaultManage, MessagePart`) — they pull `@mysten/dapp-kit`/`useTxAction` into the docs bundle. Verify post-build by grepping the bundle for `dapp-kit`.
3. **Font loading.** Use `next/font/google` (self-hosted, no FOUT), exact weights/variables from apps/web. Risk: forgetting `.variable` on `<html>` → widgets fall back to system font. Verify visually in P0.
4. **Indexer perf → why static-prop.** The Predict indexer `/oracles` is ~2.2MB / ~15s uncached with cold-start spikes; embedding live reads would make docs slow and flaky. This is the core reason **all v1 demos are static-prop** (`runnable={false}`). The seam exists but stays inert.
5. **deepbookie / deepbookies domain reconciliation.** Canonical = **`docs.deepbookie.xyz`** (singular, decision #2). Audit repo + DNS + Vercel + OG/banner assets for any "deepbookies" plural; fix before P6 ships. Single source of truth for the string lives in apps/docs metadata + `layout.shared.tsx` nav.
6. **`max-lines` 300 CI rule.** Applies to docs `.ts/.tsx` too. Keep `ToolCatalog`, `prompt-demo`, and `mdx.tsx` lean; split fixtures and family-grouping into separate modules if they approach the limit. MDX content files are prose and not subject to the rule, but split very long reference pages for readability.
7. **Doc-drift on tool count.** CLAUDE.md ("27 tools") and MEMORY ("35 tools total") are **stale**. The reference must say **44** (generated from `allTools` so it self-corrects). Flag a follow-up to update CLAUDE.md/MEMORY.

---

*End of plan. Verified-report facts override the brief wherever they conflict.*
