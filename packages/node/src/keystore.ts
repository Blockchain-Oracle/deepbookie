import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from './logger.js';

const CONFIG_DIR = join(homedir(), '.deepbookie');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Load the local signing keypair, in priority order:
 *   1. DEEPBOOKIE_PRIVATE_KEY env (a `suiprivkey…` secret key)
 *   2. ~/.deepbookie/config.json (persisted secret key, mode 0600)
 *   3. auto-generate one, persist it (0600), and warn the user to fund it.
 *
 * Plaintext-at-rest (matches the local-MCP norm); optional encryption is a later upgrade.
 */
export function getOrCreateKeypair(): Ed25519Keypair {
  const env = process.env.DEEPBOOKIE_PRIVATE_KEY?.trim();
  if (env) return Ed25519Keypair.fromSecretKey(env);

  if (existsSync(CONFIG_FILE)) {
    const cfg = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as { secretKey?: string };
    if (!cfg.secretKey) throw new Error(`${CONFIG_FILE} is missing a 'secretKey' field`);
    return Ed25519Keypair.fromSecretKey(cfg.secretKey);
  }

  const kp = Ed25519Keypair.generate();
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify({ secretKey: kp.getSecretKey() }, null, 2), {
    mode: 0o600,
  });
  chmodSync(CONFIG_FILE, 0o600);
  logger.warn(
    { address: kp.toSuiAddress(), file: CONFIG_FILE },
    'generated a new DeepBookie wallet — fund it with testnet SUI (gas) + dUSDC to trade',
  );
  return kp;
}
