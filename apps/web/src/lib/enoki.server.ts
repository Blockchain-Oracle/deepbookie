import { EnokiClient } from '@mysten/enoki';
import { PREDICT_PACKAGE } from '@deepbookie/predict-client';
import { NETWORK } from '@/lib/constants';

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
 * Move-call targets the gas sponsor is willing to pay for — restricting this prevents anyone from
 * draining the gas budget on arbitrary calls. Native PTB commands (split/merge/transfer coins) are
 * NOT moveCalls, so they don't need listing. Covers every Predict write the web app can build.
 */
export const SPONSORED_TARGETS: readonly string[] = [
  'predict::create_manager',
  'predict::mint',
  'predict::mint_range',
  'predict::redeem',
  'predict::redeem_range',
  'predict::redeem_permissionless',
  'predict::supply',
  'predict::withdraw',
  'predict_manager::deposit',
  'predict_manager::withdraw',
  'market_key::up',
  'market_key::down',
  'range_key::new',
].map((s) => `${PREDICT_PACKAGE}::${s}`);

/** Build a sponsored transaction from the client's `onlyTransactionKind` bytes. Returns the full
 *  sponsored tx bytes (gas owner = Enoki) + its digest for the wallet to sign. */
export async function createSponsored(
  sender: string,
  transactionKindBytes: string,
): Promise<{ bytes: string; digest: string }> {
  return client().createSponsoredTransaction({
    network: NETWORK,
    sender,
    transactionKindBytes,
    allowedMoveCallTargets: [...SPONSORED_TARGETS],
  });
}

/** Execute a previously-sponsored transaction once the user has signed it. */
export async function executeSponsored(
  digest: string,
  signature: string,
): Promise<{ digest: string }> {
  return client().executeSponsoredTransaction({ digest, signature });
}
