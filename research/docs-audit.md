# DeepBookie Docs — Ground Truth & Fix Plan

**Audit lead consolidation of 10 sub-audits. Verified against source on 2026-06-20.**
This is the single source of truth for the docs-site rewrite. Every claim here was checked against `/packages/core/src/tools/*`, `/apps/docs/lib/nav.ts`, `/apps/docs/content/`, and `/packages/predict-client/src/*`. When code and prior docs disagree, code wins.

---

## 1. What DeepBookie really is

DeepBookie is a chat app where you ask an AI to help you trade crypto bets on Sui testnet. You type plain English — "Bet $50 that Bitcoin is above $70,000 on Friday" — and the AI prices the bet, shows you exactly what it costs and what you'd win, then hands you an unsigned transaction to sign in your own wallet. The AI proposes; you sign. It never holds your keys or touches your money.

Under the hood it trades **two** DeepBook markets, not one: **Predict** (binary UP/DOWN options on BTC at a strike and expiry) and **Spot** (DeepBook V3's central limit order book — real swaps and limit orders, not an AMM). One tool registry powers four surfaces — web app, MCP server, CLI, and a Claude skill — and each surface exposes only the tools its users need.

**One-liner (for the Introduction hero):**
> A chat interface to Sui's DeepBook markets: describe a bet in plain English, the AI prices it off a live volatility model and builds the transaction, you sign it in your own wallet.

---

## 2. 404 / missing pages

The sidebar (`apps/docs/lib/nav.ts`) links to **6 routes that do not exist**. Every page is currently MDX rendered through the Nextra catch-all (`app/[...mdxPath]/page.tsx`); there are **zero bespoke `.tsx` content pages yet**. The home grid, 404 page, and IntentGrid all link to `/tools`, so that gap is user-blocking.

| Missing route | Build as | Scope | Blocker? |
|---|---|---|---|
| `/tools` (all 44, filterable catalog) | **Bespoke `.tsx`** — reads the real registry, grouped into families, copy-to-clipboard | High | YES — home/404/nav/IntentGrid all point here |
| `/tools/predict` | MDX **or** a tab/filter on the `/tools` page (preferred: one page, filtered) | Med | Secondary |
| `/tools/spot` | MDX **or** a tab/filter on the `/tools` page | Med | Secondary |
| `/concepts/architecture` | **Bespoke `.tsx`** (registry→4-surface diagram) or MDX with an SVG | Small | YES — Concepts nav + home grid |
| `/concepts/pricing` | MDX (SVI→N(d2) explainer + odds-curve visual) | Small | Med — Concepts nav trail |
| `/surfaces/mcp` | MDX (per-client config tabs + troubleshooting) | Med | YES — nav + IntentGrid + a broken inbound link from quickstart-mcp |

**Recommendation on `/tools`:** build **one** bespoke `/tools` page that renders all 44 from the registry with a family filter, and make `/tools/predict` and `/tools/spot` deep-links into that same page (pre-applied filter) rather than three separate files. Less to maintain, always in sync.

---

## 3. The real 44 tools

Source of truth: `packages/core/src/registry.ts` aggregates four arrays. Verified counts: **44 total** = 18 Predict (10 read + 8 write) + 26 Spot (10 read + 16 write). By kind: 20 reads, 24 writes. This powers `/tools`. Group into **5 families** for the catalog (Predict reads, Predict writes, Spot reads, Spot writes — or the 8 user-facing groupings the web `/tools` page already uses: Markets & odds, Place a bet, Manage positions, Vault, Spot market data, Spot trading, Spot account, Activity).

### Predict reads (10) — `tools/reads.ts`
1. **list_markets** — all active BTC markets with expiries + strike ranges. No input.
2. **get_market** — one market's live state: spot, forward, expiry, strike grid, status. In: `oracleId`.
3. **get_odds** — probability smile across strikes (powers the odds-curve widget). In: `oracleId`, opt `steps` (3–101), opt `rangePct` (0.1–50%).
4. **get_quote** — exact on-chain cost to mint / payout to redeem a binary. In: `oracleId`, `strikeUsd`, `direction`, `quantityUsd`.
5. **get_range_quote** — same, for a price-band (range) position. In: `oracleId`, `lowerStrikeUsd`, `higherStrikeUsd`, `quantityUsd`.
6. **get_vault** — liquidity vault (PLP) state: TVL, available, max payout, share price, utilization. No input.
7. **get_vault_history** — vault share price + value over time. No input.
8. **get_portfolio** — a PredictManager's balances, exposure, redeemable value, PnL. In: opt `managerId` (defaults to wallet's).
9. **get_positions** — a manager's open (minted) + closed (redeemed) positions. In: opt `managerId`.
10. **get_recent_bets** — recent mints across all markets (the activity tape). In: opt `limit` (1–100).

