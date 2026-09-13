import React, { useState, useCallback, useEffect, useRef } from 'react';
import { trackSection } from './track.js';
import './index.css';
import LivreBlanc from './LivreBlanc.jsx';
import SignauxContextuels from './SignauxContextuels.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminAccess from './AdminAccess.jsx';
import { CITIES } from './data/cities.js';
// Listes partagées avec l'extraction Ministral : le modèle doit proposer
// exactement les valeurs que ce formulaire accepte, sans jamais diverger.
import { TONES, AUDIENCES, CHANNELS, OBJECTIVES, PRESSURES } from '../../shared/briefOptions.js';
import { createPortal } from 'react-dom';
import { AxisMetrics, SectorIndicator, Sparkline, SourceLinks, articleNameFromUrl, formatViews, getRecentViews } from './TrendEvidence.jsx';

/* ---------- ICONS (SVG inline) ---------- */
const Icon = {
  grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  doc: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </svg>
  ),
  weather: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="10" r="4" />
      <path d="M12 2v2M12 18v2M4 10H2M22 10h-2M5 5l1.5 1.5M17.5 5L19 3.5M5 15l1.5-1.5M17.5 15L19 16.5" />
    </svg>
  ),
  settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  arrow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  ),
  more: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12l5 5 9-11" />
    </svg>
  ),
  warn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86l-8.4 14a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3l-8.4-14a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
  ban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* ---------- SCROLL PROGRESS ---------- */
function useScrollProgress() {
  useEffect(() => {
    const el = document.getElementById('sp');
    if (!el) return;
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      el.style.width = max > 0 ? `${(h.scrollTop / max) * 100}%` : '0%';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

/* ---------- MOBILE HEADER + DRAWER ---------- */
const NAV_ITEMS = [
  { id: 'livre', icon: Icon.book, label: 'Livre Blanc', accent: true },
  { id: 'overview', icon: Icon.grid, label: "Vue d'ensemble" },
  { id: 'analyses', icon: Icon.chart, label: 'Analyses' },
  { id: 'brief', icon: Icon.doc, label: 'Brief' },
  { id: 'weather', icon: Icon.weather, label: 'Contexte' },
  { id: 'admin', icon: Icon.settings, label: 'Administration' },
];

function MobileHeader({ section, setSection }) {
  const [open, setOpen] = useState(false);

  const go = (id) => { setSection(id); setOpen(false); };

  const drawer = open ? createPortal(
    <div className="mob-drawer-overlay" onClick={() => setOpen(false)}>
      <nav className="mob-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mob-drawer-top">
          <div className="logo" style={{ margin: 0 }}>B<span style={{ color: '#fff' }}>·</span>D</div>
          <button type="button" className="mob-close-btn" onClick={() => setOpen(false)} aria-label="Fermer">
            <Icon.close />
          </button>
        </div>
        <ul className="mob-nav-list">
          {NAV_ITEMS.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className={`mob-nav-item ${section === it.id ? 'active' : ''} ${it.accent ? 'accent' : ''}`}
                onClick={() => go(it.id)}
              >
                <span className="mob-nav-icon"><it.icon /></span>
                <span>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <header className="mob-header">
        <div className="logo" style={{ margin: 0 }}>B<span style={{ color: '#fff' }}>·</span>D</div>
        <span className="mob-header-title">
          {NAV_ITEMS.find((n) => n.id === section)?.label ?? 'Baromètre Data'}
        </span>
        <button type="button" className="mob-burger-btn" onClick={() => setOpen(true)} aria-label="Menu">
          <Icon.menu />
        </button>
      </header>
      {drawer}
    </>
  );
}

/* ---------- SIDEBAR ---------- */
function Sidebar({ section, setSection }) {
  const items = [
    { id: 'overview', icon: Icon.grid, label: "Vue d'ensemble" },
    { id: 'analyses', icon: Icon.chart, label: 'Analyses' },
    { id: 'brief', icon: Icon.doc, label: 'Brief' },
    { id: 'weather', icon: Icon.weather, label: 'Contexte' },
    { id: 'livre', icon: Icon.book, label: 'Livre Blanc' },
  ];
  return (
    <aside className="sidebar" aria-label="Navigation">
      <div className="logo">B<span style={{ color: '#fff' }}>·</span>D</div>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`nav-icon ${section === it.id ? 'active' : ''} ${it.id === 'livre' ? 'nav-icon-livre' : ''}`}
          onClick={() => setSection(it.id)}
          aria-label={it.label}
          title={it.label}
        >
          <it.icon />
        </button>
      ))}
      <div className="nav-spacer" />
      <button type="button" className={`nav-icon ${section === 'admin' ? 'active' : ''}`} onClick={() => setSection('admin')} aria-label="Administration" title="Administration"><Icon.settings /></button>
    </aside>
  );
}

/* ---------- TOPBAR ---------- */
function TopBar({ section, setSection }) {
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: Icon.grid },
    { id: 'analyses', label: 'Analyses', icon: Icon.chart },
    { id: 'brief', label: 'Brief', icon: Icon.doc },
    { id: 'weather', label: 'Signaux', icon: Icon.weather },
    { id: 'livre', label: 'Livre Blanc', icon: Icon.book },
  ];
  return (
    <div className="topbar">
      <div className="top-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={section === t.id}
            className={`top-tab ${section === t.id ? 'active' : ''} ${t.id === 'livre' ? 'top-tab-livre' : ''}`}
            onClick={() => setSection(t.id)}
          >
            <t.icon />
            {t.label}
          </button>
        ))}
      </div>
      <div className="team-cluster">
        <button type="button" className="pill-btn dark" onClick={() => setSection('admin')}>Administration <Icon.settings /></button>
        <div className="avatars" aria-hidden="true">
          <div className="av a1">MN</div>
          <div className="av a2">LV</div>
          <div className="av a3">SP</div>
          <div className="av count">+2</div>
        </div>
        <button type="button" className="pill-btn dark">
          Partager <Icon.arrow />
        </button>
      </div>
    </div>
  );
}

