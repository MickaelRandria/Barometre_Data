import { readAdminSession } from './admin-session.js';
import { aggregateEvents } from '../backend/analytics/aggregate.js';
import { createStore, readEventRows, parseEvent } from '../backend/analytics/store.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!readAdminSession(req)) return res.status(401).json({ error: 'unauthorized' });
  // V0 is the default exercise version. Explicit live selection preserves V1
  // without ever mixing captured traffic into the simulation screenshot.
  const source = req.query?.source ?? 'simulation';
  if (!['simulation', 'live'].includes(source)) return res.status(400).json({ error: 'invalid_source' });
  try {
    const now = new Date();
    const rows = await readEventRows(createStore());
    const events = rows.map(({ raw }) => parseEvent(raw));
    const aggregates = aggregateEvents(events, source, now);
    return res.status(200).json({ status: 'connected', ...aggregates, partial: events.some((event) => !event) || aggregates.invalidEvents > 0 });
  } catch (error) {
    const code = ['storage_not_configured', 'storage_read_limit'].includes(error.message) ? error.message : 'storage_unavailable';
    return res.status(503).json({ error: code });
  }
}
