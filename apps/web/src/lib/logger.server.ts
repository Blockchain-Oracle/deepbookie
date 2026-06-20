import pino from 'pino';

/**
 * Server-side structured logging for route handlers + the BFF. On Vercel, stdout is the
 * log channel (unlike the stdio MCP, which must log to stderr). Never import this into a
 * client (`'use client'`) module.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { app: 'deepbookie-web' },
});
