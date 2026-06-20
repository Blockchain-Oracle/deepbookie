import { z } from 'zod';
import { defineRead } from '../tool.js';
import { spotClient, requireBalanceManager } from '../spot/client.js';
import { SPOT_COINS, SPOT_MANAGER_KEY, SPOT_POOLS } from '../spot/constants.js';

const poolInput = z.object({ poolKey: z.string() });

/** DeepBook price float scaling (matches the SDK's FLOAT_SCALAR). */
const FLOAT_SCALAR = 1e9;

/** Base/quote coin scalars for a pool (10^decimals), for human-scaling raw on-chain order figures. */
function poolScalars(poolKey: string): { base: number; quote: number } {
  const pool = SPOT_POOLS[poolKey as keyof typeof SPOT_POOLS];
  const base = pool ? (SPOT_COINS[pool.baseCoin as keyof typeof SPOT_COINS]?.scalar ?? 1) : 1;
  const quote = pool ? (SPOT_COINS[pool.quoteCoin as keyof typeof SPOT_COINS]?.scalar ?? 1) : 1;
  return { base, quote };
}

/** Zip the SDK's parallel price/quantity arrays into {price,size} rows. */
function zipLevels(prices: number[], sizes: number[]): { price: number; size: number }[] {
  return prices.map((price, i) => ({ price, size: sizes[i] ?? 0 }));
}

const listPools = defineRead({
  name: 'spot_list_pools',
  description: 'List DeepBook V3 spot pools (trading pairs) available on testnet.',
  surface: 'spot',
  inputSchema: z.object({}),
  read: async () =>
    Object.entries(SPOT_POOLS).map(([poolKey, p]) => ({
      poolKey,
      base: p.baseCoin,
      quote: p.quoteCoin,
      poolId: p.address,
    })),
});

const midPrice = defineRead({
  name: 'spot_mid_price',
  description: 'Current mid price of a DeepBook spot pool (e.g. SUI_DBUSDC).',
  surface: 'spot',
  inputSchema: poolInput,
  read: async (a, ctx) => ({ poolKey: a.poolKey, midPrice: await spotClient(ctx).midPrice(a.poolKey) }),
});

const orderbook = defineRead({
  name: 'spot_orderbook',
  description: 'Level-2 order book (bids/asks) around mid for a spot pool.',
  surface: 'spot',
  inputSchema: poolInput.extend({ ticks: z.number().int().positive().max(100).optional() }),
  read: async (a, ctx) => {
    const lv = await spotClient(ctx).getLevel2TicksFromMid(a.poolKey, a.ticks ?? 10);
    return {
      poolKey: a.poolKey,
      bids: zipLevels(lv.bid_prices, lv.bid_quantities),
      asks: zipLevels(lv.ask_prices, lv.ask_quantities),
    };
  },
});

const swapQuote = defineRead({
  name: 'spot_swap_quote',
  description: 'Preview a spot swap: output amount + DEEP fee for a given base or quote input.',
  surface: 'spot',
  inputSchema: poolInput
    .extend({ baseQuantity: z.number().nonnegative().optional(), quoteQuantity: z.number().nonnegative().optional() })
    .refine((v) => (v.baseQuantity ?? 0) > 0 || (v.quoteQuantity ?? 0) > 0, {
      message: 'provide baseQuantity (to sell base) or quoteQuantity (to buy base)',
    }),
  read: async (a, ctx) => {
    const q = await spotClient(ctx).getQuantityOut(a.poolKey, a.baseQuantity ?? 0, a.quoteQuantity ?? 0);
    return {
      poolKey: a.poolKey,
      baseQuantity: q.baseQuantity,
      quoteQuantity: q.quoteQuantity,
      baseOut: q.baseOut,
      quoteOut: q.quoteOut,
      deepRequired: q.deepRequired,
    };
  },
});

const poolParams = defineRead({
  name: 'spot_pool_params',
  description: 'Pool trade + book params: taker/maker fee, stake required, tick/lot/min size, whitelist.',
  surface: 'spot',
  inputSchema: poolInput,
  read: async (a, ctx) => {
    const db = spotClient(ctx);
    const [trade, book, whitelisted] = await Promise.all([
      db.poolTradeParams(a.poolKey),
      db.poolBookParams(a.poolKey),
      db.whitelisted(a.poolKey),
    ]);
    return { poolKey: a.poolKey, ...trade, ...book, whitelisted };
  },
});

const balance = defineRead({
  name: 'spot_balance',
  description: 'Balance of one coin held inside your DeepBook balance manager.',
  surface: 'spot',
  inputSchema: z.object({ coinKey: z.string() }),
  read: async (a, ctx) => {
    requireBalanceManager(ctx);
    const b = await spotClient(ctx).checkManagerBalance(SPOT_MANAGER_KEY, a.coinKey);
    return { coinKey: a.coinKey, coinType: b.coinType, balance: b.balance };
  },
});

