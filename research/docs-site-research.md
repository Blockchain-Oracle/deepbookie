# DeepBookie Docs Site — Research Brief (`docs.deepbookies.xyz`)

Synthesis of 8 parallel research reports covering (a) Mem0's docs as inspiration and (b) the DeepBookie codebase/design/tooling, to design a new branded documentation site.

---

## 1. Executive Summary

We are building **`docs.deepbookies.xyz`** — a premium, on-brand documentation site for DeepBookie, the first usable interface for **DeepBook Predict** (Sui testnet, expiry-based prediction market). The recommended shape: a **Fumadocs (Next.js App Router) site as a new `apps/docs` workspace package**, deployed as its **own Vercel project** with Root Directory `apps/docs`, mapped to the subdomain via CNAME. Fumadocs is the only framework that satisfies all three hard constraints at once — exact brand control (Tailwind + CSS-var tokens, theme toggle disabled), live embedding of our **real React widgets** ("prompt → component" demos), and a clean pnpm-monorepo/Vercel fit. The IA borrows Mem0's best patterns: a landing-page-style docs home that **forks by intent** (card grid, not a sidebar dump), a product-verb primary CTA, intent-sorted cookbooks, and an interactive "Try it" console — adapted to our unsigned-PTB tool surface. The headline differentiator vs. Mem0: our docs embed the **actual generative-UI components** (odds curve, sign receipt) live, captioned with the chat prompt that triggers them, proving the genUI thesis inside the docs themselves.

---

## 2. Inspiration: Mem0 Docs

Mem0 runs on **Mintlify** (`theme: aspen`); the nav config (`docs.mem0.ai`, `docs.json`, `llms.txt`) is the authoritative source.

### 2.1 IA tree (top-level tabs → groups)

A single "Documentation" anchor with **10 top-level TABS**:

- **Welcome** — `introduction`
- **Mem0 Platform** (managed, headline) — Getting Started (`platform/overview`, `agent-signup`, `vibecoding`, `mem0-mcp`, `cli`, `platform-vs-oss`, `quickstart`) · Core Concepts (`memory-types`, `memory-operations/{add,search,update,delete}`, `memory-evaluation`) · Platform Features (Essential / Advanced / Data Management / Integration sub-groups) · Support · Migration · Contribute
- **OpenClaw** — a dedicated tab for ONE agent-harness family (`integrations/{openclaw,hermes,pi-agent}`)
- **Open Source** (self-host) — own Getting Started, Self-Hosting Features, Configuration (LLMs / Vector DBs / Embedders / Rerankers, each = overview + config + a long "Supported X" leaf list), Migration, Community
- **Cookbooks** — Getting Started + 5 themed groups (Essentials, Companion Playbooks, Ops & Automations, Integrations & Platforms, Frameworks & Multimodal)
- **Integrations** — Agent Frameworks / Voice & Real-time / Cloud / Developer Tools
- **Agent Plugins** — Coding Agents (claude-code, cursor, codex, opencode, antigravity) + Agent Harness (deliberately duplicated from OpenClaw)
- **API Reference** — one-endpoint-per-page, foldered by resource (memory, events, entities, organizations, projects, webhooks)
- **Release Notes** — four parallel changelogs (highlights / sdk / platform / openclaw)

### 2.2 Page taxonomy

Overview/concept · Quickstart (linear numbered Steps, multi-language CodeGroup, "under 5 minutes") · How-to/feature guide (one capability/page) · API reference (one-endpoint/page) · Integration page (bucketed by tool type) · Cookbook (outcome-named end-to-end app) · CLI/tooling · Components/config reference (provider matrix) · Migration guide · Changelog · Contributing.

**OSS vs Platform split:** two separate top-level tabs, each with its own full sub-tree (not interleaved), mirrored-but-distinct pages, plus a dedicated decision page (`platform-vs-oss`) using expandable accordions + side-by-side tables across ~6 axes and explicit "Choose Platform if… / Choose Open Source if…" guidance. Heavy provider config lives only under OSS. A bridge page `migration/oss-to-platform` connects them.

**Multi-language:** in-page `<CodeGroup>` tabs (Python / JS / cURL / CLI) inside the same page — NOT parallel SDK trees. No global "language" tab. One exception: OSS quickstart splits Python and Node into separate pages.

### 2.3 Landing / entry experience (`introduction`)

The docs home is a **mini-landing page, not a sidebar dump**:
- **Hero:** H1 "Build with Mem0," subhead "Universal, self-improving memory layer for LLM applications," product one-liner restated below.
- **Primary CTA = the product's core verb:** "Write your first memory" → quickstart (not "Read the docs" / "Get started"). The CTA *is* the product demo.
- **Six-card "choose your path" grid** forking by intent: Mem0 Platform · Mem0 Open Source · Cookbooks · Integrations · API Reference · **"Sign up as an agent"** ("mint an API key in under five seconds — no email, no dashboard" — AI agents as a first-class audience).
- Top note points to `llms.txt` (machine-readable site map).

**Value framing layering:** docs home keeps a tight one-liner; the *product landing* (`mem0.ai`) carries the loud marketing ("Memory Compression Engine," "proof, not promises," SOC 2/HIPAA, "90,000+ Developers," benchmarks "LoCoMo: 91.6 up from 71.4," ~59k GitHub stars). Docs stay calm; landing is loud. Social proof is kept one click away (README/landing), not inline in docs.

### 2.4 Visual / component vocabulary (Mintlify)

