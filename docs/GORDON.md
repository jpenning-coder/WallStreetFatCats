# GORDON — website integration and deployment guide

Implementation date: September 11, 2026.

## Delivery status

The website-side implementation is complete in the supplied source architecture. It has **not been deployed**, and the real n8n/Python round trip has **not been tested**. Production compilation is an outstanding verification gate: this environment received Windows-only native dependencies and could not download Linux dependencies. See `GORDON-VERIFICATION.md` for exact results and limitations.

This is an addition to the uploaded WallStreetFatCats project, not a second website. Apply the patch or changed-file overlay to a branch of the existing repository. Do not replace a more complete production repository with this upload: the upload contains a homepage, but no implementations of WARREN or the other linked destinations. Those destinations were preserved, not recreated or deleted.

## 1. Inspected architecture

The source uses `src/app` App Router, strict TypeScript, Tailwind CSS v4, a shared `SiteHeader` and `MobileMenu`, and a reusable `Button`. The lockfile resolves Next.js **16.3.3**, React/React DOM **19.2.8**, Tailwind **4.3.3**, and TypeScript **5.9.3**. Dependency versions and the lockfile are unchanged.

The root layout owns Manrope and Cormorant Garamond through `next/font/google`. Existing CSS tokens provide the black, forest-green, cream, and gold palette. The homepage owns its header rather than receiving one from the root layout; GORDON follows that same pattern. The existing desktop/mobile navigation breakpoint is 1360 px and is preserved.

`/gordon` was already the Gordon navigation destination and the homepage's analysis CTA destination. No GORDON page, API route, integration code, n8n export, quantitative Python source, WARREN page, or Vercel configuration was present. Consequently, no final webhook contract could be inferred from existing source. The compatibility contract below is explicit and must be checked against a real sanitized response before launch.

The homepage components, market tape, root layout, global styles, routing configuration, shared design tokens, and supplied artwork are unchanged. Page-specific styling lives in `src/app/gordon/gordon.css`. No static quotes, technical indicator calculations, scoring, strategy logic, or brokerage functionality were added.

## 2. Implemented request flow

```text
Browser: /gordon
  -> requestGordonAnalysis() in src/lib/gordon/request.ts
  -> POST /api/gordon (same-origin JSON)
  -> Next.js Node.js route validates origin, content type, body and ticker
  -> runGordonWebhook() reads private server environment configuration
  -> POST configured n8n production Webhook
  -> existing n8n market-data + news branches
  -> existing n8n -> GORDON FastAPI/Python quantitative analysis
  -> existing merge and GORDON Agent
  -> Respond to Webhook returns the completed public report
  -> website parses, checks and normalizes this request's response
  -> the requesting browser renders the report on /gordon
```

The thin server route keeps the webhook endpoint and optional authentication key out of browser code. It avoids a browser-to-n8n CORS dependency and provides one error/timeout/validation boundary. It does not calculate market data, replace n8n, contact Python, maintain jobs, or create a second backend service.

Each request awaits its own response. There is no global current ticker/report, response cache, local storage, shared job map, or automatic retry. Optional upstream correlation IDs are preserved when valid; no new mandatory correlation protocol is imposed. Cancelling a browser request does not guarantee that n8n or its downstream work stops.

## 3. Configuration

Copy `.env.example` to an untracked `.env.local` for local development. In Vercel, set the equivalent values in the existing project's Preview and Production environment scopes, then deploy with those values. Keep staging and production endpoints separate.

| Variable | Exposure | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Intentionally public; existing variable | Canonical site origin. Retained from the original project. |
| `GORDON_N8N_WEBHOOK_URL` | Server only; required for analysis | Full HTTPS URL of the n8n **production Webhook**, not the Python/FastAPI endpoint. No credentials embedded in the URL. |
| `GORDON_N8N_WEBHOOK_SECRET` | Server only; optional in code, recommended before launch | Shared value for n8n Header Auth using the exact header name `X-Gordon-Webhook-Key`. Omit only when that webhook intentionally has no authentication. |
| `GORDON_TIMEOUT_MS` | Server only | Integer milliseconds, 1000 through 105000. Defaults to `90000`. |

