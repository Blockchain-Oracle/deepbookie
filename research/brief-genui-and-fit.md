The docs site is blocking direct fetch on that path. I have the hook semantics already confirmed from two prior searches (returns `{bytes, signature}`, then `client.executeTransactionBlock()` + `reportTransactionEffects()`). I have enough verified material to write a complete, candid answer.

---

## Scope

Two-part research for a **DeepBook Predict** (Sui Overflow 2026) hackathon idea:
- **(A)** How to build a web app where an AI agent helps users trade but the **user signs with their own wallet** — Vercel AI SDK generative UI + Sui dapp-kit "agent proposes, user signs."
- **(B)** Honest track-fit assessment of the idea: a DeepBook Predict plugin (MCP + CLI + agent skill) **plus** a generative-UI chat-trade web app where users sign their own Predict txns.

READ-ONLY. Did not touch `/Users/abu/dev/hackathon/sui-overflow/onemem`. No external repos cloned (all findings from docs/search).

## Sources Checked

- Vercel AI SDK generative UI (useChat): https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
- Vercel AI SDK RSC streamUI: https://ai-sdk.dev/docs/ai-sdk-rsc/streaming-react-components
- AI SDK 3.0 generative UI announce: https://vercel.com/blog/ai-sdk-3-generative-ui
- DeepBook Predict blog: https://blog.sui.io/introducing-deepbook-predict/
- DeepBook Predict docs (overview): https://docs.sui.io/onchain-finance/deepbook-predict/
- DeepBook Predict **contract information** (package IDs, dUSDC, API endpoints): https://docs.sui.io/onchain-finance/deepbook-predict/contract-information
- Predict Move package source: https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict
- Sui dapp-kit hooks: https://sdk.mystenlabs.com/dapp-kit/wallet-hooks/useSignTransaction and .../useSignAndExecuteTransaction
- Sui signing/execution: https://sdk.mystenlabs.com/sui/transactions/signing-and-execution
- MCP "agent proposes, user signs" precedent: https://github.com/zhangzhongnan928/mcp-blockchain-server
- Sui MCP / agent kits: https://github.com/kukapay/sui-trader-mcp , https://github.com/tamago-labs/sui-mcp , https://github.com/caterpillardev/Sui-AI-Agent-Kit
- Non-custodial AI trading precedents: MoonPay Agents, Pioneer AI Foundry "Kora", Cobo Agentic Wallet (search results)
- Sui Overflow site (DeepBook track = $70K pool): https://overflow.sui.io/
- Judging weights: from task brief + auto-memory handbook (50/20/20/10)

Could NOT directly fetch (404/blocked, semantics confirmed via search instead): exact code block on `useSignTransaction` page; the overflow.sui.io handbook PDF.

---

## Verified Facts

### Part A — Generative UI + user-signs

**Vercel AI SDK generative UI — two paths, both real:**

1. **AI SDK UI (`useChat`) — the production path.** A tool is defined with a `description`, a Zod `inputSchema`, and an `execute` that returns **structured data** (plain JSON, not JSX). On the client, `message.parts` is an array; each tool part has `type: "tool-${toolName}"` and a `state` of `input-streaming` → `input-available` → `output-available` (or `output-error`). You `switch` on `part.state` and render your own React component, spreading `part.output` as props. This cleanly separates "the model picks a tool and fills args" from "your trusted React code renders the UI." (https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)

