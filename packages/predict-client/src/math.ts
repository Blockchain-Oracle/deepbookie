import { FLOAT_SCALING } from './constants.js';
import type { CurvePoint, SviParams } from './types.js';
import { fromScaled } from './units.js';

/** Standard normal CDF via the Abramowitz–Stegun approximation (max abs error ~7.5e-8). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = d * poly;
  return x >= 0 ? 1 - p : p;
}

function signed(magnitude: number, negative: boolean): number {
  return (negative ? -1 : 1) * fromScaled(magnitude);
}

/**
 * Probability the underlying ends ABOVE `strikeScaled` at expiry, from the SVI surface.
 * Mirrors the on-chain pricing: total variance w(k) from SVI, then UP = N(d2). Returns 0..1.
 * All inputs are ×1e9 fixed-point (the raw indexer/on-chain form).
 */
export function upProbability(svi: SviParams, forwardScaled: number, strikeScaled: number): number {
  const forward = fromScaled(forwardScaled);
  const strike = fromScaled(strikeScaled);
  if (forward <= 0 || strike <= 0) return 0;
  const a = fromScaled(svi.a);
  const b = fromScaled(svi.b);
  const sigma = fromScaled(svi.sigma);
  const rho = signed(svi.rho, svi.rho_negative);
  const m = signed(svi.m, svi.m_negative);

  const k = Math.log(strike / forward);
  const w = a + b * (rho * (k - m) + Math.sqrt((k - m) ** 2 + sigma ** 2));
  if (w <= 0) return strike <= forward ? 1 : 0;
  const d2 = -((k + w / 2) / Math.sqrt(w));
  return normalCdf(d2);
}

export function downProbability(svi: SviParams, forwardScaled: number, strikeScaled: number): number {
  return 1 - upProbability(svi, forwardScaled, strikeScaled);
}

export interface CurveOptions {
  /** number of sampled strikes (default 25). */
  steps?: number;
  /** half-width around the forward as a fraction (default 0.05 = ±5%). */
  rangePct?: number;
}

/** Sample the probability smile around the forward — the data the odds-curve widget renders. */
export function buildCurve(
  svi: SviParams,
  forwardScaled: number,
  options: CurveOptions = {},
): CurvePoint[] {
  const steps = options.steps ?? 25;
  const rangePct = options.rangePct ?? 0.05;
  const forward = fromScaled(forwardScaled);
  const points: CurvePoint[] = [];
  for (let i = 0; i < steps; i++) {
    const frac = steps === 1 ? 0.5 : i / (steps - 1);
    const price = forward * (1 - rangePct + 2 * rangePct * frac);
    const strikeScaled = Math.round(price * FLOAT_SCALING);
    const up = upProbability(svi, forwardScaled, strikeScaled);
    points.push({ strike: BigInt(strikeScaled), upPrice: BigInt(Math.round(up * FLOAT_SCALING)) });
  }
  return points;
}
