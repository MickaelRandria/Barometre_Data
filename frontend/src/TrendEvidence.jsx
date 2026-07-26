import React, { useMemo, useState } from 'react';

export function formatViews(views) {
  return Number(views || 0).toLocaleString('fr-FR');
}

export function getRecentViews(trend) {
  if (Number.isFinite(trend?.recentViews)) return trend.recentViews;
  return (trend?.rawSeries ?? []).slice(-7).reduce((sum, point) => sum + (Number(point.views) || 0), 0);
}

export function SectorIndicator({ sectorLabel, sectorConfidence, matchedKeywords = [], rationale, weatherSensitive = true }) {
  if (!sectorLabel || sectorConfidence === 'low') {
    return (
      <p className="trend-sector-indicator">
        Secteur non identifié avec assez de certitude — proxys généralistes utilisés
        {rationale && <span className="trend-sector-rationale">{rationale}</span>}
      </p>
    );
  }

  return (
    <p className="trend-sector-indicator">
      Secteur détecté : <strong>{sectorLabel}</strong>
      <span className="trend-sector-conf">{sectorConfidence === 'high' ? 'confiance élevée' : 'confiance moyenne'}</span>
      {matchedKeywords.length > 0 && <> (à partir de : {matchedKeywords.map((keyword) => `« ${keyword} »`).join(', ')})</>}
      {!weatherSensitive && (
        <span className="trend-sector-flag">
          Secteur déclaré non météo-sensible : ce signal est affiché pour information et n’est pas pondéré dans le score.
        </span>
      )}
      {rationale && <span className="trend-sector-rationale">Pourquoi ces articles : {rationale}</span>}
    </p>
  );
}

/**
 * Un axe présente deux chiffres qu'il ne faut jamais confondre :
 * l'indice d'attention (volume + dynamique, sert au classement) et la
 * progression relative (7 j contre sa propre moyenne 90 j).
 */
export function AxisMetrics({ trend }) {
  const attention = Number.isFinite(trend?.attentionIndex) ? trend.attentionIndex : null;
  const momentumPct = Number.isFinite(trend?.momentum) ? Math.round((trend.momentum - 1) * 100) : null;

  return (
    <div className="axis-metrics">
      {attention !== null && (
        <span
          className="axis-metric axis-metric-main"
          title="Indice d’attention : 60 % de volume réel de pages vues, 40 % de progression. C’est cet indice qui classe les axes."
        >
          Attention <strong>{attention}</strong>/100
        </span>
      )}
      <span
        className="axis-metric"
        title="Progression relative : évolution des 7 derniers jours face à la moyenne 90 jours de ces mêmes articles. Un article stable ressort autour de 40 — ce n’est PAS un volume d’attention absolu."
      >
        Progression <strong>{momentumPct === null ? '—' : `${momentumPct > 0 ? '+' : ''}${momentumPct} %`}</strong>
      </span>
      <span className="axis-metric axis-metric-views">
        {formatViews(getRecentViews(trend))} vues cumulées sur 7 j
        {Number.isFinite(trend?.viewsShare) && <> · {trend.viewsShare} % du total</>}
      </span>
    </div>
  );
}

export function articleNameFromUrl(url) {
  try {
    const segments = new URL(url).pathname.split('/');
    const article = segments[segments.indexOf('user') + 1];
    return decodeURIComponent(article).replaceAll('_', ' ');
  } catch {
    return 'Article Wikipédia';
  }
}

export function SourceLinks({ sourceUrls = [] }) {
  const urls = [...new Set(sourceUrls)].filter(Boolean);
  if (!urls.length) return null;

  return (
    <details className="trend-source-links">
      <summary>Voir la source ({urls.length})</summary>
      <div className="trend-source-menu">
        {urls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            {articleNameFromUrl(url)} <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </details>
  );
}

export function Sparkline({ rawSeries = [], label }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const points = useMemo(() => {
    if (rawSeries.length < 2) return [];
    const values = rawSeries.map((point) => Number(point.views) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    return values.map((value, index) => ({
      x: (index / (values.length - 1)) * 116 + 2,
      y: 30 - ((value - min) / spread) * 26,
    }));
  }, [rawSeries]);

  if (points.length < 2) return null;

  const hovered = hoveredIndex == null ? null : rawSeries[hoveredIndex];
  const hoveredPoint = hoveredIndex == null ? null : points[hoveredIndex];
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoveredIndex(Math.round(ratio * (rawSeries.length - 1)));
  };

  return (
    <span
      className="trend-sparkline"
      onPointerMove={handleMove}
      onPointerLeave={() => setHoveredIndex(null)}
      aria-label={`Série brute de vues pour ${label}`}
    >
      <svg viewBox="0 0 120 34" role="img" aria-hidden="true" preserveAspectRatio="none">
        <path className="trend-sparkline-path" d={path} />
        {hoveredPoint && <circle className="trend-sparkline-point" cx={hoveredPoint.x} cy={hoveredPoint.y} r="2.5" />}
      </svg>
      {hovered && (
        <span className="trend-sparkline-tooltip">
          {new Date(`${hovered.date}T00:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} · {formatViews(hovered.views)} vues
        </span>
      )}
    </span>
  );
}
