import type { GordonErrorCode } from "@/types/gordon";

// Only these messages may cross the public error boundary. Never echo an exception
// message, upstream response body, private endpoint, or authentication header.
const messages: Record<GordonErrorCode, string> = {
  INVALID_TICKER: "Check the ticker and try again. Use a stock symbol such as AAPL or BRK.B.",
  INVALID_REQUEST: "The request could not be read. Please enter a ticker and try again.",
  FORBIDDEN: "Please refresh this page before submitting another analysis.",
  RATE_LIMITED: "There are too many analysis requests right now. Please wait briefly, then try again.",
  TIMEOUT: "The analysis took longer than the available response window. Please wait briefly before retrying; the earlier request may still be processing.",
  UNAVAILABLE: "GORDON could not provide an analysis right now. Please try again later or use another ticker.",
  UPSTREAM_ERROR: "GORDON could not complete this analysis. Please try again shortly.",
  INVALID_RESPONSE: "A complete report was not returned. Please try again shortly.",
  NETWORK_ERROR: "We could not reach GORDON. Check your connection and try again.",
};

export function isGordonErrorCode(value: unknown): value is GordonErrorCode {
  return typeof value === "string" && Object.hasOwn(messages, value);
}

export class GordonError extends Error {
  constructor(public readonly code: GordonErrorCode, public readonly status = 502) {
    super(messages[code]);
    this.name = "GordonError";
  }
}

export function errorForStatus(status: number): GordonError {
  if (status === 400 || status === 422) return new GordonError("INVALID_TICKER", 422);
  if (status === 429) return new GordonError("RATE_LIMITED", 429);
  if ([408, 504, 524].includes(status)) return new GordonError("TIMEOUT", 504);
  if ([401, 403, 404, 503].includes(status)) return new GordonError("UNAVAILABLE", 503);
  return new GordonError("UPSTREAM_ERROR", 502);
}
