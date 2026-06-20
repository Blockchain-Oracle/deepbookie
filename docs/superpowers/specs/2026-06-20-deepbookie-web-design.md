# DeepBookie Web — Design Spec

**Date:** 2026-06-20 · **Phase:** 4 (web genUI app) + 5 (landing) · **Status:** approved-pending-review

The headline surface for DeepBookie: a generative-UI web app where you talk to an agent that
prices DeepBook Predict bets off a live vol surface, and **you sign every write yourself** in your
browser wallet. The agent holds no key. Plus the full responsive product around it — onboarding,
Markets / Positions / Vault / History pages, and a premium landing page. Built on the design-system
export the user delivered (Foundation / Brand / App / DesktopPages / Components / Onboarding /
Landing / Demo `.dc.html`).

This spec is the contract for the implementation plan. It reuses everything already shipped:
`@deepbookie/predict-client` (PTB builders, indexer readers, SVI→N(d2) math) and `@deepbookie/core`
(the 18-tool registry) run **inside the web app, on both server and client**.

---

## 1. Goals & non-negotiables

**Goal.** Ship the complete responsive web product (desktop + tablet + mobile *screen views*, not a
native app): landing → wallet connect → onboarding → genUI chat with sign-at-the-edge → Markets,
Positions, Vault, History pages. Premium, fast, real testnet data, nothing faked.

**Inherited non-negotiables** (from `CLAUDE.md`):
- Structured logging — **Pino on the server** (route handlers / API); a thin client logger that is a
  no-op in production. Never raw `console.log` in committed code.
- **Named constants, no magic numbers** — all IDs, scaling, URLs, cache TTLs, poll cadences live in
  `lib/constants.ts` (re-exporting `@deepbookie/predict-client` constants where they exist).
- **Files ≤ 300 lines** (soft 200). The component/module breakdown in §12 is sized to honor this.
- **Errors handled at the edge** (route handlers, hooks, widgets), never swallowed silently; every
  data surface has the loading / empty / error states the design specifies.
- **Manual-test every feature as built** against real testnet (§13) — never batch testing to the end.

**Tooling truth from research** (see memories + the three research briefs folded into this spec):
- `@mysten/dapp-kit-react` / `-core` are a **ground-up rewrite** of the legacy `@mysten/dapp-kit` —
  different API (single `createDAppKit` instance, BYO TanStack Query, action-based signing).
- AI SDK v6 (`ai@6` + `@ai-sdk/react@3`), **non-RSC** (`useChat`, typed message parts).
- The Predict indexer's `/oracles` is 2.2 MB / ~15 s / uncached → a server cache for the markets
  list is required, not optional ([[predict-indexer-perf-profile]]).

---

## 2. Architecture — one app, three data paths

A new workspace package `apps/web` (`@deepbookie/web`, Next.js App Router). Three distinct paths;
keeping them distinct is the core of the data design.

| Path | Serves | Mechanism |
|---|---|---|
| **① AI chat** | the conversation | `useChat` → `POST /api/chat` (`streamText` + core tool registry) → streamed tool calls render as widgets |
| **② Data BFF** | Markets / Positions / Vault / History | TanStack Query → `/api/*` route handlers (thin typed layer over `predict-client`/indexer; cached + projected to clean DTOs) |
| **③ Direct chain** | balances, the exact pre-sign quote, signing | browser → Sui fullnode via dapp-kit `useCurrentClient()`; **never cached** |

The data pages (②③) are fully independent of the agent (①) — this is the user's "Markets needs a
client point, not the MCP" requirement. Both sides share `@deepbookie/predict-client`.

**Shared-library reuse (the elegant part):** `@deepbookie/core` depends only on `predict-client`
(+ `@mysten/sui`), so it is browser-safe. The **same** write-tool `build()` functions run
client-side to construct the unsigned `Transaction` for signing; the **same** read-tool `execute()`
functions run server-side in `/api/chat`. One registry, both sides (§5).

---

