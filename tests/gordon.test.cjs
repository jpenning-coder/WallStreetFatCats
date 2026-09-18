const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./support/load-source.cjs');
const load = createSourceLoader();
const { normalizeTicker } = load('src/lib/gordon/ticker.ts');
const { parseWebhookResponse, normalizeWebhookReport, MAX_RESPONSE_BYTES } = load('src/lib/gordon/contract.ts');
const { GordonError } = load('src/lib/gordon/errors.ts');
const { getGordonServerConfig } = load('src/lib/gordon/config.server.ts');
const { readBoundedText } = load('src/lib/gordon/read-body.ts');
const { requestGordonAnalysis } = load('src/lib/gordon/request.ts');
const { POST } = load('src/app/api/gordon/route.ts');
const realFetch = global.fetch;
const originalEnv = { ...process.env };
const report = '## Test fixture\nThis is an integration test, not market analysis.\n\nNo prices or signals are supplied.';
const endpoint = 'https://n8n.example.invalid/webhook/private-test-path';
const secret = 'TEST_ONLY_DO_NOT_BUNDLE_7429';

afterEach(() => {
  global.fetch = realFetch;
  for (const name of ['GORDON_N8N_WEBHOOK_URL', 'GORDON_N8N_WEBHOOK_SECRET', 'GORDON_TIMEOUT_MS']) {
    if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name];
  }
});
function configure() {
  process.env.GORDON_N8N_WEBHOOK_URL = endpoint;
  process.env.GORDON_N8N_WEBHOOK_SECRET = secret;
  process.env.GORDON_TIMEOUT_MS = '90000';
}
function request(body = { ticker: 'AAPL' }, options = {}) {
  return new Request('https://www.wallstreetfatcats.com/api/gordon', {
    method: 'POST', headers: { origin: 'https://www.wallstreetfatcats.com', 'content-type': 'application/json', ...options.headers },
    body: typeof body === 'string' ? body : JSON.stringify(body), ...(options.signal ? { signal: options.signal } : {}),
  });
}
function json(value, status = 200) { return Response.json(value, { status }); }
function code(expected) { return (error) => error instanceof GordonError && error.code === expected; }

for (const [input, expected] of [
  [' aapl ', 'AAPL'], ['brk.b', 'BRK.B'], ['brk-b', 'BRK-B'], ['F', 'F'], ['ABC1', 'ABC1'],
  ['', null], ['   ', null], ['Apple Inc', null], ['AA PL', null], ['$AAPL', null], ['^GSPC', null],
  ['NASDAQ:AAPL', null], ['AAPL/TSLA', null], ['A..B', null], ['.A', null], ['A.', null],
  ['A--B', null], ['123', null], ['AAAAAAAAAAAAA', null], ['<script>', null], [null, null], [42, null],
]) test(`ticker normalization: ${JSON.stringify(input)}`, () => assert.equal(normalizeTicker(input), expected));