No secret belongs in a `NEXT_PUBLIC_*` variable. No Twelve Data, OpenAI, Python, ngrok, or localhost service configuration is required by the page. Server modules use `import "server-only"`; reusable components do not import server configuration.

`/api/gordon` exports `runtime = "nodejs"` and `maxDuration = 120` seconds. The browser deadline is 115 seconds; the normal upstream deadline is 90 seconds, with a separate five-second request-body read limit. Verify the hosting plan and deployment actually honor the function duration. The project must run Next.js server functionality; a static-only export cannot serve this API route.

**n8n Cloud has its own documented 100-second webhook response limit.** Increasing the website timeout cannot extend that upstream limit. Keep the complete workflow below the shorter effective deadline. A workflow that routinely exceeds it needs an explicitly agreed asynchronous interface on the n8n side; polling, job IDs and extra webhook contracts were not invented here.

No browser-to-n8n CORS grant is needed: the browser contacts its own `/api/gordon`. The route accepts only an exact same-origin `Origin` header and rejects `Sec-Fetch-Site: cross-site`. Ensure any reverse proxy preserves the public request origin, and test canonical-domain redirects and Preview deployments.

## 4. Exact public contract

### Website request

The browser and website-to-n8n layer both send the same body. Only the normalized ticker is forwarded; arbitrary user fields are not forwarded.

```json
{"ticker":"AAPL"}
```

Browser request: `POST /api/gordon`, `Content-Type: application/json`, same-origin credentials. Server-to-n8n request: POST JSON, with `X-Gordon-Webhook-Key` only when configured. The browser never receives that header or its value.

Ticker validation trims and uppercases the input, requires 1–12 characters, and accepts an initial letter followed by letters/digits, optionally one dot or hyphen and a one- or two-character alphanumeric suffix. Examples: `AAPL`, `BRK.B`, `BRK-B`. The page does not verify exchange listings, rewrite market-provider symbols, or claim that a syntactically valid ticker exists.

### Accepted final n8n responses

Recommended JSON shape:

```json
{
  "ticker": "AAPL",
  "report": "The completed final GORDON report goes here.",
  "generatedAt": "2026-09-11T12:00:00Z",
  "requestId": "optional-upstream-id"
}
```

This timestamp and identifier illustrate the schema only. The implementation never synthesizes report timestamps, IDs, price levels, or other market values.

Only `report` is required in that object. A final `output` string is supported as an explicit alternative to `report`. `generatedAt` and `requestId` may instead be inside an optional `metadata` object. Unknown metadata is discarded. A single-item array containing an accepted object/string is accepted; multiple items and nested arrays are rejected to avoid silently selecting the wrong result.

A plain narrative string is also accepted with `text/plain` or `text/markdown`, or as a JSON-encoded string with `application/json`. A serialized JSON object mislabeled as `text/plain` is parsed defensively. HTML is not an accepted response format. Report text may contain the supported Markdown subset.

A supplied `ticker` must match the requested ticker after normalization. Optional timestamps must be parseable ISO timestamps with an explicit timezone. Optional request IDs must be 1–128 characters using letters/digits and `.`, `_`, `:`, or `-`, beginning with a letter/digit. Invalid optional metadata is omitted, not invented.

A report must be a nonempty string of at most 100,000 JavaScript characters; the received upstream body must be at most 256 KiB. Empty/malformed JSON, raw candle/indicator objects, mismatched tickers, conflicting `report`/`output`, error envelopes, HTML responses, immediate acknowledgements, and 202/204 responses are rejected. This compatibility parser is **not confirmation of the current live n8n contract**. A different legitimate schema should be adapted deliberately in `contract.ts`, not guessed throughout the UI.

### Normalized website response

```json
{
  "ok": true,
  "analysis": {
    "ticker": "AAPL",
    "report": "The completed report."
  }
}
```

