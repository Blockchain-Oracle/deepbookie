import { NextResponse } from 'next/server';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { toDusdc } from '@deepbookie/predict-client';
import {
  DUSDC_TYPE,
  FAUCET_AMOUNT_USD,
  FAUCET_MIN_BALANCE_USD,
  FAUCET_MIN_SUI,
  NETWORK,
  SUI_DECIMALS,
} from '@/lib/constants';
import { grantDusdc, requestSuiGas } from '@/lib/faucet.server';
import { allowFaucet } from '@/lib/rate-limit';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;
const GENERIC_ERROR = 'Couldn’t fund right now — try the request form below.';

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

/**
 * App-run faucet: grants a small dUSDC starter (operator hot wallet) and requests gas SUI from the
 * public testnet faucet. Eligibility-gated on current balances + rate-limited per IP/global so it
 * can't be drained. Operational error detail is logged server-side only, never returned to the client.
 */
export async function POST(req: Request) {
  let address: string | undefined;
  try {
    address = ((await req.json()) as { address?: string }).address?.trim();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!address || !ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: 'invalid_address' }, { status: 400 });
  }
  if (!allowFaucet(clientIp(req))) {
    return NextResponse.json({ error: 'rate_limited', message: 'Too many requests — try again later.' }, { status: 429 });
  }

  const client = new SuiJsonRpcClient({ network: NETWORK, url: getJsonRpcFullnodeUrl(NETWORK) });
  try {
    const [dusdcBal, suiBal] = await Promise.all([
      client.getBalance({ owner: address, coinType: DUSDC_TYPE }),
      client.getBalance({ owner: address }),
    ]);
    // Exact base-unit comparisons (no float precision loss).
    const needDusdc = BigInt(dusdcBal.totalBalance) < toDusdc(FAUCET_MIN_BALANCE_USD);
    const minSuiBase = BigInt(Math.round(FAUCET_MIN_SUI * 10 ** SUI_DECIMALS));
    const needSui = BigInt(suiBal.totalBalance) < minSuiBase;

    const suiRequested = needSui ? await requestSuiGas(address) : false;
    const digest = needDusdc ? await grantDusdc(address, FAUCET_AMOUNT_USD) : null;
    const granted = needDusdc ? FAUCET_AMOUNT_USD : 0;

    logger.info({ address, granted, digest, suiRequested }, 'faucet grant');
    return NextResponse.json({ granted, digest, suiRequested, alreadyFunded: granted === 0 });
  } catch (err) {
    logger.error(
      { address, err: err instanceof Error ? err.message : String(err) },
      'faucet failed',
    );
    return NextResponse.json({ error: 'faucet_failed', message: GENERIC_ERROR }, { status: 500 });
  }
}
