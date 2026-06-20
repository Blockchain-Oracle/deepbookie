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
