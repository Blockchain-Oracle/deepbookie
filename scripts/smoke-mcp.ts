/** Smoke-test the MCP server: spawn it over stdio, list tools, call a read tool. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: 'pnpm',
    args: ['tsx', 'packages/mcp/src/index.ts'],
    env: process.env as Record<string, string>,
  });
  const client = new Client({ name: 'deepbookie-smoke', version: '0.0.1' });
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log('MCP tools:', tools.length);
  console.log('names:', tools.map((t) => t.name).join(', '));

  const res = await client.callTool({ name: 'get_vault', arguments: {} });
  const text = (res.content as { type: string; text?: string }[])[0]?.text ?? '';
  console.log('get_vault ->', text.replace(/\s+/g, ' ').slice(0, 180));

  await client.close();
  console.log('\n✅ MCP server responds over stdio');
}

main().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
