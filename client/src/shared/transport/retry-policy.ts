import { ApiError } from './errors';

const MAX_AUTOMATIC_RETRIES = 2;

/**
 * Applies to fetches the user did not ask for — first load and background
 * revalidation — where a transient blip should heal itself.
 *
 * A retry is pointless when the outcome cannot change: a malformed or
 * schema-breaking body will come back identical, and so will a 4xx.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.kind === 'schema' || error.kind === 'malformed') return false;
    if (error.kind === 'http' && error.status !== undefined && error.status < 500) return false;
  }
  return failureCount < MAX_AUTOMATIC_RETRIES;
}

export function retryDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, 8_000);
}

const RECONNECT_BASE_MS = 500;
const RECONNECT_CAP_MS = 15_000;

/**
 * Reconnects start faster than HTTP retries — a dropped socket is usually a
 * blip — and are jittered so many clients do not return in lockstep after a
 * server restart.
 */
export function reconnectDelay(attempt: number, jitter = Math.random()): number {
  const base = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_CAP_MS);
  return Math.round(base * (0.7 + jitter * 0.6));
}