## 3. The hybrid data layer (validated empirically)

Probed live on 2026-06-20 ([[predict-indexer-perf-profile]]). Evidence drove every row below.

**Decision table — what reads from where, and the cache policy:**

| Data | Source | Cache / cadence |
|---|---|---|
| Wallet dUSDC + SUI balance | **chain direct** `client.getBalance` | none; poll 5 s; invalidate on write |
| Exact pre-sign quote | **chain direct** `devInspect get_trade_amounts` | none; on-demand right before signing |
| Sign + execute | **chain direct** dapp-kit action | n/a |
| On-chain position/redeemable confirm (at redeem) | **chain direct** | none |
| Markets list (active) | BFF over `/oracles` → filter `active` + project | server cache ~10 s + `revalidateTag('markets')`; client poll 10 s |
| Odds / SVI curve (per market) | BFF over `/oracles/{id}/state` (bundles spot+forward+SVI) | server cache ~3 s; client poll 3 s |
| Vault summary | BFF over `/predicts/{id}/vault/summary` | server cache ~10 s; client poll 10 s |
| Vault performance series | BFF over `…/vault/performance` → **downsample 1326→~120** | server cache ~30 s |
| Positions / PnL / redeemable | BFF over `/managers/{id}/{summary,pnl,positions}` | server cache ~5 s (per-wallet key) |
| Activity tape | BFF over `/positions/minted` → project | server cache ~4 s; client poll 4 s |

**Why all indexer reads go through the BFF** (not client-direct, even though CORS is `*`):
centralized timeout + retry (cold-starts spiked to 5–20 s once), projection of raw `×1e9` ints and
17-field events into small typed DTOs, and one cache policy. *Rejected:* client-direct everywhere —
fails the 15 s `/oracles` call and gives zero cold-start resilience. The BFF runs `predict-client`
server-side, so projection logic is the existing readers + `units.ts`.

**Trust-critical reads bypass every cache** because the indexer lags chain ~7 s — fine for a curve,
unacceptable for the number you sign. Those hit the fullnode directly from the browser.

**Constants** (`lib/constants.ts`, no magic numbers): `REVALIDATE = { markets:10, curve:3, vault:10,
vaultPerf:30, manager:5, activity:4 }` and matching `POLL = {...}` for TanStack `refetchInterval`,
plus `STALE` < `POLL` per series and `INDEXER_TIMEOUT_MS`, `INDEXER_RETRIES`.

**Cache invalidation after a signed write:** `await client.waitForTransaction({digest})` →
`POST /api/revalidate` (busts `revalidateTag('markets'|'activity'|…)`) → `queryClient.invalidateQueries`
for `['balance']`, `['positions']`, `['odds', marketId]`. Client invalidation makes the UI feel
instant; the tag-bust keeps other users from briefly seeing the pre-write snapshot.

---

## 4. Model / provider layer (env-driven, provider-agnostic)

No user-facing model picker (operator concern, not a user one). Provider + model chosen by env via
the AI SDK provider registry; each provider reads its own key.

```ts
// lib/ai/model.ts
import { anthropic } from '@ai-sdk/anthropic';   // ANTHROPIC_API_KEY
import { openai } from '@ai-sdk/openai';          // OPENAI_API_KEY
import { createProviderRegistry } from 'ai';
const registry = createProviderRegistry({ anthropic, openai });
export function getModel() {
  const provider = process.env.MODEL_PROVIDER ?? 'anthropic';
  const id = process.env.MODEL_ID ?? 'claude-haiku-4-5';
  return registry.languageModel(`${provider}:${id}`);
}
```

- **Default:** `claude-haiku-4-5` ($1/$5, ~$0.004/turn, fastest). **OpenAI fallback:** `gpt-5.4-mini`
  ($0.75/$4.50). **Escalation:** `claude-sonnet-4-6` for hard turns. **No Opus** (budget blow-up risk).
