import React, { useState, useCallback, useEffect } from 'react';
import './index.css';
import LivreBlanc from './LivreBlanc.jsx';

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
};

const TONES = ['chaleureux', 'dynamique', 'urgent', 'inspirationnel', 'rassurant', 'promotionnel', 'sobre'];
const AUDIENCES = [
  { id: 'clients-actifs', label: 'Clients actifs' },
  { id: 'clients-inactifs', label: 'Clients inactifs' },
  { id: 'paniers-abandonnes', label: 'Paniers abandonnés' },
  { id: 'top-clients', label: 'Top clients (VIP)' },
  { id: 'prospects', label: 'Prospects' },
  { id: 'clients-chauds', label: 'Clients chauds' },
];
const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'push', label: 'Push notification' },
  { id: 'paid-social', label: 'Social Ads' },
  { id: 'homepage', label: 'Homepage' },
];
const OBJECTIVES = [
  { id: 'conversion', label: 'Conversion' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'trafic', label: 'Trafic' },
  { id: 'notoriete', label: 'Notoriété' },
];
const PRESSURES = [
  { id: 'faible', label: 'Faible' },
  { id: 'moyen', label: 'Modérée' },
  { id: 'fort', label: 'Forte' },
];

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
          className={`nav-icon ${section === it.id ? 'active' : ''}`}
          onClick={() => setSection(it.id)}
          aria-label={it.label}
          title={it.label}
        >
          <it.icon />
        </button>
      ))}
      <div className="nav-spacer" />
      <button type="button" className="nav-icon" aria-label="Réglages" title="Réglages">
        <Icon.settings />
      </button>
    </aside>
  );
}

