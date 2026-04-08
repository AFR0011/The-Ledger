const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'over',
  'then',
  'just',
  'have',
  'will'
]);

export function normalizeForSearch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function pickFirstMeaningfulLine(text: string): string {
  return text
    .split(/\r?\n|[.;]/)
    .map((line) => line.trim())
    .find(Boolean) ?? '';
}

export function summarizeText(text: string, maxLength = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
}

export function extractList(text: string, maxItems = 3): string[] {
  const segments = text
    .split(/\r?\n|[•,-]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > 0) {
    return segments.slice(0, maxItems);
  }

  const line = pickFirstMeaningfulLine(text);
  return line ? [line] : [];
}

export function tokenize(text: string): string[] {
  return normalizeForSearch(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}
