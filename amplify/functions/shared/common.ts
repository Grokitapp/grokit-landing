/**
 * Small helpers shared by the generation functions.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function formatDataErrors(errors: readonly unknown[]): string {
  return errors
    .map((error) =>
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error),
    )
    .join('; ');
}

export function assertNoErrors(errors: readonly unknown[] | undefined, code: string): void {
  if (errors?.length) throw new Error(`${code}: ${formatDataErrors(errors)}`);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}

/**
 * AWSJSON fields can come back as an object, a JSON string, or a JSON string
 * that was stringified twice. Normalise all three.
 */
export function parseJsonish(value: unknown): unknown {
  let current = value;
  for (let i = 0; i < 2 && typeof current === 'string'; i += 1) {
    try {
      current = JSON.parse(current);
    } catch {
      return undefined;
    }
  }
  return current;
}

const TRAILING_FILLER = new Set([
  'and', 'or', 'of', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'with', 'vs', 'versus', 'by', 'at', '&',
  'from', 'into', 'as', 'is', 'are', 'that', 'than', 'about', 'over', 'your', 'our', 'their',
]);

/**
 * Enforces the "max N words" rule on titles without failing the whole
 * generation. The prompt already asks for <= N words; this is a safety net.
 */
export function limitWords(raw: string, maxWords: number): string {
  const text = raw
    .replace(/\s+/g, ' ')
    .replace(/^(lesson|zone|phase|module)\s*\d+(\.\d+)?\s*[:.\-–—]\s*/i, '')
    .replace(/^\d+(\.\d+)*[.)]\s+/, '')
    .trim();

  let words = text.split(' ').filter(Boolean);

  // Prefer the part before a subtitle colon when the title is too long.
  if (words.length > maxWords && text.includes(':')) {
    const head = text.split(':')[0].trim().split(' ').filter(Boolean);
    if (head.length >= 2) words = head;
  }

  if (words.length > maxWords) words = words.slice(0, maxWords);

  while (
    words.length > 1 &&
    TRAILING_FILLER.has(words[words.length - 1].toLowerCase().replace(/[^a-z&]/g, ''))
  ) {
    words.pop();
  }

  return words.join(' ').replace(/[\s.,;:!\-–—]+$/g, '').trim();
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
