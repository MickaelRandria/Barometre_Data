import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'barometre_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const digest = (value) => createHash('sha256').update(value).digest();

function signature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function readAdminSession(req, secret = process.env.ADMIN_SESSION_SECRET) {
  try {
    if (!secret || secret.length < 32) return null;
    const cookies = (req.headers.cookie || '').split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${COOKIE}=`));
    for (const cookie of cookies) {
      const token = cookie.slice(COOKIE.length + 1);
      if (!token || token.length > 512) continue;
      const [payload, suppliedSignature, extra] = token.split('.');
      if (!payload || !suppliedSignature || extra) continue;
      if (!timingSafeEqual(digest(suppliedSignature), digest(signature(payload, secret)))) continue;
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (Number.isInteger(data.exp) && data.exp > Date.now() / 1000 && data.exp <= Date.now() / 1000 + SESSION_SECONDS) return { token, exp: data.exp };
    }
    return null;
  } catch {
    return null;
  }
}

function setCookie(req, res, token, maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const attributes = `HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', [
    `${COOKIE}=${token}; Path=/api; Max-Age=${maxAge}; ${attributes}`,
    // Migrate and clear the cookie scoped to the former login endpoint.
    `${COOKIE}=; Path=/api/admin-session; Max-Age=0; ${attributes}`,
  ]);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Cookie, Origin');
  // No cross-origin login/logout, no client-visible password or session secret.
  try {
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) {
      return res.status(403).json({ authenticated: false });
    }
  } catch {
    return res.status(403).json({ authenticated: false });
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(204).end();
  }
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(405).json({ authenticated: false });
  }
  if (req.method === 'DELETE') {
    setCookie(req, res, '', 0);
    return res.status(200).json({ authenticated: false });
  }

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return res.status(503).json({ authenticated: false });
  if (req.method === 'GET') {
    const session = readAdminSession(req, secret);
    if (session) setCookie(req, res, session.token, Math.max(0, session.exp - Math.floor(Date.now() / 1000)));
    return res.status(200).json({ authenticated: Boolean(session) });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ authenticated: false });
  let supplied;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 1024) return res.status(413).json({ authenticated: false });
    supplied = JSON.parse(raw)?.password;
  } catch {
    return res.status(400).json({ authenticated: false });
  }
  if (typeof supplied !== 'string' || supplied.length > 256 || !timingSafeEqual(digest(supplied), digest(password))) {
    return res.status(401).json({ authenticated: false });
  }
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  setCookie(req, res, `${payload}.${signature(payload, secret)}`, SESSION_SECONDS);
  return res.status(200).json({ authenticated: true });
}