### Predict writes (8) — `tools/writes.ts`
1. **create_manager** — create your PredictManager (one-time; required before betting/LPing). No input.
2. **mint** — buy a binary UP/DOWN at a dollar strike; optional same-tx funding. In: `oracleId`, `strikeUsd`, `direction`, `quantityUsd`, opt `fundUsd`, opt `managerId`.
3. **redeem** — sell/settle a binary; payout lands in manager balance. In: `oracleId`, `strikeUsd`, `direction`, `quantityUsd`, opt `managerId`.
4. **redeem_permissionless** — **keeper-only**: settle anyone's settled position into their manager. In: all of the above + required `managerId`.
5. **mint_range** — buy a band paying out if price lands in (lower, higher]. In: `oracleId`, `lowerStrikeUsd`, `higherStrikeUsd`, `quantityUsd`, opt `fundUsd`, opt `managerId`.
6. **redeem_range** — sell/settle a band. In: same minus funding.
7. **supply** — deposit dUSDC into the vault, receive PLP shares. In: `amountUsd`.
8. **withdraw** — burn a PLP coin, receive dUSDC. In: `plpCoinId`.

### Spot reads (10) — `tools/spot-reads.ts`
`spot_list_pools` · `spot_mid_price` · `spot_orderbook` · `spot_swap_quote` · `spot_pool_params` · `spot_balance` · `spot_account` · `spot_open_orders` · `spot_can_place_limit_order` · `spot_can_place_market_order`
(Pre-flight `can_place_*` tools validate price/size/balance before you sign.)

### Spot writes (16) — `tools/spot-writes.ts`
`spot_create_balance_manager` · `spot_deposit` · `spot_withdraw` · `spot_swap_base_for_quote` · `spot_swap_quote_for_base` · `spot_place_limit_order` · `spot_place_market_order` · `spot_cancel_order` · `spot_cancel_all_orders` · `spot_modify_order` · `spot_withdraw_settled_amounts` · `spot_stake` · `spot_unstake` · `spot_submit_proposal` · `spot_vote` · `spot_claim_rebates`

**Note for the catalog:** prior docs and the quickstarts say "27 tools" / "35 tools" / "27+". The real number is **44**. Fix everywhere.

---

## 4. Per-page fixes

### get-started/introduction.mdx — currently scored 5/5 but factually narrow
- **Fix:** says "Sui's expiry-based prediction market" (singular). Truth: trades **two** markets — Predict (binary options) AND Spot (CLOB). Add one sentence naming both.
- **Fix:** clarify "one registry" — say "one registry; each surface exposes only the tools its users need," not "every surface is a thin client over the same registry."
- **Add:** the real start funnel — click Get started → land in `/chat` → connect a testnet wallet → FundingBanner appears if you have no dUSDC → ask the AI.
- **Direction:** use the §1 one-liner verbatim. Lead with the human story (type a bet, AI prices it, you sign), then the two-markets fact, then the four surfaces.

### get-started/how-it-works.mdx
- **Cut:** "beat" jargon ("the same line, two beats"). Replace with plain "two steps."
- **Cut over-jargoned pricing step:** "reads the live SVI volatility curve … runs it through N(d2)" → "DeepBookie reads the live market odds and computes the exact cost and payout." Keep SVI/N(d2) for the Pricing concept page only.
- **Fix ambiguous receipt state machine:** define exactly what "dashed/void" means and when a user sees it. Verify against the real UI (`SignReceipt` widget). State plainly: dashed = the trade did not happen, e.g. (1) you declined in the wallet, (2) the tx failed on-chain (e.g. insufficient balance), (3) you proposed a new bet before signing the old one.