Valid optional `generatedAt` and `requestId` are included inside `analysis`. A failure uses an appropriate non-2xx status and the following envelope:

```json
{
  "ok": false,
  "error": {
    "code": "UNAVAILABLE",
    "message": "GORDON could not provide an analysis right now. Please try again later or use another ticker."
  }
}
```

Allowed error codes are `INVALID_TICKER`, `INVALID_REQUEST`, `FORBIDDEN`, `RATE_LIMITED`, `TIMEOUT`, `UNAVAILABLE`, `UPSTREAM_ERROR`, `INVALID_RESPONSE`, and `NETWORK_ERROR`. Messages come only from the website's allowlist. Upstream exception messages, bodies, headers, private endpoints, and stack traces are not forwarded. All route responses have private/no-store cache controls, including CDN controls.

## 5. Page behavior and rendering

The page provides labeled keyboard-submittable ticker input, uppercase normalization, inline validation, example-ticker buttons, a synchronous single-flight guard, and disabled form controls while active. Loading is indeterminate, with accessible announcements and no fabricated progress. Error, retry, reset, and new-ticker submissions stay on the page.

Completed reports use a safe React text renderer supporting headings, paragraphs, bold, inline code, fenced text, lists, quotes, rules, and simple tables. It does not execute HTML, render external images, or activate report links. Irregular-width tables fall back to preformatted text rather than losing columns. The full original report text is available separately, and a copy control reports clipboard failures safely. This is not a complete CommonMark implementation.

Report headings receive focus after completion. The page and shared menu support visible focus, responsive layouts, Escape to close, focus return, closed-menu `inert`, and reduced motion. These were checked as described in the verification record; no formal accessibility certification is claimed.

## 6. Public-launch security gate

The route has origin checks, bounded JSON input, bounded response reads, an HTTPS operator-configured destination, no redirect following, private configuration, explicit timeouts, safe error messages, non-executable report markup, and no response caching. Neither a hidden URL nor an Origin check authenticates public users or prevents scripted abuse.

**A distributed/edge rate limit is not implemented or enabled in this delivery.** Before opening the page broadly, configure the existing host's WAF/rate limiting for `POST /api/gordon` and verify its 429 behavior. A conservative per-IP starting limit such as five requests per minute is an operator policy choice, not an enabled feature or a guarantee of cost control; tune it against real usage and shared networks. Verify plan availability. Protect n8n itself with the Header Auth setting above and set appropriate upstream cost/concurrency controls.

Do not replace this requirement with an in-memory map: serverless instances would not share its limits. User authentication, persistent job storage, third-party rate-limit databases, brokerage connectivity, and trade execution were intentionally not introduced.

No report persistence or telemetry was added to the website. Existing n8n/provider execution retention and privacy settings remain external operator responsibilities.

## 7. n8n settings to verify manually

No n8n nodes or credentials were changed by this implementation.

1. Select the existing workflow's Webhook, set HTTP method POST, and map its JSON body's `ticker` into the existing ticker pipeline. In a standard Webhook output this input is under `body.ticker`; confirm your actual node output rather than changing downstream quantitative logic.
2. Set Webhook **Respond** to **Using 'Respond to Webhook' node**. Keep the existing market-data, news, Python, merge, and Agent orchestration intact.
3. Place/confirm Respond to Webhook after the final Agent output. Return one completed public report using **Respond With: JSON** and response code 200. Map the actual Agent report field to `report`, or keep `output` when that really is the final field. Do not return the immediate acknowledgement or the raw Python/candle payload.
4. For plain text instead of JSON, explicitly set the response `Content-Type` to `text/plain; charset=utf-8` or `text/markdown; charset=utf-8`. n8n's Text response defaults to HTML, which this website intentionally rejects.
5. Ensure failure branches return an appropriate non-2xx response and do not embed secret diagnostics in public report text. Do not enable streaming; the current interface waits for a completed response.
6. Configure Header Auth with `X-Gordon-Webhook-Key` when using the secret. Publish the workflow and use its **Production URL**, not a temporary Test URL, in the website environment.

