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
