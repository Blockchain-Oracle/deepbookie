import { describe, expect, it } from 'vitest';
import { getActiveOracles, getLatestSvi, getVaultSummary } from '../src/indexer.js';

// Live integration tests — opt in with RUN_INTEGRATION=1 (kept out of CI to avoid network flakiness).
const integration = process.env.RUN_INTEGRATION ? describe : describe.skip;

integration('predict indexer (live testnet)', () => {
  it('lists active oracles with the expected shape', async () => {
    const oracles = await getActiveOracles();
    expect(Array.isArray(oracles)).toBe(true);
    if (oracles.length > 0) {
      const o = oracles[0]!;
      expect(o.oracle_id).toMatch(/^0x/);
      expect(typeof o.expiry).toBe('number');
      expect(o.status).toBe('active');
    }
  });

  it('reads a live SVI for an active oracle', async () => {
    const oracles = await getActiveOracles();
    if (oracles.length === 0) return;
    const svi = await getLatestSvi(oracles[0]!.oracle_id);
    expect(svi).not.toBeNull();
    expect(typeof svi!.a).toBe('number');
    expect(typeof svi!.rho_negative).toBe('boolean');
  });

  it('reads the vault summary', async () => {
    const v = await getVaultSummary();
    expect(v.plp_share_price).toBeGreaterThan(0);
    expect(v.vault_value).toBeGreaterThan(0);
  });
});