/* ---------- TOPBAR ---------- */
function TopBar({ section, setSection }) {
  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: Icon.grid },
    { id: 'analyses', label: 'Analyses', icon: Icon.chart },
    { id: 'brief', label: 'Brief', icon: Icon.doc },
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
            className={`top-tab ${section === t.id ? 'active' : ''}`}
            onClick={() => setSection(t.id)}
          >
            <t.icon />
            {t.label}
          </button>
        ))}
      </div>
      <div className="team-cluster">
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
          <div className="actions">
            <button type="button" className="ico" aria-label="Options">
              <Icon.more />
            </button>
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- BRIEF FORM ---------- */
function BriefForm({ brief, onChange, onSubmit, loading, error }) {
  return (
    <Card title="Brief de campagne" sub="Définissez le contexte d'activation" col={12}>
      <form className="brief-grid" onSubmit={onSubmit}>
        <Field label="Produit / Univers">
          <input
            type="text"
            value={brief.product}
            onChange={(e) => onChange('product', e.target.value)}
            placeholder="Collection été, bougie parfumée…"
          />
        </Field>
        <Field label="Canal">
          <select value={brief.channel} onChange={(e) => onChange('channel', e.target.value)}>
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Audience">
          <select value={brief.audience} onChange={(e) => onChange('audience', e.target.value)}>
            {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
        <Field label="Objectif">
          <select value={brief.objective} onChange={(e) => onChange('objective', e.target.value)}>
            {OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Ton">
          <select value={brief.tone} onChange={(e) => onChange('tone', e.target.value)}>
            {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Pression commerciale">
          <select value={brief.pressure} onChange={(e) => onChange('pressure', e.target.value)}>
            {PRESSURES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Latitude">
          <input type="text" value={brief.lat} onChange={(e) => onChange('lat', e.target.value)} />
        </Field>
        <Field label="Longitude">
          <input type="text" value={brief.lon} onChange={(e) => onChange('lon', e.target.value)} />
        </Field>
        <Field label="Message principal" full>
          <textarea
            value={brief.message}
            onChange={(e) => onChange('message', e.target.value)}
            rows={3}
            placeholder="Votre accroche marketing…"
          />
        </Field>
        <div className="brief-submit-row">
          <button type="submit" className="pill-btn neon" disabled={loading}>
            {loading ? 'Analyse en cours…' : "Lancer l'Agent Contextuel"}
            <Icon.arrow />
          </button>
          {error && <span className="brief-error">{error}</span>}
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-lab">{label}</span>
      {children}
    </label>
  );
}

/* ---------- HERO (score global) ---------- */
function HeroScore({ scores, recommendation, context, meta }) {
  return (
    <section className="card hero col-12 in" style={{ opacity: 1, transform: 'none' }}>
      <div className="left">
        <div>
          <span className="badge"><span className="ping" />Agent Marketing Contextuel</span>
          <h2>
            Score global <span className="accent">{scores.global}</span>/100
          </h2>
          <p className="lede">{scores.interpretation}</p>
        </div>
        <div className="meta-row">
          <div className="item">Confiance<b>{scores.confidence}</b></div>
          <div className="item">Action<b>{recommendation.action}</b></div>
          <div className="item">Contexte<b>{context.contextType.label}</b></div>
          <div className="item">Modules<b>{meta.modules}</b></div>
        </div>
      </div>
      <div className="right">
        <div className="stat-bubble">
          <span className="big">{Math.round(context.weather.temperature)}°</span>
          <span className="lab">{context.weather.description}</span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="moon" />
          <div className="equalizer">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bar" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CONTEXT SIGNAL ---------- */
function ContextSignal({ context }) {
  const tiles = [
    { lab: 'Météo', vl: `${Math.round(context.weather.temperature)}°C`, dl: context.weather.description },
    { lab: 'Saison', vl: context.season.label, dl: context.isSeasonCoherent ? 'Cohérent' : 'À ajuster' },
    { lab: 'Moment', vl: context.timeOfDay.label, dl: 'Plage active' },
    { lab: 'Contexte', vl: context.contextType.label, dl: (context.contextType.toneMatch || []).slice(0, 2).join(' · ') },
  ];
  return (
    <section className="card signal col-6 in" style={{ opacity: 1, transform: 'none' }}>
      <div className="top">
        <div>
          <h3>Signal contextuel</h3>
          <div className="sub">Captation temps réel</div>
        </div>
        {context.weather.isMock || context.weather._mock ? (
          <span className="pill-mini">Données simulées</span>
        ) : (
          <span className="pill-mini">Live</span>
        )}
      </div>
      <div className="body">
        {tiles.map((t, i) => (
          <div key={i} className="tile">
            <span className="nm">{t.lab}</span>
            <span className="vl">{t.vl}</span>
            <span className="dl">{t.dl}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- SCORES (subscores bars) ---------- */
function ScoresPanel({ scores }) {
  const items = [
    { key: 'meteo', label: 'Météo / Produit', weight: 25 },
    { key: 'message', label: 'Message / Ton', weight: 30 },
    { key: 'audience', label: 'Audience / Pression', weight: 25 },
    { key: 'timing', label: 'Timing / Canal', weight: 20 },
  ];
  return (
    <Card title="Sous-scores" sub="Décomposition du score contextuel" col={6}>
      <div className="bar-row">
        {items.map((it) => {
          const v = scores.subscores[it.key] ?? 0;
          const cls = v >= 70 ? 'summer' : 'winter';
          return (
            <div key={it.key} className="bar-item">
              <div className="lab-row">
                <span className="name">{it.label} <span className="subscore-weight">({it.weight}%)</span></span>
                <span className={`delta ${v >= 70 ? '' : 'down'}`}>{v}</span>
              </div>
              <div className="track">
                <div className={`seg ${cls}`} style={{ width: `${v}%` }}>{v}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- RECOMMENDATION ---------- */
function RecommendationPanel({ recommendation }) {
  const cls = recommendation.action.toLowerCase().includes('go') ? 'neon' : 'dark';
  return (
    <Card title="Recommandation" sub="Décision de l'agent" col={6}>
      <div className="ministats" style={{ gridTemplateColumns: '1fr', marginBottom: 14 }}>
        <div className={`ministat ${cls}`}>
          <span className="lab">Action recommandée</span>
          <span className="big">{recommendation.action}</span>
          <span className="ctx">Confiance : {recommendation.confidence}</span>
        </div>
      </div>
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
function GapPanel({ gap }) {
  const level = gap.gapLevel === 'none' ? 'Aucun' : gap.gapLevel.charAt(0).toUpperCase() + gap.gapLevel.slice(1);
  return (
    <Card title="Contextual Gap Detection" sub="Écarts message ↔ contexte" col={6}>
      <div className={`gap-summary gap-level-${gap.gapLevel}`}>
        <p className="gap-level-label">Niveau : {level}</p>
        <p>{gap.summary}</p>
      </div>
      {gap.gaps && gap.gaps.length > 0 && (
        <div className="gap-list">
          {gap.gaps.map((g, i) => (
            <div key={i} className={`gap-item severity-${g.severity}`}>
              <div className="gap-item-header">
                <span className="gap-type">{g.label}</span>
                <span className={`severity-badge ${g.severity}`}>{g.severity}</span>
              </div>
              <p>{g.detail}</p>
            </div>
          ))}
        </div>
      )}
      <div className="gap-footer">
        <p><strong>Risque :</strong> {gap.risk}</p>
        <p><strong>Recommandation :</strong> {gap.recommendation}</p>
      </div>
    </Card>
  );
}

/* ---------- VARIANTS ---------- */
function VariantsPanel({ variants }) {
  return (
    <Card title="Variantes de message" sub="Propositions générées par l'agent" col={12}>
      <p className="variants-reasoning">{variants.reasoning}</p>
      <div className="variants-grid">
        {variants.variants.map((v) => (
          <div key={v.id} className={`variant-card ${v.id === variants.bestVariant ? 'best' : ''}`}>
            {v.id === variants.bestVariant && <span className="best-badge">Recommandée</span>}
            <h4>{v.label}</h4>
            <p className="variant-desc">{v.description}</p>
            <blockquote className="variant-msg">{v.message}</blockquote>
            <div className="variant-meta">
              <span>Ton : {v.tone}</span>
              <span>Score : {v.score}/100</span>
              <span className="variant-lift">{v.expectedLift}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- ACTIVATION ---------- */
function ActivationPanel({ activation }) {
  return (
    <Card title="Plan d'activation" sub="Déploiement opérationnel" col={7}>
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
          <span className="ctx">{activation.pressure.adjusted !== activation.pressure.level ? activation.pressure.reason : '—'}</span>
        </div>
        <div className="ministat">
          <span className="lab">Reach estimé</span>
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
function ABTestPanel({ abTest }) {
  return (
    <Card title="Plan A/B Test" sub="Hypothèse & mesure" col={5}>
      <div className="ab-hypothesis">
        <p><strong>H0 :</strong> {abTest.hypothesis.h0}</p>
        <p><strong>H1 :</strong> {abTest.hypothesis.h1}</p>
      </div>
      <div className="ministats" style={{ marginTop: 14 }}>
        <div className="ministat">
          <span className="lab">Population</span>
          <span className="big" style={{ fontSize: 22 }}>{abTest.population.testSize}</span>
          <span className="ctx">Test</span>
        </div>
        <div className="ministat">
          <span className="lab">Durée</span>
          <span className="big" style={{ fontSize: 22 }}>{abTest.duration.label}</span>
          <span className="ctx">{abTest.statisticalSignificance}</span>
        </div>
      </div>
      <h4 className="sub-h">Groupes</h4>
      <div className="ab-groups">
        {abTest.groups.map((g) => (
          <div key={g.id} className="ab-group">
            <span className="group-id">{g.id}</span>
            <span className="group-label">{g.label}</span>
            <span className="group-alloc">{g.allocation}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- GUARDRAILS ---------- */
function GuardrailsPanel({ guardrails }) {
  const statusIcon = (s) => s === 'ok' ? <Icon.check /> : s === 'blocked' ? <Icon.ban /> : <Icon.warn />;
  return (
    <Card title="RGPD & Garde-fous" sub={`Niveau : ${guardrails.riskLevel.label}`} col={6}>
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
function LearningPanel({ learning }) {
  return (
    <Card title="Learning Loop" sub="Simulation post-campagne" col={6}>
      <div className="ministats">
        <div className="ministat">
          <span className="lab">Envoyés</span>
          <span className="big">{learning.metrics.sent.toLocaleString()}</span>
        </div>
        <div className="ministat mint">
          <span className="lab">Ouverts</span>
          <span className="big">{learning.metrics.opened.toLocaleString()}</span>
          <span className="ctx">{learning.metrics.openRate}%</span>
        </div>
        <div className="ministat neon">
          <span className="lab">Cliqués</span>
          <span className="big">{learning.metrics.clicked.toLocaleString()}</span>
          <span className="ctx">CTR {learning.metrics.ctr}%</span>
        </div>
        <div className="ministat dark">
          <span className="lab">Convertis</span>
          <span className="big">{learning.metrics.converted.toLocaleString()}</span>
          <span className="ctx">{learning.metrics.conversionRate}%</span>
        </div>
      </div>
      <div className="learning-verdict">
        <p className="verdict-score">Score performance : {learning.performance.overallScore}/100</p>
        <p>{learning.performance.verdict}</p>
      </div>
      <h4 className="sub-h">Learnings</h4>
      <div className="learnings-list">
        {learning.learnings.map((l, i) => (
          <div key={i} className={`learning-item learning-${l.type}`}>
            <span className="learning-type">{l.type === 'positive' ? '+' : l.type === 'negative' ? '−' : '='}</span>
            <div>
              <p>{l.insight}</p>
              <p className="learning-action">{l.action}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- CTA ---------- */
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
  product: '',
  message: '',
  tone: 'dynamique',
  audience: 'clients-actifs',
  channel: 'email',
  objective: 'engagement',
  pressure: 'moyen',
  lat: '48.8566',
  lon: '2.3522',
};

function App() {
  useScrollProgress();
  const [section, setSection] = useState('overview');
  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback((field, value) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
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

  const handleReset = () => {
    setResult(null);
    setBrief(DEFAULT_BRIEF);
    setSection('brief');
  };

  return (
    <div className="app">
      <Sidebar section={section} setSection={setSection} />
      <main className="main-content">
        <TopBar section={section} setSection={setSection} />

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
            <button type="button" className="pill-btn">Export PDF</button>
            <button type="button" className="pill-btn neon" onClick={() => setSection('brief')}>
              Nouveau brief <Icon.arrow />
            </button>
          </div>
        </div>

        {section === 'livre' ? (
          <LivreBlanc />
        ) : (
        <div className="bento view-fade" key={section + (result ? '-r' : '-e')}>
          {(section === 'brief' || !result) && (
            <BriefForm
              brief={brief}
              onChange={handleChange}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          )}

          {result && section !== 'brief' && (
            <>
              <HeroScore
                scores={result.scores}
                recommendation={result.recommendation}
                context={result.context}
                meta={result.meta}
              />
              <ContextSignal context={result.context} />
              <ScoresPanel scores={result.scores} />
              <RecommendationPanel recommendation={result.recommendation} />
              <GapPanel gap={result.gap} />
              <VariantsPanel variants={result.variants} />
              <ActivationPanel activation={result.activation} />
              <ABTestPanel abTest={result.abTest} />
              <GuardrailsPanel guardrails={result.guardrails} />
              <LearningPanel learning={result.learning} />
              <CTAReset onReset={handleReset} />
            </>
          )}
        </div>
        )}

        <footer className="foot">
          <span>Baromètre Data — Agent Marketing Contextuel v2.0</span>
          <span className="dot">●</span>
          <span>Prototype M2 Data Marketing & IA</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
