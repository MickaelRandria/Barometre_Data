import React, { useState, useEffect } from 'react';

const CITIES = [
  { label: 'Paris',     lat: '48.8566', lon: '2.3522'  },
  { label: 'Lyon',      lat: '45.7640', lon: '4.8357'  },
  { label: 'Marseille', lat: '43.2965', lon: '5.3698'  },
  { label: 'Bordeaux',  lat: '44.8378', lon: '-0.5792' },
  { label: 'Lille',     lat: '50.6292', lon: '3.0573'  },
  { label: 'Toulouse',  lat: '43.6047', lon: '1.4442'  },
];

function computeSignal(weather, trends) {
  if (!weather || !trends) return null;
  const temp  = weather.temperature ?? 15;
  const desc  = (weather.description || '').toLowerCase();
  const isCold  = temp < 12;
  const isWarm  = temp > 20;
  const isRainy = desc.includes('pluie') || desc.includes('averses') || desc.includes('orage');
  const dominant    = trends.reduce((max, t) => (t.value > max.value ? t : max));
  const cocooningUp = trends.find((t) => t.keyword === 'cocooning')?.trend === 'up';
  const sortieUp    = trends.find((t) => t.keyword === 'sortie')?.trend === 'up';
  const confidence  = (temp < 10 && cocooningUp) || (temp > 20 && sortieUp) ? 'high' : 'medium';
  let contextId, contextLabel, contextDesc;
  if ((isCold || isRainy) && !isWarm) {
    contextId    = 'cocooning';
    contextLabel = 'Cocooning';
    contextDesc  = `Météo ${isCold ? 'fraîche' : 'pluvieuse'}${cocooningUp ? ' + tendance cocooning en hausse' : ''} — messages confort et réassurance recommandés.`;
  } else if (isWarm && !isRainy) {
    contextId    = 'energy';
    contextLabel = 'Énergie / Sortie';
    contextDesc  = `Météo chaude${sortieUp ? ' + tendance sortie en hausse' : ''} — messages dynamiques et orientés activité recommandés.`;
  } else {
    contextId    = 'neutral';
    contextLabel = 'Neutre';
    contextDesc  = 'Aucun signal dominant fort — adaptez le message selon votre objectif prioritaire.';
  }
  return { dominant: dominant.keyword, confidence, contextId, contextLabel, contextDesc };
}

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const GeoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" />
    <line x1="12" y1="3" x2="12" y2="1" /><line x1="12" y1="23" x2="12" y2="21" />
    <line x1="3" y1="12" x2="1" y2="12" /><line x1="23" y1="12" x2="21" y2="12" />
  </svg>
);

