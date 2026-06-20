/**
 * Manual test: drive @deepbookie/core's registry through the transport-free adapter, end-to-end.
 *   create_manager (write) -> get_odds/get_quote (reads) -> mint (write) -> sign locally -> digest
 * Proves the ToolDef contract + adapter + context wire up correctly against testnet.
 */
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { readFileSync } from 'node:fs';
import { allTools, createContext, getToolsForAdapter } from '../packages/core/dist/index.js';

const KEY_FILE = '.secrets/derisk-key.json';

async function main(): Promise<void> {
  const { secretKey } = JSON.parse(readFileSync(KEY_FILE, 'utf8')) as { secretKey: string };
  const kp = Ed25519Keypair.fromSecretKey(secretKey);
  const address = kp.toSuiAddress();

  const ctx = createContext({ network: 'testnet', sender: address });
  const api = getToolsForAdapter(allTools, ctx);
  console.log('tools:', api.list().length, '(', api.list().filter((t) => t.kind === 'read').length, 'read /', api.list().filter((t) => t.kind === 'write').length, 'write )');

  // create_manager via adapter
  const txA = await api.build('create_manager', {});
  const resA = await ctx.client.signAndExecuteTransaction({
    signer: kp,
    transaction: txA,
    options: { showObjectChanges: true },
  });
  await ctx.client.waitForTransaction({ digest: resA.digest });
  const mgr = (resA.objectChanges ?? []).find(
    (c) => c.type === 'created' && 'objectType' in c && c.objectType.includes('predict_manager::PredictManager'),
  );
  if (!mgr || !('objectId' in mgr)) throw new Error('manager not created');
  ctx.managerId = mgr.objectId;
  console.log('create_manager:', resA.digest, '-> manager', ctx.managerId);

  // pick a market + read odds via adapter
  const markets = (await api.read('list_markets', {})) as { oracleId: string }[];
  const oracleId = markets[0]!.oracleId;
  const market = (await api.read('get_market', { oracleId })) as { forward: number };
  const odds = (await api.read('get_odds', { oracleId, steps: 5, rangePct: 0.003 })) as {
    atmProbabilityUp: number;
    curve: { strike: number; probabilityUp: number }[];
  };
  const strikeUsd = Math.round(market.forward);
  console.log('market', oracleId.slice(0, 10) + '…', 'forward $' + market.forward.toFixed(0), 'ATM P(up)', odds.atmProbabilityUp.toFixed(4));

  // exact quote via adapter
  const quote = (await api.read('get_quote', {
    oracleId,
    strikeUsd,
    direction: 'UP',
    quantityUsd: 1,
  })) as { mintCostUsd: number; askProbability: number };
  console.log('quote UP @', '$' + strikeUsd, '-> cost $' + quote.mintCostUsd.toFixed(4), 'askP', quote.askProbability.toFixed(4));

  // mint via adapter (fund 5 dUSDC from wallet), sign locally, execute
  const txB = await api.build('mint', {
    oracleId,
    strikeUsd,
    direction: 'UP',
    quantityUsd: 1,
    fundUsd: 5,
  });
  const resB = await ctx.client.signAndExecuteTransaction({
    signer: kp,
    transaction: txB,
    options: { showEffects: true, showEvents: true },
  });
  await ctx.client.waitForTransaction({ digest: resB.digest });
  const ok = resB.effects?.status?.status === 'success';
  console.log('mint:', resB.digest, resB.effects?.status?.status);
  console.log('events:', (resB.events ?? []).map((e) => e.type.split('::').slice(-1)[0]).join(', '));
  if (!ok) throw new Error('mint failed: ' + JSON.stringify(resB.effects?.status));
  console.log(`\n✅ core registry works end-to-end — mint ${resB.digest}`);
  console.log(`   https://suiscan.xyz/testnet/tx/${resB.digest}`);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
