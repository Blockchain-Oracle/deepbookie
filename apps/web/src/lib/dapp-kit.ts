import { createNetworkConfig } from '@mysten/dapp-kit';

// Testnet-only (matches the rest of the app). Hardcoded URL — @mysten/sui 2.x dropped getFullnodeUrl.
const TESTNET_FULLNODE = 'https://fullnode.testnet.sui.io:443';

/** Legacy dApp-kit network config consumed by SuiClientProvider. */
export const { networkConfig } = createNetworkConfig({
  testnet: { url: TESTNET_FULLNODE, network: 'testnet' },
});

// --- Enoki zkLogin (Google sign-in) config — Slice A: login only, no sponsorship. ---
// Public values, inlined at build by Next. When both are present, "Sign in with Google"
// is registered into the same ConnectButton modal as extension wallets; when absent the
// app stays extension-only (graceful degrade, no crash). Single source of truth so the
// provider and the connect-screen copy agree.
export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? '';
export const ENOKI_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID ?? '';
export const googleLoginEnabled = ENOKI_API_KEY !== '' && ENOKI_GOOGLE_CLIENT_ID !== '';
