/**
 * Day-0 de-risk: prove the full DeepBook Predict mint path on testnet end-to-end.
 *   create_manager  ->  mint dUSDC (shared treasury cap)  ->  deposit  ->  predict::mint
 * Captures a real digest. Throwaway script; the working PTB logic seeds @deepbookie/predict-client.
 */
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const NETWORK = 'testnet' as const;
const PREDICT_PKG = '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138';
const PREDICT_OBJ = '0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a';
const DUSDC_PKG = '0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a';
const DUSDC_TREASURY_CAP = '0x64f8a47a0af0a3b14db3a7ce89aa206ff77a9c6b5ac0eaef6db2ea46da3ced94';
const DUSDC_TYPE = `${DUSDC_PKG}::dusdc::DUSDC`;
const CLOCK = '0x6';
const INDEXER = 'https://predict-server.testnet.mystenlabs.com';
const KEY_FILE = '.secrets/derisk-key.json';

const DEPOSIT = 50_000_000n; // 50 dUSDC (6dp) — split from the wallet's real dUSDC
const QUANTITY = 1_000_000n; // small position

function loadOrCreateKeypair(): Ed25519Keypair {
  if (existsSync(KEY_FILE)) {
    const { secretKey } = JSON.parse(readFileSync(KEY_FILE, 'utf8')) as { secretKey: string };
    return Ed25519Keypair.fromSecretKey(secretKey);
  }
  const kp = Ed25519Keypair.generate();
  mkdirSync('.secrets', { recursive: true });
  writeFileSync(KEY_FILE, JSON.stringify({ secretKey: kp.getSecretKey() }, null, 2), { mode: 0o600 });
  return kp;
}

async function faucet(address: string): Promise<void> {
  const res = await fetch('https://faucet.testnet.sui.io/v2/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
  });
  console.log('  faucet ->', res.status);
}

async function ensureGas(client: SuiJsonRpcClient, address: string): Promise<void> {
  for (let i = 0; i < 6; i++) {
    const bal = BigInt((await client.getBalance({ owner: address })).totalBalance);
    console.log('  SUI balance:', bal.toString());
    if (bal >= 200_000_000n) return;
    await faucet(address);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

type OracleRow = { oracle_id: string; expiry: number; min_strike: string; tick_size: string; status: string };

async function pickOracle(): Promise<{ oracleId: string; expiry: bigint; minStrike: bigint; tick: bigint; forward: bigint }> {
  const rows = (await (await fetch(`${INDEXER}/oracles`)).json()) as OracleRow[];
  const now = Date.now();
  const active = rows
    .filter((o) => o.status === 'active' && Number(o.expiry) > now + 5 * 60 * 1000)
    .sort((a, b) => Number(b.expiry) - Number(a.expiry));
  if (active.length === 0) throw new Error('no live oracle with >5min to expiry');
  const o = active[0]!;
  const state = (await (await fetch(`${INDEXER}/oracles/${o.oracle_id}/state`)).json()) as {
    latest_price: { forward: string };
  };
  return {
    oracleId: o.oracle_id,
    expiry: BigInt(o.expiry),
    minStrike: BigInt(o.min_strike),
    tick: BigInt(o.tick_size),
    forward: BigInt(state.latest_price.forward),
  };
}

async function main(): Promise<void> {
  const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(NETWORK) });
  const kp = loadOrCreateKeypair();
  const address = kp.toSuiAddress();
  console.log('address:', address);
  await ensureGas(client, address);

  // TX A — create_manager (shares a PredictManager)
  const txA = new Transaction();
  txA.moveCall({ target: `${PREDICT_PKG}::predict::create_manager`, arguments: [] });
  const resA = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: txA,
    options: { showObjectChanges: true, showEffects: true },
  });
  await client.waitForTransaction({ digest: resA.digest });
  console.log('create_manager:', resA.digest, JSON.stringify(resA.effects?.status));
  const mgr = (resA.objectChanges ?? []).find(
    (c) => c.type === 'created' && 'objectType' in c && c.objectType.includes('predict_manager::PredictManager'),
  );
  if (!mgr || !('objectId' in mgr)) throw new Error('PredictManager not found in objectChanges');
  const managerId = mgr.objectId;
  console.log('managerId:', managerId);

  // oracle + nearest-grid ATM strike
  const { oracleId, expiry, minStrike, tick, forward } = await pickOracle();
  let strike = ((forward + tick / 2n) / tick) * tick;
  if (strike < minStrike) strike = minStrike;
  console.log('oracle:', oracleId, 'expiry:', expiry.toString(), 'forward:', forward.toString(), 'strike:', strike.toString());

  // TX B — split dUSDC from wallet -> deposit -> market_key::up -> predict::mint
  const dusdcCoins = await client.getCoins({ owner: address, coinType: DUSDC_TYPE });
  if (dusdcCoins.data.length === 0) throw new Error('no dUSDC in wallet — fund it via the tally faucet first');
  const dusdcCoinId = dusdcCoins.data[0]!.coinObjectId;
  console.log('dUSDC coin:', dusdcCoinId, 'balance:', dusdcCoins.data[0]!.balance);
  const txB = new Transaction();
  const [coin] = txB.splitCoins(txB.object(dusdcCoinId), [txB.pure.u64(DEPOSIT)]);
  txB.moveCall({
    target: `${PREDICT_PKG}::predict_manager::deposit`,
    typeArguments: [DUSDC_TYPE],
    arguments: [txB.object(managerId), coin],
  });
  const key = txB.moveCall({
    target: `${PREDICT_PKG}::market_key::up`,
    arguments: [txB.pure.address(oracleId), txB.pure.u64(expiry), txB.pure.u64(strike)],
  });
  txB.moveCall({
    target: `${PREDICT_PKG}::predict::mint`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      txB.object(PREDICT_OBJ),
      txB.object(managerId),
      txB.object(oracleId),
      key,
      txB.pure.u64(QUANTITY),
      txB.object(CLOCK),
    ],
  });
  const resB = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: txB,
    options: { showEffects: true, showEvents: true },
  });
  await client.waitForTransaction({ digest: resB.digest });
  console.log('MINT:', resB.digest, JSON.stringify(resB.effects?.status));
  console.log('events:', (resB.events ?? []).map((e) => e.type.split('::').slice(-1)[0]).join(', '));
  if (resB.effects?.status?.status !== 'success') {
    throw new Error(`mint failed: ${JSON.stringify(resB.effects?.status)}`);
  }
  console.log(`\n✅ predict::mint SUCCEEDED on testnet — digest ${resB.digest}`);
  console.log(`   explorer: https://suiscan.xyz/testnet/tx/${resB.digest}`);
}

main().catch((e) => {
  console.error('❌ ERROR:', e);
  process.exit(1);
});
