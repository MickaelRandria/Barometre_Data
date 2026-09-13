/**
 * Audience capture: stores only an allowlisted logical page/section, event type,
 * server timestamp and random in-memory browser session UUID.
 * Never reads or stores IP, user-agent, referrer, cookies, query parameters,
 * form data or identity. No persistent tracking cookie or cross-session linking.
 * The ephemeral identifier supports later aggregation; the raw events expire
 * after 90 days. These are technical limits, not a claim of GDPR exemption.
 * Network providers necessarily process requests; their access logs are separate
 * from this application store. Do not log request headers or payloads here.
 */
import { isTrackingTarget } from '../shared/tracking.js';

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETENTION_DAYS = 90;

function allowOrigin(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers?.origin;
  if (req.headers?.['sec-fetch-site'] === 'cross-site') return false;
  if (!origin) return true; // Same-origin clients and server-side verification.
  try {
    const url = new URL(origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.host !== req.headers.host) return false;
    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (!allowOrigin(req, res)) return res.status(403).json({ ok: false });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) {
    return res.status(415).json({ ok: false });
  }

  let body;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw, 'utf8') > 1024) return res.status(413).json({ ok: false });
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ ok: false });
  }
  if (!body || !['pageview', 'click'].includes(body.type) || !SESSION_ID.test(body.sessionId) || !isTrackingTarget(body.page, body.section)) {
    return res.status(400).json({ ok: false });
  }

  const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !token) return res.status(503).json({ ok: false });

  // Explicit field selection: discard timestamp, IP or any extra client fields.
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const event = { type: body.type, page: body.page, section: body.section, sessionId: body.sessionId, timestamp: now.toISOString(), source: 'live' };
  const key = `events:${day}`;
  const expiresAt = Math.floor(Date.parse(`${day}T00:00:00Z`) / 1000) + RETENTION_DAYS * 86400;
  try {
    const endpoint = new URL(restUrl);
    if (endpoint.protocol !== 'https:') return res.status(503).json({ ok: false });
    // Atomic append + expiry: no read/modify/write race between serverless calls.
    const response = await fetch(`${endpoint.origin}/multi-exec`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['RPUSH', key, JSON.stringify(event)], ['EXPIREAT', key, expiresAt]]),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return res.status(503).json({ ok: false });
    const results = await response.json();
    if (!Array.isArray(results) || results.length !== 2 || results.some((result) => result.error) || !(results[0].result >= 1) || results[1].result !== 1) {
      return res.status(503).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch {
    // Never leak provider credentials, request details or payloads in logs.
    return res.status(503).json({ ok: false });
  }
}
