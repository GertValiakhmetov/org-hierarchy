import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { OrgNodeDto, SearchResponse } from '../../shared/types.ts';
import { buildSystemPrompt, FilterSchema, toOrgFilter } from './search-filter.ts';

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 20_000;

export function isAiSearchConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/**
 * The only place bound to a provider. Returns null when the model could not be
 * reached or produced nothing usable; the caller then falls back to text search.
 */
export async function parseQuery(
  query: string,
  nodes: readonly OrgNodeDto[],
): Promise<Pick<SearchResponse, 'filter' | 'sort'> | null> {
  try {
    const response = await getClient().messages.parse(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // No `effort` here: Haiku 4.5 rejects it. No `cache_control` either —
        // its minimum cacheable prefix is 4096 tokens and this system prompt is
        // about a quarter of that, so a marker would silently do nothing.
        output_config: { format: zodOutputFormat(FilterSchema) },
        system: [{ type: 'text', text: buildSystemPrompt(nodes) }],
        messages: [{ role: 'user', content: query }],
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    if (response.stop_reason === 'refusal') {
      console.warn('[search] the model refused the request:', response.stop_details?.category);
      return null;
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      console.warn('[search] the response did not parse into the schema');
      return null;
    }

    console.log(
      `[search] «${query}» — ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`,
    );

    return toOrgFilter(parsed);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('[search] the API key was rejected');
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error('[search] rate limit exceeded');
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[search] API error ${error.status}: ${error.message}`);
    } else {
      console.error('[search] could not reach the model:', error);
    }
    return null;
  }
}
