import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import './AdminVersions.css';

const number = (value) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const ratio = (value, total) => total ? value / total * 100 : 0;

function exportAnalytics(data, format) {
  const rows = [
    ['type', 'metric', 'value'], ['metadata', 'version', data.version], ['metadata', 'source', data.source],
    ['metadata', 'partial', data.partial],
    ...Object.entries(data.totals).map(([key, value]) => ['global', key, value ?? 'non_mesurable']),
    ...Object.entries(data.definitions).map(([key, value]) => ['definition', key, value]),
    ['sparkline', 'S', data.sparkline.current], ['sparkline', 'S-1', data.sparkline.previous],
    ...data.pages.flatMap((page) => [['pageviews', page.page, page.pageviews], ['clicks', page.page, page.clicks]]),
  ];
  const content = format === 'json' ? JSON.stringify(data, null, 2)
    : '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `barometre-audience-${data.version}${data.partial ? '-partiel' : ''}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Sparkline({ current, previous }) {
  const max = Math.max(current, previous, 1);
  const startY = 44 - previous / max * 30;
  const endY = 44 - current / max * 30;
  const change = previous ? (current - previous) / previous * 100 : null;
  const positive = change !== null && change > 0;
  const label = change === null ? '— vs S-1' : `${positive ? '+' : ''}${number(change)} % vs S-1`;
  return <div className={`admin-sparkline${positive ? ' is-positive' : ''}`}>
    <svg viewBox="0 0 136 56" role="img" aria-label={`Sessions : S-1 ${previous}, S ${current}`}>
      <path d={`M 8 ${startY} C 52 ${startY}, 84 ${endY}, 128 ${endY}`} fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="8" cy={startY} r="3" fill="currentColor" /><circle cx="128" cy={endY} r="3" fill="currentColor" />
    </svg>
    <div><span>S vs S-1</span><strong>{label}</strong><small>{previous === 0 ? 'Base S-1 nulle' : `${number(current)} / ${number(previous)} sessions`}</small></div>
  </div>;
}

