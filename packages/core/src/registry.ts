import type { ToolDef } from './tool.js';
import { readTools } from './tools/reads.js';
import { writeTools } from './tools/writes.js';

/** The single source of truth: every DeepBookie tool, authored once, consumed by every surface. */
export const allTools: ToolDef[] = [...readTools, ...writeTools];