| Component | Where / job |
|---|---|
| **Card / CardGroup** | The spine. Overview + the entire `/examples` cookbook index (28 cards, 6 themed groups). Each card = icon + title + one-line description. |
| **Steps** | Numbered onboarding rail (Install → Set API key → Add memory → Search). |
| **CodeGroup** | Language tabs (Python/JS/cURL/CLI); API pages use a `cURL ⇕` dropdown. |
| **Callouts** | Note / Info / Tip / Warning (Warning carries PII/safety guardrails; Tip upsells). |
| **Accordion** | Progressive disclosure of comparison tables. |
| **Mermaid diagram** | The one high-value visual (memory-hierarchy flowchart). |
| **Tables** | Dense comparison matrices. |
| **API Playground ("Try it")** | The headline interactive: method badge + endpoint + Try it ▶ + request → tabbed 200/400 response. |
| **ParamField / ResponseField** | Structured param + response-schema rows. |
| **Icons (Lucide)** | Per-card + colored HTTP-verb badges in the API sidebar. |
| **AI "Ask" affordances** | "Ask Assistant," inline "Ask a question," per-snippet ✨, "Copy page as markdown / open in ChatGPT." |

**Nav chrome (verified live):** top bar (logo · centered Search `⌘K` · Ask Assistant · Dashboard CTA · dark-mode toggle) · top-level product-switcher tabs (active = underline) · grouped left sidebar with icons + colored verb badges · right "On this page" TOC · eyebrow-label breadcrumb.

**Imagery philosophy:** deliberately text-and-diagram-first, NOT screenshot-heavy. The add-memories API page had only 2 images (light/dark logo); most pages carry zero. Diagrams (Mermaid) earn their place; decorative screenshots do not. Light/dark image variants exist for anything they do add.

### 2.5 STEAL / DON'T-COPY list

**STEAL:**
1. **Card-grid home that forks by intent, not feature** — hero + one CTA + ~6 cards mapping to real audience paths (Try the web app / MCP+CLI / predict-client npm / Tools reference / Cookbooks).
2. **A dedicated "X vs Y" decision page** with side-by-side table + "Choose X if…" — resolves our analogous fork (browser wallet-signing vs MCP/CLI local-key) in one page.
3. **In-page `<CodeGroup>` language tabs** (TS/CLI/cURL) instead of parallel SDK trees — single-source nav, half the page count.
4. **A `llms.txt` machine map** advertised on the home page — cheap, makes docs agent-consumable (on-brand for an AI-agent product).
5. **Outcome-named cookbooks separated from feature reference** ("Trade BTC up-market in 3 steps" recipe vs per-tool reference).
6. **One-endpoint/tool-per-page reference foldered by resource** — scales cleanly for our 44-tool registry.
7. **Product-verb primary CTA** — "Place your first prediction" / "Build your first unsigned trade," not "Get started."
8. **The interactive "Try it" console** — our single most distinctive analog (see §4).

**DON'T COPY (over-built for our scale):**
1. A whole top-level tab for a single integration (OpenClaw) + duplicating its pages into Agent Plugins — 10 tabs is justified only by Mem0's huge partner roster.
2. The exhaustive provider matrix (~60 leaf pages: 17 LLMs × 25 vector DBs × ~10 embedders × rerankers) — our stack is pinned. A short "Stack" page suffices.
3. Four parallel changelogs — a single `changelog` page is right until volume forces a split.

---

## 3. DeepBookie Reality

DeepBookie is an AI agent for trading **DeepBook Predict**. Defining idea: **one tool registry, authored once, flows to four surfaces** (MCP, CLI, Claude skill, generative-UI web app), and **every write tool builds an UNSIGNED Sui transaction — signing happens at the edge** (local key for MCP/CLI, browser wallet for web). The agent never holds a key.

### 3.1 Monorepo architecture

pnpm workspace (`pnpm@10.33.0`, Node ≥20, ESM). Each package: `tsup` build, `tsc` typecheck, `vitest` test.

| Package | Purpose | Key deps |
|---|---|---|
| **`@deepbookie/predict-client`** (`packages/predict-client`) | The first DeepBook Predict TS client — the durable npm artifact. Unsigned-PTB builders + indexer/devInspect readers + SVI→N(d2) math. | **ONLY `@mysten/sui@^2.19`** (browser-safe) |
| **`@deepbookie/core`** (`packages/core`) | Neutral transport-free tool registry. `ToolDef`, `allTools` tagged `surface`/`kind`, adapter view, `ToolContext`. Errors handled in adapters, not here. | predict-client, `@mysten/deepbook-v3@^1.5.1`, `@mysten/sui`, `zod@^4` |
| **`@deepbookie/node`** (`packages/node`) | Node runtime for local surfaces (MCP+CLI): Pino logger + auto-provisioned local-key signer. | `@mysten/sui`, `pino@^9.5` |
| **`@deepbookie/mcp`** (`packages/mcp`) | stdio MCP adapter. `bin: deepbookie-mcp`. Logs to **stderr**. | core, node, predict-client, `@modelcontextprotocol/sdk@^1.29` |
| **`@deepbookie/cli`** (`packages/cli`) | Commander CLI. `bin: deepbookie` (`wallet`/`tools`/`call`). | core, node, predict-client, `commander@^14` |
| **`apps/web`** (Next.js) | Headline generative-UI chat-to-sign dapp. Imports registry **in-process**. | core, predict-client, `ai@6` + `@ai-sdk/react@3`, legacy `@mysten/dapp-kit@^1.1.1` |
| **`skills/deepbookie`** | Agent skill (`SKILL.md`) playbook. | — |

### 3.2 The "ONE registry → 4 surfaces" + "sign at the edge" model

A single `ToolDef` (discriminated union) flows to all surfaces:
- **`ReadTool`** — `kind:'read'`, has `read(args, ctx)` (server-side: indexer / devInspect; no wallet, no signing).
- **`WriteTool`** — `kind:'write'`, has `build(args, ctx) => Promise<Transaction>` — builds an **UNSIGNED** tx, deliberately **no `execute`**.

Each tool carries `name`, `description`, a Zod `inputSchema`, `surface` (`predict`/`spot`/`margin`), `kind`. Adapters consume one neutral view via `getToolsForAdapter` (`list`/`schema`/`read`/`build`). Each surface injects a `ToolContext` (SuiJsonRpcClient, network, sender, managerId, balanceManagerId); `createContext` is testnet-locked.

