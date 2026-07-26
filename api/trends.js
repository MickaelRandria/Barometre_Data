import { getTrendsCacheKey, getTrendsWithStatus } from '../backend/engine/trendsEngine.js';
import { setCors } from './_weather.js';

const cache = new Map();
const TTL = 6 * 60 * 60 * 1000; // 6 heures

function parseCustomArticles(value) {
  try {
    const articles = JSON.parse(String(value ?? '[]'));
    return Array.isArray(articles) ? articles.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const fresh = req.query?.fresh === 'true';
  const brief = {
    product: req.query?.product ?? '',
    message: req.query?.message ?? '',
    customArticles: parseCustomArticles(req.query?.customArticles),
  };
  const cacheKey = getTrendsCacheKey(brief);
  const cachedEntry = cache.get(cacheKey);
  const shouldRefresh = fresh || !cachedEntry || now - cachedEntry.storedAt > TTL;
  let entry = cachedEntry;
  if (shouldRefresh) {
    const startedAt = Date.now();
    entry = {
      result: await getTrendsWithStatus('FR', null, brief),
      storedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
    };
    cache.set(cacheKey, entry);
  }
  res.json({ ...entry.result, cached: !shouldRefresh, latencyMs: entry.latencyMs });
}
