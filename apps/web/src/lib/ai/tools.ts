import { tool, type ToolSet } from 'ai';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';

// redeem_permissionless is a keeper tool, not a user action — exclude it from the agent.
const EXCLUDED = new Set(['redeem_permissionless']);

/**
 * Adapt the shared core registry into AI SDK tools (built per request, never module-scoped, so no
 * cross-user state leaks). Read tools get an `execute` (run server-side, streamed back as widgets);
 * write tools have NO execute — the call is forwarded to the browser, which builds the unsigned tx,
 * signs it, and submits the result. `walletAddress` (from the request body) is used only as the
 * devInspect quote sender — never for authorization.
 */
export function buildAiTools(opts: { walletAddress?: string }): ToolSet {
  const ctx = createContext({ network: NETWORK, sender: opts.walletAddress });
  const api = getToolsForAdapter(allTools, ctx);
  const tools: ToolSet = {};

  for (const t of allTools) {
    if (EXCLUDED.has(t.name)) continue;
    tools[t.name] =
      t.kind === 'read'
        ? tool({
            description: t.description,
            inputSchema: t.inputSchema,
            execute: (args) => api.read(t.name, args),
          })
        : tool({
            description: t.description,
            inputSchema: t.inputSchema,
            // no execute → client builds + signs, then submits the tool result
          });
  }

  return tools;
}