- **Enforce one tool-call per turn** (our propose→sign loop signs one tx per step): Anthropic
  `providerOptions.anthropic.disableParallelToolUse = true`; OpenAI `parallelToolCalls: false`.
  Applied based on active provider.
- **Keep tool input schemas simple** (no recursion / min-max / exotic JSON-schema keywords) so the
  cheap OpenAI and Anthropic models behave identically when switched blind.
- **Prompt caching:** stable system + tools prefix → ~halves real input cost on both providers.
- Optional dev-only model switch behind a flag (`NEXT_PUBLIC_DEV_MODEL_TOGGLE`), never shipped on.

---

## 5. genUI chat + sign engine (the headline)

**Server `POST /api/chat`** — `streamText({ model: getModel(), tools, messages })` →
`toUIMessageStreamResponse()`. Request body carries `{ messages, walletAddress, chatId }`;
`walletAddress` is closed over so read tools can `devInspect` with the real sender.

**Tool wiring from `@deepbookie/core`:**
- **Read tools** (`list_markets`, `get_market`, `get_odds`, `get_quote`, `get_range_quote`,
  `get_vault`, `get_vault_history`, `get_portfolio`, `get_positions`, `get_recent_bets`) keep an
  `execute` that calls the registry's `read()` → streamed back as `output-available` → rendered as a
  widget.
- **Write tools** (`create_manager`, `mint`, `redeem`, `redeem_permissionless`, `mint_range`,
  `redeem_range`, `supply`, `withdraw`) are registered with **no `execute`**. The tool call lands
  client-side carrying the user's intent (underlying / strike$ / direction / quantity, etc.).

**The sign handshake (keyless):**
1. Agent typically calls `get_quote` first (server, resolves market + prices) so the user sees the
   curve + receipt preview.
2. Agent calls e.g. `mint` (no execute). Client receives the tool part in `input-available`.
3. Client widget builds the unsigned `Transaction` by calling the **same core write-tool `build()`**
   with a browser-side context (`useCurrentClient()` = `SuiJsonRpcClient`); `resolveMarket` runs in
   the browser (indexer fetch + grid snap, both browser-safe).
4. User signs: `dAppKit.signAndExecuteTransaction({ transaction })` → result
   `{ $kind:'Transaction', Transaction:{ digest, effects } }` (or `FailedTransaction`).
