I have all facts verified against real code and primary docs. Here is the deliverable.

---

## Scope

Verify the user's "LOCAL wallet auto-created on init + social recovery" correction against real code, and extract the local-wallet lifecycle (create-on-init → store → recover → sign) with file:line citations from `xlmtools` (Stellar), `pacifica-mcp` (Solana), and `portaldot-mcp` (Polkadot). Compare to private-key-in-env, identify a better approach for a **Sui DeepBook Predict** local MCP/CLI, and confirm the WEB surface = user signs via extension wallet (dapp-kit).

## Sources Checked

- `/tmp/xlmtools` (Blockchain-Oracle/xlmtools, Stellar) — `packages/cli/src/lib/wallet.ts`, `lib/config.ts`, `lib/api-fetch.ts`, `server.ts`, `tools/wallet-tool.ts`
- `/tmp/pacifica-mcp` (Blockchain-Oracle/pacifica-mcp, Solana) — `packages/cli/src/lib/wallet.ts`, `lib/signing.ts`, `tools/market-order.ts`, `tools/withdraw.ts`, README
- `/tmp/portaldot-mcp` (Blockchain-Oracle/portaldot-mcp, Polkadot) — `packages/core/src/chain/wallet.ts`, `tools/transfer.ts`, `packages/web/lib/polkadot.ts`, `web/public/skill.md`, `CLAUDE.md`
- Primary docs: Sui keytool CLI (docs.sui.io/references/cli/keytool), Enoki (docs.enoki.mystenlabs.com), Sui zkLogin (docs.sui.io/concepts/cryptography/zklogin)
- Web/GitHub survey of Solana/Sui trading & wallet MCPs (sendaifun, Helius, agenti, WalletMCP)

## Verified Facts

### (a) Auto-create-on-init + storage — CONFIRMED in all three repos

All three are the **same pattern**: a single `loadOrCreateWallet` / `getSigner` function that (1) checks an env override, (2) loads a JSON config from `~/.<tool>/config.json`, else (3) generates a fresh key and writes it to that file with `0o600` perms. Triggered once at server/CLI startup.

| Repo | Key type | Store path | Stored material | Perms | Cite |
|---|---|---|---|---|---|
| xlmtools | Stellar Ed25519 | `~/.xlmtools/config.json` | raw secret seed (`Keypair.random().secret()`, `S...`) | `0o600` | `wallet.ts:14-15, 88-101` |
| pacifica | Solana Ed25519 | `~/.pacifica-mcp/config.json` | base58 64-byte secret | `0o600` | `wallet.ts:8-9, 43-56` |
| portaldot | sr25519 | `~/.portaldot-mcp/config.json` | **12-word BIP39 mnemonic** | `0o600` | `chain/wallet.ts:10-11, 40-43` |

- **Init flow (xlmtools):** `createMcpServer()` → `await initWallet()` (`server.ts:48-49`). `initWallet` calls `loadOrCreateWallet()`, and if the config is new, prints the address and auto-funds on **testnet only** via friendbot + USDC trustline (`wallet.ts:33-86, 115-153`). Mainnet auto-fund is explicitly blocked (`wallet.ts:35-39`).
- **Storage is PLAINTEXT at rest** in every case — the only protection is `0o600` file mode (owner-only). No encryption, no passphrase, no OS keychain in any of the three. Cited: `xlmtools wallet.ts:101`, `pacifica wallet.ts:54-56`, `portaldot chain/wallet.ts:42`.
- **Env override** exists everywhere (private-key-in-env still supported as an escape hatch): `PACIFICA_PRIVATE_KEY` (`pacifica wallet.ts:23-35`), `PORTALDOT_SEED_PHRASE` (`portaldot chain/wallet.ts:31-32`), `STELLAR_NETWORK`/`XLMTOOLS_API_URL` (`xlmtools wallet.ts:35, 97`).
- pacifica additionally persists **subaccount** keys to `~/.pacifica-mcp/subaccounts/<addr>.json`, `0o600`, "never returned through the AI context" (`wallet.ts:95-114`).

### (b) Social recovery — DOES NOT EXIST in any of the three repos

The user's correction is **half right**: auto-create-on-init is real and is the modern pattern; **"social recovery" is not present in any of these codebases.** Grep for `recover|guardian|social|mnemonic|seed phrase` across all `src/` and `docs/` returns:
- xlmtools: zero recovery code (only "social posts" in image-tool docs).
- pacifica: zero — README explicitly says a subaccount key "cannot be recovered" (`cli.ts:997`); recovery story is "copy the private key and import into Phantom/Backpack" (`wallet.ts:66-71`).
- portaldot: the **mnemonic IS the recovery** — a standard BIP39 12-word phrase. `generate_account` returns it with the note "The mnemonic is the secret — store it safely" (`tools/utils.ts:12, 16-18`). That is **self-custody seed-phrase backup, not social recovery** (no guardians, no threshold, no on-chain recovery contract).