/* ---------- CARD WRAPPER ---------- */
function Card({ title, sub, col = 6, dark = false, className = '', children }) {
  return (
    <section
      className={`card in col-${col} ${dark ? 'signal' : ''} ${className}`}
      style={{ opacity: 1, transform: 'none' }}
    >
      {title && (
        <div className="head">
          <div>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- BRIEF FORM ---------- */
/* ---------- Encart de qualification du brief ---------- */

/**
 * Suggestions de l'agent avant analyse. Jamais bloquant : l'encart est
 * fermable, et « Lancer quand même » part sur le pipeline inchangé.
 */
function BriefQualification({ issues, onFocusField, onDismiss, onSubmitAnyway }) {
  if (!issues.length) return null;

  return (
    <div className="brief-qualif" role="status">
      <div className="brief-qualif-head">
        <span className="brief-qualif-title">
          L’agent suggère de préciser {issues.length > 1 ? `${issues.length} points` : 'un point'}
        </span>
        <button type="button" className="brief-qualif-close" onClick={onDismiss} aria-label="Fermer les suggestions">×</button>
      </div>
      <ul className="brief-qualif-list">
        {issues.map((issue) => (
          <li className={`brief-qualif-item brief-qualif-${issue.severity}`} key={`${issue.field}-${issue.question}`}>
            <span className="brief-qualif-field">{issue.label}</span>
            <p className="brief-qualif-question">{issue.question}</p>
            <button type="button" className="brief-qualif-precise" onClick={() => onFocusField(issue.field)}>
              Préciser
            </button>
          </li>
        ))}
      </ul>
      <div className="brief-qualif-actions">
        <button type="button" className="pill-btn dark" onClick={onSubmitAnyway}>
          Lancer quand même
        </button>
        <span className="brief-qualif-note">Ces suggestions n’influencent pas le score : l’analyse reste identique.</span>
      </div>
    </div>
  );
}

function BriefForm({ brief, onChange, onSubmit, loading, error, qualifying, qualIssues = [], onDismissQualification, onSubmitAnyway, autoFocusField, onAutoFocusDone }) {
  const [geoError, setGeoError] = useState(null);
  const [description, setDescription] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  // Champs déduits par l'agent plutôt que dits explicitement : signalés, jamais figés.
  const [lowConfidenceFields, setLowConfidenceFields] = useState([]);
  // Permet au bouton « Préciser » de renvoyer l'utilisateur sur le champ visé.
  const fieldRefs = useRef({});

  const focusField = useCallback((field) => {
    const node = fieldRefs.current[field];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.focus({ preventScroll: true });
  }, []);

  // Arrivée depuis le Plan A/B Test : on amène l'utilisateur sur le champ visé.
  useEffect(() => {
    if (!autoFocusField) return;
    focusField(autoFocusField);
    onAutoFocusDone?.();
  }, [autoFocusField, focusField, onAutoFocusDone]);

  /**
   * Pré-remplit le formulaire depuis la description libre. En cas d'échec, on le
   * dit sans dramatiser : le formulaire détaillé reste utilisable tel quel.
   */
  const generateBrief = async () => {
    if (!description.trim() || parsing) return;
    setParsing(true);
    setParseError(null);
    try {
      const response = await fetch('/api/brief-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse', description }),
      });
      const data = await response.json();
      if (!data?.ok || !data.brief) {
        setParseError(data?.reason || 'Génération indisponible. Renseignez les champs ci-dessous.');
        return;
      }
      // Seuls les champs renvoyés sont écrasés : ville, coordonnées et articles
      // personnalisés déjà choisis par l'utilisateur ne bougent pas.
      for (const [field, value] of Object.entries(data.brief)) onChange(field, value);
      setLowConfidenceFields(
        Object.entries(data.fieldConfidence ?? {})
          .filter(([, level]) => level === 'low')
          .map(([field]) => field),
      );
    } catch {
      setParseError('Génération indisponible. Renseignez les champs ci-dessous.');
    } finally {
      setParsing(false);
    }
  };

  const isSuggested = (field) => lowConfidenceFields.includes(field);
  // Un champ retouché à la main n'est plus une suggestion.
  const handleFieldChange = (field, value) => {
    if (lowConfidenceFields.includes(field)) {
      setLowConfidenceFields((fields) => fields.filter((item) => item !== field));
    }
    onChange(field, value);
  };

  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [automaticArticles, setAutomaticArticles] = useState([]);
  const [automaticLoading, setAutomaticLoading] = useState(false);
  const [articleQuery, setArticleQuery] = useState('');
  const [articleResults, setArticleResults] = useState([]);
  const [articleSearching, setArticleSearching] = useState(false);
  const [articleError, setArticleError] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  // Justification de chaque article proposé : le choix doit rester défendable.
  const [suggestionDetail, setSuggestionDetail] = useState([]);
  const selectedCity = CITIES.find((city) => city.label === brief.city);
  const customArticles = brief.customArticles ?? [];
  const isCustomMode = customArticles.length > 0;
  const selectedArticles = isCustomMode ? customArticles : automaticArticles;

  const loadAutomaticArticles = useCallback(async () => {
    setAutomaticLoading(true);
    setArticleError(null);
    try {
      const params = new URLSearchParams({ product: brief.product ?? '', message: brief.message ?? '' });
      const response = await fetch(`/api/trends?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const articles = [...new Set((data.keywords ?? [])
        .flatMap((trend) => trend.sourceUrls ?? [])
        .map(articleNameFromUrl))];
      setAutomaticArticles(articles);
    } catch {
      setAutomaticArticles([]);
      setArticleError('Les articles automatiques sont indisponibles pour le moment.');
    } finally {
      setAutomaticLoading(false);
    }
  }, [brief.product, brief.message]);

  useEffect(() => {
    if (customizerOpen && !isCustomMode) loadAutomaticArticles();
  }, [customizerOpen, isCustomMode, loadAutomaticArticles]);

  useEffect(() => {
    const query = articleQuery.trim();
    if (query.length < 2) {
      setArticleResults([]);
      setArticleSearching(false);
      return undefined;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      setArticleSearching(true);
      try {
        const response = await fetch(`/api/wiki-search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (active) {
          setArticleResults(data.results ?? []);
          setArticleError(data.error ?? null);
        }
      } catch {
        if (active) setArticleError('Recherche indisponible');
      } finally {
        if (active) setArticleSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [articleQuery]);

  const applyCity = (city) => {
    onChange('city', city.label);
    onChange('lat', city.lat);
    onChange('lon', city.lon);
  };

  const geolocate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas prise en charge par ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange('city', 'Ma position');
        onChange('lat', position.coords.latitude.toFixed(4));
        onChange('lon', position.coords.longitude.toFixed(4));
      },
      () => setGeoError('La géolocalisation a été refusée.'),
    );
  };

  /**
   * Demande à l'agent des articles d'intention cohérents avec le brief.
   * Les titres viennent d'une vraie recherche Wikipédia, pas du modèle seul.
   */
  const suggestArticles = async () => {
    if (suggesting) return;
    setSuggesting(true);
    setArticleError(null);
    try {
      const response = await fetch('/api/brief-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-articles', brief }),
      });
      const data = await response.json();
      if (!data?.ok || !data.articles?.length) {
        setSuggestionDetail([]);
        setArticleError(data?.reason || 'Suggestion indisponible. Ajoutez vos articles à la main.');
        return;
      }
      setSuggestionDetail(data.detail ?? []);
      onChange('customArticles', data.articles.slice(0, 12));
    } catch {
      setSuggestionDetail([]);
      setArticleError('Suggestion indisponible. Ajoutez vos articles à la main.');
    } finally {
      setSuggesting(false);
    }
  };

  const addArticle = (title) => {
    if (selectedArticles.includes(title)) {
      setArticleQuery('');
      setArticleResults([]);
      return;
    }
    if (selectedArticles.length >= 12) {
      setArticleError('La limite de 12 articles est atteinte.');
      return;
    }
    onChange('customArticles', [...selectedArticles, title]);
    setArticleQuery('');
    setArticleResults([]);
    setArticleError(null);
  };

  const removeArticle = (title) => {
    onChange('customArticles', selectedArticles.filter((article) => article !== title));
  };

  return (
    <Card title="Brief de campagne" sub="Définissez le contexte d'activation" col={12}>
      <BriefQualification
        issues={qualIssues}
        onFocusField={focusField}
        onDismiss={onDismissQualification}
        onSubmitAnyway={onSubmitAnyway}
      />
      <div className="brief-express">
        <div className="brief-express-head">
          <span className="brief-express-title">Générer le brief depuis une phrase</span>
          <span className="brief-express-hint">Le plus rapide — les champs restent modifiables ensuite.</span>
        </div>
        <textarea
          className="brief-express-input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Décrivez votre campagne en une phrase… (ex : je veux lancer une campagne email sur nos écharpes en laine pour la rentrée)"
          aria-label="Description libre de la campagne"
        />
        <div className="brief-express-actions">
          <button
            type="button"
            className="pill-btn neon"
            onClick={generateBrief}
            disabled={parsing || !description.trim()}
          >
            {parsing ? 'Analyse de votre description…' : 'Générer le brief'}
          </button>
          {parseError
            ? <span className="brief-express-fallback">{parseError}</span>
            : <span className="brief-express-note">Ou renseignez directement les champs ci-dessous.</span>}
        </div>
      </div>
      <form className="brief-grid" onSubmit={onSubmit}>
        <Field label="Produit / Univers" suggested={isSuggested('product')}>
          <input
            ref={(node) => { fieldRefs.current.product = node; }}
            type="text"
            value={brief.product}
            onChange={(e) => handleFieldChange('product', e.target.value)}
            placeholder="Collection été, bougie parfumée…"
          />
        </Field>
        <Field label="Canal" suggested={isSuggested('channel')}>
          <select ref={(node) => { fieldRefs.current.channel = node; }} value={brief.channel} onChange={(e) => handleFieldChange('channel', e.target.value)}>
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Audience" suggested={isSuggested('audience')}>
          <select ref={(node) => { fieldRefs.current.audience = node; }} value={brief.audience} onChange={(e) => handleFieldChange('audience', e.target.value)}>
            {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
        <Field label="Objectif" suggested={isSuggested('objective')}>
          <select ref={(node) => { fieldRefs.current.objective = node; }} value={brief.objective} onChange={(e) => handleFieldChange('objective', e.target.value)}>
            {OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Ton" suggested={isSuggested('tone')}>
          <select ref={(node) => { fieldRefs.current.tone = node; }} value={brief.tone} onChange={(e) => handleFieldChange('tone', e.target.value)}>
            {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Pression commerciale" suggested={isSuggested('pressure')}>
          <select ref={(node) => { fieldRefs.current.pressure = node; }} value={brief.pressure} onChange={(e) => handleFieldChange('pressure', e.target.value)}>
            {PRESSURES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Taille de l’audience (optionnel)">
          <input ref={(node) => { fieldRefs.current.audienceSize = node; }} type="number" min="1" value={brief.audienceSize} onChange={(e) => onChange('audienceSize', e.target.value)} placeholder="Ex. 25000" />
        </Field>
        <Field label="Ville">
          <div className="brief-location-controls">
            <select
              ref={(node) => { fieldRefs.current.city = node; }}
              value={selectedCity ? selectedCity.label : 'custom'}
              onChange={(e) => {
                const city = CITIES.find((item) => item.label === e.target.value);
                if (city) applyCity(city);
              }}
            >
              {CITIES.map((city) => <option key={city.label} value={city.label}>{city.label}</option>)}
              {!selectedCity && <option value="custom">{brief.city || 'Position personnalisée'}</option>}
            </select>
            <button type="button" className="brief-geo-btn" onClick={geolocate}>Utiliser ma position</button>
          </div>
          {geoError && <span className="brief-geo-error">{geoError}</span>}
        </Field>
        <Field label="Message principal" full suggested={isSuggested('message')}>
          <textarea
            ref={(node) => { fieldRefs.current.message = node; }}
            value={brief.message}
            onChange={(e) => handleFieldChange('message', e.target.value)}
            rows={3}
            placeholder="Votre accroche marketing…"
          />
        </Field>
        <div className="brief-customizer field-full">
          <button
            type="button"
            className="brief-customizer-toggle"
            onClick={() => setCustomizerOpen((open) => !open)}
            aria-expanded={customizerOpen}
          >
            Personnaliser les mots-clés du signal d’intention <span aria-hidden="true">{customizerOpen ? '▴' : '▾'}</span>
          </button>
          {customizerOpen && (
            <div className="brief-customizer-panel">
              <p className="brief-customizer-help">
                {isCustomMode ? 'Les articles ci-dessous remplacent le mapping automatique pour cette analyse.' : 'Articles sélectionnés automatiquement pour le secteur détecté.'}
              </p>
              <div className="brief-article-chips">
                {automaticLoading ? (
                  <span className="brief-customizer-muted">Chargement des articles automatiques…</span>
                ) : selectedArticles.length ? selectedArticles.map((article) => (
                  <span className="brief-article-chip" key={article}>
                    {article.replaceAll('_', ' ')}
                    <button type="button" onClick={() => removeArticle(article)} aria-label={`Retirer ${article}`}>×</button>
                  </span>
                )) : (
                  <span className="brief-customizer-muted">Ajoutez des articles pour créer une sélection personnalisée.</span>
                )}
              </div>
              <div className="brief-suggest">
                <button type="button" className="brief-suggest-btn" onClick={suggestArticles} disabled={suggesting}>
                  {suggesting ? 'L’agent cherche des articles…' : 'Proposer des articles avec l’agent'}
                </button>
                <span className="brief-suggest-note">
                  Titres vérifiés sur Wikipédia — une dimension sans lien défendable est omise.
                </span>
              </div>
              {suggestionDetail.length > 0 && (
                <ul className="brief-suggest-detail">
                  {suggestionDetail.map((entry) => (
                    <li key={entry.article}>
                      <span className="brief-suggest-dim">{entry.dimension}</span>
                      <strong>{entry.article}</strong>
                      <span className="brief-suggest-why">{entry.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="brief-article-count">{selectedArticles.length} article{selectedArticles.length > 1 ? 's' : ''} sélectionné{selectedArticles.length > 1 ? 's' : ''} sur 12</div>
              <div className="brief-wiki-search">
                <input
                  type="search"
                  value={articleQuery}
                  onChange={(event) => setArticleQuery(event.target.value)}
                  placeholder="Rechercher un article Wikipédia"
                  aria-label="Rechercher un article Wikipédia"
                />
                {articleSearching && <span className="brief-search-status">Recherche…</span>}
                {articleResults.length > 0 && (
                  <div className="brief-search-results">
                    {articleResults.map((result) => (
                      <button type="button" key={result.title} onClick={() => addArticle(result.title)} disabled={selectedArticles.includes(result.title)}>
                        <strong>{result.title}</strong>
                        {result.snippet && <span>{result.snippet}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isCustomMode && <button type="button" className="brief-reset-articles" onClick={() => { setSuggestionDetail([]); onChange('customArticles', []); }}>Revenir au mapping automatique</button>}
              {articleError && <p className="brief-customizer-error">{articleError}</p>}
            </div>
          )}
        </div>
        <div className="brief-submit-row">
          <button type="submit" className="pill-btn neon" disabled={loading || qualifying}>
            {qualifying ? 'Vérification du brief…' : loading ? 'Analyse en cours…' : "Lancer l'Agent Contextuel"}
            <Icon.arrow />
          </button>
          {error && <span className="brief-error">{error}</span>}
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children, full, suggested }) {
  return (
    <label className={`field ${full ? 'field-full' : ''} ${suggested ? 'field-suggested' : ''}`}>
      <span className="field-lab">
        {label}
        {suggested && (
          <span className="field-suggested-tag" title="Valeur déduite de votre description par l’agent, pas dite explicitement. Vérifiez-la.">
            à vérifier
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/* ---------- HERO (score global) ---------- */
function HeroScore({ scores, recommendation, context, meta, scoreReview }) {
  const measurable = scores.global !== null && scores.status === 'ok';
  // Signalement de la relecture Ministral. Une relecture qui n'a pas eu lieu
  // (reviewSkipped) ne doit jamais produire d'alerte.
  const needsReview = Boolean(scoreReview && scoreReview.coherent === false && !scoreReview.reviewSkipped);
  const delta = context.seasonalNormal?.delta;

  return (
    <section className="card hero col-12 in" style={{ opacity: 1, transform: 'none' }}>
      <div className="left">
        <div>
          <span className="badge"><span className="ping" />Agent Marketing Contextuel</span>
          {measurable ? (
            <h2 title={`Valeur exacte : ${scores.global}/100. Affichée par paliers de 5, la granularité du modèle ne justifiant pas une précision à l’unité.`}>
              Score global <span className="accent">≈ {scores.displayGlobal}</span>/100
            </h2>
          ) : (
            <h2>Score <span className="accent">non publiable</span></h2>
          )}
          {needsReview && (
            <div className="score-review-flag" role="status">
              <span className="score-review-badge">À vérifier manuellement</span>
              <p className="score-review-reason">
                {scoreReview.reason}
                <span className="score-review-note">
                  {' '}Second avis de l’agent — le score affiché reste celui de la formule, il n’a pas été modifié.
                </span>
              </p>
            </div>
          )}
          <p className="lede">{scores.interpretation}</p>
        </div>
        <div className="meta-row">
          {/* Fiabilité des DONNÉES : indépendante du score obtenu. */}
          <div className="item" title={scores.dataConfidence.summary}>
            Fiabilité des données<b>{scores.dataConfidence.level}</b>
          </div>
          <div className="item">Action<b>{recommendation.action}</b></div>
          <div className="item" title={context.interpretation}>
            Contexte<b>{context.contextType.label} ({context.contextIndex >= 0 ? '+' : ''}{context.contextIndex})</b>
          </div>
          {Number.isFinite(delta) && (
            <div className="item" title={`Normale saisonnière du lieu à cette date : ${context.seasonalNormal.expected} °C.`}>
              Écart à la normale<b>{delta > 0 ? '+' : ''}{delta} °C</b>
            </div>
          )}
          {context.trendsSignal && (
            <div className="item" title="Axe d’intention le plus consulté, classé sur l’indice d’attention (volume + progression).">
              Intention<b>{context.trendsSignal.dominant}</b>
            </div>
          )}
        </div>
        {scores.dataConfidence.degraded.length > 0 && (
          <p className="hero-degraded">
            Signaux dégradés : {scores.dataConfidence.degraded.join(' · ')}
          </p>
        )}
      </div>
      <div className="right hero-video-area">
        <video
          className="hero-video"
          src="/Orche_canva.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Visualisation animée de l’orchestration des signaux contextuels"
        />
        <div className="hero-video-blend" aria-hidden="true" />
        <div className="hero-video-radial" aria-hidden="true" />
        <div className="hero-video-vignette" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ---------- CONTEXT SIGNAL ---------- */
function ContextSignal({ context, onClearCustomArticles }) {
  const trendsStatus = context.trendsStatus || (context.trendsFallback ? 'seasonal_estimate' : context.trendsSignal ? 'live' : 'unavailable');
  const customMode = Boolean(context.customMode);
  const weatherUpdatedAt = context.weather.fetchedAt ? new Date(context.weather.fetchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
  const trendsDataThrough = context.trendsDataThrough
    ? new Date(`${context.trendsDataThrough}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const trendsDescription = trendsStatus === 'seasonal_estimate'
    ? 'Estimation saisonnière'
    : customMode
      ? `${context.customArticleCount ?? context.trendsSignal?.keywords?.length ?? 0} articles choisis manuellement`
    : trendsDataThrough
      ? `Wikimedia, données jusqu’au ${trendsDataThrough}`
      : 'Wikimedia Pageviews';
  const tiles = [
    { lab: 'Météo', vl: `${Math.round(context.weather.temperature)}°C`, dl: `${context.weather.description}${weatherUpdatedAt ? ` · relevé à ${weatherUpdatedAt}` : ''}` },
    {
      lab: 'Écart à la normale',
      vl: Number.isFinite(context.seasonalNormal?.delta)
        ? `${context.seasonalNormal.delta > 0 ? '+' : ''}${context.seasonalNormal.delta}°C`
        : '—',
      dl: Number.isFinite(context.seasonalNormal?.expected)
        ? `${context.seasonalNormal.expected}°C attendus · ${context.season.label}`
        : context.season.label,
    },
    { lab: 'Moment', vl: context.timeOfDay.label, dl: 'Plage active' },
    {
      lab: 'Contexte',
      vl: `${context.contextType.label}`,
      dl: `index ${context.contextIndex >= 0 ? '+' : ''}${context.contextIndex} · ${context.intensity}`,
    },
    ...(context.trendsSignal && trendsStatus !== 'unavailable' ? [{
      lab: customMode ? 'Sélection personnalisée' : 'Tendances',
      vl: context.trendsSignal.dominant.toUpperCase(),
      dl: trendsDescription,
      trends: context.trendsSignal.keywords,
    }] : []),
  ];
  return (
    <section className="card signal col-12 in" style={{ opacity: 1, transform: 'none' }}>
      <div className="top">
        <div>
          <h3>{customMode ? 'Wikimedia Pageviews · Sélection personnalisée' : 'Signal contextuel'}</h3>
          <div className="sub">Captation temps réel</div>
          {!customMode && (
            <SectorIndicator
              sectorLabel={context.sectorLabel}
              sectorConfidence={context.sectorConfidence}
              matchedKeywords={context.matchedKeywords}
              rationale={context.sectorRationale}
              weatherSensitive={context.sectorWeatherSensitive !== false}
            />
          )}
        </div>
        <div className="signal-statuses">
          {(context.weather.isMock || context.weather._fallback) && <span className="pill-mini">Données météo simulées</span>}
          <span className="pill-mini">{trendsStatus === 'live' ? 'Wikipédia Pageviews' : trendsStatus === 'seasonal_estimate' ? 'Estimation saisonnière' : 'Tendances indisponibles'}</span>
          {trendsStatus === 'live' && trendsDataThrough && <span className="pill-mini">Données jusqu’au {trendsDataThrough}</span>}
          {customMode && <button type="button" className="pill-mini" onClick={onClearCustomArticles}>Revenir au mapping automatique</button>}
        </div>
      </div>
      <div className="body">
        {tiles.map((t, i) => (
          <div key={i} className="tile">
            <span className="nm">{t.lab}</span>
            <span className="vl">{t.vl}</span>
            <span className="dl">{t.dl}</span>
            {trendsStatus === 'live' && t.trends && (
              <div className="signal-trends-evidence">
                {t.trends.map((trend) => (
                  <div className="signal-trend-proof" key={trend.keyword}>
                    <div className="signal-trend-proof-head">
                      <span className="signal-trend-name">{trend.keyword}</span>
                    </div>
                    <AxisMetrics trend={trend} />
                    <Sparkline rawSeries={trend.rawSeries} label={trend.keyword} />
                    <SourceLinks sourceUrls={trend.sourceUrls} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- SCORES (subscores bars) ---------- */
function ScoresPanel({ scores }) {
  const items = [
    { key: 'meteo', label: 'Météo / Produit' },
    { key: 'message', label: 'Message / Ton' },
    { key: 'audience', label: 'Audience / Pression' },
    { key: 'timing', label: 'Timing / Canal' },
    { key: 'intention', label: 'Intention collective' },
  ];
  const notMeasurable = new Set(scores.nonDiscriminant ?? []);

  return (
    <Card
      title="Sous-scores"
      sub={notMeasurable.size > 0
        ? `Décomposition — ${notMeasurable.size} dimension(s) non mesurable(s) pour ce brief, exclue(s) du calcul et son poids redistribué`
        : 'Décomposition du score contextuel'}
      col={12}
    >
      <div className="bar-row">
        {items.map((it) => {
          const v = scores.subscores[it.key] ?? 0;
          const weight = Math.round((scores.weights?.[it.key] ?? 0) * 100);
          const muted = notMeasurable.has(it.key);
          const cls = muted ? 'muted' : v >= 70 ? 'summer' : 'winter';
          return (
            <div key={it.key} className={`bar-item ${muted ? 'bar-item-muted' : ''}`}>
              <div className="lab-row">
                <span className="name">
                  {it.label}{' '}
                  <span className="subscore-weight">
                    {muted ? 'poids redistribué' : `(${weight}%)`}
                  </span>
                </span>
                <span className={`delta ${muted ? 'muted' : v >= 70 ? '' : 'down'}`}>
                  {muted ? 'non mesurable' : v}
                </span>
              </div>
              {/* Une dimension non mesurable est grisée, jamais remplie avec une valeur arbitraire. */}
              <div className={`track ${muted ? 'track-muted' : ''}`}>
                {muted
                  ? <div className="seg seg-muted" style={{ width: '100%' }}>signal non discriminant</div>
                  : <div className={`seg ${cls}`} style={{ width: `${v}%` }}>{v}</div>}
              </div>
              {scores.reasons?.[it.key]?.length > 0 && (
                <details className="score-reasons">
                  <summary>Pourquoi ce score ?</summary>
                  <ul>
                    {scores.reasons[it.key].map((reason, index) => (
                      <li key={`${reason.field}-${index}`}>
                        <strong>{reason.field}</strong> : {reason.value} ({reason.impact > 0 ? '+' : ''}{reason.impact} points). {reason.text}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- RECOMMENDATION ---------- */
function RecommendationPanel({ recommendation }) {
  const cls = recommendation.action === 'ACTIVER' ? 'neon' : 'dark';
  return (
    <Card title="Recommandation" sub="Décision de l'agent" col={12}>
      <div className="ministats" style={{ gridTemplateColumns: '1fr', marginBottom: 14 }}>
        <div className={`ministat ${cls} action-${recommendation.action.toLowerCase()}`}>
          <span className="lab">Action recommandée</span>
          <span className="big">{recommendation.action}</span>
          {/* Rôle distinct du badge « Fiabilité des données » du bandeau :
              ici, confiance dans la DÉCISION, plafonnée par celle des données. */}
          <span className="ctx" title={recommendation.confidenceBasis}>
            Confiance de la décision : {recommendation.confidence}
          </span>
        </div>
      </div>
      {recommendation.confidenceNote && (
        <p className="reco-confidence-note">{recommendation.confidenceNote}</p>
      )}
      <p className="reco-justif">{recommendation.justification}</p>
      <p className="reco-text">{recommendation.recommendation}</p>
      <p className="reco-risk"><strong>Risque :</strong> {recommendation.risk}</p>
      {recommendation.kpis && recommendation.kpis.length > 0 && (
        <div className="reco-kpis">
          <h4>KPIs attendus</h4>
          <ul>{recommendation.kpis.map((k, i) => <li key={i}>{k}</li>)}</ul>
        </div>
      )}
      {recommendation.toneSuggestions && recommendation.toneSuggestions.length > 0 && (
        <div className="tone-chips">
          {recommendation.toneSuggestions.map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      )}
    </Card>
  );
}

/* ---------- GAP ---------- */
/* ---------- ANALYSE : diagnostic + contexte (rangée haute 2/3 — 1/3) ---------- */

/** Paliers du gap, du plus sain au plus grave. */
const GAP_LEVELS = {
  none: { word: 'Alignement optimal', tone: 'ok', drift: '0 %' },
  moyen: { word: 'Décalage modéré', tone: 'warn', drift: 'modéré' },
  fort: { word: 'Décalage fort', tone: 'bad', drift: 'fort' },
  critique: { word: 'Décalage critique', tone: 'crit', drift: 'critique' },
};

/** Familles d'action — le néon reste réservé au seul feu vert. */
const ACTION_TONE = {
  ACTIVER: 'go', OPTIMISER: 'tune', ADAPTER: 'tune', REPORTER: 'stop', COMPLÉTER: 'info',
};

function GapDiagnostic({ gap, recommendation }) {
  const level = GAP_LEVELS[gap.gapLevel] ?? GAP_LEVELS.none;
  const action = recommendation?.action ?? null;
  const count = gap.gaps?.length ?? 0;

  // La justification remplace l'accordéon : quelques chips techniques suffisent.
  const chips = [
    { k: 'gaps', v: count === 0 ? 'aucun décalage' : `${count} décalage${count > 1 ? 's' : ''}` },
    // Le détail complet reste accessible en infobulle, faute d'accordéon.
    ...(gap.gaps ?? []).slice(0, 3).map((g, i) => ({ k: `g${i}`, v: g.label, sev: g.severity, tip: g.detail })),
  ];

  return (
    <section className={`card an-card col-8 status-${level.tone}`}>
      <header className="an-head">
        <div className="an-head-titles">
          <h3>Contextual Gap Diagnostic</h3>
          <span className="an-sub">Écarts message ↔ contexte réel</span>
        </div>
        <span className="an-drift mono">Décalage : {level.drift}</span>
      </header>

      <div className="diag-status">
        <span className="diag-dot" aria-hidden="true" />
        <span className="diag-label">Status : {level.word}</span>
        {action && <span className={`diag-action act-${ACTION_TONE[action] ?? 'info'}`}>{action}</span>}
      </div>

      <p className="diag-line">{gap.summary}</p>

      <div className="chips">
        {chips.map((c) => (
          <span key={c.k} className={`chip ${c.sev ? `chip-${c.sev}` : ''}`} title={c.tip}>{c.v}</span>
        ))}
      </div>

      <dl className="diag-facts">
        <div><dt>Risque</dt><dd>{gap.risk}</dd></div>
        <div><dt>Recommandation</dt><dd>{gap.recommendation}</dd></div>
      </dl>
    </section>
  );
}

function ContextPanel({ context, channel }) {
  const w = context.weather ?? {};
  const delta = context.seasonalNormal?.delta;
  const rows = [
    { k: 'Météo', v: `${w.temperature ?? '—'} °C`, ctx: `${w.description ?? 'non disponible'} · ${context.season?.label ?? ''}` },
    {
      k: 'Écart normale',
      v: Number.isFinite(delta) ? `${delta > 0 ? '+' : ''}${delta} °C` : '—',
      ctx: context.seasonalNormal?.expected != null ? `${context.seasonalNormal.expected} °C attendus` : 'non calculé',
    },
    {
      k: 'Intention',
      v: context.trendsSignal?.dominant ?? '—',
      ctx: context.trendsStatus === 'ok' ? 'signal Wikimedia' : 'signal indisponible',
    },
    { k: 'Canal', v: channel ?? '—', ctx: context.contextType?.label ?? '' },
  ];

  return (
    <section className="card an-card col-4">
      <header className="an-head">
        <div className="an-head-titles">
          <h3>Contexte actif</h3>
          <span className="an-sub">Signaux observés</span>
        </div>
        <span className={`an-live mono ${w._live ? 'on' : ''}`}>{w._live ? 'LIVE' : 'FALLBACK'}</span>
      </header>
      <dl className="ctx-list">
        {rows.map((r) => (
          <div key={r.k} className="ctx-row">
            <dt>{r.k}</dt>
            <dd><span className="ctx-val mono">{r.v}</span><span className="ctx-ctx">{r.ctx}</span></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- VARIANTES (preview du message recommandé) ---------- */

const CHANNEL_LABEL = { email: 'Email', sms: 'SMS', push: 'Push', 'paid-social': 'Social Ads', homepage: 'Homepage' };

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label="Copier le message">
      {copied ? 'Copié' : 'Copier'}
    </button>
  );
}

function VariantsPanel({ variants, channel }) {
  const best = variants.variants.find((v) => v.id === variants.bestVariant) ?? variants.variants[0];
  const standard = variants.variants.find((v) => v.id === 'standard');
  const alternatives = variants.variants.filter((v) => v !== best && v !== standard);

  return (
    <section className="card an-card col-6">
      <header className="an-head">
        <div className="an-head-titles">
          <h3>Variantes de message</h3>
          <span className="an-sub">Standard vs contextualisé</span>
        </div>
        {/* La mise en garde devient une puce d'info au survol, plus un bandeau. */}
        <span
          className="an-info mono"
          tabIndex={0}
          title="Aucune projection chiffrée. Chaque variante est une hypothèse : la pertinence doit être validée par un test avec groupe de contrôle."
        >
          ⓘ non projeté
        </span>
      </header>

      <div className="msg-preview">
        <div className="msg-preview-bar">
          <span className="msg-chan mono">{CHANNEL_LABEL[channel] ?? 'Message'}</span>
          <span className="badge-neon">Recommandée</span>
          <CopyButton text={best.message} />
        </div>
        <p className="msg-body">{best.message}</p>
        <div className="msg-meta mono" title={[best.description, best.scoreBasis].filter(Boolean).join(' — ')}>
          <span>Ton : {best.tone}</span>
          <span>·</span>
          <span>{best.label}</span>
          {best.source && <><span>·</span><span>{best.source === 'mistral' ? 'agent' : 'gabarit'}</span></>}
        </div>
      </div>

      <div className="chips">
        <span className="chip">{best.expectedLift}</span>
        <span className="chip">{variants.contextType}</span>
        {Number.isFinite(best.score) && <span className="chip mono">{best.score}/100</span>}
      </div>

      {standard && (
        <div className="msg-compare">
          <span className="msg-compare-lab mono" title={standard.description}>Standard (original)</span>
          <p>{standard.message}</p>
        </div>
      )}

      {alternatives.map((v) => (
        <div className="msg-compare" key={v.id}>
          <span className="msg-compare-lab mono" title={[v.description, v.scoreBasis].filter(Boolean).join(' — ')}>{v.label}</span>
          <p>{v.message}</p>
        </div>
      ))}
    </section>
  );
}

function ActivationPanel({ activation }) {
  return (
    <Card title="Plan d'activation" sub="Déploiement opérationnel" col={12}>
      <div className="ministats">
        <div className="ministat neon">
          <span className="lab">Canal</span>
          <span className="big" style={{ fontSize: 22 }}>{activation.canal.label}</span>
          <span className="ctx">{activation.canal.reason}</span>
        </div>
        <div className="ministat dark">
          <span className="lab">Timing optimal</span>
          <span className="big" style={{ fontSize: 22 }}>{activation.timing.optimalSlot}</span>
          <span className="ctx">{activation.timing.reason}</span>
        </div>
        <div className="ministat mint">
          <span className="lab">Pression</span>
          <span className="big" style={{ fontSize: 22 }}>{activation.pressure.label}</span>
          <span className="ctx">{activation.pressure.adjusted !== activation.pressure.level ? activation.pressure.reason : 'Non ajustée'}</span>
        </div>
        <div className="ministat">
          <span className="lab">Audience</span>
          <span className="big" style={{ fontSize: 22 }}>{activation.estimatedReach}</span>
          <span className="ctx">CTR : {activation.estimatedPerformance.ctr}</span>
        </div>
      </div>

      <h4 className="sub-h">Actions</h4>
      <div className="framework-list">
        {activation.actions.map((a) => (
          <div key={a.step} className="frw-row">
            <div className="num">{a.step}</div>
            <div>
              <div className="nm">{a.action}</div>
              <div className="dsc">{a.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- A/B TEST ---------- */
/* ---------- PLAN D'EXPÉRIMENTATION & MESURE ---------- */

function ABTestPanel({ abTest, onGoToBrief }) {
  const provided = abTest.population.isProvided;

  return (
    <section className="card an-card col-6">
      <header className="an-head">
        <div className="an-head-titles">
          <h3>Plan d’expérimentation & mesure</h3>
          <span className="an-sub">A/B, échantillon, durée</span>
        </div>
        <span className={`an-info mono ${provided ? '' : 'muted'}`}>{provided ? 'dimensionné' : 'à dimensionner'}</span>
      </header>

      <div className="ab-kpis">
        <div className="ab-kpi">
          <span className="ab-kpi-lab">Échantillon</span>
          <span className="ab-kpi-val mono">{abTest.population.testSize}</span>
          <span className="ab-kpi-ctx">{abTest.population.perGroup}</span>
        </div>
        <div className="ab-kpi">
          <span className="ab-kpi-lab">Durée estimée</span>
          <span className="ab-kpi-val mono">{abTest.duration.label}</span>
        </div>
      </div>

      {!provided && (
        <button type="button" className="inline-cta" onClick={onGoToBrief}>
          Renseignez le champ « Taille de l’audience » du Brief <Icon.arrow />
        </button>
      )}

      <div className="ab-hyp">
        <div><span className="mono">H0</span><p>{abTest.hypothesis.h0}</p></div>
        <div><span className="mono">H1</span><p>{abTest.hypothesis.h1}</p></div>
      </div>

      <div className="ab-groups">
        {abTest.groups.map((g) => (
          <div key={g.id} className="ab-group">
            <span className="group-id mono">{g.id}</span>
            <span className="group-label">{g.label}</span>
            <span className="group-alloc mono">{g.allocation}</span>
          </div>
        ))}
      </div>

      <p className="an-foot-note">{abTest.statisticalSignificance}</p>
      {abTest.recommendation && <p className="an-foot-note">{abTest.recommendation}</p>}
    </section>
  );
}

function GuardrailsPanel({ guardrails }) {
  const statusIcon = (s) => s === 'ok' ? <Icon.check /> : s === 'blocked' ? <Icon.ban /> : <Icon.warn />;
  return (
    <Card title="RGPD & Garde-fous" sub={`Niveau : ${guardrails.riskLevel.label}`} col={12}>
      <p>{guardrails.summary}</p>
      <h4 className="sub-h">Conformité RGPD</h4>
      <div className="checks-list">
        {guardrails.rgpd.checks.map((c) => (
          <div key={c.id} className={`check-item check-${c.status}`}>
            <span className="check-icon">{statusIcon(c.status)}</span>
            <div>
              <p className="check-label">{c.label}</p>
              <p className="check-note">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
      <h4 className="sub-h">Éthique</h4>
      <div className="checks-list">
        {guardrails.ethics.checks.map((c) => (
          <div key={c.id} className={`check-item check-${c.status}`}>
            <span className="check-icon">{statusIcon(c.status)}</span>
            <div>
              <p className="check-label">{c.label}</p>
              <p className="check-note">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- LEARNING ---------- */
/* ---------- LEARNING LOOP (matrice de réconciliation A/B) ---------- */

const LEARNING_ROWS = [
  { key: 'sent', label: 'Volume envoyé', kind: 'count', required: true },
  { key: 'opened', label: 'Ouvertures', kind: 'rate', required: true },
  { key: 'clicked', label: 'Clics', kind: 'rate', required: true },
  { key: 'converted', label: 'Conversions', kind: 'rate', required: true },
  { key: 'unsubscribed', label: 'Désabonnements', kind: 'rate', required: false },
];

const EMPTY_COLUMN = { sent: '', opened: '', clicked: '', converted: '', unsubscribed: '' };

/** Taux d'une métrique rapporté au volume envoyé de sa propre colonne. */
function rateOf(column, key) {
  const sent = Number(column.sent);
  const value = Number(column[key]);
  if (!Number.isFinite(sent) || sent <= 0 || column[key] === '' || !Number.isFinite(value)) return null;
  return (value / sent) * 100;
}

/**
 * Δ affiché : écart absolu pour un volume, écart en points de pourcentage pour
 * un taux. Calculé côté client à partir des chiffres saisis — l'agent ne
 * projette toujours aucun gain.
 */
function deltaFor(a, b, row) {
  if (row.kind === 'count') {
    if (a.sent === '' || b.sent === '') return null;
    const diff = Number(b.sent) - Number(a.sent);
    if (!Number.isFinite(diff)) return null;
    return { text: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('fr-FR')}`, sign: Math.sign(diff) };
  }
  const ra = rateOf(a, row.key);
  const rb = rateOf(b, row.key);
  if (ra === null || rb === null) return null;
  const diff = Math.round((rb - ra) * 10) / 10;
  // Un désabonnement qui monte est une mauvaise nouvelle : le signe s'inverse.
  const sign = row.key === 'unsubscribed' ? -Math.sign(diff) : Math.sign(diff);
  return { text: `${diff >= 0 ? '+' : ''}${diff} pt`, sign };
}

function LearningPanel({ learning, onLearningCalculated }) {
  const [columns, setColumns] = useState({ a: { ...EMPTY_COLUMN }, b: { ...EMPTY_COLUMN } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasResults = learning?.status === 'calculated_from_user_input';

  const update = (col, key, value) => setColumns((prev) => ({ ...prev, [col]: { ...prev[col], [key]: value } }));

  const submitResults = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // L'API analyse UN jeu de métriques : on lui envoie la variante testée (B).
      // La colonne A ne sert qu'au calcul des écarts affichés dans la matrice.
      const response = await fetch('/api/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...columns.b, variant: 'contextualisée' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Erreur ${response.status}`);
      onLearningCalculated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card an-card col-12">
      <header className="an-head">
        <div className="an-head-titles">
          <h3>Learning Loop</h3>
          <span className="an-sub">Réconciliation des métriques réelles</span>
        </div>
        <span
          className="an-info mono muted"
          tabIndex={0}
          title="Les enseignements de l’agent sont calculés sur la colonne B (variante testée). La colonne A sert uniquement au calcul des écarts affichés."
        >
          B analysée
        </span>
      </header>

      <form onSubmit={submitResults}>
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Métrique</th>
                <th scope="col">Contrôle (A)</th>
                <th scope="col">Variante contextuelle (B)</th>
                <th scope="col">Δ estimé</th>
              </tr>
            </thead>
            <tbody>
              {LEARNING_ROWS.map((row) => {
                const delta = deltaFor(columns.a, columns.b, row);
                const rateB = row.kind === 'rate' ? rateOf(columns.b, row.key) : null;
                const trend = delta ? (delta.sign > 0 ? 'up' : delta.sign < 0 ? 'down' : '') : '';
                return (
                  <tr key={row.key}>
                    <th scope="row">
                      <span className="matrix-metric">{row.label}</span>
                      {rateB !== null && <span className="matrix-rate mono">{Math.round(rateB * 10) / 10} %</span>}
                    </th>
                    {['a', 'b'].map((col) => (
                      <td key={col}>
                        <input
                          className="matrix-input mono"
                          type="number"
                          min={row.key === 'sent' ? 1 : 0}
                          required={row.required && col === 'b'}
                          value={columns[col][row.key]}
                          onChange={(event) => update(col, row.key, event.target.value)}
                          aria-label={`${row.label}, colonne ${col.toUpperCase()}`}
                        />
                      </td>
                    ))}
                    <td className={`matrix-delta mono ${trend}`}>{delta ? delta.text : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  <div className="matrix-foot">
                    <button type="submit" className="pill-btn dark" disabled={loading}>
                      {loading ? 'Calcul en cours…' : 'Calculer l’impact'}
                    </button>
                    {error && <span className="matrix-error">{error}</span>}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </form>

      {hasResults && <>
        <div className="ministats">
          <div className="ministat"><span className="lab">Envoyés</span><span className="big mono">{learning.metrics.sent.toLocaleString()}</span></div>
          <div className="ministat mint"><span className="lab">Ouverts</span><span className="big mono">{learning.metrics.opened.toLocaleString()}</span><span className="ctx">{learning.metrics.openRate}%</span></div>
          <div className="ministat neon"><span className="lab">Cliqués</span><span className="big mono">{learning.metrics.clicked.toLocaleString()}</span><span className="ctx">CTR {learning.metrics.ctr}%</span></div>
          <div className="ministat dark"><span className="lab">Convertis</span><span className="big mono">{learning.metrics.converted.toLocaleString()}</span><span className="ctx">{learning.metrics.conversionRate}%</span></div>
        </div>
        <div className="learning-verdict">
          <p className="verdict-score mono">Score de performance calculé : {learning.performance.overallScore}/100</p>
          <p>{learning.performance.verdict}</p>
          <p className="learning-method">{learning.performance.methodology}</p>
        </div>
        <div className="learnings-list">
          {learning.learnings.map((item, index) => (
            <div key={index} className={`learning-item learning-${item.type}`}>
              <span className="learning-type">{item.type === 'negative' ? '!' : '='}</span>
              <div><p>{item.insight}</p><p className="learning-action">{item.action}</p></div>
            </div>
          ))}
        </div>
      </>}
    </section>
  );
}

/* ---------- FOOTER TECHNIQUE DE LA VUE ANALYSE ---------- */

function AnalysisFooter({ meta, context, onExport }) {
  const stamp = meta?.analyzedAt ? new Date(meta.analyzedAt).toLocaleString('fr-FR') : '—';
  const weatherLive = Boolean(context?.weather?._live);
  const trendsOk = context?.trendsStatus === 'ok';
  return (
    <footer className="an-footer col-12">
      <span className="mono">modèle v{meta?.version ?? '—'}</span>
      <span className="an-sep">·</span>
      <span className="mono">{stamp}</span>
      <span className="an-sep">·</span>
      <span className={`an-dot ${weatherLive ? 'on' : 'off'}`} aria-hidden="true" />
      <span>Météo {weatherLive ? 'live' : 'repli'}</span>
      <span className="an-sep">·</span>
      <span className={`an-dot ${trendsOk ? 'on' : 'off'}`} aria-hidden="true" />
      <span>Signal {trendsOk ? 'actif' : 'indisponible'}</span>
      <button type="button" className="an-footer-link" onClick={onExport}>Exporter le JSON</button>
    </footer>
  );
}

function CTAReset({ onReset }) {
  return (
    <section className="card cta col-12 in" style={{ opacity: 1, transform: 'none' }}>
      <div>
        <h3>Analyser un nouveau brief</h3>
        <p>Réinitialiser le formulaire pour tester un autre contexte produit / canal / audience.</p>
      </div>
      <button type="button" className="btn" onClick={onReset}>
        Nouveau brief <span className="arrow"><Icon.arrow /></span>
      </button>
    </section>
  );
}

/* ---------- MAIN APP ---------- */
const DEFAULT_BRIEF = {
  product: 'Collection bougie parfumée',
  message: 'Découvrez nos bougies artisanales pour des soirées cocooning',
  tone: 'chaleureux',
  audience: 'clients-actifs',
  channel: 'email',
  objective: 'engagement',
  pressure: 'moyen',
  audienceSize: '',
  city: 'Paris',
  lat: '48.8566',
  lon: '2.3522',
  customArticles: [],
};

function App() {
  useScrollProgress();
  const [section, setSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true' ? 'admin' : 'livre';
  });
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qualifying, setQualifying] = useState(false);
  const [qualIssues, setQualIssues] = useState([]);
  // Champ du Brief à mettre au point après une navigation depuis une autre vue.
  const [autoFocusField, setAutoFocusField] = useState(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('admin')) return;
    url.searchParams.delete('admin');
    url.searchParams.delete('key');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const previousTrackedSection = useRef(null);
  // Track the content actually rendered, including the existing brief fallback.
  const displayedSection = ['livre', 'weather', 'admin'].includes(section) || result ? section : 'brief';
  useEffect(() => {
    if (previousTrackedSection.current === displayedSection) return;
    previousTrackedSection.current = displayedSection;
    trackSection('pageview', displayedSection);
  }, [displayedSection]);

  const navigateToSection = useCallback((nextSection) => {
    trackSection('click', nextSection);
    setSection(nextSection);
  }, []);

  const handleChange = useCallback((field, value) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Qualification facultative avant analyse. Toute issue (panne, timeout,
   * réponse vide) mène au même endroit : l'analyse part. L'étape ne peut que
   * proposer une clarification, jamais retenir l'utilisateur.
   */
  const qualifyThenAnalyze = async (briefToAnalyze) => {
    setQualIssues([]);
    setQualifying(true);
    let issues = [];
    try {
      const res = await fetch('/api/brief-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qualify', brief: briefToAnalyze }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.issues)) issues = data.issues;
      }
    } catch {
      // Qualification indisponible : on enchaîne comme avant son existence.
    } finally {
      setQualifying(false);
    }

    if (issues.length) {
      setQualIssues(issues);
      return;
    }
    await analyzeBrief(briefToAnalyze);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await qualifyThenAnalyze(brief);
  };

  const handleSubmitAnyway = async () => {
    setQualIssues([]);
    await analyzeBrief(brief);
  };

  const analyzeBrief = async (briefToAnalyze) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefToAnalyze),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setResult(data);
      setSection('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCustomArticles = () => {
    const automaticBrief = { ...brief, customArticles: [] };
    setBrief(automaticBrief);
    analyzeBrief(automaticBrief);
  };

  /** Renvoie l'utilisateur sur le champ « Taille de l'audience » du Brief. */
  const goToAudienceSize = () => {
    setAutoFocusField('audienceSize');
    navigateToSection('brief');
  };

  const handleReset = () => {
    setResult(null);
    setQualIssues([]);
    setBrief(DEFAULT_BRIEF);
    navigateToSection('brief');
  };

  const handleAnalyzeContext = (city) => {
    setBrief((previous) => ({ ...previous, city: city.label, lat: city.lat, lon: city.lon }));
    navigateToSection('brief');
  };

  const handleLearningCalculated = (learning) => {
    setResult((previous) => ({ ...previous, learning }));
  };

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barometre-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (section === 'admin') {
    return (
      <div className="app admin-shell">
        <MobileHeader section={section} setSection={navigateToSection} />
        <Sidebar section={section} setSection={navigateToSection} />
        <AdminAccess onCancel={() => navigateToSection('livre')}>
          <AdminDashboard onExit={() => navigateToSection('livre')} />
        </AdminAccess>
      </div>
    );
  }

  return (
    <div className="app">
      <MobileHeader section={section} setSection={navigateToSection} />
      <Sidebar section={section} setSection={navigateToSection} />
      <main className="main-content">
        <TopBar section={section} setSection={navigateToSection} />

        <div className="page-head">
          <div>
            <div className="breadcrumb">
              <span className="crumb">Plateforme</span>
              <span>›</span>
              <span className="crumb current">Agent Contextuel</span>
            </div>
            <h1 className="title">
              Baromètre <em>Data</em>
            </h1>
          </div>
          <div className="head-actions">
            <button type="button" className="pill-btn" onClick={handleExportJson} disabled={!result}>Exporter le JSON</button>
            <button type="button" className="pill-btn neon" onClick={() => navigateToSection('brief')}>
              Nouveau brief <Icon.arrow />
            </button>
          </div>
        </div>

        {section === 'livre' ? (
          <LivreBlanc setSection={navigateToSection} />
        ) : section === 'weather' ? (
          <SignauxContextuels onAnalyzeContext={handleAnalyzeContext} onClearCustomArticles={handleClearCustomArticles} brief={brief} />
        ) : (
        <div className="bento view-fade" key={section + (result ? '-r' : '-e')}>
          {(section === 'brief' || !result) && (
            <BriefForm
              brief={brief}
              onChange={handleChange}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              qualifying={qualifying}
              qualIssues={qualIssues}
              autoFocusField={autoFocusField}
              onAutoFocusDone={() => setAutoFocusField(null)}
              onDismissQualification={() => setQualIssues([])}
              onSubmitAnyway={handleSubmitAnyway}
            />
          )}

          {result && section !== 'brief' && (
            <>
              {/* ── Vue d'ensemble ── */}
              {section === 'overview' && <>
                <HeroScore scores={result.scores} recommendation={result.recommendation} context={result.context} meta={result.meta} scoreReview={result.scoreReview} />
                <ContextSignal context={result.context} onClearCustomArticles={handleClearCustomArticles} />
                <ScoresPanel scores={result.scores} />
                <RecommendationPanel recommendation={result.recommendation} />
              </>}

              {/* ── Analyses ── */}
              {section === 'analyses' && <>
                {/* Bento : 2/3 - 1/3, puis 1/2 - 1/2, puis pleine largeur. */}
                <GapDiagnostic gap={result.gap} recommendation={result.recommendation} />
                <ContextPanel context={result.context} channel={brief.channel} />
                <VariantsPanel variants={result.variants} channel={brief.channel} />
                <ABTestPanel abTest={result.abTest} onGoToBrief={goToAudienceSize} />
                <LearningPanel learning={result.learning} onLearningCalculated={handleLearningCalculated} />
                <AnalysisFooter meta={result.meta} context={result.context} onExport={handleExportJson} />
              </>}

              {section !== 'analyses' && <CTAReset onReset={handleReset} />}
            </>
          )}
        </div>
        )}

        <footer className="foot">
          <span>Baromètre Data · Agent Marketing Contextuel v2.0</span>
          <span className="dot">●</span>
          <span>Prototype M2 Data Marketing & IA</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