| Surface | Builds tx | Signs | How |
|---|---|---|---|
| MCP | core `build()` (server) | **local key** | `@deepbookie/node` `signAndExecute` (auto-provisioned Ed25519) |
| CLI | core `build()` (server) | **local key** | same local keypair |
| Web | core `build()` (browser, `useSubmitTx`) | **user's browser wallet** | dapp-kit `useSignAndExecuteTransaction` (no `execute` on the AI tool → client signs) |

Invariant: **core always returns an unsigned `Transaction`; the signing decision is pushed entirely to the edge.** Local signer (`packages/node/src/keystore.ts`): resolution order is `DEEPBOOKIE_PRIVATE_KEY` env → `~/.deepbookie/config.json` (`0o600`) → auto-generate+persist+warn; plaintext-at-rest (local-MCP norm; encryption is a noted future upgrade).

**Two agent-footgun guards:** (1) `resolveMarket(oracleId)` grid-aligns a human dollar strike to the nearest valid on-chain strike (×1e9) and supplies the fixed expiry, so the model never passes raw expiry / pre-scaled strike. (2) `managerId` for manager-scoped tools is forced from the wallet-resolved id, never the model's (the "LLM fills managerId with 'AUTO'/'unknown'" bug) — stripped from input before build in `useSubmitTx`, overridden in `buildAiTools`.

### 3.3 `@deepbookie/predict-client`

Thin, signing-agnostic, single-dependency. Six modules behind one barrel:
- **`ptb.ts`** (unsigned builders): `buildCreateManager`, `buildMint`/`buildRedeem`/`buildRedeemPermissionless`, `buildMintRange`/`buildRedeemRange`, `buildSupply`/`buildWithdraw`. `funding` option `splitCoins` a dUSDC coin + `predict_manager::deposit` in the same PTB.
- **`indexer.ts`** (REST): `getOracles`, `getActiveOracles`, `getOracleState`, `getLatestSvi`, `getVaultSummary`, `getVaultPerformance`, `getManagerSummary`, `getManagerPnl`, `getManagerPositions`, `getRecentMints` (the live tape; exposes `trader` + `manager_id`).
- **`quotes.ts`** (devInspect, no gas/signing): `getTradeAmounts`, `getRangeTradeAmounts` (decode `mintCost`, `redeemPayout`).
- **`math.ts`** (the novel layer): `normalCdf` (Abramowitz–Stegun), `upProbability(svi, forwardScaled, strikeScaled)` (mirrors on-chain SVI→N(d2): `k=ln(strike/forward)`, total variance `w(k)=a+b·(ρ(k−m)+√((k−m)²+σ²))`, `d2=−((k+w/2)/√w)`, returns `N(d2)`), `downProbability=1−upProbability`, `buildCurve` (the probability smile data).
- **`units.ts`**: `fromScaled`/`toScaled` (×1e9), `fromDusdc`/`toDusdc` (6dp).
- **`types.ts`**: Direction, OracleRow, OracleState, SviParams, CurvePoint, VaultSummary, ManagerPnl, PositionEntry, etc.

### 3.4 FULL tool catalog — 44 tools (20 read / 24 write)

> **Scope reconciliation:** CLAUDE.md/MEMORY say "27 tools" (predict-deep + thin spot bridge) and a `margin` surface — these are *aspirational scope* labels. The **built registry is 44 tools (predict + spot), no margin tools shipped.** The content-surface report's "27 tools, spot read-only" reflects the *locked product narrative*; the our-packages report reflects the *actual code*. **For the docs, document what ships: the 44-tool registry below, with spot framed per the product owner's call (see §8).**

**Predict reads — 10** (`tools/reads.ts`, surface `predict`): `list_markets`, `get_market`, `get_odds`, `get_quote`, `get_range_quote`, `get_vault`, `get_vault_history`, `get_portfolio`, `get_positions`, `get_recent_bets`.

**Predict writes — 8** (`tools/writes.ts`, surface `predict`): `create_manager`, `mint`, `redeem`, `redeem_permissionless` (keeper; excluded from the web agent), `mint_range`, `redeem_range`, `supply`, `withdraw`.

**Spot reads — 10** (`tools/spot-reads.ts`, surface `spot`, via `@mysten/deepbook-v3`): `spot_list_pools`, `spot_mid_price`, `spot_orderbook`, `spot_swap_quote`, `spot_pool_params`, `spot_balance`, `spot_account`, `spot_open_orders`, `spot_can_place_limit_order`, `spot_can_place_market_order`.

**Spot writes — 16** (`tools/spot-writes.ts`, surface `spot`): `spot_create_balance_manager`, `spot_deposit`, `spot_withdraw`, `spot_swap_base_for_quote`, `spot_swap_quote_for_base`, `spot_place_limit_order`, `spot_place_market_order`, `spot_modify_order`, `spot_cancel_order`, `spot_cancel_all_orders`, `spot_withdraw_settled_amounts`, `spot_stake`, `spot_unstake`, `spot_submit_proposal`, `spot_vote`, `spot_claim_rebates`.

**Counts:** Predict 18 (10/8) + Spot 26 (10/16) = **44 total — 20 read / 24 write.**

### 3.5 Predict testnet reference (`predict-client/src/constants.ts`)

| Constant | Value |
|---|---|
| `NETWORK` | `testnet` (testnet-locked) |
| `PREDICT_PACKAGE` | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| `PREDICT_OBJECT` | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| `PREDICT_REGISTRY` | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| `DUSDC_TYPE` | `0xe95040…::dusdc::DUSDC` (6dp; operator-gated — acquire via tally form, fund by splitting a real coin, NOT `0x2::coin::mint`) |
| `PLP_TYPE` | `${PREDICT_PACKAGE}::plp::PLP` |
| `CLOCK_OBJECT` | `0x6` |
| `INDEXER_URL` | `https://predict-server.testnet.mystenlabs.com` |
| `FLOAT_SCALING` | `1_000_000_000` (×1e9 — prices/strikes/probabilities) |
| `DUSDC_DECIMALS` | `6` |
| `ORACLE_STATUS` | `inactive` / `active` / `pending_settlement` / `settled` |

