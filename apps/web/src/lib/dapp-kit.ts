import { createNetworkConfig } from '@mysten/dapp-kit';

// Testnet-only (matches the rest of the app). Hardcoded URL — @mysten/sui 2.x dropped getFullnodeUrl.
const TESTNET_FULLNODE = 'https://fullnode.testnet.sui.io:443';

/** Legacy dApp-kit network config consumed by SuiClientProvider. */
export const { networkConfig } = createNetworkConfig({
  testnet: { url: TESTNET_FULLNODE, network: 'testnet' },
});
