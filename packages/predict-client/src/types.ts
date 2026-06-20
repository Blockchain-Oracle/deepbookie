export type Network = 'testnet' | 'mainnet';
export type Direction = 'UP' | 'DOWN';

/**
 * A market = one OracleSVI (one underlying + expiry).
 * The indexer returns numbers; prices/strikes are ×1e9 fixed-point, timestamps are epoch ms.
 */
export interface OracleRow {
  predict_id: string;
  oracle_id: string;
  underlying_asset: string;
  expiry: number;
  min_strike: number;
  tick_size: number;
  status: string;
  settlement_price: number | null;
  activated_at: number;
}

export interface PricePoint {
  spot: number;
  forward: number;
  onchain_timestamp: number;
}

export interface OracleState {
  oracle: OracleRow;
  latest_price: PricePoint | null;
}

/** SVI params: a/b/sigma are ×1e9 magnitudes; rho/m are ×1e9 magnitudes with a sign flag. */
export interface SviParams {
  a: number;
  b: number;
  sigma: number;
  rho: number;
  rho_negative: boolean;
  m: number;
  m_negative: boolean;
}

/** One point of the probability smile. Both fields are ×1e9 fixed-point. */
export interface CurvePoint {
  strike: bigint;
  upPrice: bigint;
}

export interface VaultSummary {
  vault_value: number;
  available_liquidity: number;
  available_withdrawal: number;
  total_max_payout: number;
  plp_total_supply: number;
  plp_share_price: number;
  utilization: number;
  max_payout_utilization: number;
}

export interface ManagerSummary {
  manager_id: string;
  owner: string;
  trading_balance: number;
  open_exposure: number;
  redeemable_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  account_value: number;
  open_positions: number;
  awaiting_settlement_positions: number;
}

export interface ManagerPnl {
  series_type: string;
  points: { timestamp_ms: number; value: number }[];
  current_unrealized_pnl: number;
  current_total_pnl: number;
}

/** A minted/redeemed binary position event. strike/ask_price are ×1e9; quantity/cost are 6dp. */
export interface PositionEntry {
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number;
  cost: number;
  ask_price: number;
  digest: string;
  checkpoint_timestamp_ms: number;
  /** Present on the global activity feed (/positions/minted); the wallet that placed the bet. */
  trader?: string;
  /** Present on the global activity feed; the PredictManager that holds the position. */
  manager_id?: string;
}

export interface ManagerPositions {
  minted: PositionEntry[];
  redeemed: PositionEntry[];
}

export interface VaultPerformancePoint {
  timestamp_ms: number;
  share_price: number;
  vault_value: number;
}

export interface VaultPerformance {
  range: string;
  points: VaultPerformancePoint[];
}
