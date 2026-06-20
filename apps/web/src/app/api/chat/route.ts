import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel, isAnthropic } from '@/lib/ai/model';
import { buildAiTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { resolveManagerByOwner } from '@/lib/bff/positions';
import { resolveBalanceManagerByOwner } from '@/lib/bff/spot';
import { upsertChat } from '@/lib/db/chats';
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
 * The genUI chat. All per-user state is request-scoped (§5.1 isolation): one streamText per
 * request, tools + context built inside the handler. `walletAddress` from the body is the quote
 * sender only, never an authorization signal — write tools are signed in the browser.
 */
export async function POST(req: Request) {
  let messages: UIMessage[];
  let walletAddress: string | undefined;
  let clientManagerId: string | undefined;
  let clientBalanceManagerId: string | undefined;
  let chatId: string | undefined;
  try {
    const body = (await req.json()) as {
      messages: UIMessage[];
      walletAddress?: string;
      managerId?: string;
      balanceManagerId?: string;
      chatId?: string;
    };
    messages = body.messages;
    walletAddress = body.walletAddress;
    clientManagerId = body.managerId;
    clientBalanceManagerId = body.balanceManagerId;
    chatId = body.chatId;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Prefer the client-resolved ids (React-Query-cached, stable). Only hit chain when the client
  // hasn't resolved one yet — avoids the per-request lag flip-flop ("balance" vs "no account").
  const managerId =
    clientManagerId ??
    (walletAddress ? await resolveManagerByOwner(walletAddress).catch(() => null) : null);
  const balanceManagerId =
    clientBalanceManagerId ??
    (walletAddress ? await resolveBalanceManagerByOwner(walletAddress).catch(() => null) : null);

  // Tell the agent the account status it can't otherwise see (the managerId lives in the tool ctx,
  // not the conversation) — so it goes straight to the trade for existing users and only proposes
  // create_manager for genuinely new ones.
  const accountStatus = managerId
    ? '\n\nAccount status: the user ALREADY has a PredictManager. Do NOT call create_manager — go straight to the trade (mint/redeem/supply/withdraw).'
    : '\n\nAccount status: the user has NO PredictManager yet. Before any bet, propose create_manager first, then the trade next turn.';
  const spotStatus = balanceManagerId
    ? '\n\nSpot account: the user ALREADY has a DeepBook BalanceManager. Do NOT call spot_create_balance_manager — go straight to the spot action (deposit/swap/order/stake).'
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
