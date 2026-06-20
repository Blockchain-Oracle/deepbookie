import { Transaction } from '@mysten/sui/transactions';
import { z } from 'zod';
import { defineWrite } from '../tool.js';
import { requireBalanceManager, requireSpotSender, spotClient } from '../spot/client.js';
import { SPOT_MANAGER_KEY } from '../spot/constants.js';

const swapInput = z.object({
  poolKey: z.string(),
  amount: z.number().positive(),
  minOut: z.number().nonnegative().default(0),
  // DEEP fee budget; leave 0 on whitelisted pools (fees taken from the input coin).
  deepAmount: z.number().nonnegative().default(0),
});

const orderBase = z.object({
  poolKey: z.string(),
  quantity: z.number().positive(),
  isBid: z.boolean(),
  payWithDeep: z.boolean().optional(),
  clientOrderId: z.string().optional(),
});

const createBalanceManager = defineWrite({
  name: 'spot_create_balance_manager',
  description: 'Create your DeepBook balance manager (one-time; required before depositing or trading).',
  surface: 'spot',
  inputSchema: z.object({}),
  build: async (_a, ctx) => {
    const tx = new Transaction();
    spotClient(ctx).balanceManager.createAndShareBalanceManager()(tx);
    return tx;
  },
});

const deposit = defineWrite({
  name: 'spot_deposit',
  description: 'Deposit a coin from your wallet into your DeepBook balance manager.',
  surface: 'spot',
  inputSchema: z.object({ coinKey: z.string(), amount: z.number().positive() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).balanceManager.depositIntoManager(SPOT_MANAGER_KEY, a.coinKey, a.amount)(tx);
    return tx;
  },
});

const withdraw = defineWrite({
  name: 'spot_withdraw',
  description: 'Withdraw a coin from your DeepBook balance manager back to your wallet (omit amount = all).',
  surface: 'spot',
  inputSchema: z.object({ coinKey: z.string(), amount: z.number().positive().optional() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const sender = requireSpotSender(ctx);
    const tx = new Transaction();
    const bm = spotClient(ctx).balanceManager;
    if (a.amount === undefined) bm.withdrawAllFromManager(SPOT_MANAGER_KEY, a.coinKey, sender)(tx);
    else bm.withdrawFromManager(SPOT_MANAGER_KEY, a.coinKey, a.amount, sender)(tx);
    return tx;
  },
});

const swapBaseForQuote = defineWrite({
  name: 'spot_swap_base_for_quote',
  description: 'Swap an exact base amount for quote on a spot pool (outputs sent to your wallet).',
  surface: 'spot',
  inputSchema: swapInput,
  build: async (a, ctx) => {
    const sender = requireSpotSender(ctx);
    const tx = new Transaction();
    const [base, quote, deep] = spotClient(ctx).deepBook.swapExactBaseForQuote({
      poolKey: a.poolKey,
      amount: a.amount,
      deepAmount: a.deepAmount,
      minOut: a.minOut,
    })(tx);
    tx.transferObjects([base, quote, deep], sender);
    return tx;
  },
});

const swapQuoteForBase = defineWrite({
  name: 'spot_swap_quote_for_base',
  description: 'Swap an exact quote amount for base on a spot pool (outputs sent to your wallet).',
  surface: 'spot',
  inputSchema: swapInput,
  build: async (a, ctx) => {
    const sender = requireSpotSender(ctx);
    const tx = new Transaction();
    const [base, quote, deep] = spotClient(ctx).deepBook.swapExactQuoteForBase({
      poolKey: a.poolKey,
      amount: a.amount,
      deepAmount: a.deepAmount,
      minOut: a.minOut,
    })(tx);
    tx.transferObjects([base, quote, deep], sender);
    return tx;
  },
});

const placeLimitOrder = defineWrite({
  name: 'spot_place_limit_order',
  description: 'Place a limit order (maker) on a spot pool via your balance manager.',
  surface: 'spot',
  inputSchema: orderBase.extend({ price: z.number().positive() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.placeLimitOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      clientOrderId: a.clientOrderId ?? String(Date.now()),
      price: a.price,
      quantity: a.quantity,
      isBid: a.isBid,
      payWithDeep: a.payWithDeep ?? true,
    })(tx);
    return tx;
  },
});

const placeMarketOrder = defineWrite({
  name: 'spot_place_market_order',
  description: 'Place a market order (taker) on a spot pool via your balance manager.',
  surface: 'spot',
  inputSchema: orderBase,
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.placeMarketOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      clientOrderId: a.clientOrderId ?? String(Date.now()),
      quantity: a.quantity,
      isBid: a.isBid,
      payWithDeep: a.payWithDeep ?? true,
    })(tx);
    return tx;
  },
});

const cancelOrder = defineWrite({
  name: 'spot_cancel_order',
  description: 'Cancel one open order in a spot pool by its protocol order id.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string(), orderId: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.cancelOrder(a.poolKey, SPOT_MANAGER_KEY, a.orderId)(tx);
    return tx;
  },
});

const cancelAllOrders = defineWrite({
  name: 'spot_cancel_all_orders',
  description: 'Cancel all of your open orders in a spot pool.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.cancelAllOrders(a.poolKey, SPOT_MANAGER_KEY)(tx);
    return tx;
  },
});

export const spotWriteTools = [
  createBalanceManager,
  deposit,
  withdraw,
  swapBaseForQuote,
  swapQuoteForBase,
  placeLimitOrder,
  placeMarketOrder,
  cancelOrder,
  cancelAllOrders,
];
