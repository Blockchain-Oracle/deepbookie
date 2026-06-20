import { getOracleState } from '@deepbookie/predict-client';

const FLOAT_SCALING = 1_000_000_000;

/**
 * Resolve a market for trading: fetch its (fixed) expiry and a `snap` that converts a human dollar
 * strike to the nearest valid on-chain grid strike (×1e9). Removes two agent footguns — passing an
 * exact expiry, and pre-scaling/grid-aligning the strike.
 */
export async function resolveMarket(
  oracleId: string,
): Promise<{ expiry: number; snap: (usd: number) => number }> {
  const s = await getOracleState(oracleId);
  const tick = s.oracle.tick_size; // ×1e9 per grid step
  const min = s.oracle.min_strike; // ×1e9
  const snap = (usd: number): number => {
    const scaled = Math.round(usd * FLOAT_SCALING);
    const k = Math.round((scaled - min) / tick);
    return min + k * tick;
  };
  return { expiry: s.oracle.expiry, snap };
}
