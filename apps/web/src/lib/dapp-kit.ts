import { createDAppKit } from '@mysten/dapp-kit-core';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { NETWORK } from './constants';

/**
 * The single dApp-kit instance (nanostores-based). Plain module — NO 'use client' — so it can be
 * imported anywhere; the React providers that consume it are the client boundary (loaded ssr:false).
 * We use SuiJsonRpcClient (the @mysten/sui 2.x JSON-RPC client) as the network client.
 */
export const dAppKit = createDAppKit({
  networks: [NETWORK],
  defaultNetwork: NETWORK,
  createClient: (network) => new SuiJsonRpcClient({ network, url: getJsonRpcFullnodeUrl(network) }),
});

// Register the instance type so the hooks infer our network + client without per-call generics.
declare module '@mysten/dapp-kit-core' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