Proven mint path (testnet digest `APMjNXwN…z2hF`): `create_manager → split dUSDC → predict_manager::deposit → market_key::up → predict::mint<DUSDC>`. Reference: `scripts/derisk-predict-mint.ts`. Spot constants (`core/src/spot/constants.ts`): testnet-only, BalanceManager under key `MAIN`, coins/pools from official SDK `testnetCoins`/`testnetPools`.

**Indexer perf profile (from MEMORY):** `/oracles` is 2.2MB / ~15s uncached (must server-cache markets); ~7s freshness lag; CORS `*`; cold-start spikes; PredictManager is SHARED (resolve via `/managers?owner=`). **Implication for docs:** any live-read demo must be lazy ("Run live" button), never eager on page load.

### 3.6 Commands

`pnpm install` · `pnpm build` · `pnpm lint` (`max-lines` fails CI at 300) · `pnpm typecheck` · `pnpm test` · `pnpm derisk` (testnet mint demo) · `pnpm derisk:spot` · `pnpm smoke` (exercises every tool). MCP bin `deepbookie-mcp` (stdio, logs stderr). CLI bin `deepbookie` (`tools`/`wallet`/`call <tool> '<json>'`).

---

## 4. Web App & Component-Showcase Opportunity

The web app (`apps/web`) is the headline surface: a generative-UI chat where the agent proposes trades and the user signs every write in their browser wallet. It shares `@deepbookie/core` with MCP/CLI; the only difference is the signing edge.

### 4.1 Structure & stack