### get-started/quickstart-web.mdx
- **Fix:** define "genUI" on first use → "generative-UI chat (the chat builds the transaction for you)."
- **Fix dUSDC language:** the faucet is real (`apps/web/src/lib/faucet.server.ts`) and mints operator-gated dUSDC — keep the "Get test dUSDC" CTA, but add the warning that **balance/portfolio queries fail until the mint confirms**. Do not call it a public faucet.
- **Direction:** funnel = connect wallet → fund dUSDC (or the AI auto-resolves an existing manager+balance from your address) → ask → AI calls `get_quote` → AI calls a write tool → you sign. Step 2 and 3 overlap; the AI does not wait for manual funding to start proposing.

### get-started/quickstart-mcp.mdx (see also §6)
- **Fix line ~26:** no config file path given. Add: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `%APPDATA%\Claude\claude_desktop_config.json` (Windows).
- **Add:** a global-install variant (`"command": "deepbookie-mcp"`) next to the `npx` one.
- **Add:** `DEEPBOOKIE_LOG_LEVEL` (default `info`; `debug` to troubleshoot) to the env table.
- **Add:** platform note for keystore — macOS/Linux `~/.deepbookie/config.json`; Windows under `%APPDATA%`.
- **Fix broken link:** it links to `/surfaces/mcp` which 404s. Either create that page (preferred — see §6) or inline the configs.
- **Add:** a short Troubleshooting block (server not appearing in client; where logs live — `~/Library/Logs/Claude/mcp*.log`; how to fund the auto-generated wallet).

### concepts/sign-at-edge.mdx
- **Cut:** "Ink proposes; green disposes — the same line, two beats" poetry; remove "beat" entirely. Dial down "the trust boundary closest to you."
- **Direction:** "Ink = the proposed unsigned transaction. Green = the signed digest on-chain. You sign in your wallet (web) or with a local key on your machine (CLI/MCP) — never in the cloud. The agent never holds the key."
- **Normalize** the sign-at-edge phrasing so it matches How-it-works and quickstart-mcp (see §10 consistency).

### concepts/scaling.mdx
- **Cut:** abstract "fixed-point" opening. Lead with what the user types.
- **Add the formula inline** (not just the result): `$65,000 × 1,000,000,000 = 65,000,000,000,000`. FLOAT_SCALING = 1e9 is correct; dUSDC = 6dp is correct.
- **Add:** name the helpers — `toScaled()` multiplies, `fromScaled()` divides back; `toDusdc()`/`fromDusdc()` for the 6dp token.
- **Add:** the strike-snapping sentence here (first mention) — "You enter dollars; DeepBookie snaps to the nearest valid grid strike automatically." Currently snapping only surfaces in the Errors page.
- **Fix:** probabilities are `0..1` in the math (and `0..1e9` on-chain), not `0..100%`.

### surfaces/web.mdx (see also §7)
- **Fix:** define "genUI conversation" on first use.
- **Add `/tools` to the routes table** — it exists and is user-facing (the 44-tool catalog). The table currently lists only `/chat`, `/markets`, `/positions`, `/vault`, `/history` and calls it "five surfaces." Real list in §7.
- **Keep:** wallet-gating, launcher-first `/chat`, read-server/write-browser split, transcript persistence — all verified correct.

