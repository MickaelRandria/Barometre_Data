import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const KEYWORDS = ['cocooning', 'sortie', 'activité extérieure', 'bien-être', 'loisirs créatifs'];

function seasonalFallback() {
  const m = new Date().getMonth(); // 0-based
  const isWinter = m === 11 || m <= 1;  // Dec, Jan, Feb
  const isSummer = m >= 4 && m <= 7;   // May, Jun, Jul, Aug

  if (isWinter) return [
    { keyword: 'cocooning',            value: 80, trend: 'up'     },
    { keyword: 'bien-être',            value: 72, trend: 'up'     },
    { keyword: 'sortie',               value: 30, trend: 'down'   },
    { keyword: 'activité extérieure',  value: 25, trend: 'down'   },
    { keyword: 'loisirs créatifs',     value: 65, trend: 'up'     },
  ];

  if (isSummer) return [
    { keyword: 'sortie',               value: 85, trend: 'up'     },
    { keyword: 'activité extérieure',  value: 78, trend: 'up'     },
    { keyword: 'cocooning',            value: 28, trend: 'down'   },
    { keyword: 'bien-être',            value: 60, trend: 'up'     },
    { keyword: 'loisirs créatifs',     value: 55, trend: 'stable' },
  ];

  // Printemps / Automne
  return KEYWORDS.map((keyword) => ({ keyword, value: 50, trend: 'stable' }));
}

export async function getTrends(geo = 'FR') {
  try {
    const googleTrends = require('google-trends-api');
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await Promise.all(
      KEYWORDS.map(async (keyword) => {
        try {
          const raw = await googleTrends.interestOverTime({ keyword, geo, startTime });
          const points = JSON.parse(raw).default?.timelineData ?? [];
          if (!points.length) return { keyword, value: 50, trend: 'stable' };
          const vals = points.map((p) => p.value[0]);
          const current = vals.at(-1);
          const mid = vals[Math.floor(vals.length / 2)];
          const trend = current > mid * 1.1 ? 'up' : current < mid * 0.9 ? 'down' : 'stable';
          return { keyword, value: current, trend };
        } catch {
          return { keyword, value: 50, trend: 'stable' };
        }
      }),
    );
    return results;
  } catch (err) {
    console.error('[trendsEngine] fetch error:', err.message);
    return seasonalFallback();
  }
}