So: the safety mechanism actually shipped in these wallet-MCPs is **(1) a backup phrase (portaldot) and (2) re-import into a real wallet (pacifica)** — plus testnet-only defaults. "Social recovery (xlmtools/Pacifica pattern)" as stated in the task is not a thing that exists in either repo. The web survey corroborates: across Solana/Sui agent MCPs (sendaifun Solana-agent-kit, Helius `generateKeypair`, agenti, WalletMCP) the norm is auto-generate-keypair + local file; **none surfaced a social-recovery/guardian mechanism.** Social recovery in crypto today lives in *smart-contract account* products (Argent, Safe, Soul Wallet, Sui's own multisig), not in agent MCP keystores.

### (c) Local signing path — CONFIRMED, agent signs writes locally

- **xlmtools (payments):** `getKeypair(config)` rebuilds the `Keypair` from the stored secret (`wallet.ts:155-157`); it's handed to `Mppx.create({ methods: [stellar.charge({ keypair, mode:"pull" })] })`, which polyfills `fetch` to auto-sign Soroban USDC transfers on 402 (`server.ts:50-63`). Trustline setup signs directly: `tx.sign(keypair)` (`wallet.ts:76`).
- **pacifica (trades):** every write tool does `config = loadOrCreateWallet(); keypair = getKeypair(config); signed = signRequest(type, data, keypair.secretKey, config.publicKey)` then POSTs (`tools/market-order.ts:37-51`; same in withdraw). `signRequest` builds `{timestamp, expiry_window, type, data}`, recursively sorts keys, compact-stringifies, signs UTF-8 bytes with `nacl.sign.detached`, base58-encodes (`lib/signing.ts:44-80`). Pure local Ed25519.
- **portaldot (extrinsics):** `signer = await getSigner()` then `tx.signAndSend(signer, …)` waiting for in-block inclusion (`tools/transfer.ts:19-27`; pattern repeated in tokens/staking/identity/contracts).

The agent (server process) holds the key and signs in-process — **no human approval step locally**, which is the whole point of the headless MCP.

### (d) WEB surface — CONFIRMED, user signs via extension wallet, agent does NOT sign

portaldot-mcp is the exact dual-surface architecture the DeepBook plan describes, and it makes the split explicit:
- `CLAUDE.md:5`: "packages/web — Next.js + **AI SDK v5 generative-UI** chat for humans. **Browser injected-wallet signing; the server never holds keys.**"
- `web/lib/polkadot.ts:22-35`: `signAndSendTransfer` imports `@polkadot/extension-dapp`, gets `web3FromAddress(fromAddress)`, and signs with `{ signer: injector.signer }` — the **browser extension** signs.
- `web/public/skill.md:85`: "In the **web app** the user signs each write in their browser wallet (SubWallet/Talisman) — the server holds no keys. On the **MCP server** writes are signed by `PORTALDOT_SEED_PHRASE` (auto-generated on first run)."

This is the Polkadot equivalent of **Sui dapp-kit** (`@mysten/dapp-kit` `useSignAndExecuteTransaction` + browser wallet). Same model: tools build the tx, the **user's extension** signs on web; the **auto-created local key** signs on the MCP/CLI.

### Sui-specific facts for the recommendation

- **Sui CLI keystore** (`~/.sui/sui_config/sui.keystore`) stores keys as Base64 `flag‖privkey`, supports 12–24-word mnemonic import/export and aliases — but the docs **do not document any password/encryption option**; it is effectively plaintext-at-rest, same security posture as the three MCPs above (docs.sui.io/references/cli/keytool).
- **zkLogin** = self-custodial address from an OAuth login (Google/Apple/Twitch) + ephemeral key + ZK proof + user salt; no seed phrase (docs.sui.io/concepts/cryptography/zklogin).
- **Enoki** (Mysten) provides hosted **zkLogin** and **sponsored transactions** (gas station) with a **backend HTTP API** so a server/agent can sponsor gas for user-signed txs (docs.enoki.mystenlabs.com).
- **Sui has native multisig + on-chain `multisig`** primitives; true "social recovery" on Sui = a multisig/smart-account config, not a keystore feature.

## Inferences

1. **The task's premise is mostly right but mislabeled.** The modern, better-than-env pattern these repos actually ship is **auto-create-on-init + `0o600` local file + env override + testnet-default + (best case) a BIP39 mnemonic for backup.** "Social recovery" should be read as **"recoverability"** (a mnemonic you can re-import), not guardian-based recovery. For our docs/spec, call it **"auto-provisioned local keystore with mnemonic backup,"** not "social recovery" — otherwise we'll over-promise a feature none of the references implement.
2. **portaldot-mcp is the reference to clone our architecture from**, not pacifica/xlmtools: it is the only one that (a) stores a **mnemonic** (recoverable) rather than a raw secret, (b) cleanly separates `packages/core` (headless signer) from `packages/web` (extension signer), and (c) already pairs with **AI SDK v5 generative UI** — which is exactly the DeepBook Predict shape (shared tool registry → MCP/CLI sign locally; web → dapp-kit user-signs).
3. **Recommended local-wallet design for the Sui DeepBook Predict MCP/CLI** (in priority order):
   - **Baseline (ship this):** On init, generate a Sui Ed25519 keypair **from a 12-word mnemonic** (`@mysten/sui/keypairs/ed25519` `Ed25519Keypair.deriveKeypair(mnemonic)`), persist the **mnemonic** to `~/.deepbook-predict/config.json` at `0o600`, print address, **default to testnet**, and auto-request testnet gas from the faucet (mirror xlmtools' friendbot auto-fund). Sign writes in-process with that keypair. This is portaldot's pattern, ported to Sui. Keep a `*_PRIVATE_KEY`/`*_MNEMONIC` env override as the power-user/CI escape hatch.
   - **One concrete upgrade over the references — encrypt at rest:** the three repos leave the secret in plaintext (only `0o600`). Add an **optional passphrase-encrypted keystore** (scrypt/argon2 + XChaCha20/AES-GCM; decrypt into memory on init). This is strictly better than env and better than what any of the three ship, and is cheap.
   - **The genuinely "even better" Sui-native move — sponsored transactions / gas abstraction:** because DeepBook Predict is on Sui, use **Enoki (or a self-hosted gas station) to sponsor gas**, so the auto-created local key only has to **sign** (authority) and never has to **hold SUI for gas**. This removes the #1 friction of the env/local-key pattern (a fresh wallet with no gas can't transact) and is the thing a Sui sponsor would expect to see.
   - **For the human-facing recovery story, prefer Sui-native multisig over hand-rolled guardians:** if we want real "social recovery," express it as a **Sui multisig** account (k-of-n) or zkLogin-backed account, not a custom guardian contract. zkLogin is the right tool for the **web** onboarding (no seed phrase), but it's a poor fit for a **headless** local MCP (it needs an interactive OAuth + ZK-proof flow), so keep zkLogin/Enoki on the web surface and the mnemonic keystore on the local surface.
   - **Avoid for a hackathon:** full MPP/MPC or passkey/WebAuthn signing for the *local* key — heavy, and passkeys are a browser/web primitive, not a Node-CLI one. Note WebAuthn/passkeys as the right direction for the **web** wallet UX if we ever move off extension wallets, but extension + dapp-kit is the correct hackathon choice today.

## Unknowns And Questions

- **"xlmtools/Pacifica social-recovery pattern" does not exist in either repo** (verified by grep). Confirm with the user whether they meant (a) the auto-create-local-wallet pattern (real), (b) the mnemonic backup in portaldot (real, but self-custody not "social"), or (c) they actually want us to *build* guardian-based social recovery (new work — would be a Sui multisig/smart-account, ~the headline differentiator if so).
- The Sui keytool docs do not state whether the keystore is encryptable; I could not find a documented password option. If at-rest encryption matters, we implement our own (above) rather than relying on `~/.sui`.
- Enoki sponsored-tx has a hosted backend API but pricing/rate-limits for a hackathon weren't checked; a self-hosted gas station (Mysten `sui-gas-station`) is the fallback if Enoki quotas bite.
- Did not deep-read pacifica `create-subaccount.ts` internals (subaccount key derivation) — not load-bearing for the local-wallet lifecycle question; available if you want the subaccount model for per-strategy DeepBook keys.

**Key files to copy from:** local signer → `/tmp/portaldot-mcp/packages/core/src/chain/wallet.ts`; local signed-write tool → `/tmp/portaldot-mcp/packages/core/src/tools/transfer.ts`; web extension signer → `/tmp/portaldot-mcp/packages/web/lib/polkadot.ts`; testnet auto-fund on init → `/tmp/xlmtools/packages/cli/src/lib/wallet.ts:33-86`; Ed25519 detached-sign request → `/tmp/pacifica-mcp/packages/cli/src/lib/signing.ts:44-80`.

Sources: [Sui keytool CLI](https://docs.sui.io/references/cli/keytool), [Enoki docs](https://docs.enoki.mystenlabs.com/), [Sui zkLogin](https://docs.sui.io/concepts/cryptography/zklogin), [awesome-solana-mcp-servers](https://github.com/sendaifun/awesome-solana-mcp-servers), [Helius MCP](https://www.helius.dev/docs/agents/mcp).