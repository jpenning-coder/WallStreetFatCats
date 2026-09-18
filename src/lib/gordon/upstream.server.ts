import "server-only";

import { getGordonServerConfig } from "@/lib/gordon/config.server";
import { MAX_RESPONSE_BYTES, parseWebhookResponse } from "@/lib/gordon/contract";
import { errorForStatus, GordonError } from "@/lib/gordon/errors";
import { readBoundedText } from "@/lib/gordon/read-body";

export async function runGordonWebhook(ticker: string, callerSignal: AbortSignal) {
  const config = getGordonServerConfig();
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  callerSignal.addEventListener("abort", abort, { once: true });
  if (callerSignal.aborted) controller.abort();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, text/markdown",
    };
    if (config.secret) headers["X-Gordon-Webhook-Key"] = config.secret;
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ticker }),
      cache: "no-store",
      redirect: "error", // Do not forward an authentication header to a redirect target.
      signal: controller.signal,
    });
    if (!response.ok) {
      // Never forward n8n diagnostic bodies, headers, or stack traces to the browser.
      await response.body?.cancel().catch(() => undefined);
      throw errorForStatus(response.status);
    }
    if (response.status === 202 || response.status === 204) {
      await response.body?.cancel().catch(() => undefined);
      throw new GordonError("INVALID_RESPONSE");
    }
    const raw = await readBoundedText(response.body, MAX_RESPONSE_BYTES, controller.signal);
    return parseWebhookResponse(raw, response.headers.get("content-type") || "", ticker);
  } catch (error) {
    if (timedOut) throw new GordonError("TIMEOUT", 504);
    if (error instanceof GordonError) throw error;
    throw new GordonError("UPSTREAM_ERROR", 502);
  } finally {
    clearTimeout(timer);
    callerSignal.removeEventListener("abort", abort);
  }
}
