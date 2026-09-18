import type { GordonReport } from "@/types/gordon";
import { isRecord, MAX_RESPONSE_BYTES, normalizeWebhookReport } from "@/lib/gordon/contract";
import { errorForStatus, GordonError, isGordonErrorCode } from "@/lib/gordon/errors";
import { readBoundedText } from "@/lib/gordon/read-body";

/** Browser calls this site's API only. No deployment endpoints or secrets here. */
export async function requestGordonAnalysis(ticker: string, signal: AbortSignal): Promise<GordonReport> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 115000);
  try {
    const response = await fetch("/api/gordon", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ticker }),
      signal: controller.signal,
    });
    let body: unknown;
    try {
      body = JSON.parse(await readBoundedText(response.body, MAX_RESPONSE_BYTES, controller.signal));
    } catch {
      if (!response.ok) throw errorForStatus(response.status);
      throw new GordonError("INVALID_RESPONSE");
    }
    if (!response.ok || isRecord(body) && body.ok === false) {
      if (isRecord(body) && isRecord(body.error) && isGordonErrorCode(body.error.code)) {
        throw new GordonError(body.error.code, response.status);
      }
      throw errorForStatus(response.status);
    }
    if (!isRecord(body) || body.ok !== true || !isRecord(body.analysis) || typeof body.analysis.report !== "string") {
      throw new GordonError("INVALID_RESPONSE");
    }
    return normalizeWebhookReport(body.analysis, ticker);
  } catch (error) {
    if (signal.aborted) throw new DOMException("Request cancelled", "AbortError");
    if (timedOut) throw new GordonError("TIMEOUT", 504);
    if (error instanceof GordonError) throw error;
    throw new GordonError("NETWORK_ERROR", 503);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
