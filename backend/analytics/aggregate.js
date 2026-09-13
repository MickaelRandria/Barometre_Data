import { isTrackingTarget, TRACKING_SECTIONS } from '../../shared/tracking.js';

const DAY = 86400000;
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function aggregateEvents(events, source = 'simulation', now = new Date()) {
  const pages = new Map(Object.values(TRACKING_SECTIONS).map(({ page, section }) => [page, { page, section, pageviews: 0, clicks: 0 }]));
  const sessions = new Set();
  const engaged = new Set();
  const selected = [];
  let invalidEvents = 0;
  for (const event of events) {
    // All pre-source records were emitted by the live-only capture endpoint.
    const eventSource = event?.source ?? 'live';
    if (eventSource !== source) continue;
    const timestamp = typeof event?.timestamp === 'string' ? Date.parse(event.timestamp) : NaN;
    if (!event || !['pageview', 'click'].includes(event.type) || !isTrackingTarget(event.page, event.section) || !SESSION_ID.test(event.sessionId) || !Number.isFinite(timestamp) || timestamp > now.getTime()) {
      invalidEvents += 1;
      continue;
    }
    selected.push({ sessionId: event.sessionId, timestamp });
    sessions.add(event.sessionId);
    pages.get(event.page)[event.type === 'pageview' ? 'pageviews' : 'clicks'] += 1;
    if (event.type === 'click') engaged.add(event.sessionId);
  }
  // Anchor to the latest available day for this source, not to another dataset
  // or to the viewer's date. Missing calendar days contribute zero sessions.
  const latest = selected.reduce((max, event) => Math.max(max, event.timestamp), -Infinity);
  const end = Number.isFinite(latest) ? Math.floor(latest / DAY) * DAY + DAY : 0;
  const current = new Set();
  const previous = new Set();
  for (const event of selected) {
    if (event.timestamp >= end - 7 * DAY) current.add(event.sessionId);
    else if (event.timestamp >= end - 14 * DAY) previous.add(event.sessionId);
  }
  const rankedPages = [...pages.values()].sort((a, b) => b.pageviews - a.pageviews);
  return {
    source, version: source === 'simulation' ? 'V0' : 'V1',
    totals: {
      uniqueVisitors: sessions.size, sessions: sessions.size,
      pageviews: rankedPages.reduce((sum, page) => sum + page.pageviews, 0),
      clicks: rankedPages.reduce((sum, page) => sum + page.clicks, 0),
      engagedSessions: engaged.size,
      engagementRate: sessions.size ? engaged.size / sessions.size * 100 : null,
      averageSessionSeconds: null,
    },
    pages: rankedPages, sparkline: { current: current.size, previous: previous.size },
    audienceBreakdown: null, invalidEvents,
    definitions: {
      uniqueVisitors: 'Identifiants de session distincts, renouvelés par onglet et chargement ; pas des personnes uniques.',
      sessions: 'Identifiants de session distincts.',
      engagementRate: 'Part des sessions avec au moins un clic de navigation ; définition propre à ce produit.',
      averageSessionSeconds: 'Non mesurable avec la collecte actuelle.',
      audienceBreakdown: 'Nouveaux et connus non mesurables sans identifiant persistant.',
      sparkline: 'Sessions distinctes par fenêtre de 7 jours UTC, ancrée sur le dernier jour disponible pour cette source.',
    },
  };
}