### surfaces/cli.mdx
- **Fix:** define **MIST** ("the base unit — 1 SUI = 1 billion MIST"); annotate the wallet-output example (`"sui": "1980000000" // 1.98 SUI`, `"dusdc": "5000000" // 5 dUSDC`).
- **Emphasize:** there are only **3 commands** — `wallet`, `tools`, `call`. `call <tool> [json]` is the universal entry point; there are no per-tool subcommands. Run `deepbookie tools` to discover all 44.
- **Add:** real `tools` output sample (first ~8 + "…"), and `call` error examples (bad JSON → "invalid JSON for args…"; unknown tool name).
- **Add:** a "First-time setup" block — run `deepbookie wallet`; key auto-generates at `~/.deepbookie/config.json` (mode 0600) if no env/file; fund the printed address via the tally form.
- **Add:** a fuller worked session — `list_markets` → `create_manager` → `mint` → `get_portfolio` → `redeem`. Note env defaults `DEEPBOOKIE_MANAGER_ID` / `DEEPBOOKIE_BALANCE_MANAGER_ID` (else pass `managerId`/`balanceManagerId` per call).
- **Shorten** the 65-word keystore step to ~30 words.

### surfaces/skill.mdx (see also §5)
- **Rewrite install (lines ~46–62):** it conflates the **skill** (a `SKILL.md` instruction folder) with the **tools** (MCP/CLI executables). There is no `@deepbookie/skill` npm package. Correct method in §5.
- **Separate concerns:** install the skill (copy folder or `/plugin install`) → wire tools separately (run `deepbookie-mcp` or use the CLI).
- **Clarify** tool discovery slightly (minor).

### sdk/predict-client.mdx — **High priority**
- **Add an intro story** (2 sentences) before the imports — match the tone of core.mdx, which opens with a short intro.
- **Fix the scaled-integer trap:** the quickstart passes `market.min_strike` from `getActiveOracles()` directly to `upProbability()`/`buildCurve()`. That's correct **by accident** — the indexer already returns it ×1e9 — but the doc never says so. Add a comment: `// min_strike is already ×1e9 from the indexer — pass it directly, no scaling`.
- **Mention** the quote functions `getTradeAmounts()` / `getRangeTradeAmounts()` (devInspect, no gas/signing) that return cost/payout in dUSDC base units (6dp).

### sdk/core.mdx
- **Fix ToolContext table:** state undefined behavior. `managerId` is optional for catalog reads but **required for position reads and all writes** — undefined throws `this needs a PredictManager — run create_manager first` (`tools/writes.ts:requireManager`).

### reference/testnet.mdx — verified accurate, keep
- Addresses/IDs match `constants.ts`. Optional: alias `DUSDC_TYPE` ↔ "dUSDC" so copy-paste isn't confusing.

### reference/errors.mdx — **High priority (the faucet bug)**
- **WRONG:** error string `'no dUSDC in wallet — acquire test dUSDC from the faucet first'` and the doc says "from the faucet." DeepBookie dUSDC is **operator-gated** — acquired via the in-app "Get dUSDC" button or the tally form. The web faucet endpoint mints it; there is no generic public faucet to "find."
- **Fix:** change the error string in `packages/core/src/tools/writes.ts` to `'no dUSDC in wallet — tap "Get dUSDC" in the web app or request via the tally form'`. If the string can't change yet, add a doc note explaining "faucet" is legacy wording.
- **Move** the strike-snapping note's first mention to Scaling (keep the detailed `resolveMarket` note here).
- Error messages otherwise match code — keep them; tighten vague "fix" prose.

### reference/glossary.mdx — **High priority (too academic)**
- **Rewrite SVI:** "A math model of how option prices change across strikes. DeepBookie uses it to compute fair odds for any bet." (Drop "parameterization.")
- **Rewrite N(d2):** "A standard formula (from Black-Scholes) that turns volatility into a 0–100% probability — e.g. 'probability BTC is above $70k.'" Drop "CDF term."
- **Tighten binary vs range:** "Binary: one side of a single price (up/down). Range: price lands in a band (e.g. $68k–$72k)."
- **Standardize PredictManager** (CamelCase) and **dUSDC** spellings (see §10).

### cookbooks.mdx
- **Add a one-line note** at top: "Recipes use the CLI (bash) for simplicity. For custom apps, use the Node SDK (`@deepbookie/core`)." The keeper-bot recipe switches to TypeScript without explaining why.
- Optionally show bash + Node side-by-side for one recipe.

---

## 5. Skill install — the correct method

