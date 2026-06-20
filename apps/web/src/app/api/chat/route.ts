import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel, isAnthropic } from '@/lib/ai/model';
import { buildAiTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { resolveManagerByOwner } from '@/lib/bff/positions';
import { resolveBalanceManagerByOwner } from '@/lib/bff/spot';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { upsertChat } from '@/lib/db/chats';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { CHAT_MAX_MESSAGES, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS } from '@/lib/constants';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_STEPS = 8;

/** First user line → session title (History list label). */
function titleFrom(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const text = firstUser?.parts.find((p) => p.type === 'text');
  return (text && 'text' in text ? text.text.trim() : '') || 'New chat';
}

/**
 * Resolve a manager id, distinguishing a transient resolver FAILURE (`failed: true`) from a genuine
 * "no account" null RETURN. The caller uses `failed` to avoid telling an existing user to create a
 * duplicate manager just because a single RPC lookup blipped.
 */
async function resolveId(
  provided: string | undefined,
  walletAddress: string | undefined,
  resolve: (owner: string) => Promise<string | null>,
  label: string,
): Promise<{ id: string | null; failed: boolean }> {
  if (provided) return { id: provided, failed: false };
  if (!walletAddress) return { id: null, failed: false };
  try {
    return { id: await resolve(walletAddress), failed: false };
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), label }, 'id resolve failed');
    return { id: null, failed: true };
  }
}

/**
 * The genUI chat. All per-user state is request-scoped (§5.1 isolation): one streamText per
 * request, tools + context built inside the handler. `walletAddress` from the body is the quote
 * sender only, never an authorization signal — write tools are signed in the browser, and history
 * persistence is keyed by a secret random chatId (NOT an auth boundary; SIWS session auth is the
 * documented fast-follow). The per-IP rate-limit caps unauthenticated abuse of this write path.
 */
export async function POST(req: Request) {
  if (!allowRequest(`chat:${clientIp(req)}`, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return new Response('rate limited', { status: 429 });
  }
  let messages: UIMessage[];
  let walletAddress: string | undefined;
  let clientManagerId: string | undefined;
  let clientBalanceManagerId: string | undefined;
  let clientBalanceManagerUnknown: boolean | undefined;
  let chatId: string | undefined;
  try {
    const body = (await req.json()) as {
      messages: UIMessage[];
      walletAddress?: string;
      managerId?: string;
      balanceManagerId?: string;
      balanceManagerUnknown?: boolean;
      chatId?: string;
    };
    messages = body.messages;
    walletAddress = body.walletAddress;
    clientManagerId = body.managerId;
    clientBalanceManagerId = body.balanceManagerId;
    clientBalanceManagerUnknown = body.balanceManagerUnknown;
    chatId = body.chatId;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // walletAddress is optional (launcher-first reads run pre-wallet), but if present it must be a
  // well-formed Sui address — it's used as the quote sender + the history row key.
  if (walletAddress && !isValidSuiAddress(walletAddress)) {
    return new Response('bad request', { status: 400 });
  }
  // Validate client-supplied object ids too (parity with /api/spot/read) — a malformed id would
  // otherwise reach the SDK/devInspect as a masked error instead of a clean 400.
  if (
    (clientManagerId && !isValidSuiAddress(clientManagerId)) ||
    (clientBalanceManagerId && !isValidSuiAddress(clientBalanceManagerId))
  ) {
    return new Response('bad request', { status: 400 });
  }
  // Bound the transcript size so a single request can't blow up LLM token cost or jsonb storage.
  if (!Array.isArray(messages) || messages.length > CHAT_MAX_MESSAGES) {
    return new Response('bad request', { status: 400 });
  }

  // Prefer the client-resolved ids (React-Query-cached, stable). Only hit chain when the client
  // hasn't resolved one yet — avoids the per-request lag flip-flop ("balance" vs "no account").
  // A resolver THROW (transient RPC failure) is tracked apart from a null RETURN (genuinely no
  // account), so we never tell an existing user to create a duplicate manager on a network blip.
  const mgr = await resolveId(clientManagerId, walletAddress, resolveManagerByOwner, 'manager');
  const bmr = await resolveId(clientBalanceManagerId, walletAddress, resolveBalanceManagerByOwner, 'balanceManager');
  const managerId = mgr.id;
  const balanceManagerId = bmr.id;

  // Tell the agent the account status it can't otherwise see (the managerId lives in the tool ctx,
  // not the conversation) — so it goes straight to the trade for existing users, only proposes
  // create for genuinely new ones, and does NOT proactively propose create when the check failed.
  const accountStatus = managerId
    ? '\n\nAccount status: the user ALREADY has a PredictManager. Do NOT call create_manager — go straight to the trade (mint/redeem/supply/withdraw).'
    : mgr.failed
      ? '\n\nAccount status: UNKNOWN — could not check right now. Do NOT proactively propose create_manager; attempt the action and only if it fails for a missing account, then propose create_manager.'
      : '\n\nAccount status: the user has NO PredictManager yet. Before any bet, propose create_manager first, then the trade next turn.';
  // `clientBalanceManagerUnknown` = the client couldn't read its captured id (storage blocked); since
  // the on-chain resolver can't find shared BMs either, existence is genuinely UNKNOWN, not "none".
  const spotUnknown = bmr.failed || (clientBalanceManagerUnknown ?? false);
  const spotStatus = balanceManagerId
    ? '\n\nSpot account: the user ALREADY has a DeepBook BalanceManager. Do NOT call spot_create_balance_manager — go straight to the spot action (deposit/swap/order/stake).'
    : spotUnknown
      ? '\n\nSpot account: UNKNOWN — could not check right now. Do NOT proactively propose spot_create_balance_manager; attempt the action and only if it fails for a missing account, then propose it.'
      : '\n\nSpot account: the user has NO DeepBook BalanceManager yet. Before any spot deposit/trade, propose spot_create_balance_manager first, then the action next turn.';

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT + accountStatus + spotStatus,
    messages: await convertToModelMessages(messages),
    tools: buildAiTools({
      walletAddress,
      managerId: managerId ?? undefined,
      balanceManagerId: balanceManagerId ?? undefined,
    }),
    stopWhen: stepCountIs(MAX_STEPS),
    // One proposed trade per turn (the propose→sign UI signs one tx per step).
    providerOptions: isAnthropic()
      ? { anthropic: { disableParallelToolUse: true } }
      : { openai: { parallelToolCalls: false } },
    onError: ({ error }) => logger.error({ err: String(error) }, 'chat stream error'),
  });

  // Surface real tool/stream error messages (default masks to "An error occurred.") so the agent can
  // self-correct (e.g. pick another market) and the user sees an honest reason — and we log them.
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error({ err: msg }, 'chat tool error');
      return msg;
    },
    // Persist the full transcript per turn — History. Wallet-keyed; no-op without a DB or wallet.
    onFinish: async ({ messages: finalMessages }) => {
      if (!chatId || !walletAddress) return;
      try {
        await upsertChat({ id: chatId, wallet: walletAddress, title: titleFrom(messages), messages: finalMessages });
      } catch (err) {
        logger.error({ err: err instanceof Error ? err.message : String(err) }, 'chat persist failed');
      }
    },
  });
}
