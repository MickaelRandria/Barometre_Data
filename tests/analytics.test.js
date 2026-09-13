import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import handler from '../api/analytics.js';
import { aggregateEvents } from '../backend/analytics/aggregate.js';
import { readEventRows, clearSimulation } from '../backend/analytics/store.js';

const keys = ['ADMIN_SESSION_SECRET', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});
function configure() {
  process.env.ADMIN_SESSION_SECRET = 'analytics-test-secret-at-least-32-characters';
  process.env.KV_REST_API_URL = 'https://redis.example.test';
  process.env.KV_REST_API_TOKEN = 'private-test-token';
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
  return `barometre_admin=${payload}.${createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url')}`;
}
async function call(cookie, source, method = 'GET') {
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await handler({ method, headers: { cookie }, query: source === undefined ? {} : { source } }, res);
  return res;
}
const sessionId = randomUUID();
const event = (overrides = {}) => ({ type: 'pageview', page: '/livre-blanc', section: 'livre-blanc', sessionId, timestamp: '2026-09-12T10:00:00Z', source: 'simulation', ...overrides });

test('global aggregation filters sources and deduplicates sessions across days', () => {
  const data = aggregateEvents([
    event(), event({ type: 'click' }), event({ timestamp: '2026-08-01T10:00:00Z' }),
    event({ sessionId: randomUUID() }), event({ source: 'live' }), event({ source: undefined }),
    event({ timestamp: '2026-09-13T10:00:00Z' }), event({ page: '/admin' }), null,
  ], 'simulation', new Date('2026-09-12T12:00:00Z'));
  assert.equal(data.version, 'V0');
  assert.equal(data.totals.uniqueVisitors, 2);
  assert.equal(data.totals.sessions, 2);
  assert.equal(data.totals.pageviews, 3);
  assert.equal(data.totals.clicks, 1);
  assert.equal(data.totals.engagementRate, 50);
  assert.equal(data.totals.averageSessionSeconds, null);
  assert.equal(data.audienceBreakdown, null);
  assert.ok(!JSON.stringify(data).includes(sessionId));
  const live = aggregateEvents([event(), event({ source: 'live' }), event({ source: undefined })], 'live', new Date('2026-09-12T12:00:00Z'));
  assert.equal(live.version, 'V1');
  assert.equal(live.totals.pageviews, 2);
});

test('sparkline uses contiguous UTC windows anchored to latest selected event and distinct sessions', () => {
  const data = aggregateEvents([
    event({ timestamp: '2026-09-05T23:59:59Z' }), // previous, same session also current
    event({ timestamp: '2026-09-06T00:00:00Z' }), // current begins
    event(), event(),
    event({ timestamp: '2026-08-30T00:00:00Z', sessionId: randomUUID() }), // previous begins
    event({ timestamp: '2026-08-29T23:59:59Z', sessionId: randomUUID() }), // global only
    event({ timestamp: '2026-09-25T12:00:00Z', source: 'live' }), // must not shift V0 anchor
  ], 'simulation', new Date('2026-10-01T12:00:00Z'));
  assert.deepEqual(data.sparkline, { current: 1, previous: 2 });
  assert.equal(data.totals.sessions, 3);
  assert.deepEqual(aggregateEvents([]).sparkline, { current: 0, previous: 0 });
});

test('requires a valid admin session before storage and rejects invalid source', async () => {
  const cookie = configure();
  global.fetch = () => { throw Error('must not read storage'); };
  assert.equal((await call()).statusCode, 401);
  assert.equal((await call(`${cookie}tampered`)).statusCode, 401);
  assert.equal((await call(cookie, 'all')).statusCode, 400);
  assert.equal((await call(cookie, ['live', 'simulation'])).statusCode, 400);
  assert.equal((await call(cookie, 'live', 'POST')).statusCode, 405);
});

test('missing configuration and provider errors are distinct from connected empty V0', async () => {
  const cookie = configure();
  for (const key of keys.slice(1)) delete process.env[key];
  assert.equal((await call(cookie)).body.error, 'storage_not_configured');
  configure();
  global.fetch = async () => ({ ok: false });
  assert.equal((await call(cookie)).body.error, 'storage_unavailable');
  global.fetch = async () => ({ ok: true, json: async () => [{ result: ['0', []] }] });
  const response = await call(cookie);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.version, 'V0');
  assert.equal(response.body.totals.sessions, 0);
  assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('paginated scan deduplicates keys; paginated lists include more than the former 10000 cap', async () => {
  const commandsSeen = [];
  const key = 'events:2026-09-12';
  const rows = await readEventRows(async (commands) => commands.map((command) => {
    commandsSeen.push(command);
    if (command[0] === 'SCAN') return command[1] === '0' ? ['10', [key, 'events:metadata']] : ['0', [key]];
    if (command[0] === 'LLEN') return 10003;
    return Array.from({ length: command[3] - command[2] + 1 }, (_, i) => String(command[2] + i));
  }));
  assert.equal(rows.length, 10003);
  assert.equal(rows.at(-1).raw, '10002');
  assert.equal(commandsSeen.filter((command) => command[0] === 'LLEN').length, 1);
});

test('cleanup removes only marked values, retaining concurrent live appends and list TTL', async () => {
  const key = 'events:2026-09-12';
  const simulated = JSON.stringify(event());
  const live = JSON.stringify(event({ source: 'live' }));
  const legacy = JSON.stringify(event({ source: undefined }));
  let values = [simulated, live, legacy, '{unreadable'];
  let appended = false;
  const removed = await clearSimulation(async (commands) => commands.map((command) => {
    if (command[0] === 'SCAN') return ['0', [key]];
    if (command[0] === 'LLEN') return values.length;
    if (command[0] === 'LRANGE') return values.slice(command[2], command[3] + 1);
    assert.equal(command[0], 'LREM'); // no DEL, rewrite or expiry command allowed
    if (!appended) { values.push(live); appended = true; }
    const before = values.length;
    values = values.filter((value) => value !== command[3]);
    return before - values.length;
  }));
  assert.equal(removed, 1);
  assert.deepEqual(values, [live, legacy, '{unreadable', live]);
});

test('API returns source-specific aggregates without raw identifiers and flags damaged records', async () => {
  const cookie = configure();
  const timestamp = new Date().toISOString();
  const records = [JSON.stringify(event({ timestamp })), JSON.stringify(event({ timestamp, source: 'live' })), '{broken'];
  global.fetch = async (_, options) => ({ ok: true, json: async () => JSON.parse(options.body).map((command) => ({ result: command[0] === 'SCAN' ? ['0', [`events:${timestamp.slice(0, 10)}`]] : command[0] === 'LLEN' ? records.length : records })) });
  const response = await call(cookie);
  assert.equal(response.body.totals.pageviews, 1);
  assert.equal(response.body.partial, true);
  assert.equal(response.body.version, 'V0');
  assert.ok(!JSON.stringify(response.body).includes(sessionId));
});
