/* eslint-disable no-console -- thin dev-only client logger; no-ops in production */

type Fields = Record<string, unknown>;

const enabled = process.env.NODE_ENV !== 'production';

/** Lightweight client logger — visible in dev, silent in production (no console in the prod bundle). */
export const clientLogger = {
  info(msg: string, fields?: Fields) {
    if (enabled) console.info(`[deepbookie] ${msg}`, fields ?? '');
  },
  warn(msg: string, fields?: Fields) {
    if (enabled) console.warn(`[deepbookie] ${msg}`, fields ?? '');
  },
  error(msg: string, fields?: Fields) {
    if (enabled) console.error(`[deepbookie] ${msg}`, fields ?? '');
  },
};
