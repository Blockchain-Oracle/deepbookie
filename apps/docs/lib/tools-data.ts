/**
 * The 44 tools, mirrored from packages/core/src/registry.ts (verified in the
 * docs audit). 18 Predict (10 read + 8 write) + 26 Spot (10 read + 16 write).
 * Descriptions are kept plain and human.
 */
export type Surface = 'predict' | 'spot';
export type Kind = 'read' | 'write';

export type Tool = {
  name: string;
  surface: Surface;
  kind: Kind;
  family: string; // family id
  desc: string;
  inputs: string;
  returns: string;
};

export type Family = { id: string; surface: Surface; name: string };

export const FAMILIES: Family[] = [
  { id: 'predict-markets', surface: 'predict', name: 'Markets & odds' },
  { id: 'predict-bet', surface: 'predict', name: 'Place a bet' },
  { id: 'predict-account', surface: 'predict', name: 'Account & positions' },
  { id: 'predict-vault', surface: 'predict', name: 'Vault' },
  { id: 'spot-data', surface: 'spot', name: 'Market data' },
  { id: 'spot-trade', surface: 'spot', name: 'Trading' },
  { id: 'spot-account', surface: 'spot', name: 'Account' },
  { id: 'spot-gov', surface: 'spot', name: 'Rewards & governance' },
];

const t = (
  name: string,
  surface: Surface,
  kind: Kind,
  family: string,
  desc: string,
  inputs: string,
  returns: string,
): Tool => ({ name, surface, kind, family, desc, inputs, returns });

