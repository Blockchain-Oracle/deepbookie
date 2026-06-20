import {
  DUSDC_DECIMALS,
  DUSDC_TYPE,
  FLOAT_SCALING,
  INDEXER_URL,
  ORACLE_STATUS,
  PLP_TYPE,
  PREDICT_OBJECT,
  PREDICT_PACKAGE,
} from '@deepbookie/predict-client';

// Re-export the on-chain/indexer constants the web shares with the client lib.
export { DUSDC_DECIMALS, DUSDC_TYPE, FLOAT_SCALING, INDEXER_URL, ORACLE_STATUS, PLP_TYPE, PREDICT_OBJECT };

export const NETWORK = 'testnet' as const;

/**
 * PredictManager is a SHARED object — resolve a user's manager via the indexer
 * `/managers?owner=` endpoint, NOT `getOwnedObjects`. This type tag is for parsing the
 * created manager id out of a `create_manager` transaction's effects.
 */
export const MANAGER_TYPE = `${PREDICT_PACKAGE}::predict_manager::PredictManager` as const;

export const SUISCAN_TX = (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`;
export const SUISCAN_OBJECT = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;

/** Operator tally form — fallback path to request testnet dUSDC (hackathon-gated). */
export const TALLY_FAUCET_URL = 'https://tally.so/r/Xx102L';

/** Server cache lifetimes (seconds) for the BFF route handlers — see spec §3. */
export const REVALIDATE = {
  markets: 10,
  curve: 3,
  vault: 10,
  vaultPerf: 30,
  manager: 5,
  activity: 4,
} as const;

/** Client poll cadences (ms) for TanStack Query refetchInterval. */
export const POLL = {
  markets: 10_000,
  curve: 3_000,
  vault: 10_000,
  manager: 5_000,
  activity: 4_000,
  balance: 5_000,
} as const;

/** Client staleTime (ms) — kept below the matching POLL to avoid focus-refetch storms. */
export const STALE = {
  markets: 8_000,
  curve: 2_000,
  vault: 8_000,
  manager: 3_000,
  activity: 3_000,
} as const;

// The markets list (/oracles) is legitimately ~15s/2.2MB, so the timeout must clear it; it's
// cached server-side after the first hit. Other reads are sub-2s.
export const INDEXER_TIMEOUT_MS = 22_000;
export const INDEXER_RETRIES = 1;
export const VAULT_PERF_MAX_POINTS = 120;
export const CHAT_PRUNE_MAX_MESSAGES = 40;

/** Markets board enrichment: bound per-market odds fan-out; scan the activity feed for volume/trades. */
export const MARKETS_ENRICH_CONCURRENCY = 6;
export const ACTIVITY_SCAN_LIMIT = 100; // /positions/minted returns up to 100 recent events
export const MARKET_TRADES_LIMIT = 12; // recent trades shown on a market detail page

/** App-run faucet: a small dUSDC grant from the operator wallet to remove demo friction. */
export const FAUCET_AMOUNT_USD = 10;
export const FAUCET_MIN_BALANCE_USD = 1; // only grant dUSDC if recipient is below this
export const FAUCET_MIN_SUI = 0.05; // request gas SUI if recipient is below this
export const SUI_GAS_FAUCET_URL = 'https://faucet.testnet.sui.io/v2/gas';
export const SUI_DECIMALS = 9;
// Faucet abuse guard (in-memory; per-process — DB-backed grant log is the Phase 6 hardening).
export const FAUCET_RATE_PER_IP = 5;
export const FAUCET_RATE_GLOBAL = 40;
export const FAUCET_RATE_WINDOW_MS = 60 * 60 * 1000;
