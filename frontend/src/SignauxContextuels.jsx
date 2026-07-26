import React, { useState, useEffect } from 'react';
import { CITIES } from './data/cities.js';
import { AxisMetrics, SectorIndicator, Sparkline, SourceLinks, formatViews, getRecentViews } from './TrendEvidence.jsx';

function computeSignal(weather, trends) {
  if (!weather || !Array.isArray(trends) || trends.length === 0) return null;
  const temp  = weather.temperature ?? 15;
  const desc  = (weather.description || '').toLowerCase();
  const isCold  = temp < 12;
  const isWarm  = temp > 20;
  const isRainy = desc.includes('pluie') || desc.includes('averses') || desc.includes('orage');
  const rank = (t) => (Number.isFinite(t.attentionIndex) ? t.attentionIndex : t.value);
  const dominant    = trends.reduce((max, t) => (rank(t) > rank(max) ? t : max));
  const cocooningUp = trends.find((t) => t.keyword === 'cocooning')?.trend === 'up';
  const sortieUp    = trends.find((t) => t.keyword === 'sortie')?.trend === 'up';
  const confidence  = (temp < 10 && cocooningUp) || (temp > 20 && sortieUp) ? 'high' : 'medium';
  let contextId, contextLabel, contextDesc;
  if ((isCold || isRainy) && !isWarm) {
    contextId    = 'cocooning';
    contextLabel = 'Cocooning';
    contextDesc  = `Météo ${isCold ? 'fraîche' : 'pluvieuse'}${cocooningUp ? ' + tendance cocooning en hausse' : ''} : messages confort et réassurance recommandés.`;
  } else if (isWarm && !isRainy) {
    contextId    = 'energy';
    contextLabel = 'Énergie / Sortie';
    contextDesc  = `Météo chaude${sortieUp ? ' + tendance sortie en hausse' : ''} : messages dynamiques et orientés activité recommandés.`;
  } else {
    contextId    = 'neutral';
    contextLabel = 'Neutre';
    contextDesc  = 'Aucun signal dominant fort : adaptez le message selon votre objectif prioritaire.';
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

export default function SignauxContextuels({ onAnalyzeContext, onClearCustomArticles, brief }) {
  const [city, setCity]               = useState(CITIES[0]);
  const [customCity, setCustomCity]   = useState(null);
  const [weather, setWeather]         = useState(null);
  const [trends, setTrends]           = useState(null);
  const [wLoading, setWLoading]       = useState(false);
  const [tLoading, setTLoading]       = useState(false);
  const [geoError, setGeoError]       = useState(null);
  const [tFetchedAt, setTFetchedAt]     = useState(null);
  const [tDataThrough, setTDataThrough] = useState(null);
  const [trendStatus, setTrendStatus]   = useState('unavailable');
  const [trendSource, setTrendSource]   = useState(null);
  const [trendReason, setTrendReason]   = useState(null);
  const [sectorLabel, setSectorLabel]   = useState(null);
  const [sectorConfidence, setSectorConfidence] = useState('low');
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [sectorRationale, setSectorRationale] = useState(null);
  const [weatherSensitive, setWeatherSensitive] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [customArticleCount, setCustomArticleCount] = useState(0);
  const [replayNotice, setReplayNotice] = useState(null);

  const activeCity = customCity || city;

  const fetchWeather = async (c) => {
    setWLoading(true);
    try {
      const res  = await fetch(`/api/weather/${c.lat}/${c.lon}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      console.error('[Signaux] météo error:', err);
      setWeather(null);
    }
    setWLoading(false);
  };

  const fetchTrends = async ({ fresh = false } = {}) => {
    setTLoading(true);
    if (fresh) setReplayNotice(null);
    try {
      const params = new URLSearchParams();
      if (fresh) params.set('fresh', 'true');
      if (brief?.product) params.set('product', brief.product);
      if (brief?.message) params.set('message', brief.message);
      if (brief?.customArticles?.length) params.set('customArticles', JSON.stringify(brief.customArticles));
      const query = params.toString();
      const res  = await fetch(`/api/trends${query ? `?${query}` : ''}`, { cache: fresh ? 'no-store' : 'default' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTrends(data.keywords ?? data.trends ?? []);
      setTFetchedAt(data.fetchedAt);
      setTDataThrough(data.dataThrough ?? null);
      setTrendStatus(data.status || (data.fallback ? 'seasonal_estimate' : 'live'));
      setTrendSource(data.source ?? null);
      setTrendReason(data.reason ?? null);
      setSectorLabel(data.sectorLabel ?? null);
      setSectorConfidence(data.sectorConfidence ?? 'low');
      setMatchedKeywords(data.matchedKeywords ?? []);
      setSectorRationale(data.sectorRationale ?? null);
      setWeatherSensitive(data.weatherSensitive !== false);
      setCustomMode(Boolean(data.customMode));
      setCustomArticleCount(data.customArticleCount ?? 0);
      if (fresh) {
        const articleCount = (data.keywords ?? []).reduce((count, trend) => count + (trend.sourceUrls?.length ?? 0), 0);
        setReplayNotice(`Requête envoyée à wikimedia.org à l’instant, réponse reçue en ${data.latencyMs ?? 0} ms, ${articleCount} articles interrogés avec succès.`);
        window.setTimeout(() => setReplayNotice(null), 8_000);
      }
    } catch (error) {
      setTrends(null);
      setTrendStatus('unavailable');
      setTrendSource(null);
      setTrendReason(`Signal collectif indisponible : ${error.message}`);
      setSectorLabel(null);
      setSectorConfidence('low');
      setMatchedKeywords([]);
      setSectorRationale(null);
      setWeatherSensitive(true);
      setCustomMode(false);
      setCustomArticleCount(0);
    }
    setTLoading(false);
  };

  useEffect(() => { fetchWeather(activeCity); }, [activeCity]);
  useEffect(() => { fetchTrends(); }, [brief?.product, brief?.message]);

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

  // Classement sur l'indice d'attention, pas sur la progression relative.
  const sortedTrends = trends
    ? [...trends].sort((x, y) => (Number.isFinite(y.attentionIndex) ? y.attentionIndex : y.value) - (Number.isFinite(x.attentionIndex) ? x.attentionIndex : x.value))
    : [];
  const signal = computeSignal(weather, trends);

  const trendArrow = (t) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';

  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const fmtDate = (ts) => {
    if (!ts) return '';
    return new Date(`${ts}T00:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const fmtFullDate = (ts) => {
    if (!ts) return '';
    return new Date(`${ts}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
                  {weather.fetchedAt && <div className="sc-weather-updated">Actualisé à {fmtTime(weather.fetchedAt)}</div>}
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
                  <b className="sc-detail-val">{weather.feelsLike != null ? `${weather.feelsLike}°C` : 'Indisponible'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Humidité</span>
                  <b className="sc-detail-val">{weather.humidity != null ? `${weather.humidity}%` : 'Indisponible'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Vent</span>
                  <b className="sc-detail-val">{weather.windSpeed != null ? `${weather.windSpeed} km/h` : 'Indisponible'}</b>
                </div>
                <div className="sc-detail">
                  <span className="sc-detail-lab">Précipitations</span>
                  <b className="sc-detail-val">{weather.precipitation != null ? `${weather.precipitation} mm` : 'Indisponible'}</b>
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
              <div className="sc-card-title">{customMode ? 'Wikimedia Pageviews · Sélection personnalisée' : 'Wikimedia Pageviews'}</div>
              <div className="sc-card-sub">{customMode ? `${customArticleCount} articles choisis manuellement` : 'Attention collective · indice relatif sur 90 jours'}</div>
              {!customMode && <SectorIndicator sectorLabel={sectorLabel} sectorConfidence={sectorConfidence} matchedKeywords={matchedKeywords} rationale={sectorRationale} weatherSensitive={weatherSensitive} />}
            </div>
            <div className="sc-trends-actions">
              {trendStatus === 'live' && (
                <div className="sc-trends-live-status">
                  <span className="sc-live-badge live">Live</span>
                  {tDataThrough && <span>Données jusqu’au {fmtFullDate(tDataThrough)}</span>}
                </div>
              )}
              <button type="button" className="sc-replay-btn" onClick={() => fetchTrends({ fresh: true })} disabled={tLoading}>
                {tLoading ? 'Requête en cours' : 'Rejouer la requête en direct'}
              </button>
              {customMode && <button type="button" className="sc-replay-btn" onClick={onClearCustomArticles}>Revenir au mapping automatique</button>}
              <button type="button" className="sc-refresh-light" onClick={fetchTrends} title="Actualiser" disabled={tLoading}>
                <RefreshIcon />
              </button>
            </div>
          </div>

          {replayNotice && <p className="sc-replay-notice" role="status">{replayNotice}</p>}

          {tLoading ? (
            <div className="sc-skeleton-wrap">
              {[1,2,3,4,5].map(i => <div key={i} className="sc-skeleton sc-skeleton-bar" />)}
            </div>
          ) : sortedTrends.length > 0 && trendStatus !== 'unavailable' ? (
            <>
              <div className="sc-trends-list">
                {sortedTrends.map((t) => (
                  <div key={t.keyword} className="sc-trend-row">
                    <div className="sc-trend-main">
                      <span className="sc-trend-kw">{t.keyword}</span>
                      {/* La barre suit l'indice d'attention (volume + progression),
                          plus la seule progression relative qui inversait le classement. */}
                      <div className="sc-trend-track">
                        <div
                          className={`sc-trend-fill t-${t.trend}`}
                          style={{ width: `${Number.isFinite(t.attentionIndex) ? t.attentionIndex : t.value}%` }}
                        />
                      </div>
                      {trendStatus === 'live' && <Sparkline rawSeries={t.rawSeries} label={t.keyword} />}
                      <span
                        className="sc-trend-num"
                        title="Indice d’attention : 60 % de volume réel de pages vues, 40 % de progression sur 7 jours."
                      >
                        {Number.isFinite(t.attentionIndex) ? t.attentionIndex : t.value}/100
                      </span>
                      <span className={`sc-trend-arrow t-${t.trend}`}>{trendArrow(t.trend)}</span>
                    </div>
                    {trendStatus === 'live' && (
                      <div className="sc-trend-proof">
                        <AxisMetrics trend={t} />
                        <SourceLinks sourceUrls={t.sourceUrls} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="sc-trends-footer">
                <div className="sc-dominant">
                  <span className="sc-dominant-lab">Dominant</span>
                  <span className="sc-dominant-kw">{sortedTrends[0].keyword.toUpperCase()}</span>
                  <span className={`sc-trend-arrow t-${sortedTrends[0].trend}`}>{trendArrow(sortedTrends[0].trend)}</span>
                </div>
                {trendStatus === 'seasonal_estimate' ? (
                  <span className="sc-cache-info sc-fallback-info">{trendReason || 'Estimation saisonnière utilisée'}</span>
                ) : (
                  <span className="sc-cache-info">
                    {trendSource || 'Wikipédia'}{tDataThrough ? ` · données jusqu’au ${fmtDate(tDataThrough)}` : ''}{tFetchedAt ? ` · actualisé à ${fmtTime(tFetchedAt)}` : ''}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="sc-error-msg-light">{trendReason || 'Tendances indisponibles'}</div>
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

      <div className="sc-brief-action">
        <button type="button" className="pill-btn neon" onClick={() => onAnalyzeContext?.(activeCity)}>
          Analyser ce contexte <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
