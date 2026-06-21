/**
 * A ready-to-use chat prompt for each tool — what a user would actually TYPE, not the internal tool
 * name. The tools page copies THIS (and shows it as the headline); the raw name is kept as a dev tag.
 * Amounts are tiny on purpose (testnet faucet grants are small). Falls back to a generic line.
 */
export const TOOL_PROMPTS: Record<string, string> = {
  // Markets & odds
  list_markets: 'List the active BTC markets.',
  get_market: 'Show details for the nearest BTC market.',
  get_odds: 'What are the live BTC odds?',
  get_quote: 'Quote a $5 UP bet on BTC.',
  get_range_quote: 'Quote a $5 bet that BTC lands between $63k and $65k.',
  get_recent_bets: 'Show the recent bets on BTC.',
  // Place a bet
  mint: 'Place a $5 UP bet on BTC.',
  redeem: 'Sell my open BTC bet now.',
  mint_range: 'Bet $5 that BTC lands between $63k and $65k.',
  redeem_range: 'Close my BTC range bet.',
  // Your account
  create_manager: 'Set up my Predict account.',
  get_portfolio: "What's my balance and PnL?",
  get_positions: 'Show my open positions.',
  // Vault & liquidity
  get_vault: 'How does the vault work?',
  get_vault_history: "Show the vault's performance.",
  supply: 'Provide 5 dUSDC to the vault.',
  withdraw: 'Withdraw my vault liquidity.',
  // Swap
  spot_list_pools: 'List the DeepBook spot pools.',
  spot_mid_price: "What's the SUI/DBUSDC price?",
  spot_swap_quote: 'Quote swapping 0.5 SUI to DBUSDC.',
  spot_swap_base_for_quote: 'Swap 0.5 SUI to DBUSDC.',
  spot_swap_quote_for_base: 'Swap 0.5 DBUSDC to SUI.',
  // Orders & liquidity
  spot_orderbook: 'Show the SUI/DBUSDC order book.',
  spot_pool_params: 'Show the SUI/DBUSDC pool parameters.',
  spot_open_orders: 'Show my open orders.',
  spot_can_place_limit_order: 'Can I place a limit buy for 1 SUI at 4.20?',
  spot_place_limit_order: 'Place a limit buy for 1 SUI at 4.20.',
  spot_modify_order: 'Reduce my open SUI order.',
  spot_cancel_order: 'Cancel my SUI order.',
  spot_cancel_all_orders: 'Cancel all my SUI/DBUSDC orders.',
  // Spot account
  spot_create_balance_manager: 'Open my DeepBook spot account.',
  spot_deposit: 'Deposit 0.5 SUI into my spot account.',
  spot_withdraw: 'Withdraw 0.5 SUI from my spot account.',
  spot_balance: "What's my spot balance?",
  spot_account: 'Show my spot account.',
  spot_withdraw_settled_amounts: 'Sweep my settled proceeds.',
  // Stake DEEP
  spot_stake: 'Stake 1 DEEP in the SUI/DBUSDC pool.',
  spot_unstake: 'Unstake my DEEP.',
  // Governance
  spot_submit_proposal: 'Propose new fees for the SUI/DBUSDC pool.',
  spot_vote: 'Vote on the SUI/DBUSDC proposal.',
  spot_claim_rebates: 'Claim my fee rebates.',
};

export const promptFor = (name: string): string => TOOL_PROMPTS[name] ?? `Use ${name}.`;
