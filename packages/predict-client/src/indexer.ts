import { INDEXER_URL, ORACLE_STATUS, PREDICT_OBJECT } from './constants.js';
import type {
  ManagerPnl,
  ManagerSummary,
  OracleRow,
  OracleState,
  SviParams,
  VaultSummary,
} from './types.js';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${INDEXER_URL}${path}`);
  if (!res.ok) throw new Error(`predict indexer ${path} -> HTTP ${res.status}`);
  const body = (await res.json()) as T;
  if (body === null || body === undefined) {
    throw new Error(`predict indexer ${path} -> empty/invalid response`);
  }
  return body;
}

export function getOracles(): Promise<OracleRow[]> {
  return get('/oracles');
}

export async function getActiveOracles(): Promise<OracleRow[]> {
  const all = await getOracles();
  return all.filter((o) => o.status === ORACLE_STATUS.active);
}

export function getOracleState(oracleId: string): Promise<OracleState> {
  return get(`/oracles/${oracleId}/state`);
}

/** Latest SVI params for an oracle (the indexer returns newest-first history). */
export async function getLatestSvi(oracleId: string): Promise<SviParams | null> {
  const history = await get<SviParams[]>(`/oracles/${oracleId}/svi`);
  return history[0] ?? null;
}

export function getVaultSummary(predictId: string = PREDICT_OBJECT): Promise<VaultSummary> {
  return get(`/predicts/${predictId}/vault/summary`);
}

export function getManagerSummary(managerId: string): Promise<ManagerSummary> {
  return get(`/managers/${managerId}/summary`);
}

export function getManagerPnl(managerId: string): Promise<ManagerPnl> {
  return get(`/managers/${managerId}/pnl`);
}
