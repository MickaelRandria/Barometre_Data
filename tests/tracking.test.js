import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import handler from '../api/track.js';
import { TRACKING_SECTIONS } from '../shared/tracking.js';

const originalFetch = globalThis.fetch;
const envKeys = ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function configureStore() {
  process.env.KV_REST_API_URL = 'https://redis.example.test';
  process.env.KV_REST_API_TOKEN = 'test-only-token';
}

function request(overrides = {}) {
  return { method: 'POST', headers: { host: 'app.example.test', origin: 'https://app.example.test', 'content-type': 'application/json' }, body: { type: 'pageview', ...TRACKING_SECTIONS.livre, sessionId: randomUUID() }, ...overrides };
}

async function invoke(req) {
  const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, end() { return this; } };
  await handler(req, res);
  return res;
}

test('capture stores only permitted fields, uses the server clock and appends atomically', async () => {
  configureStore();
  let command;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://redis.example.test/multi-exec');
    assert.equal(options.headers.Authorization, 'Bearer test-only-token');
    assert.ok(options.signal);
    command = JSON.parse(options.body);
    return { ok: true, json: async () => [{ result: 1 }, { result: 1 }] };
  };
  const req = request();
  req.headers['x-forwarded-for'] = '192.0.2.1';
  req.headers.cookie = 'private=value';
  req.body.timestamp = '1900-01-01T00:00:00Z';
  req.body.email = 'discard@example.test';
  req.body.source = 'simulation';
  const before = Date.now();
  const res = await invoke(req);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(command[0][0], 'RPUSH');
  const event = JSON.parse(command[0][2]);
  assert.deepEqual(Object.keys(event).sort(), ['type', 'page', 'section', 'sessionId', 'timestamp', 'source'].sort());
  assert.equal(event.source, 'live');
  assert.ok(Date.parse(event.timestamp) >= before && Date.parse(event.timestamp) <= Date.now());
  assert.equal(command[0][1], `events:${event.timestamp.slice(0, 10)}`);
  assert.equal(command[1][0], 'EXPIREAT');
  assert.equal(command[1][1], command[0][1]);
  const remaining = command[1][2] - Date.now() / 1000;
  assert.ok(remaining > 89 * 86400 && remaining <= 90 * 86400);
});

test('CORS, OPTIONS and method filtering never write events', async () => {
  globalThis.fetch = () => { throw Error('must not call storage'); };
  assert.equal((await invoke(request({ method: 'OPTIONS' }))).statusCode, 204);
  const get = await invoke(request({ method: 'GET' }));
  assert.equal(get.statusCode, 405);
  assert.equal(get.headers.Allow, 'POST, OPTIONS');
  const crossSite = request();
  crossSite.headers.origin = 'https://other.example.test';
  const response = await invoke(crossSite);
  assert.equal(response.statusCode, 403);
  assert.equal(response.headers['Access-Control-Allow-Origin'], undefined);
});

test('invalid data, private URLs, admin routes and malformed payloads are rejected', async () => {
  for (const change of [
    { type: 'identify' }, { page: '/?admin=true&key=secret' },
    { section: 'admin', page: '/admin' }, { sessionId: 'person@example.test' },
    { section: 'brief', page: '/livre-blanc' },
  ]) {
    const req = request();
    Object.assign(req.body, change);
    assert.equal((await invoke(req)).statusCode, 400);
  }
  assert.equal((await invoke(request({ body: '{invalid' }))).statusCode, 400);
  assert.equal((await invoke(request({ body: 'x'.repeat(1025) }))).statusCode, 413);
  const wrongContent = request();
  wrongContent.headers['content-type'] = 'text/plain';
  assert.equal((await invoke(wrongContent)).statusCode, 415);
});

test('missing storage and provider failures never report successful persistence', async () => {
  for (const key of envKeys) delete process.env[key];
  assert.equal((await invoke(request())).statusCode, 503);
  configureStore();
  for (const fakeFetch of [
    async () => { throw Error('network unavailable'); },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => [{ error: 'ERR' }, { result: 1 }] }),
    async () => ({ ok: true, json: async () => [{ result: 1 }, { result: 0 }] }),
  ]) {
    globalThis.fetch = fakeFetch;
    assert.deepEqual((await invoke(request())).body, { ok: false });
  }
});

test('parallel events issue independent append operations rather than replacing a JSON file', async () => {
  configureStore();
  const saved = [];
  globalThis.fetch = async (url, options) => {
    const commands = JSON.parse(options.body);
    assert.equal(commands[0][0], 'RPUSH');
    saved.push(JSON.parse(commands[0][2]));
    return { ok: true, json: async () => [{ result: saved.length }, { result: 1 }] };
  };
  const responses = await Promise.all(Array.from({ length: 50 }, () => invoke(request())));
  assert.ok(responses.every((res) => res.statusCode === 200));
  assert.equal(new Set(saved.map((event) => event.sessionId)).size, 50);
});

function browser(fetchImpl, uuid = randomUUID()) {
  const queued = [];
  globalThis.window = {
    crypto: { randomUUID: () => uuid },
    setTimeout(callback, delay) { if (delay === 0) queued.push(callback); return 1; },
    clearTimeout() {},
    fetch: fetchImpl,
  };
  return () => { while (queued.length) queued.shift()(); };
}

test('frontend is deferred, uses ephemeral sessions and sends no browser credentials or URL', async () => {
  const requests = [];
  let flush = browser((url, options) => { requests.push({ url, options }); return Promise.resolve({ ok: true }); });
  const tracker = await import(`../frontend/src/track.js?session=${randomUUID()}`);
  tracker.trackSection('pageview', 'livre');
  tracker.trackSection('click', 'brief');
  tracker.trackSection('pageview', 'admin');
  assert.equal(requests.length, 0);
  flush();
  assert.equal(requests.length, 2);
  const first = JSON.parse(requests[0].options.body);
  const second = JSON.parse(requests[1].options.body);
  assert.equal(first.sessionId, second.sessionId);
  assert.equal(requests[0].url, '/api/track');
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(requests[0].options.referrerPolicy, 'no-referrer');
  assert.equal(requests[0].options.keepalive, true);
  assert.equal(first.timestamp, undefined);
  flush = browser((url, options) => { requests.push({ url, options }); return Promise.resolve(); });
  const nextLoad = await import(`../frontend/src/track.js?session=${randomUUID()}`);
  nextLoad.trackSection('pageview', 'livre');
  flush();
  assert.notEqual(JSON.parse(requests[2].options.body).sessionId, first.sessionId);
});

test('frontend swallows sync and async failures and does not retry', async () => {
  const tracker = await import(`../frontend/src/track.js?session=${randomUUID()}`);
  for (const fetchImpl of [() => { throw Error('blocked'); }, () => Promise.reject(Error('offline'))]) {
    const flush = browser(fetchImpl);
    assert.doesNotThrow(() => tracker.trackSection('click', 'weather'));
    assert.doesNotThrow(flush);
    await new Promise((resolve) => setImmediate(resolve));
  }
  window.setTimeout = () => { throw Error('restricted'); };
  assert.doesNotThrow(() => tracker.trackSection('pageview', 'overview'));
});
