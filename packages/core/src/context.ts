import type { Network } from '@deepbookie/predict-client';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

/** Everything a tool needs that isn't a per-call argument. Supplied by each surface (MCP/CLI/web). */
export interface ToolContext {
  client: SuiJsonRpcClient;
  network: Network;
  /** The signer's address — needed to build writes (funding-coin selection, LP recipient). */
  sender?: string;
  /** The user's PredictManager object id — most writes/reads about positions need it. */
  managerId?: string;
}

export function createContext(
  opts: { network?: Network; sender?: string; managerId?: string } = {},
): ToolContext {
  const network = opts.network ?? 'testnet';
  // Honesty guard: the Predict indexer + deployment are testnet-only, so a non-testnet context
  // would read the testnet indexer while pointing the RPC elsewhere (split-brain). Reject it.
  if (network !== 'testnet') {
    throw new Error('DeepBook Predict is testnet-only for now — set DEEPBOOKIE_NETWORK=testnet');
  }
  return {
    client: new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network), network }),
    network,
    sender: opts.sender,
    managerId: opts.managerId,
  };
}
