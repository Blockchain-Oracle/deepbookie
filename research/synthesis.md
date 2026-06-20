## Scope

Decision brief for Abu: a DeepBook Predict AI-agent product (MCP + CLI + skill + generative-UI web app, user-signs). Merges four research briefs and two adversarial verifications. Where they conflict, the CONFIRMED verification wins. Track: Sui Overflow 2026 DeepBook Predict ($35k 1st). All claims carry an inline citation; unverified items are flagged.

## Sources Checked

Reconciled from the supplied material: `mcp-existence`, `predict-surface`, `abu-repos-pattern`, `genui-and-fit` briefs + `verify-mcp-existence` (VERDICT: CONFIRMED-NONE) and `verify-predict-surface` (CONFIRMED all addresses/entrypoints; one REFUTATION). Primary external anchors cited inline: the `deepbookv3` repo branch `predict-testnet-4-16`, the live indexer `predict-server.testnet.mystenlabs.com`, the official MCP registry / Glama API, and Abu's four repos under `/tmp` (pacifica-mcp, portaldot-mcp, mpilot, cdr-kit).

---

## 1) Does a DeepBook / Predict MCP already exist?

**Headline: CONFIRMED-NONE.** No MCP server exists for DeepBook, DeepBook Predict, or Sui trading. This is independently reproduced by two passes.

Evidence:
- GitHub repo + code searches for every MCP-specific combination (`deepbook mcp`, `sui predict mcp`, `@mysten/deepbook-v3 @modelcontextprotocol`, `DeepBookClient mcp`) return **empty result sets** (`gh search`, both passes).
- Official MCP registry: `registry.modelcontextprotocol.io/v0/servers?search=deepbook` → `count:0`. Glama's authoritative JSON API `glama.ai/api/mcp/v1/servers?query=deepbook` → **exactly one** result with `hasNextPage:false`.
- That one result, `ExpertVagabond/sui-mcp-server`, is the **only** DeepBook-touching MCP. It is **read-only**, has a single tool `deepbook_get_pool` (mid price / spread / balances), hardcoded to the **mainnet v3** package `0x337f4f…482ef497`. Grep for `predict|placeOrder|deepbook_place` → zero matches. No Predict, no testnet, no order placement (`src/index.ts:818-825,1683-1684`).
- All ~30 DeepBook Predict hackathon repos (the competitor set: `predictpilot`, `deepskew`, `updown`, `book`, `deepedge`, `Floe`, etc.) are **apps / CLIs / vaults / Telegram bots — none is an MCP server.** Tree + `package.json` inspection of the 8 highest-risk candidates found no MCP module or `modelcontextprotocol` dep. `16abhimasani/book` ("agentic") is a Robinhood+Predict app, not an MCP.

**White space that remains:**
1. **First-of-kind DeepBook Predict MCP** — no Sui precedent in any of four directories.
2. **First Predict TS client at all.** The published `@mysten/deepbook-v3` SDK (latest **1.5.1**, modified 2026-06-17) has **zero** `predict` references — it covers spot + margin only (grep on cloned `ts-sdks` src; `npm view`). Predict writes must be hand-built as raw `tx.moveCall` PTBs. Whoever ships the TS/MCP client ships the first one.
3. **A safer signing model.** Every surveyed trading MCP (Polymarket, Kalshi, Hyperliquid, Jupiter, GMX) uses a **server-held private key / API key in an env var** and signs autonomously. A true "agent proposes, user signs in their own wallet, agent holds no key" model is **not** the norm in any of them — open differentiation lane that also aligns with the track's "user signs" framing.

---

## 2) DeepBook Predict tool catalog

All Move signatures CONFIRMED against `predict.move` on branch `predict-testnet-4-16` by the adversarial verify pass. Deployment constants CONFIRMED matching both `constants.ts` and the official docs page.

**Testnet constants (CONFIRMED, both `constants.ts:80-95` + docs):**
- Predict package `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Registry `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64`
- Predict shared object `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- dUSDC `0xe95040…::dusdc::DUSDC` (6 dp) · PLP `0xf5ea…5138::plp::PLP` (6 dp) · Clock `0x6` · Indexer `https://predict-server.testnet.mystenlabs.com`
- On-chain scaling: FLOAT_SCALING = 1e9 (`oracle.move:71`).

