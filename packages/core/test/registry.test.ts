import { describe, expect, it } from 'vitest';
import { allTools } from '../src/registry.js';

describe('registry', () => {
  it('exposes 14 Predict tools (6 read / 8 write) with unique names', () => {
    expect(allTools).toHaveLength(14);
    expect(allTools.filter((t) => t.kind === 'read')).toHaveLength(6);
    expect(allTools.filter((t) => t.kind === 'write')).toHaveLength(8);
    expect(allTools.every((t) => t.surface === 'predict')).toBe(true);
    expect(new Set(allTools.map((t) => t.name)).size).toBe(14);
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
