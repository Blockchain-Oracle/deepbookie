import { NAV } from '@/lib/nav';

export const dynamic = 'force-static';

const BASE = 'https://docs.deepbookie.xyz';

/** A plain-text site map for LLMs, served at /llms.txt. */
export function GET() {
  const lines: string[] = [
    '# DeepBookie Docs',
    '',
    'DeepBookie is a chat app for trading on Sui: describe a trade in plain English,',
    'the AI prices it and builds the transaction, and you sign it in your own wallet.',
    'It trades two DeepBook markets — Predict (yes/no price bets) and Spot (order book) —',
    'through one tool registry exposed over a web app, an MCP server, a CLI, and a Claude skill.',
    '',
  ];
  for (const group of NAV) {
    lines.push(`## ${group.label}`);
    for (const item of group.items) {
      lines.push(`- [${item.label}](${BASE}${item.href.split('?')[0]})`);
    }
    lines.push('');
  }
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
