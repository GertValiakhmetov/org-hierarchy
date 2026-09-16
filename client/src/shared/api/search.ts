import type { SearchResponse } from '@shared/types';
import { fetchJson } from '@/shared/transport/http';
import { parseSearchResponse } from './search.schema';

export async function searchOrg(query: string, signal: AbortSignal): Promise<SearchResponse> {
  const payload = await fetchJson('/api/search', signal, { method: 'POST', body: { query } });
  return parseSearchResponse(payload);
}
