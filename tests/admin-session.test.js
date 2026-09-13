import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import handler from '../api/admin-session.js';

const keys = ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'VERCEL', 'NODE_ENV'];
const oldEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
afterEach(() => {
  for (const key of keys) {
    if (oldEnv[key] === undefined) delete process.env[key];
    else process.env[key] = oldEnv[key];
  }
});

async function call(method = 'GET', { body, cookie, origin = 'https://app.example.test' } = {}) {
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; }, end() { return this; } };
  await handler({ method, body, headers: { host: 'app.example.test', origin, cookie, 'content-type': 'application/json', 'x-forwarded-proto': 'https' } }, res);
  return res;
}

function configure() {
  process.env.ADMIN_PASSWORD = 'test-only-password-never-used';
  process.env.ADMIN_SESSION_SECRET = 'test-only-session-secret-at-least-32-chars';
}

test('unconfigured authentication fails closed', async () => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal((await call()).statusCode, 503);
});

test('wrong password does not create a session', async () => {
  configure();
  const res = await call('POST', { body: { password: 'wrong' } });
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers['Set-Cookie'], undefined);
  assert.deepEqual((await call()).body, { authenticated: false });
});

test('correct password creates a signed HttpOnly Secure session and GET validates it', async () => {
  configure();
  const res = await call('POST', { body: { password: process.env.ADMIN_PASSWORD } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { authenticated: true });
  const cookie = res.headers['Set-Cookie'][0];
  assert.match(cookie, /Path=\/api; Max-Age=28800; HttpOnly; SameSite=Strict; Secure/);
  assert.ok(!cookie.includes(process.env.ADMIN_PASSWORD));
  assert.equal(res.headers['Cache-Control'], 'no-store');
  const migrated = await call('GET', { cookie: cookie.split(';')[0] });
  assert.deepEqual(migrated.body, { authenticated: true });
  assert.equal(migrated.headers['Set-Cookie'][0].split(';')[0], cookie.split(';')[0]);
  assert.match(migrated.headers['Set-Cookie'][1], /Path=\/api\/admin-session; Max-Age=0/);
});

test('tampered and expired sessions are rejected', async () => {
  configure();
  const login = await call('POST', { body: { password: process.env.ADMIN_PASSWORD } });
  const cookie = login.headers['Set-Cookie'][0].split(';')[0];
  assert.deepEqual((await call('GET', { cookie: `${cookie}changed` })).body, { authenticated: false });
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 })).toString('base64url');
  const sig = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  assert.deepEqual((await call('GET', { cookie: `barometre_admin=${payload}.${sig}` })).body, { authenticated: false });
});

test('logout expires the cookie', async () => {
  const res = await call('DELETE');
  assert.deepEqual(res.body, { authenticated: false });
  for (const cookie of res.headers['Set-Cookie']) {
    assert.match(cookie, /barometre_admin=;/);
    assert.match(cookie, /Max-Age=0/);
  }
});

test('cross-origin requests, malformed bodies and unsupported methods are rejected', async () => {
  configure();
  assert.equal((await call('POST', { origin: 'https://other.example.test', body: { password: process.env.ADMIN_PASSWORD } })).statusCode, 403);
  assert.equal((await call('POST', { body: '{invalid' })).statusCode, 400);
  assert.equal((await call('POST', { body: { password: 'x'.repeat(1500) } })).statusCode, 413);
  assert.equal((await call('PATCH')).statusCode, 405);
  assert.equal((await call('OPTIONS')).statusCode, 204);
});
