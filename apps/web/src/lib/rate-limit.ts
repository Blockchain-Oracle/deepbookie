import { FAUCET_RATE_GLOBAL, FAUCET_RATE_PER_IP, FAUCET_RATE_WINDOW_MS } from '@/lib/constants';

/**
 * Minimal in-memory sliding-window limiter for the faucet — caps fresh-address spam (which would
 * drain the public SUI gas faucet + burn operator gas) per-IP and globally per process. It's a
 * shared rate-limit credential, not user data. Note: in-memory means per-instance only; the
 * durable fix is a DB-backed grant log (Phase 6).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, Bucket>();
let globalBucket: Bucket = { count: 0, resetAt: 0 };

function take(bucket: Bucket, max: number, now: number): boolean {
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + FAUCET_RATE_WINDOW_MS;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/** Returns true if this IP may take a faucet grant now (consumes one global + one per-IP token). */
export function allowFaucet(ip: string): boolean {
  const now = Date.now();
  if (now > globalBucket.resetAt) globalBucket = { count: 0, resetAt: now + FAUCET_RATE_WINDOW_MS };
  if (globalBucket.count >= FAUCET_RATE_GLOBAL) return false;

  let bucket = ipBuckets.get(ip);
  if (!bucket) {
    bucket = { count: 0, resetAt: now + FAUCET_RATE_WINDOW_MS };
    ipBuckets.set(ip, bucket);
  }
  if (!take(bucket, FAUCET_RATE_PER_IP, now)) return false;

  globalBucket.count += 1;
  return true;
}

// Generic per-key sliding-window limiter — used to cap abuse on the chat + history-write routes
// (unauthenticated by design; the durable fix is SIWS session auth). Keyed e.g. `chat:<ip>`.
const genBuckets = new Map<string, Bucket>();
// Global backstop: because the per-IP key derives from the client-controlled X-Forwarded-For, an
// attacker can rotate it to dodge the per-IP cap — this ceiling bounds total abuse regardless of
// key-spoofing. Scoped PER ROUTE (the key prefix before ':'), so flooding one route can't trip the
// backstop for every other route's legitimate users (a global self-DoS). Set far above real load.
const GEN_GLOBAL_MAX = 5000;
const genGlobalByRoute = new Map<string, Bucket>();

export function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const route = key.split(':')[0] || 'default';
  let global = genGlobalByRoute.get(route);
  if (!global || now > global.resetAt) {
    global = { count: 0, resetAt: now + windowMs };
    genGlobalByRoute.set(route, global);
  }
  if (global.count >= GEN_GLOBAL_MAX) return false;
  let bucket = genBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    genBuckets.set(key, bucket);
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  global.count += 1;
  return true;
}

/**
 * Best-effort client IP from proxy headers — for rate-limit keys only, NEVER trusted for auth. The
 * leftmost X-Forwarded-For hop is client-controllable; behind a trusted proxy/CDN that overwrites the
 * header this is fine, and the GEN_GLOBAL_MAX backstop bounds spoofing either way.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip')?.trim() ?? 'unknown';
}
