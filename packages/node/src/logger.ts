import pino from 'pino';

/**
 * Structured logger. Writes to STDERR (fd 2) on purpose: the stdio MCP server uses STDOUT as the
 * JSON-RPC channel, so anything logged to stdout would corrupt the protocol. Never console.log.
 */
export const logger = pino(
  { level: process.env.DEEPBOOKIE_LOG_LEVEL ?? 'info' },
  pino.destination(2),
);
