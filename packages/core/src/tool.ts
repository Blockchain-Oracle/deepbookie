import type { Transaction } from '@mysten/sui/transactions';
import type { z } from 'zod';
import type { ToolContext } from './context.js';

/** Which DeepBook primitive a tool belongs to (lets adapters filter, e.g. demo = predict-only). */
export type Surface = 'predict' | 'spot' | 'margin';

interface Base<S extends z.ZodTypeAny> {
  name: string;
  description: string;
  surface: Surface;
  inputSchema: S;
}

/** A read tool runs server-side (indexer / devInspect) and returns JSON. No wallet, no signing. */
export interface ReadTool<S extends z.ZodTypeAny = z.ZodTypeAny> extends Base<S> {
  kind: 'read';
  read: (args: z.infer<S>, ctx: ToolContext) => Promise<unknown>;
}

/** A write tool BUILDS an unsigned Sui transaction. Signing happens at the edge (local key or wallet). */
export interface WriteTool<S extends z.ZodTypeAny = z.ZodTypeAny> extends Base<S> {
  kind: 'write';
  build: (args: z.infer<S>, ctx: ToolContext) => Promise<Transaction>;
}

export type ToolDef = ReadTool | WriteTool;

export function defineRead<S extends z.ZodTypeAny>(def: Omit<ReadTool<S>, 'kind'>): ReadTool<S> {
  return { ...def, kind: 'read' };
}

export function defineWrite<S extends z.ZodTypeAny>(def: Omit<WriteTool<S>, 'kind'>): WriteTool<S> {
  return { ...def, kind: 'write' };
}