5. `await client.waitForTransaction({digest})`, then `addToolResult({ tool, toolCallId, output:{digest} })`
   (or the `output-error` form). `useChat`'s `sendAutomaticallyWhen:
   lastAssistantMessageIsCompleteWithToolCalls` resumes the stream so the agent reacts to the digest.
6. Invalidate caches (§3).

**Tool → widget map** (each a typed renderer keyed by `part.type === 'tool-<name>'` × `part.state`):

| Tool(s) | Widget | States map to design |
|---|---|---|
| `get_odds`, `get_market` | **OddsCurveCard** | loading → empty → error → live → settled |
| `get_quote` / write proposal | **SignReceipt** | loading → proposed (ink) → signing → signed (green+stamp+digest) → cancelled/failed |
| `get_range_quote` | **RangePayoff** (payoff diagram) | recomputing → ready |
| `get_portfolio` | **PortfolioRollup** | account value / unrealized / realized / open exposure |
| `get_positions` | **PositionCard list** | active / settled-redeemable |
| `get_vault`, `get_vault_history` | **VaultCard** | pool value / share price / utilization / your PLP |
| `get_recent_bets` | **ActivityTape** | live tape |
| `list_markets` | **MarketTable / MarketHeader pills** | live / settling / settled |

Transient agent status (e.g. "pricing…") via AI SDK custom **data parts** (`data-*`, `transient`)
read through `onData`; widget payloads ride tool parts.

**Persistence:** `toUIMessageStreamResponse({ originalMessages, generateMessageId, onFinish })`
saves the full `UIMessage[]`; reload hydrates `useChat({ id: chatId, messages })`; restored messages
pass `validateUIMessages({ messages, tools })` so tool parts re-type against the registry (History
restores "exactly as signed").

---

## 5.1 Conversational memory & per-user isolation

**Within-session memory is automatic — it *is* the message thread, replayed every turn.** `useChat`
holds the full `UIMessage[]` and `DefaultChatTransport` POSTs the **entire** array each turn; the
route does `convertToModelMessages(messages)` → `streamText({ messages })`, so the model re-reads the
whole conversation on every call. The flow "send $10 → *what address?* → `0x…` → done" works **by
default** — the model sees its own earlier question + the original intent + the new value together.
The broken "why are you giving me an address?" only happens if an app fails to resend history, which
we never do. **No Redis/DB is needed for coherence** — the thread is the memory.

- **Tool-pair integrity (load-bearing):** assistant tool-call parts and their tool-result parts stay
  paired and in chronological order in the thread, so a half-finished sign (e.g. "minting 100 UP")
  still knows what it was doing on the next turn. `convertToModelMessages` requires the pairing;
  `validateUIMessages` enforces it on restore.
- **Long-thread safety:** there is **no auto-truncation**. Before `streamText`, run `pruneMessages`
  (v6 helper — strips old reasoning/tool chunks, by message count) and/or slice to last N + a
  summarization pass once per-call `usage` nears the context window. Limits live in `constants.ts`.

**Per-user isolation — guaranteed by construction, enforced by hard rules.** The backend is
stateless: each request carries only that wallet's `messages`; `streamText`, the tool closures, and
identity are all created **inside the handler** and die with the response. Two users = two
independent invocations with zero shared state. The *only* way to cause catastrophic cross-user bleed
(User B's pasted address surfacing in User A's chat) is to break one of these rules — so they are
non-negotiable in `app/api/chat/route.ts`:

1. **No per-user state in module/global scope** — never a module-level `let history` / mutable `ctx`
   / "current user" singleton / reused `streamText` instance. A route module is shared across all
   requests on a server instance → last-writer-wins bleed.
2. **One `streamText` per request**, constructed in the handler.
3. **Key every persisted row by wallet** (`chats.wallet_address`, …).
4. **Scope every query by the authenticated wallet, never client id alone**
   (`WHERE chat_id=$1 AND wallet_address=$authed`) — id-only load is an IDOR.
5. **Ownership check before load/save/continue** (`chat.wallet_address === authed`, else 404).
6. **Tools close over the request's wallet**, not a shared context object; write tools encode it as
   the PTB sender.
7. **Stamp `wallet_address` from the server session** on write; ignore any client-sent `wallet` for
   authorization.

The §3 split already minimizes exposure: balances and the exact pre-sign quote are read **direct from
the browser** (path ③), so the most sensitive per-user data never transits shared server memory.

**Wallet binding (auth tiers):** chatId namespaced by wallet + per-request ownership check is the
pragmatic testnet bar — it stops accidental bleed and casual IDOR, and a forged identity can at worst
read/seed a chat but **cannot move funds** (writes are user-signed PTBs). The real bar, required
before any real-value deploy, is **signed-message auth**: server nonce → `signPersonalMessage` via
dapp-kit → verify against the claimed address → short-lived session bound to it; identity then comes
from the verified session, never the request body.

**Deferred (see §16):**
- **Cross-session "working memory"** (remembering "my friend's address" across days): **not needed** —
  session-scoped is sufficient and lower-risk. If wanted later: a per-wallet
  `user_facts(wallet_address, key, value)` table injected into the system prompt for that wallet
  only, behind signed-message auth.
- **Redis / resumable streams** (reconnecting to an *in-progress* generation after a mid-stream
  disconnect): orthogonal to memory; our turns are short tool-driven generations, so the window is
  tiny. Strictly additive later (Redis pub/sub + a `GET` stream route) with zero change to
  persistence.

---

## 6. Wallet + onboarding (new dapp-kit)

- `createDAppKit({ networks:['testnet'], defaultNetwork:'testnet', createClient: (n)=> new
  SuiJsonRpcClient({ network:n, url:getJsonRpcFullnodeUrl(n) }) })` in a plain module
  (`lib/dapp-kit.ts`, no `'use client'`); `declare module` registers the instance type.
- `DAppKitProvider dAppKit={…}` + **BYO** `QueryClientProvider` in a `'use client'` wrapper,
  **dynamic-imported with `ssr:false`** (autoconnect needs `window`; otherwise hydration mismatch).
- `ConnectButton` from `@mysten/dapp-kit-react/ui`. Theming via **shadcn-style CSS vars** — our
  design tokens drive the wallet modal too (§9).
- Hooks: `useCurrentAccount`, `useWalletConnection`, `useCurrentNetwork`, `useCurrentClient`,
  `useDAppKit`. Reuse `constants.ts` for the exact `SuiJsonRpcClient` constructor shape (already
  proven in `predict-client`).

**Onboarding flow** (design Onboarding/MobileOnboarding): connect → **wrong-network guard** (banner
when `!account.chains?.includes('sui:testnet')`) → **fund dUSDC** (faucet card; balances read live
on-chain; the funding state is part of the flow, not an error). "Skip — explore markets first" path
allowed; betting gated on dUSDC > 0 with the warm funding prompt.

---

## 7. App shell + responsive

One shell, responsive screen views:
- **Mobile** = 4-tab bottom nav: Chat · Positions · Vault · History (markets surface inside chat).
- **Desktop** = persistent left nav, 5 items: Chat · Markets · Positions · Vault · History.
- **Tablet** = left nav collapses / hybrid per the Tablet export.
- Top bar: logo + TESTNET chip + wallet/account chip (address + live balance).

Breakpoints + nav components in §12. Tailwind responsive utilities; the design's exact paddings,
radii, and type scale.

---

## 8. The five surfaces (data sources)

- **Chat** — path ①; the genUI spine; composer with "Ask, or refine the bet…"; camera/motion polish.
- **Markets** (desktop) — BFF markets list (status filters Live/Settling/Settled) + per-row Trade →
  opens curve; table per DesktopPages + Components-Support data-table.
- **Positions** — rollup (account value / unrealized / realized / **open exposure**) + position rows
  (active / settled-redeemable with Redeem →). BFF manager summary+positions+pnl; redeemable
  confirmed on-chain at redeem; redeem is a signed receipt. **owner→manager_id resolution:** the
  indexer manager endpoints key on `manager_id`, not owner address — resolve via on-chain
  `getOwnedObjects` (filter to the `PredictManager` type) on first load, cache the id client-side,
  and capture it from the `create_manager` digest when the user first onboards. Surface the
  "no manager yet → create one" state for fresh wallets.
- **Vault** — pool value / share price / utilization / max-payout-util / available liq + withdrawal +
  PLP supply (BFF vault summary+performance) and **your PLP position**; Supply / Withdraw are signed
  receipts. "Inside the vault also consists of current positions" → show pool exposure context.
- **History** — the DB surface (§10); desktop 3-pane (nav · sessions list · transcript); restores a
  session exactly as signed (receipts, stamps, digests, Suiscan links intact).

---

## 9. Design-system foundation

One token layer → Tailwind theme **and** dapp-kit CSS vars.

- **Color:** ink `#1A1714`, paper `#F4F2EC`, canvas `#E4E2DC`, card `#FFFFFF`, signal-green
  `#2C5E4A` (up/live/signed), clay `#B0452B` (down/error), wallet-blue `#4DA2FF`, mint `#7Fcaa6`.
  Direction never by color alone — always paired with ↑/↓ + label.
