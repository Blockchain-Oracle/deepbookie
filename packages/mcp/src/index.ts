import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import type { Network } from '@deepbookie/predict-client';
import { getOrCreateKeypair, logger, signAndExecute } from '@deepbookie/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

type Change = { type: string; objectType?: string; objectId?: string };

function newManagerId(changes: readonly Change[]): string | undefined {
  const m = changes.find(
    (c) => c.type === 'created' && c.objectType?.includes('predict_manager::PredictManager'),
  );
  return m?.objectId;
}

function newBalanceManagerId(changes: readonly Change[]): string | undefined {
  const m = changes.find(
    (c) => c.type === 'created' && c.objectType?.includes('balance_manager::BalanceManager'),
  );
  return m?.objectId;
}

async function main(): Promise<void> {
  const kp = getOrCreateKeypair();
  const sender = kp.toSuiAddress();
  const network = (process.env.DEEPBOOKIE_NETWORK as Network | undefined) ?? 'testnet';
  const ctx = createContext({
    network,
    sender,
    managerId: process.env.DEEPBOOKIE_MANAGER_ID,
    balanceManagerId: process.env.DEEPBOOKIE_BALANCE_MANAGER_ID,
  });
  const api = getToolsForAdapter(allTools, ctx);

  const server = new McpServer({ name: 'deepbookie', version: '0.0.1' });

  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema.shape },
      async (args: Record<string, unknown>) => {
        try {
          if (tool.kind === 'read') {
            const data = await api.read(tool.name, args);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
          }
          const tx = await api.build(tool.name, args);
          const res = await signAndExecute(ctx.client, tx, kp);
          const out: Record<string, unknown> = {
            digest: res.digest,
            status: res.effects?.status?.status,
          };
          const changes = (res.objectChanges ?? []) as Change[];
          const mgr = newManagerId(changes);
          if (mgr) {
            ctx.managerId = mgr;
            out.managerId = mgr;
          }
          const bm = newBalanceManagerId(changes);
          if (bm) {
            ctx.balanceManagerId = bm;
            out.balanceManagerId = bm;
          }
          return { content: [{ type: 'text' as const, text: JSON.stringify(out, null, 2) }] };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error({ tool: tool.name, err: msg }, 'tool failed');
          return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
        }
      },
    );
  }

  await server.connect(new StdioServerTransport());
  logger.info({ address: sender, network, tools: allTools.length }, 'DeepBookie MCP ready (stdio)');
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, 'fatal');
  process.exit(1);
});
