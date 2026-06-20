import { describe, expect, it } from 'vitest';
import { FLOAT_SCALING } from '../src/constants.js';
import { buildCurve, normalCdf, upProbability } from '../src/math.js';
import type { SviParams } from '../src/types.js';

// Real SVI sample + forward observed from the testnet indexer.
const svi: SviParams = {
  a: 5450,
  b: 473870,
  sigma: 1000000,
  rho: 805150899,
  rho_negative: true,
  m: 2524550,
  m_negative: true,
};
const forward = 63414869615743; // ×1e9  ($63,414.87)

describe('normalCdf', () => {
  it('is 0.5 at 0 and symmetric around it', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    expect(normalCdf(1) + normalCdf(-1)).toBeCloseTo(1, 5);
  });
});

describe('upProbability', () => {
  it('is ~0.5 at the forward (ATM)', () => {
    const p = upProbability(svi, forward, forward);
    expect(p).toBeGreaterThan(0.45);
    expect(p).toBeLessThan(0.55);
  });

  it('falls as the strike rises (harder to exceed)', () => {
    const atm = upProbability(svi, forward, forward);
    const otm = upProbability(svi, forward, Math.round(forward * 1.02));
    expect(otm).toBeLessThan(atm);
  });
});

describe('buildCurve', () => {
  it('returns a non-increasing smile of the requested length, with probabilities in [0,1]', () => {
    const curve = buildCurve(svi, forward, { steps: 11, rangePct: 0.03 });
    expect(curve).toHaveLength(11);
    for (const pt of curve) {
      expect(Number(pt.upPrice)).toBeGreaterThanOrEqual(0);
      expect(Number(pt.upPrice)).toBeLessThanOrEqual(FLOAT_SCALING);
    }
    for (let i = 1; i < curve.length; i++) {
      // strictly non-increasing (allow a 1-unit rounding wobble)
      expect(Number(curve[i]!.upPrice)).toBeLessThanOrEqual(Number(curve[i - 1]!.upPrice) + 1);
    }
  });
});
