import type { Signer } from '@mysten/sui/cryptography';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import type { Transaction } from '@mysten/sui/transactions';

/** Sign an unsigned transaction with a local key, execute it, and wait for finality. */
export async function signAndExecute(
  client: SuiJsonRpcClient,
  tx: Transaction,
  signer: Signer,
) {
  const res = await client.signAndExecuteTransaction({
    signer,
    transaction: tx,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
  await client.waitForTransaction({ digest: res.digest });
  return res;
}