2. **AI SDK RSC (`streamUI`) — explicitly experimental.** Here tools have a `generate: async function*` that **yields JSX** (e.g. `yield <Loading/>; … return <Weather .../>`), streaming React Server Components from the server. The docs explicitly say: *"AI SDK RSC is currently experimental. We recommend using AI SDK UI for production."* (https://ai-sdk.dev/docs/ai-sdk-rsc/streaming-react-components)

> Implication for this project: use **`useChat` + tool parts**, NOT `streamUI`. Your "sign this transaction" widget must be a **client component** with wallet hooks — RSC server components can't hold wallet/dapp-kit state. The tool returns the *PTB description / serialized bytes as data*; the client component renders the signer.

**Sui "agent proposes, user signs" — the wallet primitives:**

- `useSignAndExecuteTransaction` (dapp-kit): build a `new Transaction()`, add `tx.moveCall(...) / tx.splitCoins / tx.transferObjects`, pass to the hook's mutate fn; wallet pops up, user approves, it signs **and** executes; `onSuccess` returns the digest. (https://sdk.mystenlabs.com/dapp-kit/wallet-hooks/useSignAndExecuteTransaction)
- `useSignTransaction` (dapp-kit): signs **without** executing — returns `{ bytes, signature }`; you then call `client.executeTransactionBlock(...)` with your own RPC and `reportTransactionEffects()` back to the wallet. Useful for sponsored-gas / custom execution. (search-confirmed from https://sdk.mystenlabs.com/dapp-kit/wallet-hooks/useSignTransaction and https://sdk.mystenlabs.com/sui/transactions/signing-and-execution)
- The Wallet Standard `sui:signTransaction` flow opens a dialog; on accept returns `{bytes, signature}`. Using `tx.serialize()` (not `tx.build()`) lets the wallet do gas/coin selection. (https://docs.sui.io/standards/wallet-standard)

**The non-custodial flow that satisfies "agent never holds keys":** The cleanest precedent is `zhangzhongnan928/mcp-blockchain-server` (EVM, but architecture ports 1:1 to Sui). Its README states the exact pattern the task is after: *"The hard problem in AI + blockchain is letting an assistant act without ever touching private keys… Private keys never reach the server. It only prepares transactions; the user's wallet signs and broadcasts them."* Flow: agent calls `prepare-transaction` → server stores it, returns a signing URL → user opens a web dapp showing tx details → connects wallet → approves → wallet signs+broadcasts → page reports hash back → agent polls status. (https://github.com/zhangzhongnan928/mcp-blockchain-server)

The Sui-native version of this is simpler because everything can live in one Next.js app: **tool `execute` returns a serialized PTB (or the params to build one) as structured data → the client tool-part renders a `<SignPredictTrade>` component → that component calls `useSignAndExecuteTransaction`.** The agent (LLM + tool layer) only ever produces *data*; signing authority stays in the browser wallet.

**Precedents for AI-agent trading frontends with user signing (verified to exist):**
- MoonPay Agents (Feb 24 2026): non-custodial layer; human does one-time KYC + funds wallet, agent then trades/swaps/transfers.
- Pioneer AI Foundry "Kora" (Solana): non-custodial agent with a **co-pilot conversational interface** for NL strategy design.
- Cobo Agentic Wallet: MPC, key split agent-share/infra-share, policy limits.
- Sui-side building blocks: `kukapay/sui-trader-mcp`, `tamago-labs/sui-mcp`, `caterpillardev/Sui-AI-Agent-Kit` (MCP tools over Sui DeFi protocols).
> Caveat (honest): most of these give the **agent** signing authority (MPC/delegated keys/autopilot). The "agent proposes, USER signs in their own wallet, agent holds no key" variant — rendered via Vercel generative-UI tool components — is **not** something I found shipped on Sui for Predict. That's the white space (good news for novelty, see Part B).

### Part B — DeepBook Predict facts that gate track-fit

**The protocol is real, live on testnet, and integratable today:**
- Predict = expiry-based prediction-market / options primitive; mint/redeem **binary positions** and **vertical ranges** against oracle prices; LPs supply quote to a shared vault for **PLP** shares. Oracle pricing via **Block Scholes** (SVI vol surface). Settlement <400ms. (https://blog.sui.io/introducing-deepbook-predict/ , https://docs.sui.io/onchain-finance/deepbook-predict/)
- **Move entry points** (branch `predict-testnet-4-16`): `predict::create_manager`, `predict::mint<Quote>`, `predict::redeem<Quote>`, `predict::redeem_permissionless<Quote>`, `predict::mint_range<Quote>`, `predict::redeem_range<Quote>`, `predict::supply<Quote>`, `predict::withdraw<Quote>`; per-user `predict_manager::deposit`; `oracle.move` exposes `OracleSVI` + events (`OraclePricesUpdated`, `OracleSVIUpdated`, `OracleSettled`, …). (https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict)
- **Testnet contract info (provisional):** Predict package `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`; Registry `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64`; shared Predict object `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`; PLP `…138::plp::PLP`; **dUSDC** quote `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` (6 dp). (https://docs.sui.io/onchain-finance/deepbook-predict/contract-information)
- **Indexer/API** base `https://predict-server.testnet.mystenlabs.com` with `/status`, `/predicts/:id/state`, `/predicts/:id/vault/summary`, `/managers/:id/pnl`, `/oracles/:id/prices` (render-ready market/vault/portfolio/history). (same contract-info page)

**Track economics & judging:** DeepBook specialized track pool ~$70K (https://overflow.sui.io/). Judging weights per brief + handbook: **50% real-world application / 20% product & UX / 20% technical / 10% presentation.** Minimum: integrate the Predict contract on testnet, working end-to-end.

---

## Inferences

**Does the idea satisfy the minimum?** Yes, cleanly. The web app's "sign this trade" component builds a PTB calling `predict::mint` / `mint_range` / `supply` against the real testnet package, signed by the user's wallet → that *is* "integrate Predict on testnet, end-to-end." The MCP/CLI/skill layer reads `predict-server` endpoints for market/vault/PnL data. Nothing speculative is required.

**Where it maps in the idea bank:** It hits **two** named flavors at once — "alt-flavor frontends: chat-based trading / PWAs" **and** "analytics & dev tooling that make Predict legible." The MCP+CLI+skill is literally *developer tooling that makes Predict legible to AI agents*; the generative-UI chat app is the *chat-based trading frontend*. That dual coverage is a real asset for the **50% real-world** weight.

**Strongest angles:**
1. **Novelty is genuinely defensible.** "Agent proposes a vol-surface-priced Predict trade as a *generative-UI component*, user signs in their own wallet, agent holds zero keys" is a combination I did not find shipped on Sui. It's the safe-by-construction answer to the agentic-trading trust problem — and it's demoable.
2. **UX score (20%) is winnable** precisely because Predict is hard to reason about (strikes, vertical ranges, SVI vol surface). A chat UI that turns "I think BTC stays between 60–65k this hour" into a rendered `mint_range` order card + vol-surface widget + one-click sign is a legible- on-ramp judges can feel. The `predict-server` `/oracles/:id/prices` and `/state` endpoints make the vol-surface/market widgets real, not faked.
3. **Distribution story for "built to last."** An MCP server + CLI + Claude/agent skill means Predict becomes reachable from any agent runtime — that's the "make Predict legible" mandate, and it survives past the hackathon.

**Weakest angles / where it dies as a thin wrapper:**
1. **"Chat over a swap" is the slop version.** If the web app is just a chatbox that emits a single `mint` PTB, it's an LLM bolted onto a form — judges have seen 50 of these. The generative-UI components (vol-surface widget, range-payoff diagram, vault/PLP card, live PnL from `/managers/:id/pnl`) are what separate it from a wrapper. They must be real, data-driven, and the *primary* surface — not a fallback to plain text.
2. **The agent must add trading judgment, not just translate.** Map NL → the *right* primitive (binary vs vertical range), pull live SVI/oracle data to show implied prob and breakevens, surface vault depth before a `supply`. If it can't reason about strikes/ranges/vol, the "AI" is decorative.
3. **Scope risk.** MCP + CLI + skill + a polished generative-UI dapp is a lot. For a winning **demo**, the web app's chat-to-sign Predict flow is the headline (50% real-world + 20% UX live there); MCP/CLI/skill are the "built to last / dev-tooling" supporting cast. Don't let three thin surfaces crowd out one deep one.
4. **Testnet IDs are provisional** ("pinned to `predict-testnet-4-16`", "provisional pending mainnet"). Pin to that branch, isolate IDs in config, expect churn. The handbook's mainnet-by-Aug-27 rule means a testnet-only build is fine for judging but plan the config seam.

**What makes it a *clear* winner vs. a wrapper:**
- The signing component is a true generative-UI artifact (rendered order card + vol-surface + range-payoff), not a text "click here."
- Live data from all five `predict-server` endpoints visibly drives the UI.
- The agent demonstrably chooses primitive + strikes/ranges from NL and explains implied probability/breakeven from the SVI oracle.
- One headline flow (chat → rendered Predict order → user-signed testnet tx → live PnL) shown end-to-end, with MCP/CLI/skill framed as the "any agent can now trade Predict" durability layer.

## Unknowns And Questions

1. **Exact `useSignTransaction` code block** — the dapp-kit page 404'd on direct fetch; semantics confirmed (`{bytes,signature}` → `executeTransactionBlock` → `reportTransactionEffects`) but I didn't capture the verbatim snippet. Recommend pulling it via the live docs site or `npm` README before coding.
2. **dUSDC faucet path on testnet** — contract-info mentions "token requests" for DUSDC but I didn't capture the exact faucet/mint route. Verify before the demo (users need dUSDC to sign a real `mint`).
3. **PTB shape per entry function** — exact type args/object args ordering for `predict::mint<Quote>` / `mint_range<Quote>` / `supply<Quote>` (manager, predict object, oracle, clock, coin) needs reading the actual `.move` source on the branch before wiring the PTB builder. Not yet captured at signature level.
4. **Official idea-bank wording & per-place prize split** — confirmed the DeepBook pool is ~$70K and the $35K-1st figure is in the brief, but the official handbook PDF (idea bank, exact 1st/2nd/3rd split, any "must integrate X" sub-rules) was not directly fetchable; worth confirming against the participant handbook.
5. **Whether judges reward MCP/CLI/skill breadth or penalize split focus** — unverifiable; my inference is "depth on one headline flow beats three thin surfaces," but the sponsor's actual weighting of the dev-tooling flavor vs. frontend flavor isn't documented.