App Router with a single `(app)` route group wrapping all wallet-gated pages; the landing (`/`) sits **outside** the group (SSR, provider-free). Routes: `/` (landing placeholder), `/chat` (headline genUI), `/markets` + `/markets/[id]`, `/positions`, `/vault`, `/history`, `/docs` (**the auto-generated tool catalog we're superseding**), `/dev/widgets` (**dev-only widget gallery — the showcase seed**).

Stack (confirmed `package.json`): Next.js `^15.3.9` · React `^19.2.7` · `ai@^6.0.208` + `@ai-sdk/react@^3.0.210` (default model `claude-sonnet-4-6`) · legacy `@mysten/dapp-kit@^1.1.1` + `@mysten/sui@^2.19` + `@tanstack/react-query@^5` · **Tailwind v4 CSS-first (no `tailwind.config.*`)**, theme in `globals.css` via `@theme {…}` · fonts via `next/font/google` (Schibsted Grotesk + IBM Plex Mono) · `drizzle-orm` + `pg` · `pino` · `react-markdown` + `remark-gfm` · `zod@^4`.

### 4.2 The propose → sign → receipt loop

Hinges on the read/write split in `src/lib/ai/tools.ts`: **read tools get an `execute`** (run server-side, stream as cards); **write tools have NO `execute`** → forwarded to the browser, which builds the unsigned tx, signs in the wallet, submits the result. This is what makes "the agent holds no key" literally true. Flow: write tool arrives as `tool-*` part → `MessagePart.tsx` routes it → `ReceiptController` derives a `ReceiptState` (`loading → proposed → signing → signed/failed/cancelled`), fetches a live `useQuote`, renders `<SignReceipt>` → user clicks **Authorize & sign** → `useSubmitTx` rebuilds with the same core `build()`, signs, waits for finality, busts caches → `addToolResult({digest})` resumes the agent. A decline = `{status:'cancelled'}` (void receipt, not error). An outcome ledger POSTs to `/api/chats/[id]/outcome` so a signed trade survives a tab close.

### 4.3 Live "prompt → component" showcase

The killer docs feature: embed the **real** chat widgets live, each captioned with the prompt that triggers it. `app/dev/widgets/page.tsx` is the proof-of-concept — every widget already renders from pure mock props (`mockOdds`, `mockQuote`, `mockReceipt`) with no wallet/network, so they drop straight into MDX.

| Component | Triggering prompt (tool) |
|---|---|
| **`SignReceipt`** (the hero — all 6 states: loading/proposed/signing/signed/cancelled/failed) | "Walk me through a $1 UP bet on BTC." (`mint`) |
| **`OddsCurveCard`** | "What are the live BTC odds right now?" (`get_odds`) |
| **`QuotePreview`** | "Quote a $1 UP bet on BTC at $63,000." (`get_quote`) |
| **`MarketTable`** | "Show me the live BTC markets." (`list_markets`) |
| **`MarketHeader`** | "Show the odds for the BTC market." (`get_market`) |
| **`RangePayoff`** | "Price a range bet between $62k and $64k." (`get_range_quote`) |
| **`PortfolioRollup`** | "What's my balance?" (`get_portfolio`) |
| **`PositionCard` / `PositionList`** | "Show my open positions." (`get_positions`) |
| **`ActivityTape`** | "What are people betting right now?" (`get_recent_bets`) |
| **`VaultCard`** | "How does the vault work?" (`get_vault`) |
| **"Open your account" CTA** | "What's my balance?" with no manager (error→CTA) |
| **Category carousel** | the empty chat home itself |

The strongest narrative: a **"How a trade works" walkthrough** showing the four-step loop using live components in each state — the `SignReceipt` state array (`['loading','proposed','signing','signed','failed','cancelled']`) is the storyboard.

**Implementation note:** docs demos must be **read-only or static-prop** — never render anything needing `useCurrentAccount`/`useSignAndExecuteTransaction`. Promote demo-able presentational components into a `packages/ui` workspace package so they import cleanly with no wallet coupling. Keep `apps/docs` deps to `@deepbookie/ui` + `@deepbookie/predict-client` (browser-safe); **never** import `@deepbookie/mcp`/`@deepbookie/cli` (server-only modules break the build).

---

## 5. Brand & Design System

Source of truth: `/Users/abu/Downloads/Design system exploration (5)/*.dc.html`, cross-checked against `apps/web/src/app/globals.css` (Tailwind v4 `@theme`). All hex verbatim.

### 5.1 Core palette

| Token | Hex | Usage |
|---|---|---|
| **Ink** | `#1A1714` | Primary text, primary buttons, dark surfaces, logo body |
| **Paper** | `#F4F2EC` | Surfaces / panels / inverted text on dark |
| **Canvas** | `#E4E2DC` | Page base background |
| **Card** | `#FFFFFF` | Raised cards / receipts / tables |
| **Signal green** | `#2C5E4A` | **UP / live / signed** — the single accent |
| **Mint** | `#7FCAA6` | Live-dot bright variant, logo dot on light, PnL-up |
| **Clay** | `#B0452B` | **DOWN / error / rejected** |
| **Wallet blue** | `#4DA2FF` | Sui Wallet identity only |
| **Void tan** | `#B0856B` | Dashed void-receipt top-rule ONLY (one-off, NOT a clay variant) |

> **Correction carried from the design report:** there is no `#B0856B` "clay-down." DOWN/error is always `#B0452B`. `#B0856B` is a one-off void-hairline tan.

### 5.2 Greys, lines, semantic tints

Text greys: ink-soft `#3C3933` · body `#615C53`/`#6F6A60` · sub `#7D7870` · muted `#8A857B` · faint `#9C978D` · faint-2 `#928D83` · disabled `#A8A298`. Lines: `#E6E1D8` (default border) · `#DED9CF` (panel/section) · `#EDE9E0`/`#F2EEE6` (inner/table dividers) · shimmer `#ECE8DF` · table-head `#FAF8F3` · inner off-white `#FAFAF7`. Tints: green-bg `#F4F7F4` / green-border `#DCEAE2` / green-card-border `#C9D8CF` · error-bg `#FBF1EC` / error-border `#E6C9BE` / error-text `#8A2F1C` · warn-text `#9C7A2A` / warn-bg `#FBF6EC` / warn-border `#ECDCBC` · dark-section line `#2C2823` / body `#CFC9BD` / eyebrow `#7D8A82`. Asset chips: ETH `#6E7BE0`, SUI `#19A1A6`, BTC = Ink.

### 5.3 Typography

Two families: **Schibsted Grotesk** (400–900; display/headings/UI/body) + **IBM Plex Mono** (400–600; figures/labels/IDs/digests/ticks, always `tabular-nums`).

| Role | Size | Weight | Tracking | Font |
|---|---|---|---|---|
| Display (hero) | 52–62px | 800 | -0.04 / -0.045em | Schibsted |
| H1 page | 30px | 700 | -0.03em | Schibsted |
| H2 section | 40–42px | 700 | -0.035em | Schibsted |
| Card title | 19–26px | 700 | -0.02 / -0.03em | Schibsted |
| Body | 14–15px | 400 | — (1.5–1.55 lh) | Schibsted |
| Big figures | 30–34px | 600 | -0.01em | IBM Plex Mono |
| Uppercase label (`.lbl`) | 10–10.5px | 600 | 0.13em UPPER | Schibsted/mono |
| Section eyebrow (`.sec`) | 11px | 500–600 | 0.1em UPPER | IBM Plex Mono `#928D83` |

Foundation legend: display = 800 / -0.04em · heading = 700 / -0.03em · body = 400 / 1.5 · numerals = tabular mono 600.

### 5.4 Spacing / radius / elevation / motion

- **Spacing (4px base):** 8 · 12 · 16 · 24 · 32 · 48. Section padding 84–96px.
- **Radius:** `--radius-card-in` 8px · `--radius-card` 14px · `--radius-phone` 42px · `--radius-pill` 999px.
- **Elevation (ink-tinted, soft lift, negative-spread):** hairline `1px solid #E6E1D8` (default) · raised `0 18px 40px -22px rgba(26,23,20,.3)` · float `0 28px 64px -26px rgba(26,23,20,.45)` · toast `0 12px 28px -14px rgba(26,23,20,.5)`.
- **Motion principles:** *deliberate* — cards reveal with 14px rise + fade, 0.5–0.55s, ease-out (`fade-up` keyframe, `cubic-bezier(.22,1,.36,1)`); *the camera* — view pushes in to curve/receipt; *the sign* — spinner → wax-stamp slams in with gentle overshoot (`cubic-bezier(.34,1.56,.64,1)`); *live data* — 1.8s pulse on the live dot. Honors `prefers-reduced-motion`.

### 5.5 Signature objects (reuse in docs)

- **The receipt** (~60% of interactions): white card, top-rule (3px) encoding state (Ink = proposed, Green = signed, dashed tan `#B0856B` = void), kicker `.lbl` "TRADE CONFIRMATION," direction pill (UP green / DOWN clay), title, hairline figure rows, bordered total, on-chain digest strip (`#FAFAF7` + "Suiscan ↗"), wax-seal stamp when signed.
- **The chat-bubble logo mark** ("Quote mark"): a speech bubble whose stroke line IS the odds curve. Green marker dot = the live odds (Mint `#7FCAA6` on light, Green `#2C5E4A` for app-icon/favicon/print). At ≤16px the curve drops; only the dot carries it.
- **The wax-seal "SIGNED" stamp:** circular ~56–72px, `1.4–1.5px solid #2C5E4A` ring, rotated -9deg, opacity ~0.9, green check + mono micro-caps "SIGNED"; enters with the overshoot beat — the trust climax.

### 5.6 Brand-asset & screenshot inventory

All under `/Users/abu/Downloads/Design system exploration (5)/`.

**Brand Logos/** (vector + raster): `app-icon.svg` + `app-icon-1024/512/256/128.png` · `favicon.svg` + `favicon-32/64.png` · `mark-primary.svg/.png` (default) · `mark-reverse` · `mark-green` · `mark-mono-ink` · `mark-mono-white` · `wordmark.svg/.png` · `wordmark-twotone` · `wordmark-reverse` · `lockup-stacked.svg/.png` (docs hero badge) · **`banner-link.png/.svg`** (1200×630 OG/share card — docs social/OG image) · **`banner-wide.png/.svg`** (1500×500 cover — docs page hero / GitHub social) · `film-16x9.gif` (480×270, 1.3MB) · `film-vertical.gif`.

**uploads/:** `deepbook_logo.svg` (SPONSOR DeepBook logo, blue `#1349EC` — use only for "built on DeepBook" attribution, NOT DeepBookie's mark) · `ssstwitter…mp4` (reference video, not a brand asset).

**screenshots/** (docs section figures): `01/02-landing.png`, `premium-landing.png` (heroes) · **`receipts.png`** (best receipt figure — proposed↔signed pair) · `01/02-foundation.png` (tokens/type) · `01-comp2.png`/`comp1.png` (component states) · `01-04-app2.png`/`app1.png`/`applogo.png` (chat) · `desktop.png`/`01-04-dpages.png` (Markets/Positions/Vault/History) · `01/02-brand.png`/`logo2.png`/`directions.png`/`frames.png` (logo system) · `01-onb.png`/`01-mobonb.png` (onboarding) · `01-demo-beat.png`/`01-demo-loop.png` (demo).

**Best docs picks:** hero → `banner-wide.svg` (dark) or `banner-link.svg` (light); OG/meta → `banner-link.png`; "the receipt" → `receipts.png`; tokens/type → `01-foundation.png`; logo → `lockup-stacked.svg`.

### 5.7 Ready-to-use `:root` token block

```css
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  color-scheme: light;

  /* ---- Core palette ---- */
  --db-ink:            #1A1714;  /* text, primary, dark surfaces */
  --db-paper:          #F4F2EC;  /* surfaces / inverted text */
  --db-canvas:         #E4E2DC;  /* page base */
  --db-card:           #FFFFFF;  /* raised cards / receipts */
  --db-green:          #2C5E4A;  /* UP · live · signed (sole accent) */
  --db-mint:           #7FCAA6;  /* live-dot / logo dot on light / PnL up */
  --db-clay:           #B0452B;  /* DOWN · error · rejected */
  --db-wallet:         #4DA2FF;  /* Sui Wallet identity only */
  --db-void:           #B0856B;  /* dashed void-receipt rule (one-off) */

  /* ---- Text greys ---- */
  --db-ink-soft:       #3C3933;
  --db-body:           #615C53;
  --db-body-2:         #6F6A60;
  --db-sub:            #7D7870;
  --db-muted:          #8A857B;
  --db-faint:          #9C978D;
  --db-faint-2:        #928D83;
  --db-disabled:       #A8A298;

  /* ---- Lines & fills ---- */
  --db-line:           #E6E1D8;  /* default card border */
  --db-line-strong:    #DED9CF;  /* panel / section divider */
  --db-divider:        #EDE9E0;  /* inner row divider */
  --db-divider-2:      #F2EEE6;  /* table row divider */
  --db-shimmer:        #ECE8DF;  /* skeleton fill */
  --db-table-head:     #FAF8F3;
  --db-inner-offwhite: #FAFAF7;

  /* ---- Semantic tints ---- */
  --db-green-bg:       #F4F7F4;  --db-green-border:  #DCEAE2;  --db-green-card-border:#C9D8CF;
  --db-error-bg:       #FBF1EC;  --db-error-border:  #E6C9BE;  --db-error-text:#8A2F1C;
  --db-warn-text:      #9C7A2A;  --db-warn-bg:       #FBF6EC;  --db-warn-border:#ECDCBC;
  --db-dark-line:      #2C2823;  --db-dark-body:     #CFC9BD;  --db-dark-eyebrow:#7D8A82;

  /* ---- Type ---- */
  --db-font-sans: 'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif;
  --db-font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --db-tracking-display: -0.04em;
  --db-tracking-heading: -0.03em;
  --db-tracking-tight:   -0.02em;
  --db-tracking-label:    0.13em;   /* uppercase .lbl */
  --db-tracking-eyebrow:  0.10em;   /* mono .sec */
  --db-leading-body: 1.55;

  /* ---- Radius ---- */
  --db-radius-in:    8px;
  --db-radius-card: 14px;
  --db-radius-phone:42px;
  --db-radius-pill: 999px;

  /* ---- Spacing (4px base) ---- */
  --db-space-1: 4px;  --db-space-2: 8px;  --db-space-3: 12px; --db-space-4: 16px;
  --db-space-6: 24px; --db-space-8: 32px; --db-space-12:48px;

  /* ---- Elevation (ink-tinted, soft lift) ---- */
  --db-shadow-raised: 0 18px 40px -22px rgb(26 23 20 / 0.30);
  --db-shadow-float:  0 28px 64px -26px rgb(26 23 20 / 0.45);
  --db-shadow-toast:  0 12px 28px -14px rgb(26 23 20 / 0.50);

  /* ---- Motion ---- */
  --db-ease-enter:  cubic-bezier(.22, .61, .36, 1);
  --db-ease-camera: cubic-bezier(.5, .05, .2, 1);
  --db-ease-stamp:  cubic-bezier(.34, 1.56, .64, 1);  /* the "sign" overshoot */
  --db-dur-rise:    .5s;     /* 14px rise + fade */
  --db-dur-camera:  1.15s;
  --db-pulse:       1.8s;    /* live-dot */
}
```

Cross-check: `globals.css` confirms every core token, all four radii, both shadows, and the `fade-up` utility exactly; it also maps shadcn vars (`--ring: #2c5e4a`, `--radius: 8px`) for dapp-kit. Only the secondary semantic tints + named motion tokens were absent from the repo (included above so docs match without inventing).

