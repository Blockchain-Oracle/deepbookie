/**
 * DeepBook Predict on-chain + indexer constants.
 * Testnet; provisional — these IDs will change at mainnet, so they live in one place.
 */
export const NETWORK = 'testnet' as const;

export const PREDICT_PACKAGE =
  '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138';
export const PREDICT_OBJECT =
  '0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a';
export const PREDICT_REGISTRY =
  '0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64';
export const DUSDC_PACKAGE =
  '0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a';
export const DUSDC_TYPE = `${DUSDC_PACKAGE}::dusdc::DUSDC`;
export const PLP_TYPE = `${PREDICT_PACKAGE}::plp::PLP`;
export const CLOCK_OBJECT = '0x6';
export const INDEXER_URL = 'https://predict-server.testnet.mystenlabs.com';

/** On-chain fixed-point scaling for prices / strikes / probabilities (FLOAT_SCALING = 1e9). */
export const FLOAT_SCALING = 1_000_000_000;
/** dUSDC token decimals. */
export const DUSDC_DECIMALS = 6;

/** OracleSVI lifecycle statuses (the indexer `status` field). */
export const ORACLE_STATUS = {
  inactive: 'inactive',
  active: 'active',
  pendingSettlement: 'pending_settlement',
  settled: 'settled',
} as const;

/** Fully-qualified Move call targets (the only entrypoints this client builds). */
export const TARGET = {
  createManager: `${PREDICT_PACKAGE}::predict::create_manager`,
  mint: `${PREDICT_PACKAGE}::predict::mint`,
  redeem: `${PREDICT_PACKAGE}::predict::redeem`,
  redeemPermissionless: `${PREDICT_PACKAGE}::predict::redeem_permissionless`,
  mintRange: `${PREDICT_PACKAGE}::predict::mint_range`,
  redeemRange: `${PREDICT_PACKAGE}::predict::redeem_range`,
  supply: `${PREDICT_PACKAGE}::predict::supply`,
  withdraw: `${PREDICT_PACKAGE}::predict::withdraw`,
  getTradeAmounts: `${PREDICT_PACKAGE}::predict::get_trade_amounts`,
  getRangeTradeAmounts: `${PREDICT_PACKAGE}::predict::get_range_trade_amounts`,
  deposit: `${PREDICT_PACKAGE}::predict_manager::deposit`,
  withdrawBalance: `${PREDICT_PACKAGE}::predict_manager::withdraw`,
  marketKeyUp: `${PREDICT_PACKAGE}::market_key::up`,
  marketKeyDown: `${PREDICT_PACKAGE}::market_key::down`,
  rangeKeyNew: `${PREDICT_PACKAGE}::range_key::new`,
} as const;
