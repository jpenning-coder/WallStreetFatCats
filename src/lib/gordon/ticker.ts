export const MAX_TICKER_LENGTH = 12;

/** Format validation, not an assertion that a symbol exists or is supported upstream. */
export function normalizeTicker(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ticker = value.trim().toUpperCase();
  if (!ticker || ticker.length > MAX_TICKER_LENGTH) return null;
  return /^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]{1,2})?$/.test(ticker) ? ticker : null;
}