---

## 6. Docs Framework + Vercel Deployment Recommendation

### 6.1 Comparison table

| Dimension | **A) Fumadocs** | **B) Nextra 4** | **C) Mintlify** | **D) Custom Next+MDX** | **E) Starlight (Astro)** |
|---|---|---|---|---|---|
| Exact brand control | ✅ Full (Tailwind + CSS-var `--color-fd-*`; `theme={{enabled:false}}`; CLI eject) | 🟡 Opinionated; deep rebrand = real work | ❌ Capped; white-label Enterprise-only ($600+/mo) | ✅ Total | 🟡 Astro's design language |
| Live React embeds of *our real* components | ✅ First-class (RSC + `'use client'` islands) | 🟡 Works, more friction for wallet/client | ❌ **Disqualifier** — sandboxed runtime | ✅ Total | ❌ **Disqualifier** — wrong runtime |
| MDX authoring | ✅ | ✅ | ✅ (their dialect) | ✅ | ✅ |
| Code/tabs/callouts/cards | ✅ Built-in | ✅ | ✅ | ❌ DIY | ✅ |
| Search | ✅ Orama (swap Pagefind/Algolia) | ✅ Pagefind | ✅ Hosted + AI | ❌ DIY | ✅ Pagefind |
| Sidebar / auto-TOC | ✅ file tree + `meta.json` | ✅ `_meta.js` | ✅ | ❌ DIY | ✅ |
| Monorepo fit (pnpm + apps/web sharing) | ✅ Excellent (plain Next app) | ✅ Good | ❌ External service | ✅ Excellent | 🟡 Astro toolchain split |
| Vercel deploy | ✅ Native | ✅ Native | 🟡 Hosted by Mintlify | ✅ Native | ✅ Astro adapter |
| Maintenance | 🟢 Low–med (you own theme) | 🟢 Low | 🟢 Lowest (but loses 2 hard reqs) | 🔴 High | 🟢 Low |

