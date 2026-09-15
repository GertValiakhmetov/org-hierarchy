import { ApiError, isAbortError } from './errors';

/**
 * The only place that touches the network.
 *
 * `signal` is required rather than optional: react-query passes the query's
 * signal through, which is what makes unmounting abort the in-flight request
 * instead of merely discarding its result.
 */
export async function fetchJson(
  path: string,
  signal: AbortSignal,
  init?: { method: string; body: unknown },
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path, {
      signal,
      method: init?.method,
      headers: init
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      body: init ? JSON.stringify(init.body) : undefined,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('network', 'Request did not reach the server', { cause: error });
  }

  if (!response.ok) {
    throw new ApiError('http', `Server responded with ${response.status}`, {
      status: response.status,
    });
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError('malformed', 'Response body is not valid JSON', { cause: error });
  }
}
