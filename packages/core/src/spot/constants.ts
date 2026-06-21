import { testnetCoins, testnetPools } from '@mysten/deepbook-v3';

/** The single key we register the user's BalanceManager under in the SDK client. */
export const SPOT_MANAGER_KEY = 'MAIN';

/** DeepBook V3 spot is testnet-only here (matches the Predict deployment). */
export const SPOT_NETWORK = 'testnet' as const;

/** Suffix of the created BalanceManager object type — parses a new id out of tx effects (MCP/CLI). */
export const BALANCE_MANAGER_TYPE = 'balance_manager::BalanceManager';

/** Testnet coin + pool catalogs from the official SDK (DBUSDC/DBUSDT/DEEP/SUI/DBTC/WAL). */
export const SPOT_COINS = testnetCoins;
export const SPOT_POOLS = testnetPools;
