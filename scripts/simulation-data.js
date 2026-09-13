import { randomUUID } from 'node:crypto';
import { TRACKING_SECTIONS } from '../shared/tracking.js';

const DAY = 86400000;

export function generateSimulation(now = new Date()) {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw Error('invalid_date');
  const midnight = Math.floor(nowMs / DAY) * DAY;
  const timeOfDay = nowMs - midnight;
  const batchId = randomUUID();
  const events = [];
  // 30 distinct sessions / population 50 = 60%; 15 clickers / 50 = 30%.
  // 14 sessions in S-1, 16 in S. Each of the 14 UTC dates has traffic.
  for (let index = 0; index < 30; index += 1) {
    const week = index < 14 ? 0 : 1;
    const localIndex = week ? index - 14 : index;
    const day = week * 7 + localIndex % 7;
    const dateStart = midnight - 14 * DAY + day * DAY;
    const base = dateStart + timeOfDay;
    const sessionId = randomUUID();
    let action = 0;
    const emit = (type, target) => {
      // Clamp within each UTC day even when run immediately before midnight.
      const timestamp = Math.min(base + localIndex * 60000 + action++ * 15000, dateStart + DAY - 1);
      events.push({ type, ...target, sessionId, timestamp: new Date(timestamp).toISOString(), source: 'simulation', batchId });
    };
    emit('pageview', TRACKING_SECTIONS.livre);
    if (index % 2 === 0) {
      emit('click', TRACKING_SECTIONS.brief);
      emit('pageview', TRACKING_SECTIONS.brief);
      const target = index % 4 === 0 ? TRACKING_SECTIONS.weather : TRACKING_SECTIONS.overview;
      emit('click', target);
      emit('pageview', target);
    }
  }
  return {
    events: events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
    calibration: { population: 50, openers: 30, openRate: 60, clickers: 15, clickRate: 30 },
    weeks: {
      previous: events.filter((event) => Date.parse(event.timestamp) < midnight - 7 * DAY).length,
      current: events.filter((event) => Date.parse(event.timestamp) >= midnight - 7 * DAY).length,
    },
  };
}
