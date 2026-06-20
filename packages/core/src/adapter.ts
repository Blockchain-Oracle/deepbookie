import type { ToolContext } from './context.js';
import type { ToolDef } from './tool.js';

export interface ToolInfo {
  name: string;
  description: string;
  surface: string;
  kind: 'read' | 'write';
}

/**
 * Transport-free view of the registry — every adapter (MCP, CLI, web) consumes this same shape.
 * Reads run server-side; writes return an UNSIGNED transaction the caller signs at the edge.
 */
export function getToolsForAdapter(tools: ToolDef[], ctx: ToolContext) {
  const byName = new Map(tools.map((t) => [t.name, t]));
  return {
    list: (): ToolInfo[] =>
      tools.map((t) => ({
        name: t.name,
        description: t.description,
        surface: t.surface,
        kind: t.kind,
      })),
    schema: (name: string) => byName.get(name)?.inputSchema,
    /** Run a READ tool, returning JSON data. Throws if the name is not a read tool. */
    read: async (name: string, args: unknown): Promise<unknown> => {
      const t = byName.get(name);
      if (!t || t.kind !== 'read') throw new Error(`no read tool named '${name}'`);
      return t.read(t.inputSchema.parse(args), ctx);
    },
    /** Build the UNSIGNED transaction for a WRITE tool. Throws if the name is not a write tool. */
    build: async (name: string, args: unknown) => {
      const t = byName.get(name);
      if (!t || t.kind !== 'write') throw new Error(`no write tool named '${name}'`);
      return t.build(t.inputSchema.parse(args), ctx);
    },
  };
}
