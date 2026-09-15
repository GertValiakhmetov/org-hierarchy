import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';
import { retryDelay, shouldRetry } from './retry-policy';

describe('shouldRetry', () => {
  it('retries a network failure, which may be transient', () => {
    expect(shouldRetry(0, new ApiError('network', 'down'))).toBe(true);
  });

  it('retries a 5xx', () => {
    expect(shouldRetry(0, new ApiError('http', 'boom', { status: 500 }))).toBe(true);
  });

  it('does not retry a 4xx: the answer will not change', () => {
    expect(shouldRetry(0, new ApiError('http', 'nope', { status: 404 }))).toBe(false);
  });

  it('does not retry a schema violation or an unreadable body', () => {
    expect(shouldRetry(0, new ApiError('schema', 'bad'))).toBe(false);
    expect(shouldRetry(0, new ApiError('malformed', 'bad'))).toBe(false);
  });

  it('allows three automatic attempts in total: the first plus two retries', () => {
    const error = new ApiError('http', 'boom', { status: 500 });

    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });
});

describe('retryDelay', () => {
  it('grows exponentially up to a ceiling', () => {
    expect([0, 1, 2, 3, 10].map(retryDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 8_000]);
  });
});
