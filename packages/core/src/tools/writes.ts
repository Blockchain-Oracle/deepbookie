import {
  DUSDC_TYPE,
  buildCreateManager,
  buildMint,
  buildMintRange,
  buildRedeem,
  buildRedeemPermissionless,
  buildRedeemRange,
  buildSupply,
  buildWithdraw,
  toDusdc,
} from '@deepbookie/predict-client';
import { z } from 'zod';
import type { ToolContext } from '../context.js';
import { defineWrite } from '../tool.js';
import { resolveMarket } from './helpers.js';

async function firstDusdcCoin(ctx: ToolContext): Promise<string> {
  if (!ctx.sender) throw new Error('funding requires a connected wallet (ctx.sender)');
  const coins = await ctx.client.getCoins({ owner: ctx.sender, coinType: DUSDC_TYPE });
  const coin = coins.data[0];
  if (!coin) throw new Error('no dUSDC in wallet — acquire test dUSDC from the faucet first');
  return coin.coinObjectId;
}

function requireManager(ctx: ToolContext, override?: string): string {
  const id = override ?? ctx.managerId;
  if (!id) throw new Error('this needs a PredictManager — run create_manager first');
  return id;
}

function requireSender(ctx: ToolContext): string {
  if (!ctx.sender) throw new Error('this needs a connected wallet (ctx.sender)');
  return ctx.sender;
}

const binary = z.object({
  oracleId: z.string(),
  strikeUsd: z.number().positive(),
  direction: z.enum(['UP', 'DOWN']),
  quantityUsd: z.number().positive(),
  managerId: z.string().optional(),
});

const range = z.object({
  oracleId: z.string(),
  lowerStrikeUsd: z.number().positive(),
  higherStrikeUsd: z.number().positive(),
  quantityUsd: z.number().positive(),
  managerId: z.string().optional(),
});

const createManager = defineWrite({
  name: 'create_manager',
  description: 'Create your PredictManager account (one-time; required before betting or LPing).',
  surface: 'predict',
  inputSchema: z.object({}),
  build: async () => buildCreateManager(),
});

const mint = defineWrite({
  name: 'mint',
  description: 'Buy a binary UP/DOWN position at a dollar strike. Optionally fund the manager in the same tx.',
  surface: 'predict',
  inputSchema: binary.extend({ fundUsd: z.number().positive().optional() }),
  build: async (a, ctx) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    const funding = a.fundUsd
      ? { fundCoinId: await firstDusdcCoin(ctx), depositAmount: toDusdc(a.fundUsd) }
      : undefined;
    return buildMint({
      managerId: requireManager(ctx, a.managerId),
      oracleId: a.oracleId,
      expiry,
      strike: snap(a.strikeUsd),
      direction: a.direction,
      quantity: toDusdc(a.quantityUsd),
      funding,
    });
  },
});

const redeem = defineWrite({
  name: 'redeem',
  description: 'Sell or settle a binary position; payout lands in your manager balance.',
  surface: 'predict',
  inputSchema: binary,
  build: async (a, ctx) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    return buildRedeem({
      managerId: requireManager(ctx, a.managerId),
      oracleId: a.oracleId,
      expiry,
      strike: snap(a.strikeUsd),
      direction: a.direction,
      quantity: toDusdc(a.quantityUsd),
    });
  },
});

const redeemPermissionless = defineWrite({
  name: 'redeem_permissionless',
  description: 'Keeper: settle anyone’s settled binary position into their manager.',
  surface: 'predict',
  inputSchema: binary.required({ managerId: true }),
  build: async (a) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    return buildRedeemPermissionless({
      managerId: a.managerId,
      oracleId: a.oracleId,
      expiry,
      strike: snap(a.strikeUsd),
      direction: a.direction,
      quantity: toDusdc(a.quantityUsd),
    });
  },
});

const mintRange = defineWrite({
  name: 'mint_range',
  description: 'Buy a price-band position paying out if the price lands in (lower, higher]. Optionally fund.',
  surface: 'predict',
  inputSchema: range.extend({ fundUsd: z.number().positive().optional() }),
  build: async (a, ctx) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    const funding = a.fundUsd
      ? { fundCoinId: await firstDusdcCoin(ctx), depositAmount: toDusdc(a.fundUsd) }
      : undefined;
    return buildMintRange({
      managerId: requireManager(ctx, a.managerId),
      oracleId: a.oracleId,
      expiry,
      lowerStrike: snap(a.lowerStrikeUsd),
      higherStrike: snap(a.higherStrikeUsd),
      quantity: toDusdc(a.quantityUsd),
      funding,
    });
  },
});

const redeemRange = defineWrite({
  name: 'redeem_range',
  description: 'Sell or settle a price-band position.',
  surface: 'predict',
  inputSchema: range,
  build: async (a, ctx) => {
    const { expiry, snap } = await resolveMarket(a.oracleId);
    return buildRedeemRange({
      managerId: requireManager(ctx, a.managerId),
      oracleId: a.oracleId,
      expiry,
      lowerStrike: snap(a.lowerStrikeUsd),
      higherStrike: snap(a.higherStrikeUsd),
      quantity: toDusdc(a.quantityUsd),
    });
  },
});

const supply = defineWrite({
  name: 'supply',
  description: 'Provide liquidity: deposit dUSDC into the vault and receive PLP shares.',
  surface: 'predict',
  inputSchema: z.object({ amountUsd: z.number().positive() }),
  build: async (a, ctx) =>
    buildSupply({
      fundCoinId: await firstDusdcCoin(ctx),
      amount: toDusdc(a.amountUsd),
      recipient: requireSender(ctx),
    }),
});

const withdraw = defineWrite({
  name: 'withdraw',
  description: 'Withdraw liquidity: burn a PLP coin and receive dUSDC.',
  surface: 'predict',
  inputSchema: z.object({ plpCoinId: z.string() }),
  build: async (a, ctx) => buildWithdraw(a.plpCoinId, requireSender(ctx)),
});

export const writeTools = [
  createManager,
  mint,
  redeem,
  redeemPermissionless,
  mintRange,
  redeemRange,
  supply,
  withdraw,
];
