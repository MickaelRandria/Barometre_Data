const EVENT_KEY = /^events:\d{4}-\d{2}-\d{2}$/;

// REST only: credentials never leave server-side modules.
export function createStore({ timeout = 20000 } = {}) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw Error('storage_not_configured');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:') throw Error('storage_unavailable');
  const signal = AbortSignal.timeout(timeout);
  return async (commands, { atomic = false } = {}) => {
    if (!commands.length) return [];
    const response = await fetch(`${endpoint.origin}/${atomic ? 'multi-exec' : 'pipeline'}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands), signal,
    });
    if (!response.ok) throw Error('storage_unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== commands.length || rows.some((row) => !row || row.error || !Object.hasOwn(row, 'result'))) throw Error('storage_unavailable');
    return rows.map((row) => row.result);
  };
}

export async function listEventKeys(store) {
  const keys = new Set();
  let cursor = '0';
  let iterations = 0;
  do {
    if (++iterations > 1000) throw Error('storage_read_limit');
    const [result] = await store([['SCAN', cursor, 'MATCH', 'events:*', 'COUNT', 100]]);
    if (!Array.isArray(result) || result.length !== 2 || !Array.isArray(result[1]) || !/^\d+$/.test(String(result[0]))) throw Error('storage_unavailable');
    cursor = String(result[0]);
    for (const key of result[1]) if (typeof key === 'string' && EVENT_KEY.test(key)) keys.add(key);
  } while (cursor !== '0');
  return [...keys].sort();
}

export async function readEventRows(store) {
  const keys = await listEventKeys(store);
  const rows = [];
  let total = 0;
  const ranges = [];
  for (let offset = 0; offset < keys.length; offset += 30) {
    const batch = keys.slice(offset, offset + 30);
    const lengths = await store(batch.map((key) => ['LLEN', key]));
    lengths.forEach((length, index) => {
      if (!Number.isSafeInteger(length) || length < 0) throw Error('storage_unavailable');
      total += length;
      // Fail explicitly instead of presenting truncated totals as complete.
      if (total > 200000) throw Error('storage_read_limit');
      for (let start = 0; start < length; start += 1000) ranges.push(['LRANGE', batch[index], start, Math.min(start + 999, length - 1)]);
    });
  }
  for (let offset = 0; offset < ranges.length; offset += 10) {
    const batch = ranges.slice(offset, offset + 10);
    const results = await store(batch);
    results.forEach((result, index) => {
      if (!Array.isArray(result)) throw Error('storage_unavailable');
      for (const raw of result) rows.push({ key: batch[index][1], raw });
    });
  }
  return rows;
}

export function parseEvent(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
}

export async function clearSimulation(store) {
  const rows = await readEventRows(store);
  const commands = rows.filter(({ raw }) => parseEvent(raw)?.source === 'simulation')
    .map(({ key, raw }) => ['LREM', key, 0, typeof raw === 'string' ? raw : JSON.stringify(raw)]);
  let removed = 0;
  // Remove exact marked values, never delete/rebuild a list. Concurrent live
  // appends, legacy records without a source, and existing TTLs are preserved.
  for (let offset = 0; offset < commands.length; offset += 100) {
    const results = await store(commands.slice(offset, offset + 100));
    for (const count of results) {
      if (!Number.isSafeInteger(count) || count < 0) throw Error('storage_unavailable');
      removed += count;
    }
  }
  return removed;
}