### 6.2 Recommendation — **Fumadocs**, with Custom Next+MDX as the documented fallback

C (Mintlify) and E (Starlight) are eliminated by hard requirements — both structurally **cannot import our real `apps/web`/`packages` client tree** (sandboxed runtime / wrong bundler), and Mintlify can't inject custom brand layout without Enterprise white-label. B (Nextra) works but you'd fight its content-first opinions to hit exact brand + frictionless wallet-component embeds. That leaves **A (Fumadocs)** as best-fit and **D (Custom)** as fallback.

Why Fumadocs wins for *this* project: (1) it's a Next.js App Router app, not a docs platform — identical toolchain to `apps/web` (Next/Turbopack/Tailwind/pnpm), no second runtime; (2) the live-embed requirement is its home turf — renders arbitrary React in MDX with native RSC + client islands; (3) exact brand control is first-class — override `--color-fd-*` tokens for the warm-paper palette + green accent, set the two fonts as font vars, `<RootProvider theme={{enabled:false}}>` ships a single brand theme (then define every `--color-fd-*` light value so the preset can't leak); (4) Shiki code blocks, Tabs, Callout, Cards, Steps, FileTree, auto sidebar/TOC, and search come free. You can degrade toward Option D via the CLI eject without a rewrite. **Risk:** Fumadocs moves fast — **pin exact versions** and treat the overridden theme tokens as the stable surface.

### 6.3 Project layout & deployment

A separate `apps/docs` Next project (`pnpm-workspace.yaml` already globs `apps/*` — no edit needed):

```
apps/docs/
├─ package.json            # @deepbookie/docs (pin fumadocs-{ui,core,mdx})
├─ next.config.mjs         # createMDX from fumadocs-mdx
├─ source.config.ts        # content source
├─ vercel.json             # monorepo install/build
├─ content/docs/           # MDX + meta.json sidebars
└─ src/{app,lib/source.ts,mdx-components.tsx,components/PromptDemo.tsx,components/demos/*}
```

Import the real components two ways: **preferred** — promote demo-able presentational components into `packages/ui` (`@deepbookie/ui`, provider-free), consumed by both `web` and `docs`; **pragmatic** — direct `workspace:*` dep on the web app's exposed subpath (couples to internals; refactor later). Either way `apps/docs` already has `@deepbookie/predict-client` + `@deepbookie/core` for live read demos.

**Vercel:** a second, separate project on the same repo. Set **Root Directory = `apps/docs`**; `vercel.json` → `installCommand: cd ../.. && pnpm install --frozen-lockfile`, `buildCommand: cd ../.. && pnpm --filter @deepbookie/docs build`; enable "skip unaffected projects" so doc-only pushes don't rebuild `apps/web`; corepack pins pnpm `10.33.0` (the `packageManager` field already does). Add domain `docs.deepbookies.xyz` → if DNS is on Vercel, the record is auto-created; if external/Cloudflare, add **CNAME `docs` → `cname.vercel-dns.com`** (Cloudflare: grey-cloud / DNS-only so Vercel can issue TLS). Result: `apps/web` → `deepbookies.xyz`, `apps/docs` → `docs.deepbookies.xyz`, independent pipelines/rollbacks. (Rejected alternative: subdomain-rewrite inside `apps/web` — couples docs to the app pipeline and drags the wallet/AI provider tree into the docs root.)

**The "prompt → component" widget** — `PromptDemo.tsx` (client island): a toggle between the chat **prompt** and the **real live component** (`<PromptDemo toolName="get_odds" prompt="…"><OddsCardDemo/></PromptDemo>`). Two fidelity tiers: static-prop (default, 90% of pages) and optional "Run live" read-demo against `@deepbookie/predict-client` (reads need no wallet; lazy-gate to avoid hammering the 2.2MB `/oracles`). Register `PromptDemo` globally in `mdx-components.tsx`.

**Gotchas:** docs demos must be read-only / static-prop (never `useCurrentAccount`/`useSignAndExecuteTransaction`); keep `apps/docs` deps browser-safe (never import `@deepbookie/mcp`/`cli`); load fonts via `next/font/google` mapped to Fumadocs font vars; import `fumadocs-ui/css/preset.css` BEFORE brand overrides.

---

## 7. Proposed Docs Content Outline / Sidebar Tree

Mem0-style spine: **Introduction → Quickstarts → Concepts → Guides → Tool/API Reference → Surfaces → Cookbooks → Reference.** Pages marked 🎬 embed live "prompt → component" showcases.

