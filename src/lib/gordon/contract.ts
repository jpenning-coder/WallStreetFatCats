import type { GordonReport } from "@/types/gordon";
import { GordonError } from "@/lib/gordon/errors";
import { normalizeTicker } from "@/lib/gordon/ticker";

export const MAX_REPORT_CHARACTERS = 100_000;
export const MAX_RESPONSE_BYTES = 262_144;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalRequestId(value: unknown): string | undefined {
  // Preserve a supplied opaque identifier, but never render arbitrary metadata.
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
    ? value
    : undefined;
}

function optionalTimestamp(value: unknown): string | undefined {
  // Require an explicit timezone; a browser must not guess the market's timezone.
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
    ? value
    : undefined;
}

function validNarrative(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > MAX_REPORT_CHARACTERS) {
    throw new GordonError("INVALID_RESPONSE");
  }
  const report = value.trim();
  // n8n's immediate acknowledgement and exception/HTML pages are not reports.
  if (
    /^(?:workflow (?:was |got )?started|accepted|ok|success|no data|analysis unavailable)[.!]?$/i.test(report) ||
    /^(?:<!doctype|<html\b|<iframe\b|traceback \(|(?:type|reference|syntax)?error\s*:)/i.test(report) ||
    /^[\[{]/.test(report) && (() => { try { return typeof JSON.parse(report) !== "string"; } catch { return false; } })()
  ) {
    throw new GordonError("INVALID_RESPONSE");
  }
  return report;
}

export function normalizeWebhookReport(value: unknown, requestedTicker: string): GordonReport {
  // Only a SINGLE final item is permitted. Selecting the first of several reports
  // could silently associate another ticker/user's output with this request.
  if (Array.isArray(value)) {
    if (value.length !== 1 || Array.isArray(value[0])) throw new GordonError("INVALID_RESPONSE");
    value = value[0];
  }
  if (typeof value === "string") {
    return { ticker: requestedTicker, report: validNarrative(value) };
  }
  if (!isRecord(value)) throw new GordonError("INVALID_RESPONSE");
  const status = typeof value.status === "string" ? value.status.toLowerCase() : "";
  if (
    value.ok === false || value.success === false || value.error ||
    ["error", "failed", "unavailable", "pending", "processing", "queued"].includes(status)
  ) {
    throw new GordonError("UNAVAILABLE", 503);
  }
  if (value.ticker !== undefined && normalizeTicker(value.ticker) !== requestedTicker) {
    throw new GordonError("INVALID_RESPONSE");
  }
  if (value.report !== undefined && value.output !== undefined && value.report !== value.output) {
    throw new GordonError("INVALID_RESPONSE");
  }
  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const generatedAt = optionalTimestamp(value.generatedAt ?? metadata.generatedAt);
  const requestId = optionalRequestId(value.requestId ?? metadata.requestId);
  return {
    ticker: requestedTicker,
    report: validNarrative(value.report ?? value.output),
    ...(generatedAt ? { generatedAt } : {}),
    ...(requestId ? { requestId } : {}),
  };
}

export function parseWebhookResponse(raw: string, contentType: string, ticker: string): GordonReport {
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  const jsonType = mediaType === "application/json" || mediaType.endsWith("+json");
  if (!jsonType && !["", "text/plain", "text/markdown"].includes(mediaType)) {
    throw new GordonError("INVALID_RESPONSE");
  }
  const text = raw.trim();
  // Some webhook configurations label serialized JSON as text/plain.
  const looksSerialized = /^(?:\{|\[\s*[\{"\]]|\")/.test(text);
  let value: unknown = text;
  if (jsonType || looksSerialized) {
    try { value = JSON.parse(text); }
    catch { throw new GordonError("INVALID_RESPONSE"); }
  }
  return normalizeWebhookReport(value, ticker);
}