const account = defineRead({
  name: 'spot_account',
  description: 'Your balance-manager account in a pool: open orders, locked balances, stake, rebates.',
  surface: 'spot',
  inputSchema: poolInput,
  read: async (a, ctx) => {
    requireBalanceManager(ctx);
    const db = spotClient(ctx);
    // `accountExists` calls Move `account_exists`, which returns a clean `false` for a manager that
    // hasn't traded this pool yet (it does NOT abort), so a THROW here is always a genuine RPC /
    // devInspect anomaly — including the SDK's unsafe BCS access on a degraded devInspect. Let it
    // PROPAGATE so the read proxy returns 502 and the UI shows its retry/unavailable state, instead
    // of masking real orders/stake/rebates as an empty account (which would disable claim/sweep).
    const exists = await db.accountExists(a.poolKey, SPOT_MANAGER_KEY);
    if (!exists) {
      return {
        poolKey: a.poolKey,
        openOrderIds: [],
        locked: { base: 0, quote: 0, deep: 0 },
        stake: { active: 0, inactive: 0 },
        volume: { taker: 0, maker: 0 },
        rebates: { base: 0, quote: 0, deep: 0 },
        settled: { base: 0, quote: 0, deep: 0 },
      };
    }
    const [acct, locked] = await Promise.all([
      db.account(a.poolKey, SPOT_MANAGER_KEY),
      db.lockedBalance(a.poolKey, SPOT_MANAGER_KEY),
    ]);
    return {
      poolKey: a.poolKey,
      openOrderIds: acct.open_orders.contents,
      locked,
      stake: { active: acct.active_stake, inactive: acct.inactive_stake },
      volume: { taker: acct.taker_volume, maker: acct.maker_volume },
      rebates: acct.unclaimed_rebates,
      settled: acct.settled_balances,
    };
  },
});

const openOrders = defineRead({
  name: 'spot_open_orders',
  description: 'Your open limit orders in a pool (price, side, size, fill, status).',
  surface: 'spot',
  inputSchema: poolInput,
  read: async (a, ctx) => {
    requireBalanceManager(ctx);
    const db = spotClient(ctx);
    // One call for all open orders; decode price/side locally (avoids an N+1 per-order round-trip).
    // getAccountOrderDetails returns RAW on-chain units — human-scale them the SAME way the SDK's
    // getOrderNormalized does, so the figures match every other spot read AND so a signed modify
    // (which re-applies the scalar) isn't double-scaled into an on-chain abort.
    const { base, quote } = poolScalars(a.poolKey);
    const orders = await db.getAccountOrderDetails(a.poolKey, SPOT_MANAGER_KEY);
    return (orders ?? []).map((o) => {
      const decoded = db.decodeOrderId(BigInt(o.order_id));
      return {
        poolKey: a.poolKey,
        orderId: o.order_id,
        isBid: decoded.isBid,
        price: (decoded.price * base) / quote / FLOAT_SCALAR,
        quantity: Number(o.quantity) / base,
        filledQuantity: Number(o.filled_quantity) / base,
        status: o.status,
        expireTs: o.expire_timestamp,
      };
    });
  },
});

const canPlaceLimit = defineRead({
  name: 'spot_can_place_limit_order',
  description: 'Pre-flight: is this limit order valid (price/size/balance) before you sign it?',
  surface: 'spot',
  inputSchema: poolInput.extend({
    price: z.number().positive(),
    quantity: z.number().positive(),
    isBid: z.boolean(),
    payWithDeep: z.boolean().optional(),
  }),
  read: async (a, ctx) => {
    requireBalanceManager(ctx);
    const canPlace = await spotClient(ctx).canPlaceLimitOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      price: a.price,
      quantity: a.quantity,
      isBid: a.isBid,
      payWithDeep: a.payWithDeep ?? true,
      expireTimestamp: Number.MAX_SAFE_INTEGER, // pre-flight check assumes a non-expiring (GTC) order
    });
    return { poolKey: a.poolKey, canPlace };
  },
});

const canPlaceMarket = defineRead({
  name: 'spot_can_place_market_order',
  description: 'Pre-flight: is this market order valid (size/balance) before you sign it?',
  surface: 'spot',
  inputSchema: poolInput.extend({
    quantity: z.number().positive(),
    isBid: z.boolean(),
    payWithDeep: z.boolean().optional(),
  }),
  read: async (a, ctx) => {
    requireBalanceManager(ctx);
    const canPlace = await spotClient(ctx).canPlaceMarketOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      quantity: a.quantity,
      isBid: a.isBid,
      payWithDeep: a.payWithDeep ?? true,
    });
    return { poolKey: a.poolKey, canPlace };
  },
});

export const spotReadTools = [
  listPools,
  midPrice,
  orderbook,
  swapQuote,
  poolParams,
  balance,
  account,
  openOrders,
  canPlaceLimit,
  canPlaceMarket,
];