test('accepts a raw narrative and a JSON-encoded string', () => {
  assert.deepEqual(parseWebhookResponse(report, 'text/plain; charset=utf-8', 'AAPL'), { ticker: 'AAPL', report });
  assert.equal(parseWebhookResponse(JSON.stringify(report), 'application/json', 'AAPL').report, report);
});
test('accepts canonical JSON and preserves only approved metadata', () => {
  const result = normalizeWebhookReport({ ticker: ' aapl ', report, generatedAt: '2026-09-11T12:00:00Z', requestId: 'req:test-42', privateKey: secret, metadata: { secret } }, 'AAPL');
  assert.deepEqual(result, { ticker: 'AAPL', report, generatedAt: '2026-09-11T12:00:00Z', requestId: 'req:test-42' });
  assert.ok(!JSON.stringify(result).includes(secret));
});
test('accepts explicit output alias, singleton array and nested metadata', () => {
  assert.deepEqual(parseWebhookResponse(JSON.stringify([{ output: report, metadata: { requestId: 'n8n-7', generatedAt: '2026-09-11T09:00:00-04:00' } }]), 'text/plain', 'NVDA'), { ticker: 'NVDA', report, requestId: 'n8n-7', generatedAt: '2026-09-11T09:00:00-04:00' });
});
test('ignores malformed optional metadata without losing a valid report', () => {
  assert.deepEqual(normalizeWebhookReport({ report, generatedAt: 'yesterday', requestId: '<script>test</script>' }, 'AAPL'), { ticker: 'AAPL', report });
  assert.deepEqual(normalizeWebhookReport({ report, generatedAt: '2026-09-11T12:00:00' }, 'AAPL'), { ticker: 'AAPL', report });
});
for (const [name, value] of [
  ['empty object', {}], ['empty report', { report: '' }], ['object as report', { report: { price: 1 } }],
  ['wrong ticker', { ticker: 'TSLA', report }], ['many items', [{ report }, { report }]],
  ['nested array', [[{ report }]]], ['raw candles', { candles: [{ close: 5 }] }],
  ['ambiguous reports', { report, output: 'another report' }], ['missing value', null],
  ['acknowledgement string', 'Workflow got started'], ['exception', 'Traceback (most recent call last): secret'],
  ['too long', { report: 'x'.repeat(100001) }], ['JSON printed as report', { report: '{"close": 123}' }],
]) test(`rejects ${name}`, () => assert.throws(() => normalizeWebhookReport(value, 'AAPL'), code('INVALID_RESPONSE')));
for (const value of [{ error: { message: secret } }, { success: false, report }, { ok: false }, { status: 'processing', report }, { status: 'unavailable' }]) {
  test(`does not render error/pending response ${JSON.stringify(value).slice(0, 45)}`, () => assert.throws(() => normalizeWebhookReport(value, 'AAPL'), code('UNAVAILABLE')));
}
test('rejects malformed JSON, HTML mime types, and HTML error documents', () => {
  assert.throws(() => parseWebhookResponse('{broken', 'application/json', 'AAPL'), code('INVALID_RESPONSE'));
  assert.throws(() => parseWebhookResponse(report, 'text/html', 'AAPL'), code('INVALID_RESPONSE'));
  assert.throws(() => parseWebhookResponse('<html>internal error</html>', 'text/plain', 'AAPL'), code('INVALID_RESPONSE'));
});
test('bounded reader cancels oversized chunked responses', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(MAX_RESPONSE_BYTES + 1)); }, cancel() { cancelled = true; } });
  await assert.rejects(readBoundedText(stream, MAX_RESPONSE_BYTES, new AbortController().signal), code('INVALID_RESPONSE'));
  assert.ok(cancelled);
});
test('bounded reader handles split UTF-8 characters', async () => {
  const bytes = new TextEncoder().encode('GORDON — café');
  const stream = new ReadableStream({ start(c) { for (const byte of bytes) c.enqueue(new Uint8Array([byte])); c.close(); } });
  assert.equal(await readBoundedText(stream, 100, new AbortController().signal), 'GORDON — café');
});
test('bounded reader exits on cancellation while waiting on a stream', async () => {
  const controller = new AbortController();
  const pending = readBoundedText(new ReadableStream(), 100, controller.signal);
  controller.abort();
  await assert.rejects(pending);
});
test('valid request uses only the configured n8n endpoint and ticker', async () => {
  configure();
  global.fetch = async (url, init) => {
    assert.equal(url, endpoint); assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { ticker: 'AAPL' });
    assert.equal(init.headers['X-Gordon-Webhook-Key'], secret);
    assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(init.headers.cookie, undefined);
    return json({ ticker: 'AAPL', report, requestId: 'preserved-123', secret });
  };
  const response = await POST(request({ ticker: ' aapl ', destination: 'https://evil.invalid', requestId: 'not-forwarded' }, { headers: { cookie: 'session=private' } }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const body = await response.json();
  assert.deepEqual(body, { ok: true, analysis: { ticker: 'AAPL', report, requestId: 'preserved-123' } });
});
test('missing server configuration returns a safe 503 and never calls fetch', async () => {
  delete process.env.GORDON_N8N_WEBHOOK_URL;
  global.fetch = () => { assert.fail('must not invoke upstream'); };
  const response = await POST(request()); assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'UNAVAILABLE');
});
test('rejects cross-origin, missing-origin, and cross-site requests before fetch', async () => {
  global.fetch = () => { assert.fail('must not invoke upstream'); };
  for (const headers of [{ origin: 'https://evil.invalid' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' }]) {
    assert.equal((await POST(request({ ticker: 'AAPL' }, { headers }))).status, 403);
  }
});
test('requires JSON and valid bounded request body before fetch', async () => {
  global.fetch = () => { assert.fail('must not invoke upstream'); };
  assert.equal((await POST(request({}, { headers: { 'content-type': 'text/plain' } }))).status, 415);
  assert.equal((await POST(request('{broken'))).status, 400);
  assert.equal((await POST(request('x'.repeat(1025)))).status, 400);
  assert.equal((await POST(request({ ticker: '' }))).status, 422);
  assert.equal((await POST(request({ ticker: 'AAPL TSLA' }))).status, 422);
});
for (const [status, expected, publicStatus] of [[400, 'INVALID_TICKER', 422], [422, 'INVALID_TICKER', 422], [429, 'RATE_LIMITED', 429], [500, 'UPSTREAM_ERROR', 502], [503, 'UNAVAILABLE', 503], [504, 'TIMEOUT', 504], [524, 'TIMEOUT', 504], [401, 'UNAVAILABLE', 503], [404, 'UNAVAILABLE', 503]]) {
  test(`sanitizes upstream HTTP ${status}`, async () => {
    configure(); global.fetch = async () => new Response(`Stack trace ${endpoint} ${secret}`, { status });
    const response = await POST(request()); assert.equal(response.status, publicStatus);
    const text = await response.text(); assert.ok(!text.includes(secret)); assert.ok(!text.includes(endpoint)); assert.equal(JSON.parse(text).error.code, expected);
  });
}
test('200 upstream error envelope is not a success', async () => {
  configure(); global.fetch = async () => json({ error: { stack: secret }, report });
  const response = await POST(request()); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes(secret));
});
test('200 malformed response is not a success', async () => {
  configure(); global.fetch = async () => new Response('<html>private</html>', { headers: { 'content-type': 'text/html' } });
  assert.equal((await POST(request())).status, 502);
});
test('202 acknowledgements are rejected, not displayed as completed reports', async () => {
  configure(); global.fetch = async () => json({ report }, 202);
  assert.equal((await POST(request())).status, 502);
});
test('network failure never exposes exception details', async () => {
  configure(); global.fetch = async () => { throw new Error(`${endpoint} ${secret}`); };
  const response = await POST(request()); assert.equal(response.status, 502); assert.ok(!(await response.text()).includes(secret));
});
test('server-side deadline cancels fetch and returns a safe timeout', async () => {
  configure(); process.env.GORDON_TIMEOUT_MS = '1000';
  global.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error(secret)), { once: true }));
  const start = Date.now(); const response = await POST(request());
  assert.equal(response.status, 504); assert.equal((await response.json()).error.code, 'TIMEOUT'); assert.ok(Date.now() - start < 3000);
});
test('deadline remains active during response body consumption', async () => {
  configure(); process.env.GORDON_TIMEOUT_MS = '1000';
  global.fetch = async () => new Response(new ReadableStream(), { headers: { 'content-type': 'application/json' } });
  const response = await POST(request()); assert.equal(response.status, 504);
});
test('two requests completing in reverse order remain isolated', async () => {
  configure();
  global.fetch = async (_url, init) => {
    const { ticker } = JSON.parse(init.body);
    await new Promise(resolve => setTimeout(resolve, ticker === 'AAPL' ? 25 : 1));
    return json({ ticker, report: `${ticker}: ${report}`, requestId: `id-${ticker}` });
  };
  const [apple, nvidia] = await Promise.all([POST(request({ ticker: 'AAPL' })), POST(request({ ticker: 'NVDA' }))]);
  const a = await apple.json(), n = await nvidia.json();
  assert.equal(a.analysis.ticker, 'AAPL'); assert.equal(n.analysis.ticker, 'NVDA');
  assert.ok(a.analysis.report.startsWith('AAPL:')); assert.ok(n.analysis.report.startsWith('NVDA:'));
  assert.equal(a.analysis.requestId, 'id-AAPL'); assert.equal(n.analysis.requestId, 'id-NVDA');
});
test('configuration rejects unsafe URL forms, header injection, and invalid time budgets', () => {
  configure();
  for (const url of ['http://n8n.example.invalid/webhook', 'not-a-url', 'https://user:password@n8n.example.invalid/webhook', endpoint + '#fragment']) {
    process.env.GORDON_N8N_WEBHOOK_URL = url; assert.throws(getGordonServerConfig, code('UNAVAILABLE'));
  }
  configure(); process.env.GORDON_N8N_WEBHOOK_SECRET = 'x\r\nAuthorization: stolen'; assert.throws(getGordonServerConfig, code('UNAVAILABLE'));
  for (const budget of ['0', '999', '105001', '1000.5', 'NaN']) { configure(); process.env.GORDON_TIMEOUT_MS = budget; assert.throws(getGordonServerConfig, code('UNAVAILABLE')); }
});
test('webhook authentication remains optional and is never a browser header', async () => {
  configure(); delete process.env.GORDON_N8N_WEBHOOK_SECRET;
  global.fetch = async (_url, init) => { assert.equal(init.headers['X-Gordon-Webhook-Key'], undefined); return json({ report }); };
  assert.equal((await POST(request())).status, 200);
});
test('browser helper calls only same-origin API and validates success', async () => {
  global.fetch = async (url, init) => {
    assert.equal(url, '/api/gordon'); assert.equal(init.credentials, 'same-origin');
    assert.equal(init.headers['X-Gordon-Webhook-Key'], undefined);
    assert.deepEqual(JSON.parse(init.body), { ticker: 'AAPL' });
    return json({ ok: true, analysis: { ticker: 'AAPL', report } });
  };
  assert.deepEqual(await requestGordonAnalysis('AAPL', new AbortController().signal), { ticker: 'AAPL', report });
});
test('browser helper ignores arbitrary error messages even in valid JSON', async () => {
  global.fetch = async () => json({ ok: false, error: { code: 'UPSTREAM_ERROR', message: secret } }, 502);
  await assert.rejects(requestGordonAnalysis('AAPL', new AbortController().signal), error => error.code === 'UPSTREAM_ERROR' && !error.message.includes(secret));
});
test('browser handles non-JSON hosting errors and network rejection', async () => {
  global.fetch = async () => new Response('Vercel private error', { status: 504 });
  await assert.rejects(requestGordonAnalysis('AAPL', new AbortController().signal), code('TIMEOUT'));
  global.fetch = async () => { throw new TypeError(secret); };
  await assert.rejects(requestGordonAnalysis('AAPL', new AbortController().signal), code('NETWORK_ERROR'));
});
test('browser rejects malformed success or a mismatched report', async () => {
  for (const body of [{ ok: true, analysis: { ticker: 'NVDA', report } }, { ok: true, analysis: {} }, { data: report }]) {
    global.fetch = async () => json(body);
    await assert.rejects(requestGordonAnalysis('AAPL', new AbortController().signal), code('INVALID_RESPONSE'));
  }
});
test('browser cancels without turning unmount into a public error', async () => {
  const controller = new AbortController();
  global.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  const pending = requestGordonAnalysis('AAPL', controller.signal); controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError');
});
