// DTOs mirroring the @deepbookie/core read-tool outputs (all amounts already in human units).

export type Direction = 'UP' | 'DOWN';

export interface Market {
  oracleId: string;
  asset: string;
  expiry: number;
  minStrike: number;
  tickSize: number;
  status: string;
}

export interface MarketState {
  oracleId: string;
  asset: string;
  expiry: number;
  status: string;
  spot: number | null;
  forward: number | null;
  minStrike: number;
  tickSize: number;
}

export interface OddsPoint {
  strike: number;
  probabilityUp: number;
}

export interface Odds {
  oracleId: string;
  expiry: number;
  spot: number;
  forward: number;
  atmProbabilityUp: number;
  curve: OddsPoint[];
}

export interface MarketDetail {
  market: MarketState;
  odds: Odds | null; // null when the market has no live price/SVI (e.g. settled)
}

export interface Vault {
  vaultValueUsd: number;
  availableLiquidityUsd: number;
  totalMaxPayoutUsd: number;
  plpSharePrice: number;
  utilization: number;
}

export interface VaultHistoryPoint {
  at: number;
  sharePrice: number;
  vaultValueUsd: number;
}

export interface VaultHistory {
  range: string;
  points: VaultHistoryPoint[];
}

export interface Portfolio {
  managerId: string;
  accountValueUsd: number;
  tradingBalanceUsd: number;
  openExposureUsd: number;
  redeemableValueUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  openPositions: number;
  currentTotalPnlUsd: number;
}

export interface Position {
  oracleId: string;
  expiry: number;
  strikeUsd: number;
  direction: Direction;
  quantityUsd: number;
  costUsd: number;
  probabilityAtTrade: number;
  digest: string;
  at: number;
}

export interface Positions {
  managerId: string;
  minted: Position[];
  redeemed: Position[];
}

/** Resolved account view for a wallet/manager (null fields when the wallet has no manager yet). */
export interface AccountView {
  managerId: string | null;
  portfolio: Portfolio | null;
  positions: Positions | null;
}
