/**
 * Spot (DeepBook V3) read DTOs — the exact shapes the core spot read tools return, typed for the
 * chat widgets + client hooks. One source of truth so widgets and the agent never disagree.
 * Amounts are human-decimal (the SDK scales internally), matching the Predict tools.
 */

/** DeepBook testnet coins (held inside the BalanceManager). */
export const SPOT_COIN_KEYS = ['SUI', 'DEEP', 'DBUSDC', 'DBUSDT', 'DBTC', 'WAL'] as const;
export type SpotCoinKey = (typeof SPOT_COIN_KEYS)[number];

/** DeepBook testnet pools (from the official SDK catalog). */
export const SPOT_POOL_KEYS = [
  'DEEP_SUI',
  'SUI_DBUSDC',
  'DEEP_DBUSDC',
  'DBUSDT_DBUSDC',
  'DBTC_DBUSDC',
  'WAL_DBUSDC',
  'WAL_SUI',
] as const;
export type SpotPoolKey = (typeof SPOT_POOL_KEYS)[number];

/** spot_list_pools */
export interface SpotPool {
  poolKey: string;
  base: string;
  quote: string;
  poolId: string;
}

/** spot_mid_price */
export interface SpotMid {
  poolKey: string;
  midPrice: number;
}

export interface SpotLevel {
  price: number;
  size: number;
}

/** spot_orderbook */
export interface SpotOrderbook {
  poolKey: string;
  bids: SpotLevel[];
  asks: SpotLevel[];
}

/** spot_swap_quote — out amount + DEEP fee for a base or quote input. */
export interface SpotSwapQuote {
  poolKey: string;
  baseQuantity: number;
  quoteQuantity: number;
  baseOut: number;
  quoteOut: number;
  deepRequired: number;
}

/** spot_pool_params — trade + book params merged. */
export interface SpotPoolParams {
  poolKey: string;
  takerFee: number;
  makerFee: number;
  stakeRequired: number;
  tickSize: number;
  lotSize: number;
  minSize: number;
  whitelisted: boolean;
}

/** spot_balance — one coin held inside the BalanceManager. */
export interface SpotCoinBalance {
  coinKey: string;
  coinType: string;
  balance: number;
}

/** DeepBook's per-coin triple (base/quote/DEEP) used for locked + rebate balances. */
export interface SpotBalances {
  base: number;
  quote: number;
  deep: number;
}

/** spot_account — your balance-manager account state in a pool. */
export interface SpotAccount {
  poolKey: string;
  openOrderIds: string[];
  locked: SpotBalances;
  stake: { active: number; inactive: number };
  volume: { taker: number; maker: number };
  /** Accrued fee rebates (claimed via spot_claim_rebates). */
  rebates: SpotBalances;
  /** Settled proceeds from filled orders (swept via spot_withdraw_settled_amounts). */
  settled: SpotBalances;
}

/** spot_open_orders — one open limit order. */
export interface SpotOpenOrder {
  poolKey: string;
  orderId: string;
  isBid: boolean;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: string | number;
  expireTs: number;
}

/** spot_can_place_limit_order / spot_can_place_market_order — pre-flight validity. */
export interface SpotCanPlace {
  poolKey: string;
  canPlace: boolean;
}
