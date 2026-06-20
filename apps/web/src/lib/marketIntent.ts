import { formatSettleTime } from './format';

interface MarketRef {
  asset: string;
  expiry: number;
  oracleId: string;
}

/** Auto-prompt for the Markets "Trade" action — carries the exact market so the agent quotes it. */
export function tradePrompt(m: MarketRef): string {
  return `Show me the live odds for the ${m.asset} market settling ${formatSettleTime(
    m.expiry,
  )}, then help me place a bet. (oracleId: ${m.oracleId})`;
}

/** Auto-prompt for a Bet UP/DOWN action on the market detail page. */
export function betPrompt(m: MarketRef & { direction: 'UP' | 'DOWN'; strikeUsd: number }): string {
  return `Quote a ${m.direction} bet on the ${m.asset} market settling ${formatSettleTime(
    m.expiry,
  )} at strike $${Math.round(m.strikeUsd)}. (oracleId: ${m.oracleId})`;
}

/** Link into the chat that auto-sends `prompt` (read + cleared by the Chat component on mount). */
export function chatHref(prompt: string): string {
  return `/chat?q=${encodeURIComponent(prompt)}`;
}