- **Type:** Schibsted Grotesk (display/UI: 800/-0.04em, 700/-0.03em, 400/1.5) + IBM Plex Mono
  (figures/labels/ids, tabular nums).
- **Space/radius/elevation:** 4 px base; radii 8 card-inner / 14 card / 42 phone / 99 pill; three
  elevations (hairline / raised / float).
- **Motion principles:** deliberate (14 px rise + fade, 0.5–0.55 s ease-out), the camera (push-in to
  curve & receipt), the sign (spinner → stamp slam with gentle overshoot), live data (1.8 s pulse on
  live dot; curve eases between updates). Respect `prefers-reduced-motion`.
- **The receipt treatment** is the signature object: ink top-rule = proposed, green = signed, dashed
  = void; doc number, hairline rows, tabular figures, wax-seal stamp, on-chain digest.
- **Components (the kit):** two heroes (OddsCurveCard, SignReceipt) + supporting (WalletChip,
  MarketHeader/pill, QuotePreview, RangePayoff, DataTable, Toasts/Banners). Every state from the
  Components / Components-Support exports.

---

## 10. History persistence (Neon Postgres + Drizzle)

- **Stack:** Neon serverless Postgres + Drizzle ORM, deployed on Vercel.
- **Schema:** one row per session — `chats(id, wallet_address, title, messages jsonb, created_at,
  updated_at)`. The whole `UIMessage[]` is stored as the `messages` blob (AI SDK persists/restores
  it as a unit; no message-level queries needed). Indexed on `wallet_address`.
