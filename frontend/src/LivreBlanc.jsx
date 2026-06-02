import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CHAPTERS, READING_TIME_MIN } from './data/livreblanc.js';

/* ---- Audio helpers ---- */
const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <rect x="6" y="4" width="4" height="16" rx="1.5" />
    <rect x="14" y="4" width="4" height="16" rx="1.5" />
  </svg>
);

/* ---- Block renderer ---- */
function renderBlock(block, idx) {
  switch (block.type) {
    case 'p':
      return <p key={idx} className="lb-p">{block.text}</p>;

    case 'quote':
      return (
        <blockquote key={idx} className="lb-quote">
          {block.text}
        </blockquote>
      );

    case 'callout':
      return (
        <div key={idx} className="lb-callout">
          <span className="lb-callout-label">{block.label}</span>
          <p>{block.text}</p>
        </div>
      );

    case 'h3':
      return <h3 key={idx} className="lb-h3">{block.text}</h3>;

    case 'list':
      return (
        <ul key={idx} className="lb-list">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );

    case 'numbered':
      return (
        <ol key={idx} className="lb-numbered">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      );

    case 'steps':
      return (
        <div key={idx} className="lb-steps">
          {block.items.map((step, i) => (
            <div key={i} className="lb-step">
              <div className="lb-step-num">{step.num}</div>
              <div className="lb-step-body">
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div key={idx} className="lb-table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'matrix':
      return (
        <div key={idx} className="lb-table-wrap">
          <table className="lb-table lb-matrix">
            <thead>
              <tr>
                {block.cols.map((c, i) => <th key={i}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

/* ---- Chapter section ---- */
function Chapter({ chapter, chapterRef }) {
  return (
    <section
      id={`lb-ch-${chapter.id}`}
      className="lb-chapter"
      ref={chapterRef}
    >
      <div className={`lb-chapter-hero accent-${chapter.accent}`}>
        {chapter.num && (
          <div className="lb-chapter-num">0{chapter.num}</div>
        )}
        <h2 className="lb-chapter-title">{chapter.title}</h2>
        {chapter.subtitle && (
          <p className="lb-chapter-sub">{chapter.subtitle}</p>
        )}
      </div>
      <div className="lb-chapter-body">
        {chapter.blocks.map((block, idx) => renderBlock(block, idx))}
      </div>
    </section>
  );
}

/* ---- Mobile chapter bottom sheet ---- */
function ChapterSheet({ activeId, onSelect, onClose }) {
  return createPortal(
    <div className="lb-sheet-backdrop" onClick={onClose}>
      <div className="lb-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lb-sheet-handle" />
        <div className="lb-sheet-header">
          <span className="lb-sheet-title">Chapitres</span>
          <span className="lb-sheet-meta">~{READING_TIME_MIN} min de lecture</span>
        </div>
        <ul className="lb-sheet-list">
          {CHAPTERS.map((ch) => (
            <li key={ch.id}>
              <button
                type="button"
                className={`lb-sheet-item ${activeId === ch.id ? 'active' : ''}`}
                onClick={() => onSelect(ch.id)}
              >
                {ch.num ? (
                  <span className="lb-sheet-num">{ch.num}</span>
                ) : (
                  <span className="lb-sheet-dot" />
                )}
                <span className="lb-sheet-label">{ch.label}</span>
                {activeId === ch.id && (
                  <svg className="lb-sheet-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

/* ---- Main component ---- */
export default function LivreBlanc({ setSection }) {
  const [activeId, setActiveId] = useState(CHAPTERS[0].id);
  const [scrollPct, setScrollPct] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const chapterRefs = useRef({});

  /* Audio state */
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };
  const seek = (e, el) => {
    if (!audioRef.current || !duration) return;
    const r = Math.max(0, Math.min(1, (e.clientX - el.getBoundingClientRect().left) / el.offsetWidth));
    audioRef.current.currentTime = r * duration;
  };
  const cycleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };
  const pct = duration ? (currentTime / duration) * 100 : 0;

  /* window scroll → progress bar + active chapter */
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScrollPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* intersection observer for active chapter (viewport root) */
  useEffect(() => {
    const observers = [];
    CHAPTERS.forEach((ch) => {
      const el = chapterRefs.current[ch.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(ch.id);
        },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToChapter = (id) => {
    const el = chapterRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="lb-layout">
      {/* ---- Audio (caché) ---- */}
      <audio
        ref={audioRef}
        src="/podcast-livre-blanc.m4a"
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* ---- Barre de progression mobile (fixed, sous le header) ---- */}
      <div className="lb-mob-progress" aria-hidden="true">
        <div className="lb-mob-progress-fill" style={{ width: `${scrollPct}%` }} />
      </div>

      {/* ---- NAV ---- */}
      <nav className="lb-nav" aria-label="Chapitres du livre blanc">
        <div className="lb-nav-header">
          <div className="lb-nav-title">Livre Blanc V4</div>
          <div className="lb-nav-meta">~{READING_TIME_MIN} min · Marketing prédictif & agents IA</div>
          <div className="lb-progress-track">
            <div className="lb-progress-fill" style={{ width: `${scrollPct}%` }} />
          </div>
          {setSection && (
            <button type="button" className="lb-goto-app" onClick={() => setSection('overview')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Accéder au Baromètre
            </button>
          )}
        </div>
        {/* Mini-player nav (desktop) */}
        <div className="lb-nav-mini-player">
          <button type="button" className="lb-mini-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div
            className="lb-mini-bar"
            onClick={(e) => seek(e, e.currentTarget)}
            title="Cliquer pour avancer"
          >
            <div className="lb-mini-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="lb-mini-time">{fmt(currentTime)}</span>
        </div>

        <ul className="lb-nav-list">
          {CHAPTERS.map((ch) => (
            <li key={ch.id}>
              <button
                type="button"
                className={`lb-nav-item ${activeId === ch.id ? 'active' : ''}`}
                onClick={() => scrollToChapter(ch.id)}
              >
                {ch.num ? (
                  <span className="lb-nav-num">{ch.num}</span>
                ) : (
                  <span className="lb-nav-dot" />
                )}
                <span className="lb-nav-label">{ch.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---- Pill flottant chapitre (mobile uniquement) ---- */}
      {(() => {
        const activeCh = CHAPTERS.find((c) => c.id === activeId) || CHAPTERS[0];
        return (
          <button
            type="button"
            className="lb-chap-pill"
            onClick={() => setSheetOpen(true)}
            aria-label="Changer de chapitre"
          >
            {activeCh.num ? (
              <span className="lb-chap-pill-num">{activeCh.num}</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ opacity: 0.6 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            )}
            <span className="lb-chap-pill-label">{activeCh.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className="lb-chap-pill-chevron">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        );
      })()}

      {sheetOpen && (
        <ChapterSheet
          activeId={activeId}
          onSelect={(id) => { scrollToChapter(id); setSheetOpen(false); }}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {/* ---- CONTENT ---- */}
      <div className="lb-content">
        {/* ---- Carte podcast hero ---- */}
        <div className="lb-podcast-card">
          <div className="lb-podcast-top">
            <div className="lb-podcast-meta">
              <span className="lb-podcast-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                  <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="3" x2="12" y2="1" /><line x1="12" y1="23" x2="12" y2="21" />
                </svg>
                PODCAST
              </span>
              <h2 className="lb-podcast-title">Marketing prédictif & agents IA</h2>
              <p className="lb-podcast-author">Livre Blanc V4 · Mickael Randrianandraina</p>
            </div>
            {duration > 0 && (
              <span className="lb-podcast-dur">{fmt(duration)}</span>
            )}
          </div>

          <div className="lb-podcast-controls">
            <button
              type="button"
              className={`lb-podcast-play ${playing ? 'playing' : ''}`}
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div
              className="lb-podcast-bar"
              onClick={(e) => seek(e, e.currentTarget)}
              role="slider"
              aria-label="Progression"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="lb-podcast-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="lb-podcast-time">{fmt(currentTime)} / {fmt(duration)}</span>
            <button type="button" className={`lb-podcast-speed ${speed !== 1 ? 'active' : ''}`} onClick={cycleSpeed}>
              {speed}×
            </button>
          </div>

          <p className="lb-podcast-tagline">
            "Écouter plutôt que lire — même contenu, disponible en podcast"
          </p>
        </div>

        {/* Séparateur */}
        <div className="lb-podcast-sep">— ou parcourir les chapitres —</div>

        {CHAPTERS.map((ch) => (
          <Chapter
            key={ch.id}
            chapter={ch}
            chapterRef={(el) => { chapterRefs.current[ch.id] = el; }}
          />
        ))}

        <div className="lb-end">
          <div className="lb-end-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p>Livre Blanc V4 — Marketing prédictif & agents IA</p>
          <p className="lb-end-sub">Mickael Randrianandraina · Prototype M2 Data Marketing & IA · Baromètre Data</p>
          <div className="lb-end-actions">
            <a
              href="/livre-blanc-v4.pdf"
              download="Livre Blanc V4 - Marketing Predictif Agents IA.pdf"
              className="lb-download-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Télécharger le PDF complet
            </a>
            {setSection && (
              <button type="button" className="lb-try-app-btn" onClick={() => setSection('brief')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <path d="M7 17L17 7" /><path d="M9 7h8v8" />
                </svg>
                Tester le Baromètre Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
