import "server-only";

import { GordonError } from "@/lib/gordon/errors";

export function getGordonServerConfig() {
  const endpoint = process.env.GORDON_N8N_WEBHOOK_URL?.trim();
  const timeoutMs = Number(process.env.GORDON_TIMEOUT_MS || "90000");
  if (!endpoint || !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 105000) {
    throw new GordonError("UNAVAILABLE", 503);
  }
  let url: URL;
  try { url = new URL(endpoint); }
  catch { throw new GordonError("UNAVAILABLE", 503); }
  // An operator-configured HTTPS n8n endpoint only; never a user-supplied target.
  if (url.protocol !== "https:" || url.username || url.password || url.hash) {
    throw new GordonError("UNAVAILABLE", 503);
  }
  const secret = process.env.GORDON_N8N_WEBHOOK_SECRET;
  if (secret && (/[^\x20-\x7E]/.test(secret) || secret.length > 4096)) {
    throw new GordonError("UNAVAILABLE", 503);
  }
  return { endpoint: url.toString(), secret, timeoutMs };
}
