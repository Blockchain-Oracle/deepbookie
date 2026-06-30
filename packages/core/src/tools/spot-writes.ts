import { Transaction } from '@mysten/sui/transactions';
import { z } from 'zod';
import { defineWrite } from '../tool.js';
import { requireBalanceManager, requireSpotSender, spotClient } from '../spot/client.js';
import { SPOT_MANAGER_KEY } from '../spot/constants.js';

// The only stakeable coin in DeepBook governance — staking always pulls DEEP from the manager.
const DEEP_COIN_KEY = 'DEEP';

const swapInput = z.object({
  poolKey: z.string(),
  amount: z.number().positive(),
  // Required slippage floor (minimum output) — get the expected output from spot_swap_quote first.
  minOut: z.number().nonnegative(),
  // DEEP fee budget; leave 0 on whitelisted pools (fees taken from the input coin).
  deepAmount: z.number().nonnegative().default(0),
});

const orderBase = z.object({
  poolKey: z.string(),
  quantity: z.number().positive(),
  isBid: z.boolean(),
  payWithDeep: z.boolean().optional(),
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
  description:
    "Swap an exact amount of the pool's BASE token (the FIRST token in the pool name — e.g. DEEP in DEEP_SUI, SUI in SUI_DBUSDC) for QUOTE. `amount` is the INPUT quantity in BASE units (e.g. amount=10 on DEEP_SUI means swap 10 DEEP for SUI). Use this when the user's FROM token is the pool's base. Outputs sent to your wallet.",
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
  description:
    "Swap an exact amount of the pool's QUOTE token (the SECOND token in the pool name — e.g. SUI in DEEP_SUI, DBUSDC in SUI_DBUSDC) for BASE. `amount` is the INPUT quantity in QUOTE units (e.g. amount=0.5 on DEEP_SUI means swap 0.5 SUI for DEEP). Use this when the user's FROM token is the pool's quote. Outputs sent to your wallet.",
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
  description:
    'Place a limit order (maker) on a spot pool via your balance manager. Fees pay with DEEP by default — on a whitelisted pool set payWithDeep:false to pay fees from the traded coin (no DEEP needed).',
  surface: 'spot',
  inputSchema: orderBase.extend({ price: z.number().positive() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.placeLimitOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      clientOrderId: String(Date.now()),
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
  description:
    'Place a market order (taker) on a spot pool via your balance manager. Fees pay with DEEP by default — on a whitelisted pool set payWithDeep:false to pay fees from the traded coin (no DEEP needed).',
  surface: 'spot',
  inputSchema: orderBase,
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.placeMarketOrder({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      clientOrderId: String(Date.now()),
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

const modifyOrder = defineWrite({
  name: 'spot_modify_order',
  description: 'Reduce the quantity of one of your open orders (new quantity must be below the original).',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string(), orderId: z.string(), newQuantity: z.number().positive() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.modifyOrder(a.poolKey, SPOT_MANAGER_KEY, a.orderId, a.newQuantity)(tx);
    return tx;
  },
});

const withdrawSettled = defineWrite({
  name: 'spot_withdraw_settled_amounts',
  description: 'Sweep settled proceeds from filled orders in a pool back into your balance manager.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.withdrawSettledAmounts(a.poolKey, SPOT_MANAGER_KEY)(tx);
    return tx;
  },
});

const stake = defineWrite({
  name: 'spot_stake',
  description:
    'Stake DEEP into a pool for lower trading fees + governance voting power. Pass fundDeep to first deposit that much DEEP from your wallet into the balance manager (same PTB), so you can stake even when the manager holds none.',
  surface: 'spot',
  inputSchema: z.object({
    poolKey: z.string(),
    amount: z.number().positive(),
    // DEEP to deposit from the wallet into the balance manager BEFORE staking, composed into the SAME
    // transaction. Staking pulls from the manager (not the wallet), so when the manager is short the UI
    // passes the shortfall here and "stake N DEEP" succeeds in one signature (mirrors the mint auto-fund).
    fundDeep: z.number().nonnegative().optional(),
  }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    const sc = spotClient(ctx);
    if (a.fundDeep && a.fundDeep > 0) {
      sc.balanceManager.depositIntoManager(SPOT_MANAGER_KEY, DEEP_COIN_KEY, a.fundDeep)(tx);
    }
    sc.governance.stake(a.poolKey, SPOT_MANAGER_KEY, a.amount)(tx);
    return tx;
  },
});

const unstake = defineWrite({
  name: 'spot_unstake',
  description: 'Unstake your DEEP from a pool.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).governance.unstake(a.poolKey, SPOT_MANAGER_KEY)(tx);
    return tx;
  },
});

const submitProposal = defineWrite({
  name: 'spot_submit_proposal',
  description: 'Submit a governance proposal for a pool (proposed taker/maker fee + stake required).',
  surface: 'spot',
  inputSchema: z.object({
    poolKey: z.string(),
    takerFee: z.number().nonnegative(),
    makerFee: z.number().nonnegative(),
    stakeRequired: z.number().nonnegative(),
  }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).governance.submitProposal({
      poolKey: a.poolKey,
      balanceManagerKey: SPOT_MANAGER_KEY,
      takerFee: a.takerFee,
      makerFee: a.makerFee,
      stakeRequired: a.stakeRequired,
    })(tx);
    return tx;
  },
});

const vote = defineWrite({
  name: 'spot_vote',
  description: 'Vote your staked DEEP on a governance proposal for a pool.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string(), proposalId: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).governance.vote(a.poolKey, SPOT_MANAGER_KEY, a.proposalId)(tx);
    return tx;
  },
});

const claimRebates = defineWrite({
  name: 'spot_claim_rebates',
  description: 'Claim your accrued maker/taker fee rebates in a pool.',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string() }),
  build: async (a, ctx) => {
    requireBalanceManager(ctx);
    const tx = new Transaction();
    spotClient(ctx).deepBook.claimRebates(a.poolKey, SPOT_MANAGER_KEY)(tx);
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
  modifyOrder,
  cancelOrder,
  cancelAllOrders,
  withdrawSettled,
  stake,
  unstake,
  submitProposal,
  vote,
  claimRebates,
];
