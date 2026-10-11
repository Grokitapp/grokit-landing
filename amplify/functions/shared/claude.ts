/**
 * Minimal, dependency-free Anthropic Messages API client used by the
 * generation workers. Handles structured output, retries on transient
 * errors, truncation detection, and prompt-cache blocks.
 */

import { getErrorMessage } from './common';

const API_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeTextBlock {
  text: string;
  /** Marks the end of a stable prefix so repeat calls can read it from cache. */
  cache?: boolean;
}

export interface ClaudeJsonRequest {
  apiKey: string;
  model: string;
  system: string;
  blocks: ClaudeTextBlock[];
  maxTokens: number;
  schema: Record<string, unknown>;
  effort?: 'low' | 'medium' | 'high';
  /** Per-attempt network timeout. */
  timeoutMs: number;
  /** Total attempts including the first (default 3). */
  maxAttempts?: number;
}

export interface ClaudeUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeJsonResult {
  data: unknown;
  usage?: ClaudeUsage;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 529]);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function callClaudeJson(request: ClaudeJsonRequest): Promise<ClaudeJsonResult> {
  const maxAttempts = request.maxAttempts ?? 3;

  const body = JSON.stringify({
    model: request.model,
    max_tokens: request.maxTokens,
    system: request.system,
    messages: [
      {
        role: 'user',
        content: request.blocks.map((block) => ({
          type: 'text',
          text: block.text,
          ...(block.cache ? { cache_control: { type: 'ephemeral' } } : {}),
        })),
      },
    ],
    output_config: {
      ...(request.effort ? { effort: request.effort } : {}),
      format: { type: 'json_schema', schema: request.schema },
    },
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': request.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: AbortSignal.timeout(request.timeoutMs),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const error = new Error(`ANTHROPIC_API_ERROR_${response.status}: ${errorBody.slice(0, 1500)}`);

        if (RETRYABLE_STATUS.has(response.status) && attempt < maxAttempts) {
          lastError = error;
          const retryAfter = Number(response.headers.get('retry-after'));
          await sleep(
            Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1500 * attempt,
          );
          continue;
        }

        throw error;
      }

      return parseResponse(await response.json());
    } catch (error) {
      // Network failures and timeouts deserve another attempt. Our own
      // classified errors (API 4xx, truncation, refusal, bad JSON) do not.
      const isOwnError = getErrorMessage(error).startsWith('ANTHROPIC_');

      if (!isOwnError && attempt < maxAttempts) {
        lastError = error;
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('ANTHROPIC_REQUEST_FAILED');
}

function parseResponse(body: unknown): ClaudeJsonResult {
  if (!body || typeof body !== 'object') throw new Error('ANTHROPIC_INVALID_RESPONSE');

  const record = body as {
    content?: unknown;
    stop_reason?: unknown;
    usage?: ClaudeUsage;
  };

  if (record.stop_reason === 'max_tokens') throw new Error('ANTHROPIC_OUTPUT_TRUNCATED');
  if (record.stop_reason === 'refusal') throw new Error('ANTHROPIC_REFUSAL');

  if (!Array.isArray(record.content)) throw new Error('ANTHROPIC_CONTENT_MISSING');

  const textBlock = record.content.find(
    (block): block is { type: 'text'; text: string } =>
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: unknown }).type === 'text' &&
      typeof (block as { text?: unknown }).text === 'string',
  );

  const text = textBlock?.text.trim();
  if (!text) throw new Error('ANTHROPIC_EMPTY_RESPONSE');

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return { data: JSON.parse(cleaned), usage: record.usage };
  } catch (error) {
    console.error('Claude returned invalid JSON', { preview: cleaned.slice(0, 1500) });
    throw new Error(`ANTHROPIC_INVALID_JSON: ${getErrorMessage(error)}`);
  }
}