export const TOOLS: Tool[] = [
  // ── Predict · Markets & odds ──
  t('list_markets', 'predict', 'read', 'predict-markets', 'List the active BTC markets with their expiries and strike ranges.', 'none', 'Market[]'),
  t('get_market', 'predict', 'read', 'predict-markets', 'Live state of one market: spot, forward, expiry, strikes, status.', 'oracleId', 'Market'),
  t('get_odds', 'predict', 'read', 'predict-markets', 'The probability curve across strikes — the odds-curve widget.', 'oracleId, steps?, rangePct?', 'OddsPoint[]'),
  t('get_quote', 'predict', 'read', 'predict-markets', 'Exact cost to buy, and payout to sell, a yes/no bet.', 'oracleId, strikeUsd, direction, quantityUsd', 'Quote'),
  t('get_range_quote', 'predict', 'read', 'predict-markets', 'Same as get_quote, for a price-band (range) bet.', 'oracleId, lowerStrikeUsd, higherStrikeUsd, quantityUsd', 'Quote'),
  // ── Predict · Place a bet ──
  t('mint', 'predict', 'write', 'predict-bet', 'Buy a yes/no (UP/DOWN) bet at a dollar strike.', 'oracleId, strikeUsd, direction, quantityUsd, fundUsd?, managerId?', 'unsigned tx'),
  t('redeem', 'predict', 'write', 'predict-bet', 'Sell or settle a bet; the payout lands in your manager.', 'oracleId, strikeUsd, direction, quantityUsd, managerId?', 'unsigned tx'),
  t('mint_range', 'predict', 'write', 'predict-bet', 'Buy a band that pays out if price lands between two strikes.', 'oracleId, lowerStrikeUsd, higherStrikeUsd, quantityUsd, fundUsd?', 'unsigned tx'),
  t('redeem_range', 'predict', 'write', 'predict-bet', 'Sell or settle a band bet.', 'oracleId, lowerStrikeUsd, higherStrikeUsd, quantityUsd', 'unsigned tx'),
  t('redeem_permissionless', 'predict', 'write', 'predict-bet', 'Keeper-only: settle anyone’s expired position into their manager.', 'oracleId, strikeUsd, direction, quantityUsd, managerId', 'unsigned tx'),
  // ── Predict · Account & positions ──
  t('create_manager', 'predict', 'write', 'predict-account', 'Create your PredictManager — needed once before betting or LPing.', 'none', 'unsigned tx'),
  t('get_portfolio', 'predict', 'read', 'predict-account', 'Your balances, exposure, redeemable value, and PnL.', 'managerId?', 'Portfolio'),
  t('get_positions', 'predict', 'read', 'predict-account', 'Your open and settled positions.', 'managerId?', 'Position[]'),
  t('get_recent_bets', 'predict', 'read', 'predict-account', 'Recent bets across all markets — the activity tape.', 'limit?', 'Bet[]'),
  // ── Predict · Vault ──
  t('get_vault', 'predict', 'read', 'predict-vault', 'Liquidity-vault stats: value, available, payout cap, utilization.', 'none', 'Vault'),
  t('get_vault_history', 'predict', 'read', 'predict-vault', 'Vault share price and value over time.', 'none', 'VaultPoint[]'),
  t('supply', 'predict', 'write', 'predict-vault', 'Add dUSDC to the vault and receive PLP shares.', 'amountUsd', 'unsigned tx'),
  t('withdraw', 'predict', 'write', 'predict-vault', 'Burn a PLP share and take your dUSDC back out.', 'plpCoinId', 'unsigned tx'),
  // ── Spot · Market data ──
  t('spot_list_pools', 'spot', 'read', 'spot-data', 'List the spot trading pools (coin pairs).', 'none', 'Pool[]'),
  t('spot_mid_price', 'spot', 'read', 'spot-data', 'Current mid price of a pool.', 'poolKey', 'number'),
  t('spot_orderbook', 'spot', 'read', 'spot-data', 'Live order-book depth (bids and asks).', 'poolKey, ticks?', 'Orderbook'),
  t('spot_swap_quote', 'spot', 'read', 'spot-data', 'Preview a swap: output amount and any DEEP fee.', 'poolKey, baseQuantity? | quoteQuantity?', 'SwapQuote'),
  t('spot_pool_params', 'spot', 'read', 'spot-data', 'A pool’s fees, tick size, lot size, and whitelist status.', 'poolKey', 'PoolParams'),
  // ── Spot · Trading ──
  t('spot_swap_base_for_quote', 'spot', 'write', 'spot-trade', 'Swap an exact amount of the base coin for the quote coin.', 'poolKey, amount, minOut', 'unsigned tx'),
  t('spot_swap_quote_for_base', 'spot', 'write', 'spot-trade', 'Swap an exact amount of the quote coin for the base coin.', 'poolKey, amount, minOut', 'unsigned tx'),
  t('spot_place_limit_order', 'spot', 'write', 'spot-trade', 'Place a limit (maker) order at a price.', 'poolKey, quantity, isBid, price', 'unsigned tx'),
  t('spot_place_market_order', 'spot', 'write', 'spot-trade', 'Place a market (taker) order that fills now.', 'poolKey, quantity, isBid', 'unsigned tx'),
  t('spot_cancel_order', 'spot', 'write', 'spot-trade', 'Cancel one open order.', 'poolKey, orderId', 'unsigned tx'),
  t('spot_cancel_all_orders', 'spot', 'write', 'spot-trade', 'Cancel every open order in a pool.', 'poolKey', 'unsigned tx'),
  t('spot_modify_order', 'spot', 'write', 'spot-trade', 'Reduce an open order’s quantity.', 'poolKey, orderId, newQuantity', 'unsigned tx'),
  t('spot_withdraw_settled_amounts', 'spot', 'write', 'spot-trade', 'Sweep filled proceeds back into your balance manager.', 'poolKey', 'unsigned tx'),
  t('spot_can_place_limit_order', 'spot', 'read', 'spot-trade', 'Pre-flight check: would this limit order be accepted?', 'poolKey, quantity, isBid, price', 'boolean'),
  t('spot_can_place_market_order', 'spot', 'read', 'spot-trade', 'Pre-flight check: would this market order be accepted?', 'poolKey, quantity, isBid', 'boolean'),
  // ── Spot · Account ──
  t('spot_create_balance_manager', 'spot', 'write', 'spot-account', 'Create your spot balance manager — needed once before trading.', 'none', 'unsigned tx'),
  t('spot_deposit', 'spot', 'write', 'spot-account', 'Move a coin from your wallet into the balance manager.', 'coinKey, amount', 'unsigned tx'),
  t('spot_withdraw', 'spot', 'write', 'spot-account', 'Move a coin from the balance manager back to your wallet.', 'coinKey, amount?', 'unsigned tx'),
  t('spot_balance', 'spot', 'read', 'spot-account', 'Balance of one coin inside your balance manager.', 'coinKey', 'number'),
  t('spot_account', 'spot', 'read', 'spot-account', 'All coin balances in your balance manager.', 'none', 'Account'),
  t('spot_open_orders', 'spot', 'read', 'spot-account', 'Your resting orders in a pool.', 'poolKey', 'Order[]'),
  // ── Spot · Rewards & governance ──
  t('spot_stake', 'spot', 'write', 'spot-gov', 'Stake DEEP for fee rebates and voting power.', 'amount', 'unsigned tx'),
  t('spot_unstake', 'spot', 'write', 'spot-gov', 'Unstake DEEP.', 'amount', 'unsigned tx'),
  t('spot_claim_rebates', 'spot', 'write', 'spot-gov', 'Claim the maker rebates you’ve earned in a pool.', 'poolKey', 'unsigned tx'),
  t('spot_submit_proposal', 'spot', 'write', 'spot-gov', 'Submit a pool governance proposal.', 'proposalContent', 'unsigned tx'),
  t('spot_vote', 'spot', 'write', 'spot-gov', 'Vote on a pool governance proposal.', 'proposalId, choice', 'unsigned tx'),
];

export const TOOL_COUNT = TOOLS.length; // 44
