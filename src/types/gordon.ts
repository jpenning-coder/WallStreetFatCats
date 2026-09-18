/** Public website boundary only. No Python market-data or scoring types. */
export type GordonRequest = { ticker: string };

/** Normalized final report returned by the website's own API. */
export type GordonReport = {
  ticker: string;
  report: string;
  generatedAt?: string;
  requestId?: string;
};

/**
 * Explicit compatibility contract until a real Respond to Webhook sample is supplied.
 * Also accepts a narrative string or a singleton array containing one of these objects.
 * `output` supports a final n8n Agent text output; it is NOT a Python response shape.
 */
export type GordonWebhookReport = {
  report: string;
  ticker?: string;
  generatedAt?: string;
  requestId?: string;
  metadata?: { generatedAt?: string; requestId?: string };
};
export type GordonWebhookOutput = Omit<GordonWebhookReport, "report"> & {
  output: string;
};

export type GordonErrorCode =
  | "INVALID_TICKER"
  | "INVALID_REQUEST"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR";

export type GordonApiResponse =
  | { ok: true; analysis: GordonReport }
  | { ok: false; error: { code: GordonErrorCode; message: string } };