## 8. Install, check, and run

Do not copy the supplied archive's `node_modules` or `.next` to another operating system. Install from the unchanged lockfile on an internet-connected machine/CI runner with a Node.js version supported by this locked Next.js version.

```bash
npm ci
cp .env.example .env.local
# Set the private webhook values locally; do not commit them.
npm test
npm run typecheck
npm run lint
npm run build
npm run start
```

For development, use `npm run dev` instead of build/start. The UI loads without a webhook value, but attempting analysis then produces a safe unavailable error.

The optional browser tests use Python Playwright and a running Next.js server. They intercept the website API in the browser; they do **not** consume real n8n/market requests.

```bash
python -m venv .venv
# Activate the environment using your platform's activation command.
python -m pip install playwright
python -m playwright install chromium
GORDON_TEST_BASE_URL=http://localhost:3000 python tests/browser_test.py
```

`GORDON_TEST_BROWSER` can select an installed Chromium executable. `GORDON_TEST_OUTPUT_DIR` selects the output directory (default `test-results/browser`). The optional offline-fixture adapter was used only to work around the delivery environment's inability to run Next; it is not required or included as another app. Run the default server-backed mode in CI to verify actual Next navigation and hydration.

The original `next/font/google` build-time font resolution is preserved and may require outbound access in the build environment. No font binaries are distributed in this handoff.

## 9. Short live end-to-end test

1. Confirm section 7, publish the workflow, and set the private environment values. Verify Python is reachable **from n8n** using its existing configuration; the website needs no Python address.
2. Start the actual site or deploy the existing repository branch to a Vercel Preview after a successful production build. Open `/gordon`, type ` aapl `, and submit once. Confirm uppercase `AAPL`, disabled controls, and a loading state without navigation.
3. In browser Network, confirm a single same-origin POST to `/api/gordon` with `{"ticker":"AAPL"}` and no private endpoint/credential. In n8n Executions, confirm both news and market-data branches, the Python request/result, merge, final Agent, and Respond to Webhook complete for that execution.
4. Confirm the corresponding complete report appears on the same page, then run `NVDA`. Repeat with two independent browser sessions and distinct tickers. Verify each session receives only its own report.
5. In staging, test an unknown but syntactically valid ticker, a controlled workflow failure, a slow workflow/timeout, and the configured rate limit. Confirm useful retry/reset behavior and no private diagnostics. Repeat on the production domain before announcing availability.

To test the website route directly while developing, include its required Origin header:

```bash
curl -i --max-time 120 \
  'http://localhost:3000/api/gordon' \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  --data '{"ticker":"AAPL"}'
```

A direct call without a matching Origin is intentionally rejected. This command is a manual test instruction; no live call was made during the implementation.

## 10. Remaining external decisions

Required before public launch: a verified production n8n endpoint, the actual final response sample/mapping, matching optional Header Auth configuration, hosting function-duration verification, WAF/rate limiting, a clean Next build, server-backed browser tests, and a real end-to-end execution. GitHub/Vercel/n8n/Python settings were not changed. All Python analysis and n8n workflow business logic remain authoritative and untouched.

If the deployed website has additional source not present in this upload, review the patch against that repository rather than overwriting it. A pre-existing root Open Graph image reference and historical homepage documentation name `hero-trading-floor.webp`, which is absent in the upload; GORDON's own metadata uses the actual supplied `frenzied-cat-traders.png`. The unrelated root metadata was not changed.

## Official configuration references

Consulted September 11, 2026. These references explain external behavior; they are not proof that a live deployment was configured or tested.

- Next.js environment variables: https://nextjs.org/docs/app/guides/environment-variables
- Next.js Server and Client Components / server-only: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- n8n Webhook: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- n8n Respond to Webhook: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/
- n8n Webhook common issues / Cloud timeout: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/common-issues/
- Vercel function duration: https://vercel.com/docs/functions/configuring-functions/duration
- Vercel WAF rate limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
