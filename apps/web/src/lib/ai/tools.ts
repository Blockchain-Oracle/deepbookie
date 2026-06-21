import { tool, type ToolSet } from 'ai';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import { cachedAiRead, withReliability } from '@/lib/bff/read';

// Tools excluded from the WEB agent (still available in MCP/CLI):
// - redeem_permissionless: a keeper tool, not a user action.
// - spot_place_market_order + its pre-flight: no editable card on the keyless web path, so the agent
//   would sign a fixed market order verbatim — and payWithDeep can be economically wrong on a
//   non-whitelisted pool with nothing to correct it. SwapCard covers "buy/sell now at market" safely
//   (whitelist-aware fee + quote + slippage). MCP/CLI keep these for local-key power users.
const EXCLUDED = new Set(['redeem_permissionless', 'spot_place_market_order', 'spot_can_place_market_order']);

// Reads that depend on the user's PredictManager / DeepBook BalanceManager (or live per-input quote
// against their account). These run REQUEST-SCOPED against the wallet ctx (never shared-cached), but
// still get timeout + retry. Everything else routes through the shared `cachedAiRead`.
const WALLET_SCOPED = new Set([
  'get_portfolio',
  'get_positions',
  'spot_account',
  'spot_balance',
  'spot_open_orders',
  'spot_can_place_limit_order',
]);

/**
 * Adapt the shared core registry into AI SDK tools (built per request, never module-scoped, so no
 * cross-user state leaks). Read tools get an `execute` (run server-side, streamed back as widgets);
 * write tools have NO execute — the call is forwarded to the browser, which builds the unsigned tx,
 * signs it, and submits the result. `walletAddress` (from the request body) is used only as the
 * devInspect quote sender — never for authorization.
 */
export function buildAiTools(opts: {
  walletAddress?: string;
  managerId?: string;
  balanceManagerId?: string;
}): ToolSet {
  const ctx = createContext({
    network: NETWORK,
    sender: opts.walletAddress,
    managerId: opts.managerId,
    balanceManagerId: opts.balanceManagerId,
  });
  const api = getToolsForAdapter(allTools, ctx);
  const tools: ToolSet = {};

  for (const t of allTools) {
    if (EXCLUDED.has(t.name)) continue;
    tools[t.name] =
      t.kind === 'read'
        ? tool({
            description: t.description,
            inputSchema: t.inputSchema,
            execute: (args) =>
              WALLET_SCOPED.has(t.name)
                ? // Runs against the wallet ctx (managerId/balanceManagerId baked in); the Predict
                  // manager reads also force the resolved id over any model-supplied one.
                  withReliability(() => {
                    // Wallet-scoped reads must use the CTX-resolved ids, never a model-supplied one (a
                    // hallucinated "AUTO"/"unknown" must never win). Strip any id from args, then force
                    // the resolved managerId for the Predict manager reads. (The spot reads' schemas
                    // already omit balanceManagerId, so ctx wins there — this keeps it true if that changes.)
                    const { managerId: _m, balanceManagerId: _b, ...safe } = args as Record<string, unknown>;
                    return api.read(
                      t.name,
                      t.name === 'get_portfolio' || t.name === 'get_positions'
                        ? { ...safe, managerId: opts.managerId }
                        : safe,
                    );
                  })
                : // Shared catalog/book reads: cached + timeout + retry (no wallet ctx needed).
                  cachedAiRead(t.name, args),
          })
        : tool({
            description: t.description,
            inputSchema: t.inputSchema,
            // no execute → client builds + signs, then submits the tool result
          });
  }

  return tools;
}