export default function SignauxContextuels() {
  const [city, setCity]               = useState(CITIES[0]);
  const [customCity, setCustomCity]   = useState(null);
  const [weather, setWeather]         = useState(null);
  const [trends, setTrends]           = useState(null);
  const [wLoading, setWLoading]       = useState(false);
  const [tLoading, setTLoading]       = useState(false);
  const [geoError, setGeoError]       = useState(null);
  const [tFetchedAt, setTFetchedAt]   = useState(null);

  const activeCity = customCity || city;

  const fetchWeather = async (c) => {
    setWLoading(true);
    try {
      const res  = await fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      console.error('[Signaux] météo error:', err);
      setWeather(null);
    }
    setWLoading(false);
  };

  const fetchTrends = async () => {
    setTLoading(true);
    try {
      const res  = await fetch('/api/trends');
      const data = await res.json();
      setTrends(data.trends);
      setTFetchedAt(data.fetchedAt);
    } catch { setTrends(null); }
    setTLoading(false);
  };

  useEffect(() => { fetchWeather(activeCity); }, [activeCity]);
  useEffect(() => { fetchTrends(); }, []);

  const geolocate = () => {
    setGeoError(null);
    if (!navigator.geolocation) { setGeoError('Non supporté'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCustomCity({
        label: 'Ma position',
        lat: pos.coords.latitude.toFixed(4),
        lon: pos.coords.longitude.toFixed(4),
      }),
      () => setGeoError('Permission refusée'),
    );
  };

  const sortedTrends = trends ? [...trends].sort((a, b) => b.value - a.value) : [];
  const signal = computeSignal(weather, trends);

  const trendArrow = (t) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="sc-page">
      {/* ── Header ── */}
      <div className="sc-header">
        <div className="sc-header-title">
          <h2 className="sc-title">Signaux contextuels</h2>
          <p className="sc-subtitle">Captation temps réel · France</p>
        </div>
        <div className="sc-city-wrap">
          {CITIES.map((c) => (
            <button
              key={c.label}
              type="button"
              className={`sc-city-btn ${activeCity.label === c.label ? 'active' : ''}`}
              onClick={() => { setCustomCity(null); setCity(c); }}
            >
              {c.label}
            </button>
          ))}
          <button type="button" className={`sc-city-btn sc-geo-btn ${customCity ? 'active' : ''}`} onClick={geolocate}>
            <GeoIcon /> {customCity ? 'Moi' : 'Géolocaliser'}
          </button>
          {geoError && <span className="sc-geo-err">{geoError}</span>}
        </div>
      </div>

      {/* ── Grid météo + trends ── */}
      <div className="sc-grid">

        {/* Météo */}
        <div className="sc-weather-card">
          {wLoading ? (
            <div className="sc-skeleton-wrap">
              <div className="sc-skeleton sc-skeleton-temp" />
              <div className="sc-skeleton sc-skeleton-desc" />
            </div>
          ) : weather ? (
            <>
              <div className="sc-weather-top-row">
                <div>
                  <div className="sc-temp">{Math.round(weather.temperature)}°</div>
                  <div className="sc-desc">{weather.description}</div>
                  <div className="sc-city-name">{activeCity.label}</div>
                </div>
                <div className="sc-weather-actions">
                  <span className={`sc-live-badge ${weather._live ? 'live' : 'mock'}`}>
                    {weather._live ? 'Live' : 'Simulé'}
                  </span>
                  <button type="button" className="sc-refresh-dark" onClick={() => fetchWeather(activeCity)} title="Actualiser">
                    <RefreshIcon />
                  </button>
                </div>
              </div>

              <div className="sc-detail-grid">
                <div className="sc-detail">
                  <span className="sc-detail-lab">Ressenti</span>
                  <b className="sc-detail-val">{weather.feelsLike != null ? `${weather.feelsLike}°C` : '—'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Humidité</span>
                  <b className="sc-detail-val">{weather.humidity != null ? `${weather.humidity}%` : '—'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Vent</span>
                  <b className="sc-detail-val">{weather.windSpeed != null ? `${weather.windSpeed} km/h` : '—'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Précipitations</span>
                  <b className="sc-detail-val">{weather.precipitation != null ? `${weather.precipitation} mm` : '—'}</b>
                </div>
              </div>
            </>
          ) : (
            <div className="sc-error-msg">Météo indisponible</div>
          )}
        </div>

        {/* Trends */}
        <div className="sc-trends-card">
          <div className="sc-trends-head">
            <div>
              <div className="sc-card-title">Google Trends</div>
              <div className="sc-card-sub">France · 7 derniers jours</div>
            </div>
            <button type="button" className="sc-refresh-light" onClick={fetchTrends} title="Actualiser">
              <RefreshIcon />
            </button>
          </div>

          {tLoading ? (
            <div className="sc-skeleton-wrap">
              {[1,2,3,4,5].map(i => <div key={i} className="sc-skeleton sc-skeleton-bar" />)}
            </div>
          ) : sortedTrends.length > 0 ? (
            <>
              <div className="sc-trends-list">
                {sortedTrends.map((t) => (
                  <div key={t.keyword} className="sc-trend-row">
                    <span className="sc-trend-kw">{t.keyword}</span>
                    <div className="sc-trend-track">
                      <div className={`sc-trend-fill t-${t.trend}`} style={{ width: `${t.value}%` }} />
                    </div>
                    <span className="sc-trend-num">{t.value}</span>
                    <span className={`sc-trend-arrow t-${t.trend}`}>{trendArrow(t.trend)}</span>
                  </div>
                ))}
              </div>

              <div className="sc-trends-footer">
                <div className="sc-dominant">
                  <span className="sc-dominant-lab">Dominant</span>
                  <span className="sc-dominant-kw">{sortedTrends[0].keyword.toUpperCase()}</span>
                  <span className={`sc-trend-arrow t-${sortedTrends[0].trend}`}>{trendArrow(sortedTrends[0].trend)}</span>
                </div>
                {tFetchedAt && (
                  <span className="sc-cache-info">Cache · actualisé à {fmtTime(tFetchedAt)}</span>
                )}
              </div>
            </>
          ) : (
            <div className="sc-error-msg-light">Tendances indisponibles</div>
          )}
        </div>
      </div>

      {/* ── Signal combiné ── */}
      {signal && (
        <div className={`sc-signal-banner sc-signal-${signal.contextId}`}>
          <div className="sc-signal-left">
            <span className={`sc-confidence-badge ${signal.confidence}`}>
              {signal.confidence === 'high' ? 'Confiance élevée' : 'Confiance moyenne'}
            </span>
            <span className="sc-signal-label">{signal.contextLabel}</span>
          </div>
          <p className="sc-signal-desc">{signal.contextDesc}</p>
        </div>
      )}
    </div>
  );
}
