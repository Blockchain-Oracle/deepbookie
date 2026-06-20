import {
  buildCurve,
  fromDusdc,
  fromScaled,
  getActiveOracles,
  getLatestSvi,
  getManagerPnl,
  getManagerPositions,
  getManagerSummary,
  getOracleState,
  getRangeTradeAmounts,
  getRecentMints,
  getTradeAmounts,
  getVaultPerformance,
  getVaultSummary,
  toDusdc,
  upProbability,
} from '@deepbookie/predict-client';
import type { PositionEntry } from '@deepbookie/predict-client';
import { z } from 'zod';
import { defineRead } from '../tool.js';
import { resolveMarket } from './helpers.js';

function mapPosition(p: PositionEntry) {
  return {
    oracleId: p.oracle_id,
    expiry: p.expiry,
    strikeUsd: fromScaled(p.strike),
    direction: p.is_up ? 'UP' : 'DOWN',
    quantityUsd: fromDusdc(p.quantity),
    costUsd: fromDusdc(p.cost),
    probabilityAtTrade: fromScaled(p.ask_price),
    digest: p.digest,
    at: p.checkpoint_timestamp_ms,
    trader: p.trader ?? null,
    managerId: p.manager_id ?? null,
  };
}

const ZERO_ADDRESS = `0x${'0'.repeat(64)}`;

const listMarkets = defineRead({
  name: 'list_markets',
  description: 'List active DeepBook Predict markets (each is a BTC above/below market with an expiry).',
  surface: 'predict',
  inputSchema: z.object({}),
  read: async () => {
    const oracles = await getActiveOracles();
    return oracles.map((o) => ({
      oracleId: o.oracle_id,
      asset: o.underlying_asset,
      expiry: o.expiry,
      minStrike: fromScaled(o.min_strike),
      tickSize: fromScaled(o.tick_size),
      status: o.status,
    }));
  },
});

const getMarket = defineRead({
  name: 'get_market',
  description: 'Live state of one market: spot, forward, expiry, strike grid, status.',
  surface: 'predict',
  inputSchema: z.object({ oracleId: z.string() }),
  read: async (a) => {
    const s = await getOracleState(a.oracleId);
    return {
      oracleId: s.oracle.oracle_id,
      asset: s.oracle.underlying_asset,
      expiry: s.oracle.expiry,
      status: s.oracle.status,
      spot: s.latest_price ? fromScaled(s.latest_price.spot) : null,
      forward: s.latest_price ? fromScaled(s.latest_price.forward) : null,
      minStrike: fromScaled(s.oracle.min_strike),
      tickSize: fromScaled(s.oracle.tick_size),
    };
  },
});

const getOdds = defineRead({
  name: 'get_odds',
  description:
    'The probability smile for a market: P(price >= strike) across strikes — the data the odds-curve widget renders.',
  surface: 'predict',
  inputSchema: z.object({
    oracleId: z.string(),
    steps: z.number().int().min(3).max(101).optional(),
    rangePct: z.number().min(0.001).max(0.5).optional(),
  }),
  read: async (a) => {
    const [state, svi] = await Promise.all([getOracleState(a.oracleId), getLatestSvi(a.oracleId)]);
    if (!state.latest_price || !svi) throw new Error('market has no live price/SVI yet');
    const forward = state.latest_price.forward;
    const curve = buildCurve(svi, forward, { steps: a.steps, rangePct: a.rangePct }).map((p) => ({
      strike: fromScaled(p.strike),
      probabilityUp: fromScaled(p.upPrice),
    }));
    return {
      oracleId: a.oracleId,
      expiry: state.oracle.expiry,
      spot: fromScaled(state.latest_price.spot),
      forward: fromScaled(forward),
      atmProbabilityUp: upProbability(svi, forward, Math.round(forward)),
      curve,
    };
  },
});

const getQuote = defineRead({
  name: 'get_quote',
  description: 'Exact on-chain cost to buy, and payout to sell, a binary position at a dollar strike.',
  surface: 'predict',
  inputSchema: z.object({
    oracleId: z.string(),
    strikeUsd: z.number().positive(),
    direction: z.enum(['UP', 'DOWN']),
    quantityUsd: z.number().positive(),
  }),
  read: async (a, ctx) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    const snappedStrike = snap(a.strikeUsd);
    const quantity = toDusdc(a.quantityUsd);
    if (quantity === 0n) {
      throw new Error('quantityUsd too small — minimum tradable size is 0.000001 dUSDC');
    }
    const { mintCost, redeemPayout } = await getTradeAmounts(ctx.client, {
      oracleId: a.oracleId,
      expiry,
      strike: snappedStrike,
      direction: a.direction,
      quantity,
      sender: ctx.sender ?? ZERO_ADDRESS,
    });
    return {
      requestedStrikeUsd: a.strikeUsd,
      strikeUsd: fromScaled(snappedStrike), // the grid strike actually priced
      quantityUsd: a.quantityUsd,
      mintCostUsd: fromDusdc(mintCost),
      redeemPayoutUsd: fromDusdc(redeemPayout),
      askProbability: Number(mintCost) / Number(quantity),
    };
  },
});

