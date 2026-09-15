import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryDelay, shouldRetry } from '@/shared/transport/retry-policy';
import { orgTreeQuery, retryOrgTreeOnce } from './org-tree';

function failingFetch(status: number): ReturnType<typeof vi.fn> {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ message: 'boom' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    // Delays are covered in retry-policy.test.ts; this file counts requests.
    defaultOptions: { queries: { retry: shouldRetry, retryDelay: () => 0 } },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  client.clear();
});

describe('request count on a 500', () => {
  it('an automatic fetch makes three attempts', async () => {
    const spy = failingFetch(500);
    vi.stubGlobal('fetch', spy);

    await client.fetchQuery(orgTreeQuery()).catch(() => undefined);

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('a manual retry makes exactly one request', async () => {
    const spy = failingFetch(500);
    vi.stubGlobal('fetch', spy);

    await retryOrgTreeOnce(client);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('a manual retry hits the network even when the cache is still fresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })),
    );
    await client.fetchQuery(orgTreeQuery());

    const spy = failingFetch(500);
    vi.stubGlobal('fetch', spy);
    await retryOrgTreeOnce(client);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('the delay policy is untouched and stays exponential', () => {
    expect(retryDelay(0)).toBe(1_000);
  });
});