A Claude skill is a **directory containing `SKILL.md`** (instructions), **not** an npm package. Tools (MCP/CLI) are separate and paired with it. Two valid install paths:

**A. Local / project scope (recommend for the hackathon — works immediately):**
```bash
mkdir -p ~/.claude/skills
cp -r ./skills/deepbookie ~/.claude/skills/   # or .claude/skills/ for project scope
# then /reload-plugins in Claude Code
```
Wire tools separately: `npx -y @deepbookie/mcp` (MCP) **or** `deepbookie call list_markets` (CLI).

**B. Marketplace (for public distribution):**
1. Add `.claude-plugin/marketplace.json` at repo root pointing to `./skills/deepbookie`.
2. Users run `/plugin marketplace add Blockchain-Oracle/deepbook-predict-agent` then `/plugin install deepbookie` then `/reload-plugins`.

**Repo cleanup:** delete/clarify `skills/deepbookie/package.json` (the `@deepbookie/skill` name implies an npm package — wrong). Keep `@deepbookie/mcp`, `@deepbookie/cli`, `@deepbookie/predict-client` as real npm packages.

**OWNER DECISION NEEDED:** pick distribution — **A** (document local copy in README), **B** (add marketplace.json + push), or **C** (both). Recommend **C**: ship `marketplace.json` AND document the local copy, so it's discoverable but also works offline for judges.

---

## 6. MCP config — correct per-client blocks

Server: stdio JSON-RPC, bin `deepbookie-mcp`, logs to **stderr** (stdout is the protocol channel). Env vars: `DEEPBOOKIE_NETWORK` (default `testnet`), `DEEPBOOKIE_PRIVATE_KEY`, `DEEPBOOKIE_MANAGER_ID`, `DEEPBOOKIE_BALANCE_MANAGER_ID`, `DEEPBOOKIE_LOG_LEVEL` (default `info`). Local Ed25519 key signs writes; the model never sees it.

**Claude Desktop** — macOS `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "deepbookie": {
      "command": "npx",
      "args": ["-y", "@deepbookie/mcp"],
      "env": { "DEEPBOOKIE_NETWORK": "testnet" }
    }
  }
}
```
Global-install variant: `"command": "deepbookie-mcp"` (drop `args`).

**Cursor** — `~/.cursor/mcp_servers.json` (Windows `%APPDATA%\Cursor\mcp_servers.json`):
```json
{
  "deepbookie": {
    "command": "npx",
    "args": ["-y", "@deepbookie/mcp"],
    "env": { "DEEPBOOKIE_NETWORK": "testnet" }
  }
}
```

**Claude Code** — `.claude/settings.json` (project) or `~/.claude/settings.json` (global), same `mcpServers` shape as Claude Desktop.

Build `/surfaces/mcp.mdx` to hold all three + an env table (incl. `DEEPBOOKIE_LOG_LEVEL`) + wallet/keystore notes + troubleshooting (tail `~/Library/Logs/Claude/mcp*.log`; testnet-only, plaintext key at rest, fund sparingly).

---

## 7. Web routes — the real list

Verified against `apps/web/src/app/`. The docs' "five surfaces" table is missing `/tools`.

| Route | Renders |
|---|---|
| `/` | Landing (Hero, DemoPhone) — accessible before wallet connect |
| `/chat` | Generative-UI chat (the main agent surface; launcher-first before connecting) |
| `/markets` | Browse live Predict markets (filter/sort) |
| `/markets/[id]` | Single market — odds curve, trade tape, stats |
| `/positions` | Portfolio + open/settled bets from your PredictManager |
| `/vault` | Liquidity vault stats + supply/withdraw |
| `/history` | Past conversations, persisted per turn |
| `/tools` | **44-tool catalog grouped by family — MISSING FROM DOCS, ADD IT** |
| `/dev/widgets` | Dev-only widget showcase (correctly dev-only) |

Plus `/api/*` handlers (chats, markets, positions, vault, spot, activity, faucet, revalidate). The read-server / write-browser split and outcome persistence (`POST /api/chats/[id]/outcome`) are correct as documented.

