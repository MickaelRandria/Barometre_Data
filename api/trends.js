import { getTrends } from '../backend/engine/trendsEngine.js';
import { setCors } from './_weather.js';

let cache = { data: null, fetchedAt: null };
const TTL = 6 * 60 * 60 * 1000; // 6 heures

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now = Date.now();
    if (!cache.data || !cache.fetchedAt || now - cache.fetchedAt > TTL) {
      cache.data = await getTrends('FR');
      cache.fetchedAt = now;
    }
    res.json({ trends: cache.data, fetchedAt: cache.fetchedAt, cached: cache.fetchedAt !== now });
  } catch (error) {
    res.status(500).json({ error: 'Trends unavailable', details: error.message });
  }
}
