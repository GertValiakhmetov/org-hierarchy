import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { fetchJson } from './http';

function stubFetch(implementation: () => Promise<Response>): void {
  vi.stubGlobal('fetch', vi.fn(implementation));
}

function jsonResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  const signal = new AbortController().signal;

  it('returns the parsed body as unknown', async () => {
    stubFetch(async () => jsonResponse('[{"id":"a"}]'));

    await expect(fetchJson('/api/org-tree', signal)).resolves.toEqual([{ id: 'a' }]);
  });

  it('an unreachable server yields kind network', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(fetchJson('/api/org-tree', signal)).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
    });
  });

  it('a non-OK status yields kind http carrying the code', async () => {
    stubFetch(async () => jsonResponse('{"message":"boom"}', 500));

    await expect(fetchJson('/api/org-tree', signal)).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    });
  });

  it('a non-JSON body yields kind malformed, never schema', async () => {
    stubFetch(async () => jsonResponse('<html>502 Bad Gateway</html>'));

    const error = await fetchJson('/api/org-tree', signal).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('malformed');
  });

  it('the transport never returns a verdict about the schema', async () => {
    const bodies = ['не json', '{"unexpected":"shape"}', ''];

    for (const body of bodies) {
      stubFetch(async () => jsonResponse(body));
      const error = await fetchJson('/api/org-tree', signal).catch((cause: unknown) => cause);

      if (error instanceof ApiError) {
        expect(error.kind).not.toBe('schema');
      }
    }
  });

  it('an abort is rethrown as-is so react-query does not treat it as a failure', async () => {
    stubFetch(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    });

    const error = await fetchJson('/api/org-tree', signal).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(DOMException);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('a POST sends the body and the content-type header', async () => {
    const spy = vi.fn(async () => jsonResponse('{"mode":"error"}'));
    stubFetch(spy);

    await fetchJson('/api/debug/mode', signal, { method: 'POST', body: { mode: 'error' } });

    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"mode":"error"}');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});
