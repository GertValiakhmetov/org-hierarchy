import { queryOptions } from '@tanstack/react-query';
import { DEBUG_MODES, type DebugMode, type DebugModeResponse } from '@shared/types';
import { ApiError } from '@/shared/transport/errors';
import { fetchJson } from '@/shared/transport/http';

function parseModeResponse(payload: unknown): DebugMode {
  const mode = (payload as DebugModeResponse | null)?.mode;

  if (!DEBUG_MODES.includes(mode as DebugMode)) {
    throw new ApiError('schema', 'Server returned an unknown debug mode', {
      issues: [{ path: 'mode', message: `получено «${String(mode)}»` }],
    });
  }

  return mode as DebugMode;
}

export const debugModeQuery = () =>
  queryOptions({
    queryKey: ['debug-mode'] as const,
    queryFn: async ({ signal }) => parseModeResponse(await fetchJson('/api/debug/mode', signal)),
    staleTime: Number.POSITIVE_INFINITY,
  });

export async function setDebugMode(mode: DebugMode, signal: AbortSignal): Promise<DebugMode> {
  const payload = await fetchJson('/api/debug/mode', signal, { method: 'POST', body: { mode } });
  return parseModeResponse(payload);
}
