import { NextResponse } from 'next/server';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { fromDusdc } from '@deepbookie/predict-client';
import {
  DUSDC_TYPE,
  FAUCET_AMOUNT_USD,
  FAUCET_MIN_BALANCE_USD,
  FAUCET_MIN_SUI,
  NETWORK,
} from '@/lib/constants';
import { grantDusdc, requestSuiGas } from '@/lib/faucet.server';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;
const SUI_DECIMALS = 9;

/**
 * App-run faucet: grants a small dUSDC starter to a connected wallet (operator hot wallet) and
 * requests gas SUI from the public testnet faucet. Eligibility-gated on current balances so it
 * can't be drained; once a wallet is funded, repeat calls no-op (`alreadyFunded`).
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

  const client = new SuiJsonRpcClient({ network: NETWORK, url: getJsonRpcFullnodeUrl(NETWORK) });
  try {
    const [dusdcBal, suiBal] = await Promise.all([
      client.getBalance({ owner: address, coinType: DUSDC_TYPE }),
      client.getBalance({ owner: address }),
    ]);
    const dusdcUsd = fromDusdc(Number(dusdcBal.totalBalance));
    const suiAmt = Number(suiBal.totalBalance) / 10 ** SUI_DECIMALS;

    const suiRequested = suiAmt < FAUCET_MIN_SUI ? await requestSuiGas(address) : false;

    let digest: string | null = null;
    let granted = 0;
    if (dusdcUsd < FAUCET_MIN_BALANCE_USD) {
      digest = await grantDusdc(address, FAUCET_AMOUNT_USD);
      granted = FAUCET_AMOUNT_USD;
    }

    logger.info({ address, granted, digest, suiRequested }, 'faucet grant');
    return NextResponse.json({ granted, digest, suiRequested, alreadyFunded: granted === 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error({ address, err: message }, 'faucet failed');
    return NextResponse.json({ error: 'faucet_failed', message }, { status: 500 });
  }
}