- **Endpoints:** `GET /api/chats?wallet=` (list/sessions), `GET /api/chats/{id}` (restore),
  persistence on `onFinish` in `/api/chat`. `validateUIMessages` on restore.
- **Funds stay on-chain** — only transcripts live in the DB ("not in our database" holds for money).

---

## 11. Landing page + animated demo

Per Landing/Demo exports. Sections: hero with the **looping animated demo** (type → think → curve
draws → camera zoom → receipt → wallet sheet → SIGNED stamp), "How it works" (3 steps), dark trust
band ("smart but powerless"), odds-curve glimpse, open-protocol band (CLI / any AI client / this
app), final CTA + footer. The demo is a self-contained client component (pure CSS transitions + `setTimeout` sequence, no real
chain calls — it's a scripted loop) — port the `Demo.dc.html` animation timeline directly to React.

---

## 12. Module structure (every file ≤ 300 lines)

```
apps/web/
  package.json  next.config.ts  drizzle.config.ts  tailwind.config.ts  postcss  tsconfig
  src/
    app/
      layout.tsx                  globals.css (tokens as CSS vars + fonts)
      page.tsx                    # landing
      (app)/layout.tsx            # shell: desktop left-nav / mobile tab-bar + top bar
        chat/page.tsx  markets/page.tsx  positions/page.tsx  vault/page.tsx  history/page.tsx
      api/
        chat/route.ts             # streamText + tools + persistence
        markets/route.ts  markets/[id]/route.ts
        vault/route.ts  vault/performance/route.ts
        positions/route.ts        # manager summary+pnl+positions by ?manager= / ?owner=
        activity/route.ts  revalidate/route.ts
        chats/route.ts  chats/[id]/route.ts
    lib/
      constants.ts  logger.ts  dapp-kit.ts  sui.ts
      ai/ model.ts  tools.ts  prompt.ts  message-types.ts
      bff/ markets.ts vault.ts positions.ts activity.ts  (typed fetch+project over predict-client)
      db/ schema.ts  client.ts  chats.ts
      hooks/ useBalances.ts useMarkets.ts useOddsCurve.ts usePositions.ts useVault.ts
             useActivity.ts useSubmitTx.ts useChatPersistence.ts
    components/
      providers/ DappKitClientProvider.tsx QueryProvider.tsx
      shell/ AppShell.tsx DesktopNav.tsx MobileTabBar.tsx TopBar.tsx WalletChip.tsx NetworkGuard.tsx
      chat/ Chat.tsx Composer.tsx MessageList.tsx MessagePart.tsx
      widgets/ OddsCurveCard.tsx SignReceipt.tsx QuotePreview.tsx RangePayoff.tsx
               PositionCard.tsx PortfolioRollup.tsx VaultCard.tsx ActivityTape.tsx
               MarketHeader.tsx MarketTable.tsx Toast.tsx
      onboarding/ ConnectScreen.tsx FundingScreen.tsx
      landing/ Hero.tsx DemoPhone.tsx HowItWorks.tsx TrustBand.tsx OddsGlimpse.tsx
               OpenProtocol.tsx Cta.tsx Footer.tsx
      ui/ Button.tsx Card.tsx Stat.tsx Pill.tsx Skeleton.tsx Sparkline.tsx
      foundation/ tokens.ts fonts.ts
```

Large widgets (OddsCurveCard, SignReceipt) split into sub-parts if they approach 300 lines.

---

## 13. Verification (manual-test per feature)

- **Data layer:** each BFF endpoint hit against live testnet; assert projected DTO shapes + cache
  headers + timeout behavior (kill-switch test with a bad upstream).
- **Widgets/states:** rendered via the Claude Preview MCP (`preview_start` / `screenshot` /
  `click`) with real BFF reads; verify loading/empty/error/live/settled per component.
- **Sign flow:** manually in a real browser with a Sui wallet on testnet — capture a real digest for
  a `mint` and a `redeem`; verify SIGNED stamp + Suiscan link + cache invalidation + History restore.
- **Responsive:** desktop / tablet / mobile breakpoints via Preview MCP resize.
- **Provider switch:** run once on Anthropic (`claude-haiku-4-5`) and once on OpenAI
  (`gpt-5.4-mini`) to confirm env-driven parity + one-tool-call enforcement.

---

## 14. Build sequencing (everything ships; responsive at each step)

1. **Foundation** — `apps/web` scaffold, Tailwind tokens + fonts, `ui/` primitives, CI wiring.
2. **Wallet + onboarding** — providers (ssr:false), connect, network guard, funding, live balances.
3. **Data BFF + hooks** — route handlers + TanStack hooks + constants (the §3 table).
4. **genUI chat + sign engine** — `/api/chat`, model layer, tool→widget renderers, the sign handshake.
5. **Data pages** — Markets, Positions, Vault (read surfaces over the BFF) + write receipts.
6. **History** — Neon+Drizzle, persistence, sessions 3-pane, restore.
7. **Landing + animated demo** — marketing surface; the looping hero.
8. **Polish + deploy** — motion, empty/error states, Vercel deploy, env config.

Review cadence per `CLAUDE.md`: `pr-review-toolkit` over each phase's diff + manual-test; PR every
~2 phases; merge to `main` only on green CI.

---

## 15. Risks & mitigations

- **Indexer cold-starts (5–20 s spikes):** BFF timeout + retry + the design's error/empty states;
  client keeps last good data (`placeholderData: prev`).
- **`/oracles` 2.2 MB/15 s:** server cache + project to active-only small DTO (mandatory, §3).
- **dapp-kit new-package churn / version drift:** pin at install; reuse proven `SuiJsonRpcClient`
  construction from `predict-client`; `useCurrentClient()` may need a cast to call JSON-RPC-only
  methods (or use `client.core.*`).
- **Sign handshake correctness:** the unsigned-tx is built client-side from the same core `build()`;
  arg-ordering already proven on testnet ([[dusdc-acquisition-testnet]]); manual digest capture in §13.
- **Provider-switch divergence:** one-tool-call enforced + simple schemas (§4).
- **dUSDC operator-gated:** funding via faucet/tally per [[dusdc-acquisition-testnet]]; never mint
  from a treasury cap.

---

## 16. Out of scope (v1)

Margin/maintainer/admin tools (testnet-blocked), spot swap-to-fund (dUSDC not spot-tradeable),
non-wallet auth, multi-device transcript sync, WebSocket streaming (polling suffices),
**Redis-backed resumable in-progress-stream reconnect** and **cross-session working memory**
(per-wallet remembered facts) — both deferred, rationale in §5.1. Signed-message wallet auth is a
fast-follow required before any real-value deploy (§5.1).
