// Logical pages only: never send location.href, query strings or user input.
export const TRACKING_SECTIONS = Object.freeze({
  livre: { page: '/livre-blanc', section: 'livre-blanc' },
  brief: { page: '/brief-generator', section: 'brief' },
  weather: { page: '/signaux-meteo', section: 'signaux-meteo' },
  overview: { page: '/overview-dashboard', section: 'overview-dashboard' },
  analyses: { page: '/analyses', section: 'analyses' },
});

export function isTrackingTarget(page, section) {
  return Object.values(TRACKING_SECTIONS).some((target) => target.page === page && target.section === section);
}