### Introduction
- **What is DeepBookie** — the spine ("the agent proposes, you sign, it holds no key"); who it's for; testnet status.
- **Why DeepBookie** 🎬 — the 4 pillars (first Predict client · sign-at-edge · one-registry-many-surfaces · generative UI); embeds the full prompt → OddsCurveCard → SignReceipt loop.
- **How it works (60-second tour)** 🎬 — chat → odds curve → sign receipt → position, annotated with the live app.
- **Architecture at a glance** — the "one registry → MCP + CLI + skill + web" diagram; "reads execute, writes return an unsigned PTB; sign at the edge."
- **Project status & roadmap** — shipped (44-tool registry, web app, MCP/CLI/skill), testnet-gated, stretch.

### Quickstarts (one per audience)
- **Web app** (browser wallet) — connect → fund dUSDC → ask odds → sign first bet. The headline path.
- **MCP (Claude / Cursor)** (local key) — install `deepbookie-mcp`, add to client config, place a bet from chat.
- **CLI** (local key) — `deepbookie wallet` / `tools` / `call <tool>`; first read + first signed write.
- **npm client** (caller signs) — `pnpm add @deepbookie/predict-client`; read live odds + build an unsigned `mint` PTB in ~15 lines.

### Concepts
- Sui in 5 minutes · DeepBook Predict (vault-not-CLOB) · Markets: expiry/strike/oracle (BTC-only testnet) · **The bet lifecycle** (mint → ongoing → auto-settle → redeem; **early close = redeem at live value**; "no order to cancel") · Binary vs range bets 🎬 (RangePayoff vs binary step) · **Pricing: SVI → N(d2)** 🎬 (the intellectual core; OddsCurveCard probability smile) · dUSDC & funding (operator-gated, why no buy button) · **The receipt / sign-at-edge model** 🎬 (SignReceipt all states) · Managers, positions & PnL (shared object, internal quantities) · The PLP vault & liquidity · Units & scaling (×1e9 / 6dp / epoch-ms).

### Guides (task-oriented)
- Connect a wallet & fund with dUSDC · Read the odds & pick a strike 🎬 (QuotePreview) · Place a binary bet (mint) · Place a range bet (mint_range) · Close or settle a bet (redeem; early close vs settled) · Track positions & PnL 🎬 (PositionCard/PortfolioRollup) · Provide liquidity (supply/withdraw) 🎬 (VaultCard) · Conversation & receipt history · Run the agent in your own app.

### Tool & API Reference
- **Tool registry overview** — the 44 tools tagged `surface` × `kind`; the uniform handler contract; the registry-driven catalog ported from `apps/web/(app)/docs/page.tsx`.
- **Predict read tools** (per-tool: args/returns/example).
- **Predict write tools (sign)** — each returns an unsigned PTB.
- **Spot bridge** — framed per the product owner's call (see §8).
- **`@deepbookie/predict-client` API** — by module: `ptb` · `indexer` · `quotes` · `math` (SVI→N(d2)) · `units` & `constants` · `types`.

### Surfaces
- Surfaces overview (one registry, four edges; how signing differs) · Web app 🎬 (routes, widgets, dapp-kit signing; mini live chat) · MCP server (stdio, local keystore, stderr caveat) · CLI · Claude skill (`SKILL.md`) · Landing page (positioning).

### Cookbooks (outcome-named, intent-sorted)
1. "Will BTC be above $63k in 30 minutes?" (canonical demo) · 2. Bet a price band (mint_range) · 3. Close a winning bet early (redeem) · 4. Build a watchlist agent (read-only) · 5. Provide liquidity safely · 6. A keeper bot (redeem_permissionless) · 7. Quote-before-you-sign · 8. Embed DeepBookie in your own chat app.

### Reference
- Testnet constants (pinned, "provisional, churns at mainnet" banner) · Indexer REST API · Move entrypoints & arg ordering · Error codes (the Predict aborts) · Glossary · FAQ & troubleshooting ("Can I cancel?", "Why testnet only?", indexer lag) · Security & trust model (no-key-on-web; local keystore plaintext-at-rest `0o600`, honest) · Changelog (single page).

**Landing/docs-home (the entry):** hero (logo lockup + "Real odds. Priced live. You sign." + product-verb CTA "Place your first prediction") over a **6-card intent grid** (Try the web app · MCP/CLI · `@deepbookie/predict-client` npm · Tool reference · Cookbooks · How it works), `banner-link.png` as OG, `llms.txt` advertised.

---

## 8. Open Questions for the Product Owner

1. **Tool scope to document — 44 or 27?** The built registry is 44 tools (predict + spot). CLAUDE.md/MEMORY and the locked product narrative say "27, spot read-only." **Decision needed:** does the docs site document all 44 (predict + full spot), or only the predict-deep + read-only-spot subset the product narrative locks? This drives the entire Tool Reference and Surfaces sections.
2. **Spot framing.** If spot stays, is it a documented trading surface or "read-only context only"? (The spot write tools — orders, staking, governance — exist in code but the narrative calls spot context-only.)
3. **Shared design system extraction — `packages/ui` now or later?** Should we extract demo-able presentational components into a `packages/ui` workspace package (cleanest, decouples wallet) before building docs, or take the pragmatic direct-`apps/web`-dependency path for hackathon speed and refactor later?
4. **Live-read demos — ship "Run live" or static-prop only?** Given the indexer perf profile (2.2MB/~15s `/oracles`, ~7s lag), do we include the optional lazy "Run live" testnet demos, or keep every showcase static-prop for v1 reliability?
5. **Domain confirmation.** The brief says `docs.deepbookies.xyz`; the banner assets reference `deepbookie.xyz` (singular). **Confirm the canonical domain** (singular vs plural) before DNS/OG-image work.
6. **AI-native affordances scope.** Do we ship the Mem0-style "Copy page as markdown / Ask about this page" + `llms.txt` for v1 (on-brand for an AI-agent product, cheap), or defer to a later pass?
7. **Changelog source.** Single page vs per-package (predict-client npm vs app) — what cadence/source feeds it?
