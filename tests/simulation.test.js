import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSimulation } from '../scripts/simulation-data.js';
import { aggregateEvents } from '../backend/analytics/aggregate.js';

for (const date of ['2026-09-12T00:00:00.000Z', '2026-09-12T15:22:13.456Z', '2026-09-12T23:59:59.999Z', '2028-03-01T12:00:00.000Z']) {
  test(`simulation remains within 14 days and covers both weeks when run at ${date}`, () => {
    const now = new Date(date);
    const { events, calibration, weeks } = generateSimulation(now);
    assert.equal(events.length, 90);
    assert.equal(new Set(events.map((event) => event.timestamp.slice(0, 10))).size, 14);
    assert.ok(events.every((event) => event.source === 'simulation' && Date.parse(event.timestamp) >= now.getTime() - 14 * 86400000 && Date.parse(event.timestamp) < now.getTime()));
    const data = aggregateEvents(events, 'simulation', now);
    assert.equal(data.totals.uniqueVisitors, 30);
    assert.equal(data.totals.engagedSessions, 15);
    assert.equal(data.totals.pageviews, 60);
    assert.equal(data.totals.clicks, 30);
    assert.deepEqual(data.sparkline, { current: 16, previous: 14 });
    assert.deepEqual(weeks, { previous: 42, current: 48 });
    assert.equal(calibration.openRate, 60);
    assert.equal(calibration.clickRate, 30);
    assert.notEqual(events[0].batchId, generateSimulation(now).events[0].batchId);
  });
}