**WRITE / SIGN tools — the 8 user entrypoints (each returns an unsigned PTB; user's wallet signs):**
| Tool | Move signature (CONFIRMED) | Note |
|---|---|---|
| `create_manager` | `create_manager(ctx): ID` @ `predict.move:192` | per-user shared `PredictManager`; one-time |
| `mint` | `mint<Quote>(predict, manager, oracle, key: MarketKey, quantity, clock, ctx)` @ :219 | buy binary UP/DOWN; asserts owner, `!trading_paused`, `quantity>0` |
| `redeem` | `redeem<Quote>(...)` @ :285 | sell/settle binary; payout → manager balance |
| `redeem_permissionless` | `redeem_permissionless<Quote>(...)` @ :300 | gated by `oracle.is_settled()`; **anyone can call (keeper)** |
| `mint_range` | `mint_range<Quote>(..., key: RangeKey, ...)` @ :331 | buy vertical range `(lower, higher]` |
| `redeem_range` | `redeem_range<Quote>(...)` @ :380 | |
| `supply` | `supply<Quote>(predict, coin, clock, ctx): Coin<PLP>` @ :437 | LP deposit → PLP shares |
| `withdraw` | `withdraw<Quote>(predict, lp_coin, clock, ctx): Coin<Quote>` @ :474 | burn PLP; capped at `balance − total_max_payout` + rate limiter |

> **CORRECTION (verify pass overrides brief):** `compact_settled_oracle` (`predict.move:270`) is **NOT** permissionless — it requires an `OracleSVICap` (`oracle::assert_authorized_cap`). Do **not** advertise it as a keeper action. Only `redeem_permissionless` is open to arbitrary keepers. A keeper product can auto-redeem settled positions but cannot drive vault compaction.

> Admin-only (`registry.move`, `AdminCap`/`OracleSVICap`-gated — relevant only for a local devnet harness, never a user tool): `create_predict`, `create_oracle(...)` @ `registry.move:104`, oracle price/SVI pushes. The off-chain Block Scholes operator holds `OracleSVICap`.

**READ / QUERY tools (safe, no signing):**
- *On-chain getters* (devInspect): `get_trade_amounts(...) → (mint_cost, redeem_payout)` @ :199 and `get_range_trade_amounts` @ :317 (the canonical quote preview); `ask_bounds` @ :212; config getters (`trading_paused`, `base_spread`, `min_spread`, `accepted_quotes`, `available_withdrawal`); vault/oracle/manager getters; `oracle_config::build_curve(...) → vector<CurvePoint{strike, up_price}>` (probability smile sampler; `CurvePoint` type + getters CONFIRMED at `oracle_config.move:55`).
- *Indexer REST API* (all GET, all verified returning live JSON; routes `server.rs:41-69`): `/config`, `/status`, `/oracles`, `/oracles/:id/{state,prices,svi,ask-bounds}`, `/svi/latest`, `/positions/{minted,redeemed}`, `/ranges/{minted,redeemed}`, `/trades/:oracle_id`, `/lp/{supplies,withdrawals}`, `/managers`, `/managers/:id/{positions,summary,pnl,ranges}`, `/predicts/:id/{state,vault/summary,vault/performance}`.
- **Known gaps (CONFIRMED live):** `pricing`/`risk`/`trading_paused` are **null** in `/config` (indexer hasn't backfilled — read spread/risk params on-chain instead). **No `/openapi.json`, no `/leaderboard`** (both 404). A leaderboard must be derived client-side from `/managers` + `/managers/:id/pnl`.

**Rich data types for generative UI (the four the build needs):**
- **Market** = `OracleSVI` row: `{oracle_id, underlying_asset:"BTC", expiry, status, spot, forward, min_strike, tick_size, settlement_price}` (`/oracles/:id/state`). Lifecycle: 0 INACTIVE → 1 ACTIVE → 2 PENDING_SETTLEMENT → 3 SETTLED.
- **Vol-surface point** = `SVIParams{a,b,rho,m,sigma}` + a `build_curve` → `CurvePoint{strike, up_price}` vector (the probability smile). The math is exact: `k=ln(strike/forward)`, total variance `w = a + b·(rho·(k−m) + √((k−m)²+σ²))`, `d2 = −((k+w/2)/√w)`, **UP = N(d2)**, **DOWN = 1−UP** (parity CONFIRMED `oracle.move:331,346,400`). Implied vol per strike = `√(w/T)`. Note: API returns signed `rho`/`m` pre-split as `{magnitude, *_negative:bool}` — genUI reads the API form.
- **Position** = `MarketKey{oracle_id, expiry, strike, direction}` or `RangeKey{oracle_id, expiry, lower, higher}` + quantity, enriched by `/managers/:id/summary` PnL fields.
- **PLP/vault state** = `/predicts/:id/vault/summary` (`vault_value, total_mtm, total_max_payout, available_liquidity, plp_share_price, utilization, plp_total_supply`). Live sample: vault ≈ $1.018M dUSDC, share price 1.00208, utilization 0.14%.

---

## 3) Abu's proven pattern (replicate / avoid)

**REPLICATE — portaldot-mcp's shape (4 packages, not cdr-kit's 17):**
- **One transport-free tool registry.** `ToolDef{name, description, inputShape: RawShape, handler}` + a flat `allTools: ToolDef[]` array (`portaldot core/src/lib/types.ts:19`, `registry.ts:30`). No factory, no agent argument, no custom primitive.
- **MCP adapter = a ~31-line loop** over `allTools` calling `server.registerTool` (`portaldot mcp/src/index.ts`).
- **Vercel AI SDK adapter consumes the SAME registry** — `buildTools()` iterates `allTools`, wraps each in `tool({description, inputSchema: z.object(t.inputShape), execute})`, hands to `streamText` (`web/app/api/chat/route.ts:40`). **Same source array, two transports** — the literal "usable in MCP and Vercel AI" mechanism.
- **Typed structured returns → generative-UI cards.** Tools return a `Result<T>` discriminated union; the client `switch`-maps `tool-<name>` → a dedicated React card (`chat-app.tsx:259-286`), with skeleton/error states.
- **CLI + skill surfaces exist** (pacifica `commander` CLI one-tool-per-file + `SKILL.md` with a "when to use / tool selection" table).
- **Config DX:** env-or-auto-create on first run (pacifica `PACIFICA_PRIVATE_KEY` else `~/.pacifica-mcp/config.json` at `0600`; cdr-kit `CDR_*`). For the Predict target, keep the ergonomics but for **read-only RPC/indexer config**, not a signing key.

**The mPilot ANTI-PATTERN (do NOT do this):** mPilot took the *same correct principle* and exploded it into **~30 workspace packages** — a bespoke `ConciergeTool` framework with dual Zod generics + annotations + `UICardId` + `supportsNetwork`, a **142-line "ten-duty" registry builder** doing runtime Zod duck-typing, **7 per-protocol provider packages**, **5 separate adapter packages**, meta-SDK wrappers, plus biome/commitlint/osv/gitleaks/husky/ADR process bloat. portaldot does the equivalent in a 24-line `tool.ts` + 24-line `types.ts` + `export const allTools = [...]`. **Lesson: flat array + two ~20-line loops. No SDK-around-it.**

---

## 4) Generative-UI + user-signs model

The mechanism (CONFIRMED in portaldot, semantics confirmed for Sui via dapp-kit docs):

1. **Use AI SDK UI (`useChat` + tool parts), NOT `streamUI`/RSC.** RSC is explicitly experimental and server-rendered — it can't hold wallet state. The signer must be a **client component**. Tool parts stream `input-streaming → input-available → output-available`; you `switch` on state and render your own React component with `part.output` as props (ai-sdk.dev generative-UI docs).
2. **Read tools get an `execute`** (server runs them against the indexer — no wallet). **Write tools are registered with NO `execute`** (`portaldot route.ts:54`, comment: *"AI proposes, user signs"*). With no `execute`, the AI SDK streams the tool call to the client as `input-available` with no output.
3. **The client detects `tool-<writeName>`, renders a confirm-and-sign card** (portaldot `<TransferCard>`: receipt-style, `Authorize`/`Cancel`, `AWAITING SIGNATURE → SIGNING → FINALIZED`, explorer links). On click it signs in the **browser wallet**, then calls `addToolOutput({tool, toolCallId, output})` to feed the signed result back into the conversation (`chat-app.tsx:133-145,223-248`).
4. **Sui signing primitive:** the card builds a `new Transaction()` with `tx.moveCall(...)` against the Predict package and calls **`useSignAndExecuteTransaction`** (dapp-kit) — wallet pops up, user approves, signs+executes, `onSuccess` returns the digest. (`useSignTransaction` is the sign-without-execute variant returning `{bytes, signature}` for sponsored gas.)

**Upgrade over portaldot (net-new, must be built + tested):** portaldot's tool *handler* still signs server-side with a headless key (`transfer.ts`/`chain/wallet.ts`) — signing is *surface-selected*, not eliminated. For the Predict target, make the write-tool handler **build and return an unsigned Sui PTB payload** instead of signing. Then **both** MCP and web return that payload and the user signs — agent holds **zero** keys on **any** surface. No surveyed repo (portaldot/cdr-kit/pacifica) ships a pure "return unsigned tx" handler, so this piece is genuinely new and is the cleanest version of the trust story.

---

## 5) Track fit + honest recommendation

**Does it satisfy the minimum?** Yes, cleanly. The web app's sign card builds a PTB calling `predict::mint` / `mint_range` / `supply` against the real testnet package, signed by the user's wallet — that *is* "integrate the Predict contract on testnet, end-to-end." MCP/CLI/skill read the live `predict-server` endpoints. Nothing speculative required.

**Idea-bank flavor fit:** hits **two** named flavors at once — *alt-flavor frontends (chat-based trading / PWAs)* AND *analytics & dev tooling that makes Predict legible*. The MCP+CLI+skill is literally dev tooling that makes Predict reachable from any agent runtime; the genUI chat app is the chat-based frontend. Dual coverage helps the **50% real-world** weight.

**Novelty (defensible):** "Agent proposes a vol-surface-priced Predict trade as a generative-UI component; user signs in their own wallet; agent holds zero keys" is a combination **not found shipped on Sui** — and it's the first Predict MCP/TS client at all. Two independent forms of first-of-kind (the MCP, and the unsigned-PTB user-signs model).

**Sharpest framing to win:** *"The first way any AI agent can trade DeepBook Predict — safely. One tool registry → MCP + CLI + Claude skill + a generative-UI chat dapp where the agent reasons about strikes/ranges/vol and proposes the trade, but you sign it in your own wallet. The agent never holds a key."* The vol-surface and range-payoff widgets (real, fed by `/oracles/:id/{prices,svi}` + `build_curve`) are what make Predict legible and win the **20% UX**; the no-key-anywhere model is the real-world trust story for the **50%**.

**Risks (honest):**
- **"Chat over a swap" is the slop version.** If the web app is just a chatbox emitting one `mint` PTB, it's an LLM bolted onto a form — judges have seen 50. The genUI widgets (vol-surface heatmap, range-payoff diagram, vault/PLP card, live PnL) must be the **primary** surface and **data-driven**, not a text fallback.
- **The agent must add trading judgment, not just translate** — map NL → the *right* primitive (binary vs vertical range), show implied prob/breakeven from the SVI oracle, surface vault depth before a `supply`. Otherwise the "AI" is decorative.
- **Scope risk.** MCP + CLI + skill + polished dapp is a lot for one month. Make the **chat-to-sign dapp the headline** (50% + 20% live there); frame MCP/CLI/skill as the "any agent can now trade Predict" durability layer, not three thin co-equal surfaces.
- **The unsigned-PTB-on-every-surface handler is net-new** — not copied 1:1 from any repo. Must be built and tested against Predict on testnet early; it's the differentiator and the riskiest seam.
- **Testnet IDs are provisional** (pinned to `predict-testnet-4-16`). Isolate IDs in config; expect churn. Re-check `npm view @mysten/deepbook-v3` before building (Mysten could add Predict).

**Verdict:** Novel, winnable, and satisfies the minimum with margin. The MCP+CLI+skill+genUI idea is a genuine first-of-kind on two axes. It wins **if and only if** the generative-UI trade flow is deep (real vol-surface/range/PnL widgets + real NL→primitive reasoning) rather than a chat wrapper, and the user-signs/no-key model is demoed end-to-end as the headline. Build the dapp deep; let the MCP/CLI/skill be the durability story.

## Open Questions For Abu

1. **Headline surface:** confirm the **generative-UI chat-to-sign dapp** is the demo headline and MCP/CLI/skill are the supporting durability layer — not four co-equal surfaces splitting focus. (Brief recommends depth-on-one.)
2. **Signing model:** commit to the **unsigned-PTB-returned, user-signs-everywhere, agent-holds-zero-keys** model? It's the differentiator but net-new (no repo ships it 1:1) and the riskiest seam — needs an early testnet spike.
3. **dUSDC faucet:** the testnet token-request/faucet URL was **NOT** found in docs or repo (both verify passes flag this). Users need dUSDC to sign a real `mint` in the demo. Do you have it, or should the next task be to extract it from the blog/docs index?
4. **Scope of write tools for v1:** all 8 entrypoints, or a headline subset (`create_manager`, `mint`, `mint_range`, `redeem`, `supply`) for the demo with the rest as stretch?
5. **Keeper flavor — in or out?** `redeem_permissionless` enables an auto-settlement keeper bot (a separate idea-bank flavor). Worth a thin add for the durability story, or a distraction from the headline?
6. **PTB builder confirmation:** exact type-arg/object-arg ordering per entry function still needs reading the `.move` source before wiring (signatures confirmed; arg-ordering spike not yet done). OK to make that the first build task?