/**
 * Diagnose a failed transaction — turn a raw thrown error into a structured envelope the UI can
 * render specifically and the agent (via tool-result errorText) can speak to intelligently.
 *
 * Source of truth for: WHAT the user sees on the failed card, AND what the model sees in the
 * tool-error result. Both consume the same diagnosis, so the card and the chat agree.
 */

export type DiagnosisCode =
  | 'user_rejected' // wallet decline — not a failure to retry around (caller handles separately)
  | 'market_settled' // bet/redeem on an expired market
  | 'insufficient_dusdc' // not enough dUSDC to cover the stake/quote
  | 'insufficient_sui' // not enough SUI for gas (only happens in user-pays paths)
  | 'insufficient_deep' // not enough DEEP for spot fees on a non-whitelisted pool
  | 'insufficient_balance' // generic balance shortfall we can't attribute to a specific coin
  | 'no_predict_manager' // first-bet path — need create_manager first
  | 'no_balance_manager' // first-spot path — need spot_create_balance_manager first
  | 'sponsor_failed' // Enoki sponsorship rejected the tx (allowlist, gas budget, etc.)
  | 'on_chain_abort' // MoveAbort — execution rejected on-chain (generic, no specific table mapping)
  | 'indexer_timeout' // network/indexer hiccup — the tx may or may not have landed
  | 'unknown'; // catch-all — never blame the user

export interface Diagnosis {
  code: DiagnosisCode;
  /** One-line user-facing summary (goes on the failed card as the headline). */
  headline: string;
  /** Optional second line with specifics (balance shortfall, pool name, abort code, etc.). */
  detail?: string;
  /** Optional next step the user can take (free text — not a button label). */
  suggestion?: string;
  /** Serialized form the AI agent sees as the tool-error result — multi-line, model-readable. */
  forModel: string;
}

const norm = (e: unknown): string => (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();

/**
 * Classify a thrown write-error into a structured Diagnosis. Ordered most-specific first — a
 * settlement abort is itself a MoveAbort whose text NAMES "settled", so it must match before the
 * generic on-chain-abort branch.
 */
export function diagnose(e: unknown): Diagnosis {
  const m = norm(e);

  if (m.includes('reject') || m.includes('denied') || m.includes('cancel')) {
    return build('user_rejected', 'Signature declined in your wallet.', {
      detail: 'No funds moved.',
    });
  }

  if (m.includes('settled') || m.includes('not active') || m.includes('expired')) {
    return build('market_settled', 'This market has settled.', {
      detail: 'It can no longer be traded — open positions on it auto-redeem at expiry.',
    });
  }

  if (m.includes('no dusdc') || (m.includes('dusdc') && m.includes('balance'))) {
    return build('insufficient_dusdc', 'Not enough dUSDC.', {
      detail: 'Your dUSDC balance is too low to cover this bet or deposit.',
      suggestion: "Tap 'Get test funds' in the banner to top up.",
    });
  }

  if (m.includes('deep') && (m.includes('balance') || m.includes('insufficient') || m.includes('fee'))) {
    return build('insufficient_deep', 'Not enough DEEP for fees.', {
      detail: 'This pool charges fees in DEEP and your DEEP balance is too low.',
      suggestion: 'Try a whitelisted pool (SUI_DBUSDC or DEEP_SUI) where fees pay from the traded coin — no DEEP needed.',
    });
  }

  if (m.includes('balance manager') || m.includes('balancemanager')) {
    return build('no_balance_manager', 'Open a DeepBook spot account first.', {
      detail: 'Spot orders need a BalanceManager — a one-time, signed setup.',
      suggestion: "Say 'open my DeepBook spot account' to create one (it's gasless).",
    });
  }

  if (m.includes('predict manager') || (m.includes('manager') && !m.includes('balance'))) {
    return build('no_predict_manager', 'Open your trading account first.', {
      detail: 'Predict bets need a PredictManager — a one-time, signed setup.',
      suggestion: "Say 'open my trading account' to create one (it's gasless).",
    });
  }

  if (m.includes('sponsor') || m.includes('enoki') || m.includes('gas owner')) {
    return build('sponsor_failed', 'Gasless sponsorship rejected this trade.', {
      detail: 'Falling back to user-pays-gas should normally retry automatically — if you see this, both paths failed.',
      suggestion: 'Try again, or contact support with the trade reference.',
    });
  }

  if (m.includes('moveabort') || m.includes('abort')) {
    const code = /code:?\s*(\d+)/.exec(m)?.[1];
    return build('on_chain_abort', 'The transaction was rejected on-chain.', {
      detail: code
        ? `MoveAbort code ${code} — usually a balance check, stale market, or state that changed between the quote and signing.`
        : 'Usually a balance check, stale market, or state that changed between the quote and signing.',
      suggestion: 'Re-quote and try again with current numbers.',
    });
  }

  if (m.includes('insufficient') || m.includes('balance')) {
    return build('insufficient_balance', 'Not enough balance to cover this.', {
      detail: 'Check the trade size against your wallet balance.',
    });
  }

  if (m.includes('gas') && (m.includes('budget') || m.includes('insufficient') || m.includes('cover'))) {
    return build('insufficient_sui', 'Not enough SUI for gas.', {
      detail: 'This action falls back to user-pays-gas (SUI swaps cannot be sponsored), and your SUI balance is too low.',
      suggestion: "Tap 'Get test funds' for a small SUI grant from the faucet.",
    });
  }

  if (m.includes('timeout') || m.includes('indexer') || m.includes('econnreset') || m.includes('fetch')) {
    return build('indexer_timeout', 'Couldn’t reach the market right now.', {
      detail: 'The transaction may have landed on-chain even though the response timed out — check your wallet history before retrying.',
    });
  }

  // Unknown: never blame the user, never assert "no funds moved" (sign+execute may have broadcast).
  return build('unknown', 'The transaction failed or its result couldn’t be confirmed.', {
    detail: 'Check your wallet history before retrying.',
  });
}

/** Backwards-compat shim: legacy callers that only want the headline. */
export function reasonFor(e: unknown): string {
  return diagnose(e).headline;
}

/** True iff the error is a user-declined-the-popup cancellation (NOT a failure). */
export function isUserRejection(e: unknown): boolean {
  return diagnose(e).code === 'user_rejected';
}

function build(
  code: DiagnosisCode,
  headline: string,
  parts: { detail?: string; suggestion?: string } = {},
): Diagnosis {
  // The model sees a multi-line string — labelled fields scan better than a free-form sentence,
  // and giving it a `code` makes pattern-matching across turns reliable.
  const forModel = [
    `Trade failed.`,
    `code: ${code}`,
    `reason: ${headline}`,
    parts.detail ? `detail: ${parts.detail}` : undefined,
    parts.suggestion ? `suggestion: ${parts.suggestion}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
  return { code, headline, ...parts, forModel };
}
