# SPEC — Slice A: "Sign in with Google" (Enoki zkLogin) for DeepBookie web

## Goal
Let a user onboard to the DeepBookie web app by signing in with Google instead of
only a browser-extension wallet. Enoki's zkLogin derives a real Sui **testnet**
address from the Google login; that address shows up in the existing
`@mysten/dapp-kit` `ConnectButton` modal and can sign DeepBook Predict bets through
the unchanged `useSignAndExecuteTransaction` path. **Scope = login only.** No gasless
/ sponsored transactions yet (that is Slice B) — a Google user pays their own SUI gas.

## Constraints
- Legacy `@mysten/dapp-kit@1.1.1` stack ONLY (NOT dapp-kit-react). Per CLAUDE.md.
- Pin `@mysten/enoki@~1.1.0` (peer `@mysten/sui ^2.18.0`) to stay compatible with the
  repo's `@mysten/sui ^2.19.0` — do NOT bump sui (would ripple into predict-client).
- Port the proven pattern from `onemem/apps/hosted-dashboard/components/HostedProviders.tsx`.
- Google registration is env-gated: only registers when both
  `NEXT_PUBLIC_ENOKI_API_KEY` and `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID` are present.
  Missing env → app behaves exactly as today (extension-only), no crash.
- Touch only: `apps/web/src/components/providers/DappKitClientProvider.tsx`,
  `apps/web/.env.local` (+ `.env.example`), `apps/web/src/components/onboarding/ConnectScreen.tsx`.
- Files ≤ 300 lines; no `console.log` (Pino elsewhere; provider is client component).
- Agent holds no key — signing stays at the edge.

## Acceptance
- `pnpm build`, `pnpm lint`, `pnpm typecheck` pass in the worktree.
- With env set, `ConnectButton` modal lists "Sign in with Google" alongside extensions.
- Clicking it (from an Enoki-allowlisted origin) completes Google OAuth and yields a
  testnet address via `useCurrentAccount`; a bet can be signed (user pays gas).
- With env unset, no Google entry appears and nothing throws (graceful degrade).
- Fresh-context reviewer (Codex) finds no blocking issues.
- Known external dependency documented: the dev origin must be allowlisted in the
  Enoki portal + Google OAuth client (origin lock) — keys are currently scoped to
  OneMem's `localhost:3001` / app.onemem.xyz.
