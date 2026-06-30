import { EnokiClient, EnokiClientError } from '@mysten/enoki';
import { NETWORK } from '@/lib/constants';

/** Extract the actionable detail from an Enoki failure (the API returns a specific code/message that
 *  the generic Error.message hides — e.g. a disallowed move target or gas-budget issue). */
export function enokiErrorInfo(err: unknown): {
  message: string;
  code?: string;
  status?: number;
  errors?: unknown;
} {
  if (err instanceof EnokiClientError) {
    return {
      message: err.errors?.[0]?.message ?? err.message,
      code: err.code,
      status: err.status,
      errors: err.errors,
    };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

/**
 * Server-only Enoki sponsorship (Slice B — gasless). Uses the PRIVATE Enoki key (`ENOKI_PRIVATE_KEY`)
 * to sponsor gas for any connected wallet (extension OR zkLogin), so a brand-new user needs zero SUI.
 * The wallet still signs the bet; Enoki co-signs + pays gas. Never import this into a client module.
 *
 * Flow: client builds an `onlyTransactionKind` tx → POST /api/sponsor/create (this createSponsored) →
 * wallet signs the returned bytes → POST /api/sponsor/execute (executeSponsored).
 */
let enoki: EnokiClient | null = null;

function client(): EnokiClient {
  if (enoki) return enoki;
  const apiKey = process.env.ENOKI_PRIVATE_KEY?.trim();
  if (!apiKey) throw new Error('ENOKI_PRIVATE_KEY is not configured');
  enoki = new EnokiClient({ apiKey });
  return enoki;
}

/**
 * Build a sponsored transaction from the client's `onlyTransactionKind` bytes. Returns the full
 * sponsored tx bytes (gas owner = Enoki) + its digest for the wallet to sign.
 *
 * Enoki ALWAYS enforces an allowlist (no wildcard, no allow-all; the comparison is against
 * fully-normalized 64-hex addresses). Rather than hand-maintain a list — which inevitably forgets a
 * target (spot/DeepBook did) — the client extracts the move-call targets from the very tx it's
 * sponsoring and passes them here. So every tx the app builds is covered automatically.
 */
export async function createSponsored(
  sender: string,
  transactionKindBytes: string,
  allowedMoveCallTargets: string[],
): Promise<{ bytes: string; digest: string }> {
  return client().createSponsoredTransaction({
    network: NETWORK,
    sender,
    transactionKindBytes,
    allowedMoveCallTargets,
  });
}

/** Execute a previously-sponsored transaction once the user has signed it. */
export async function executeSponsored(
  digest: string,
  signature: string,
): Promise<{ digest: string }> {
  return client().executeSponsoredTransaction({ digest, signature });
}
