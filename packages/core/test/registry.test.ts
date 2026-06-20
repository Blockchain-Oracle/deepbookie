import { describe, expect, it } from 'vitest';
import { allTools } from '../src/registry.js';

describe('registry', () => {
  it('exposes Predict + Spot tools (18 read / 17 write) with unique names', () => {
    expect(allTools).toHaveLength(35);
    expect(allTools.filter((t) => t.kind === 'read')).toHaveLength(18);
    expect(allTools.filter((t) => t.kind === 'write')).toHaveLength(17);
    expect(new Set(allTools.map((t) => t.name)).size).toBe(35);
  });

  it('has both predict and spot surfaces (18 predict + 17 spot)', () => {
    expect(allTools.filter((t) => t.surface === 'predict')).toHaveLength(18);
    expect(allTools.filter((t) => t.surface === 'spot')).toHaveLength(17);
    expect(allTools.every((t) => t.surface === 'predict' || t.surface === 'spot')).toBe(true);
  });

  it('every tool has a description and an object input schema', () => {
    for (const t of allTools) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.inputSchema.shape).toBeTypeOf('object');
    }
  });

  it('read tools have a read fn, write tools have a build fn', () => {
    for (const t of allTools) {
      if (t.kind === 'read') expect(t.read).toBeTypeOf('function');
      else expect(t.build).toBeTypeOf('function');
    }
  });
});
