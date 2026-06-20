import { DeepBookClient } from '@mysten/deepbook-v3';
import type { ToolContext } from '../context.js';
import { SPOT_COINS, SPOT_MANAGER_KEY, SPOT_NETWORK, SPOT_POOLS, ZERO_ADDRESS } from './constants.js';

type SdkClient = ConstructorParameters<typeof DeepBookClient>[0]['client'];

/**
 * Build a DeepBookClient from a ToolContext. The user's BalanceManager (if known) is registered under
 * SPOT_MANAGER_KEY so order/account calls resolve it. The context's RPC client is reused (cast to the
 * SDK's client surface — same devInspect/core API), mirroring how predict-client reuses ctx.client.
 */
export function spotClient(ctx: ToolContext): DeepBookClient {
  if (ctx.network !== 'testnet') {
    throw new Error('DeepBook spot is testnet-only here — set DEEPBOOKIE_NETWORK=testnet');
  }
  return new DeepBookClient({
    client: ctx.client as unknown as SdkClient,
    address: ctx.sender ?? ZERO_ADDRESS,
    network: SPOT_NETWORK,
    coins: SPOT_COINS,
    pools: SPOT_POOLS,
    balanceManagers: ctx.balanceManagerId
      ? { [SPOT_MANAGER_KEY]: { address: ctx.balanceManagerId } }
      : undefined,
  });
}

/** Spot writes/account reads need a BalanceManager — clear error if the user hasn't created one. */
export function requireBalanceManager(ctx: ToolContext): string {
  if (!ctx.balanceManagerId) {
    throw new Error('no DeepBook balance manager — run spot_create_balance_manager first');
  }
  return ctx.balanceManagerId;
}

export function requireSpotSender(ctx: ToolContext): string {
  if (!ctx.sender) throw new Error('this needs a connected wallet (ctx.sender)');
  return ctx.sender;
}
