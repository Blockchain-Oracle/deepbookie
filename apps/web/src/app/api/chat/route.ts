import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel, isAnthropic } from '@/lib/ai/model';
import { buildAiTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { resolveManagerByOwner } from '@/lib/bff/positions';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_STEPS = 5;

/**
 * The genUI chat. All per-user state is request-scoped (§5.1 isolation): one streamText per
 * request, tools + context built inside the handler. `walletAddress` from the body is the quote
 * sender only, never an authorization signal — write tools are signed in the browser.
 */
export async function POST(req: Request) {
  let messages: UIMessage[];
  let walletAddress: string | undefined;
  try {
    const body = (await req.json()) as { messages: UIMessage[]; walletAddress?: string };
    messages = body.messages;
    walletAddress = body.walletAddress;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Resolve the connected wallet's shared PredictManager so portfolio/positions "just work" — the
  // manager is auto-derived (owner→manager via the indexer), never asked of the user. Best-effort.
  const managerId = walletAddress
    ? await resolveManagerByOwner(walletAddress).catch(() => null)
    : null;

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: buildAiTools({ walletAddress, managerId: managerId ?? undefined }),
    stopWhen: stepCountIs(MAX_STEPS),
    // One proposed trade per turn (the propose→sign UI signs one tx per step).
    providerOptions: isAnthropic()
      ? { anthropic: { disableParallelToolUse: true } }
      : { openai: { parallelToolCalls: false } },
    onError: ({ error }) => logger.error({ err: String(error) }, 'chat stream error'),
  });

  return result.toUIMessageStreamResponse();
}
