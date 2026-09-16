import type { Request, Response } from 'express';
import {
  MAX_SEARCH_QUERY_LENGTH,
  type OrgNodeDto,
  type SearchResponse,
} from '../../shared/types.ts';
import { isAiSearchConfigured, parseQuery } from './anthropic.ts';

function readQuery(body: unknown): string | null {
  const query = (body as { query?: unknown } | undefined)?.query;

  if (typeof query !== 'string') return null;

  const trimmed = query.trim();
  if (trimmed === '' || trimmed.length > MAX_SEARCH_QUERY_LENGTH) return null;

  return trimmed;
}

/** Plain substring search, used whenever the model cannot be asked or fails. */
function textFallback(query: string, reason: SearchResponse['reason']): SearchResponse {
  return { source: 'text', filter: { name: query }, reason };
}

export function createSearchHandler(nodes: readonly OrgNodeDto[]) {
  return async function handleSearch(req: Request, res: Response): Promise<void> {
    const query = readQuery(req.body);

    if (query === null) {
      res
        .status(400)
        .json({ message: `query: непустая строка не длиннее ${MAX_SEARCH_QUERY_LENGTH}` });
      return;
    }

    if (!isAiSearchConfigured()) {
      res.json(textFallback(query, 'not-configured'));
      return;
    }

    const parsed = await parseQuery(query, nodes);

    if (!parsed) {
      res.json(textFallback(query, 'failed'));
      return;
    }

    const response: SearchResponse = { source: 'ai', filter: parsed.filter };
    if (parsed.sort) response.sort = parsed.sort;
    res.json(response);
  };
}
