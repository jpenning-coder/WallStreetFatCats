import { isRecord } from "@/lib/gordon/contract";
import { GordonError } from "@/lib/gordon/errors";
import { readBoundedText } from "@/lib/gordon/read-body";
import { normalizeTicker } from "@/lib/gordon/ticker";
import { runGordonWebhook } from "@/lib/gordon/upstream.server";
import type { GordonApiResponse } from "@/types/gordon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Keep the website runtime longer than the upstream budget. Hosting must support it.
export const maxDuration = 120;

function respond(body: GordonApiResponse, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Same-origin JSON requests only. This is CSRF/cross-site cost protection,
    // NOT authentication or distributed rate limiting; configure the edge WAF.
    const origin = request.headers.get("origin");
    if (origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new GordonError("FORBIDDEN", 403);
    }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw new GordonError("INVALID_REQUEST", 415);
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    if (request.signal.aborted) controller.abort();
    const timer = setTimeout(abort, 5000);
    let value: unknown;
    try {
      value = JSON.parse(await readBoundedText(request.body, 1024, controller.signal));
    } catch {
      throw new GordonError("INVALID_REQUEST", 400);
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", abort);
    }
    const ticker = normalizeTicker(isRecord(value) ? value.ticker : undefined);
    if (!ticker) throw new GordonError("INVALID_TICKER", 422);
    const analysis = await runGordonWebhook(ticker, request.signal);
    return respond({ ok: true, analysis });
  } catch (error) {
    const safeError = error instanceof GordonError ? error : new GordonError("UPSTREAM_ERROR", 500);
    return respond({ ok: false, error: { code: safeError.code, message: safeError.message } }, safeError.status);
  }
}
