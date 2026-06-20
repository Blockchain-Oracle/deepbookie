import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createProviderRegistry, type LanguageModel } from 'ai';

/**
 * Provider-agnostic model selection from env (no user-facing picker). Each provider reads its own
 * key (ANTHROPIC_API_KEY / OPENAI_API_KEY). Default: claude-haiku-4-5 (cheap, fast tool use).
 */
const registry = createProviderRegistry({ anthropic, openai });

const DEFAULT_PROVIDER = 'anthropic';
const DEFAULT_MODEL = 'claude-haiku-4-5';

export function getModel(): LanguageModel {
  const provider = (process.env.MODEL_PROVIDER ?? DEFAULT_PROVIDER) as 'anthropic' | 'openai';
  const id = process.env.MODEL_ID ?? DEFAULT_MODEL;
  return registry.languageModel(`${provider}:${id}`);
}

export function isAnthropic(): boolean {
  return (process.env.MODEL_PROVIDER ?? DEFAULT_PROVIDER) === 'anthropic';
}
