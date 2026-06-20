import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { toDusdc } from '@deepbookie/predict-client';
import { DUSDC_TYPE, NETWORK, SUI_GAS_FAUCET_URL } from '@/lib/constants';

/**
 * Server-only faucet. The OPERATOR key is the single deliberately-scoped server credential —
 * an operator funding wallet, never a user trading key, never used to trade. Never import this
 * into a client module.
 */
let operatorKp: Ed25519Keypair | null = null;

function operator(): Ed25519Keypair {
  if (operatorKp) return operatorKp;
  const key = process.env.FAUCET_OPERATOR_KEY?.trim();
  if (!key) throw new Error('FAUCET_OPERATOR_KEY is not configured');
  operatorKp = Ed25519Keypair.fromSecretKey(key);
  return operatorKp;
}

function rpc(): SuiJsonRpcClient {
  return new SuiJsonRpcClient({ network: NETWORK, url: getJsonRpcFullnodeUrl(NETWORK) });
}

export function operatorAddress(): string {
  return operator().toSuiAddress();
}

/** Send a small dUSDC grant from the operator wallet to `recipient`. Returns the tx digest. */
export async function grantDusdc(recipient: string, amountUsd: number): Promise<string> {
  const client = rpc();
  const kp = operator();
  const amount = toDusdc(amountUsd); // bigint, 6dp
  const coins = await client.getCoins({ owner: kp.toSuiAddress(), coinType: DUSDC_TYPE });
  const coin = coins.data.find((c) => BigInt(c.balance) >= amount);
  if (!coin) throw new Error('faucet operator is out of dUSDC — top it up');

  const tx = new Transaction();
  const [granted] = tx.splitCoins(tx.object(coin.coinObjectId), [tx.pure.u64(amount)]);
  tx.transferObjects([granted], tx.pure.address(recipient));

  const res = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: tx,
    options: { showEffects: true },
  });
  await client.waitForTransaction({ digest: res.digest });
  return res.digest;
}

/** Ask the public Sui testnet faucet for gas SUI for `recipient`. Returns whether it accepted. */
export async function requestSuiGas(recipient: string): Promise<boolean> {
  try {
    const res = await fetch(SUI_GAS_FAUCET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient } }),
    });
    return res.ok;
  } catch {
    return false; // gas faucet is best-effort; dUSDC grant is the primary path
  }
}
