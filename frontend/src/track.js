import { isTrackingTarget, TRACKING_SECTIONS } from '../../shared/tracking.js';

// Memory only. A reload or a new tab creates a new random, unlinked session.
// No cookies, localStorage, sessionStorage, URL parameters or identity signals.
let sessionId;

export function trackEvent(type, page, section) {
  try {
    if (typeof window === 'undefined' || !['pageview', 'click'].includes(type) || !isTrackingTarget(page, section)) return;
    // Let the UI finish its current work; tracking has no effect on rendering.
    window.setTimeout(() => {
      try {
        sessionId ??= window.crypto.randomUUID();
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 3000);
        try {
          const request = window.fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            mode: 'same-origin',
            keepalive: true,
            signal: controller.signal,
            body: JSON.stringify({ type, page, section, sessionId }),
          });
          // No retries (avoids double-counting), no UI messages, no console logs.
          Promise.resolve(request).catch(() => {}).finally(() => window.clearTimeout(timeout));
        } catch {
          window.clearTimeout(timeout);
        }
      } catch {
        // Unavailable crypto, blocked fetch, offline, etc.: the app keeps working.
      }
    }, 0);
  } catch {
    // Also tolerate restricted browser APIs before scheduling the request.
  }
}

export function trackSection(type, appSection) {
  const target = Object.hasOwn(TRACKING_SECTIONS, appSection) ? TRACKING_SECTIONS[appSection] : null;
  if (target) trackEvent(type, target.page, target.section);
}
