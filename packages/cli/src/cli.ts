import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import type { Network } from '@deepbookie/predict-client';
import { DUSDC_TYPE } from '@deepbookie/predict-client';
import { getOrCreateKeypair, signAndExecute } from '@deepbookie/node';
import { Command } from 'commander';

function ctxApi() {
  const kp = getOrCreateKeypair();
  const network = (process.env.DEEPBOOKIE_NETWORK as Network | undefined) ?? 'testnet';
  const ctx = createContext({
    network,
    sender: kp.toSuiAddress(),
    managerId: process.env.DEEPBOOKIE_MANAGER_ID,
    balanceManagerId: process.env.DEEPBOOKIE_BALANCE_MANAGER_ID,
  });
  return { kp, ctx, api: getToolsForAdapter(allTools, ctx) };
}

type Change = { type: string; objectType?: string; objectId?: string };

/** Pull a newly-created object id (PredictManager / DeepBook BalanceManager) out of tx effects. */
function createdId(changes: readonly Change[], typeSuffix: string): string | undefined {
  return changes.find((c) => c.type === 'created' && c.objectType?.includes(typeSuffix))?.objectId;
}

function out(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

const program = new Command()
  .name('deepbookie')
  .description('Trade DeepBook Predict from the terminal. The tool builds the tx; your local key signs it.')
  .version('0.0.1');

program
  .command('wallet')
  .description('show the local wallet address + SUI/dUSDC balances')
  .action(async () => {
    const { kp, ctx } = ctxApi();
    const address = kp.toSuiAddress();
    const [sui, dusdc] = await Promise.all([
      ctx.client.getBalance({ owner: address }),
      ctx.client.getBalance({ owner: address, coinType: DUSDC_TYPE }),
    ]);
    out({ address, sui: sui.totalBalance, dusdc: dusdc.totalBalance });
  });

program
  .command('tools')
  .description('list all available tools')
  .action(() => {
    out(getToolsForAdapter(allTools, createContext({})).list());
  });

program
  .command('call')
  .argument('<tool>', 'tool name (see `deepbookie tools`)')
  .argument('[json]', 'JSON args object', '{}')
  .description('call any tool — reads print data; writes build + sign + execute')
  .action(async (tool: string, json: string) => {
    const def = allTools.find((t) => t.name === tool);
    if (!def) {
      process.stderr.write(`unknown tool '${tool}' (try: deepbookie tools)\n`);
      process.exitCode = 1;
      return;
    }
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(json) as Record<string, unknown>;
    } catch {
      process.stderr.write(
        `invalid JSON for args: ${json}\n  pass a quoted JSON object, e.g. '{"oracleId":"0x.."}'\n`,
      );
      process.exitCode = 1;
      return;
    }
    const { kp, ctx, api } = ctxApi();
    if (def.kind === 'read') {
      out(await api.read(tool, args));
    } else {
      const tx = await api.build(tool, args);
      const res = await signAndExecute(ctx.client, tx, kp);
      const result: Record<string, unknown> = { digest: res.digest, status: res.effects?.status?.status };
      const changes = (res.objectChanges ?? []) as Change[];
      const managerId = createdId(changes, 'predict_manager::PredictManager');
      const balanceManagerId = createdId(changes, 'balance_manager::BalanceManager');
      if (managerId) result.managerId = managerId;
      if (balanceManagerId) result.balanceManagerId = balanceManagerId;
      out(result);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
