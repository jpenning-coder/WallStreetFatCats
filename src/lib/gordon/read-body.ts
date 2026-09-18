import { GordonError } from "@/lib/gordon/errors";

/** Bound streamed bytes, even when Content-Length is missing or misleading. */
export async function readBoundedText(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
  signal: AbortSignal,
): Promise<string> {
  if (signal.aborted) throw signal.reason;
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw signal.reason;
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => undefined);
        throw new GordonError("INVALID_RESPONSE");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}