---

## 8. Architecture + pricing (bespoke pages)

**Architecture (plain human):** One TypeScript tool registry (`packages/core/src/registry.ts`, the single `allTools` array of 44 tools) feeds four surfaces — web, MCP, CLI, skill. Each tool is authored once as a `ReadTool` or `WriteTool`. **Reads** run server-side (indexer or devInspect) and return JSON. **Writes** build an **unsigned** Sui transaction and stop there — the core never signs or executes. Signing happens at the edge: a local key for CLI/MCP (`packages/node` keystore + signer), the browser wallet for web, the skill runtime delegating to CLI/MCP. The `getToolsForAdapter(tools, ctx)` adapter exposes `list / read / build` only. `ToolContext` is plain data (RPC client, network, sender address for devInspect, manager IDs) — **not** authorization. The diagram: one core box → four surface boxes; CLI/MCP = "build + sign + execute (local key)", web = "build only (browser signs)".

**Pricing (plain human):** DeepBookie estimates the chance BTC ends above your strike using a volatility model called **SVI** (Stochastic Volatility Inspired), then converts it to a probability with **N(d2)**, the standard normal CDF from Black-Scholes. In code (`predict-client/src/math.ts`): `upProbability(svi, forward, strike)` computes a normalized distance `d2` and feeds it to `normalCdf()` → a number 0..1; `downProbability = 1 − up`; `buildCurve()` samples ~25 strikes around the forward (±5% default) to draw the smile. All inputs are ×1e9 (FLOAT_SCALING); probabilities return 0..1. Show the odds-curve visual; keep the math in a collapsible "for the curious" block.

---

## 9. llms.txt fix + IA

**Status:** `/llms.txt` is **not implemented** — no `public/llms.txt`, no route handler. Nextra v4 does not auto-generate it. The designer brief asks for it in the sidebar footer + Reference.

**Fix:** add a dynamic route handler `apps/docs/app/llms/route.ts` that flattens `NAV` from `lib/nav.ts` into a plain-text site map (`href - label (group)` per line, `content-type: text/plain`). Dynamic > static so it stays in sync as pages are added. Only ship it **after** the 6 missing pages exist, so it doesn't advertise 404s. Lower priority than the missing pages (branding, not user-blocking).

**IA recommendation: do NOT simplify the structure.** The tree (intro → concepts → surfaces → tools → SDK → reference) matches the product (four surfaces, two SDK packages, two markets, a real registry) and the brief. The problem is **missing pages, not bad structure** — finish building the 6 pages and the journey is whole. The only consolidation worth doing: collapse `/tools/predict` + `/tools/spot` into filters on a single `/tools` page (see §2).

---

## 10. Writing rules for the rewrite

1. **Short sentences. Plain words.** One idea per sentence. A trader who's never read a finance paper should get it on the first pass.
2. **No jargon without a plain gloss on first use.** Gate the math: SVI, N(d2), CDF, fixed-point, MIST, genUI, "edge" — define inline the first time, or push to the Glossary/Pricing page. Never two undefined terms in one line.
3. **Kill the poetry.** No "beats," no "ink proposes / green disposes," no "trust boundary closest to you." Use "step," "proposed," "signed."
4. **Show, don't gesture.** When numbers matter, show the formula and the result (`$65,000 × 1e9 = 65,000,000,000,000`), not just the result.
5. **Consistent canonical terms:** **PredictManager** (CamelCase), **dUSDC** (mixed case), **44 tools** (not 27/35), **two markets** (Predict + Spot), **sign at the edge** = "in your wallet, or on your machine — never in the cloud." Pick one phrasing and reuse it everywhere.
6. **No invented facts.** dUSDC is operator-gated, not a public faucet. The agent never holds keys. Writes are unsigned until the edge. If you can't point to a file, don't claim it.
7. **One voice:** concrete, friendly, technical-but-human (the Introduction page is the reference tone). Concept pages explain; reference pages are terse and exact.
8. **Trim length:** step blocks ≤ ~35 words; glossary entries ≤ 2 lines.