const getVault = defineRead({
  name: 'get_vault',
  description: 'The liquidity vault (PLP): total value, available liquidity, share price, utilization.',
  surface: 'predict',
  inputSchema: z.object({}),
  read: async () => {
    const v = await getVaultSummary();
    return {
      vaultValueUsd: fromDusdc(v.vault_value),
      availableLiquidityUsd: fromDusdc(v.available_liquidity),
      totalMaxPayoutUsd: fromDusdc(v.total_max_payout),
      plpSharePrice: v.plp_share_price,
      utilization: v.utilization,
    };
  },
});

const getPortfolio = defineRead({
  name: 'get_portfolio',
  description: 'A PredictManager account: balances, open exposure, redeemable value, and PnL.',
  surface: 'predict',
  inputSchema: z.object({ managerId: z.string().optional() }),
  read: async (a, ctx) => {
    const managerId = a.managerId ?? ctx.managerId;
    if (!managerId) throw new Error('get_portfolio requires a managerId');
    const [summary, pnl] = await Promise.all([
      getManagerSummary(managerId),
      getManagerPnl(managerId),
    ]);
    return {
      managerId,
      accountValueUsd: fromDusdc(summary.account_value),
      tradingBalanceUsd: fromDusdc(summary.trading_balance),
      openExposureUsd: fromDusdc(summary.open_exposure),
      redeemableValueUsd: fromDusdc(summary.redeemable_value),
      realizedPnlUsd: fromDusdc(summary.realized_pnl),
      unrealizedPnlUsd: fromDusdc(summary.unrealized_pnl),
      openPositions: summary.open_positions,
      currentTotalPnlUsd: fromDusdc(pnl.current_total_pnl),
    };
  },
});

const getPositions = defineRead({
  name: 'get_positions',
  description: 'Detailed list of a manager’s open (minted) and closed (redeemed) Predict positions.',
  surface: 'predict',
  inputSchema: z.object({ managerId: z.string().optional() }),
  read: async (a, ctx) => {
    const managerId = a.managerId ?? ctx.managerId;
    if (!managerId) throw new Error('get_positions requires a managerId');
    const pos = await getManagerPositions(managerId);
    return { managerId, minted: pos.minted.map(mapPosition), redeemed: pos.redeemed.map(mapPosition) };
  },
});

const getRangeQuote = defineRead({
  name: 'get_range_quote',
  description: 'Exact on-chain cost to buy, and payout to sell, a price-band (range) position.',
  surface: 'predict',
  inputSchema: z.object({
    oracleId: z.string(),
    lowerStrikeUsd: z.number().positive(),
    higherStrikeUsd: z.number().positive(),
    quantityUsd: z.number().positive(),
  }),
  read: async (a, ctx) => {
    if (a.lowerStrikeUsd >= a.higherStrikeUsd) {
      throw new Error('lowerStrikeUsd must be < higherStrikeUsd');
    }
    const { expiry, snap } = await resolveMarket(a.oracleId);
    const lower = snap(a.lowerStrikeUsd);
    const higher = snap(a.higherStrikeUsd);
    const quantity = toDusdc(a.quantityUsd);
    if (quantity === 0n) throw new Error('quantityUsd too small — minimum tradable size is 0.000001 dUSDC');
    const { mintCost, redeemPayout } = await getRangeTradeAmounts(ctx.client, {
      oracleId: a.oracleId,
      expiry,
      lower,
      higher,
      quantity,
      sender: ctx.sender ?? ZERO_ADDRESS,
    });
    return {
      lowerStrikeUsd: fromScaled(lower),
      higherStrikeUsd: fromScaled(higher),
      quantityUsd: a.quantityUsd,
      mintCostUsd: fromDusdc(mintCost),
      redeemPayoutUsd: fromDusdc(redeemPayout),
    };
  },
});

const getVaultHistory = defineRead({
  name: 'get_vault_history',
  description: 'Vault share-price and total value over time (for the vault performance chart).',
  surface: 'predict',
  inputSchema: z.object({}),
  read: async () => {
    const v = await getVaultPerformance();
    return {
      range: v.range,
      points: v.points.map((p) => ({
        at: p.timestamp_ms,
        sharePrice: p.share_price,
        vaultValueUsd: fromDusdc(p.vault_value),
      })),
    };
  },
});

const getRecentBets = defineRead({
  name: 'get_recent_bets',
  description: 'Recent bets across all markets — the live activity tape.',
  surface: 'predict',
  inputSchema: z.object({ limit: z.number().int().min(1).max(100).optional() }),
  read: async (a) => {
    const mints = await getRecentMints();
    return mints.slice(0, a.limit ?? 20).map(mapPosition);
  },
});

export const readTools = [
  listMarkets,
  getMarket,
  getOdds,
  getQuote,
  getRangeQuote,
  getVault,
  getVaultHistory,
  getPortfolio,
  getPositions,
  getRecentBets,
];