export default function AdminDashboard({ onExit, source = 'simulation', onUnauthorized }) {
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let active = true;
    setState({ loading: true, data: null, error: null });
    fetch(`/api/analytics?source=${source}`, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) onUnauthorized?.();
          throw new Error('unauthorized');
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'storage_unavailable');
        if (active) setState({ loading: false, data, error: null });
      }).catch((error) => {
        if (active) setState({ loading: false, data: null, error: error.message });
      }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [source, refresh, onUnauthorized]);
  // A source switch must not show the previous dataset while the effect starts.
  const data = state.data?.source === source ? state.data : null;
  const loading = state.loading || (!data && !state.error);
  const version = data?.version ?? (source === 'simulation' ? 'V0' : 'V1');
  const totals = data?.totals;
  const clickPages = data ? [...data.pages].sort((a, b) => b.clicks - a.clicks) : [];
  const errors = {
    storage_not_configured: 'Le stockage analytics doit être connecté au projet.',
    storage_read_limit: 'Le volume dépasse la capacité de lecture. Les totaux ne sont pas affichés partiellement.',
    unauthorized: 'Reconnecte-toi pour consulter les métriques.',
  };
  return <main className="admin-dashboard admin-version-dashboard">
    <div className="admin-topline"><p className="admin-breadcrumb">Baromètre Data · <strong>Console Analytics</strong></p><div className="admin-top-actions"><button type="button" className="admin-button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Actualiser</button><button type="button" className="admin-button" onClick={onExit}>Retour au livre blanc <span aria-hidden="true">↗</span></button></div></div>
    <header className="admin-header"><div className="admin-version-heading"><h1>Audience & Engagement</h1><span className="admin-version-badge" aria-label={`Version ${version}`}>{version}</span></div><p>Vue globale · Toutes les sections</p></header>
    {loading && <section className="admin-panel admin-data-state" role="status" aria-busy="true">Chargement des métriques…</section>}
    {state.error && <section className="admin-panel admin-data-state" role="alert"><h2>Métriques indisponibles</h2><p>{errors[state.error] || 'Le stockage n’a pas répondu. Réessaie avec Actualiser.'}</p></section>}
    {data && <>
      {data.partial && <p className="admin-data-note" role="status">Résultats partiels · Certains événements sont illisibles.</p>}
      {!totals.sessions && <p className="admin-data-note" role="status">Aucun événement disponible pour cette version.</p>}
      <section className="admin-hero" aria-labelledby="admin-hero-title">
        <div className="admin-hero-orb" aria-hidden="true" />
        <div className="admin-hero-content"><span className="admin-hero-badge">Métriques clés · Global</span><h2 id="admin-hero-title"><strong>{number(totals.uniqueVisitors)}</strong> visiteurs uniques</h2><p>Identifiants de session distincts</p><Sparkline {...data.sparkline} /></div>
        <dl className="admin-hero-metrics"><div><dt>Sessions</dt><dd>{number(totals.sessions)}</dd><dd className="admin-hero-detail">Par onglet et chargement</dd></div><div><dt>Pages vues</dt><dd>{number(totals.pageviews)}</dd></div><div><dt>Vues par session</dt><dd>{totals.sessions ? number(totals.pageviews / totals.sessions) : '—'}</dd></div></dl>
      </section>
      <div className="admin-grid">
        <section className="admin-panel admin-visits"><div className="admin-panel-heading"><h2>Interactions de navigation</h2><span className="admin-period">Toutes les sections</span></div><div className="admin-chart-summary"><strong>{number(totals.clicks)}</strong><span>clics</span></div><ul className="admin-click-distribution">{clickPages.map((page) => <li key={page.page}><div><span>{page.page}</span><strong>{number(page.clicks)}</strong></div><div className="admin-click-track" role="meter" aria-label={`Part des clics : ${page.page}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratio(page.clicks, totals.clicks)}><span style={{ width: `${ratio(page.clicks, totals.clicks)}%` }} /></div></li>)}</ul></section>
        <section className="admin-panel admin-traffic"><div className="admin-panel-heading"><h2>Taux d’engagement</h2><span className="admin-period">Navigation</span></div><div className="admin-traffic-reading"><strong>{totals.engagementRate === null ? '—' : `${number(totals.engagementRate)} %`}</strong></div><p className="admin-caption admin-traffic-label">Sessions avec au moins un clic de navigation</p><div className="admin-traffic-track" role="meter" aria-label="Part des sessions avec clic" aria-valuemin={0} aria-valuemax={100} aria-valuenow={totals.engagementRate ?? 0}><span style={{ width: `${totals.engagementRate ?? 0}%` }} /></div><div className="admin-traffic-scale"><span>Avec clic · {number(totals.engagedSessions)}</span><span>Sans clic · {number(totals.sessions - totals.engagedSessions)}</span></div><div className="admin-comparison"><span>Sessions engagées</span><strong>{number(totals.engagedSessions)} / {number(totals.sessions)}</strong></div></section>
        <section className="admin-panel admin-events"><div className="admin-panel-heading"><h2>Pages les plus consultées</h2><span className="admin-period">{number(totals.pageviews)} vues</span></div><ul>{data.pages.map((page, index) => <li key={page.page} className={index === 0 && page.pageviews ? 'admin-event-leading' : ''}><span className="admin-event-label">{page.page}</span><div className="admin-event-track" role="meter" aria-label={`Part des vues : ${page.page}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratio(page.pageviews, totals.pageviews)}><span style={{ width: `${ratio(page.pageviews, totals.pageviews)}%` }} /></div><strong className="admin-event-count">{number(page.pageviews)} vues</strong><span className="admin-event-share">{number(ratio(page.pageviews, totals.pageviews))} %</span></li>)}</ul></section>
      </div>
      <section className="admin-demo-cta"><div><h2>Export des métriques disponible</h2><p>Audience · Sessions · Pages vues</p></div><div className="admin-top-actions"><button type="button" className="admin-button" onClick={() => exportAnalytics(data, 'csv')}>Exporter CSV ↗</button><button type="button" className="admin-button" onClick={() => exportAnalytics(data, 'json')}>Exporter JSON ↗</button></div></section>
      <footer className="admin-footer">Baromètre Data · Console Analytics</footer>
    </>}
  </main>;
}
