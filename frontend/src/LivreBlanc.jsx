import React, { useState, useEffect, useRef } from 'react';
import { CHAPTERS, READING_TIME_MIN } from './data/livreblanc.js';

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

/* ---- Main component ---- */
export default function LivreBlanc() {
  const [activeId, setActiveId] = useState(CHAPTERS[0].id);
  const [scrollPct, setScrollPct] = useState(0);
  const chapterRefs = useRef({});

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
      {/* ---- NAV ---- */}
      <nav className="lb-nav" aria-label="Chapitres du livre blanc">
        <div className="lb-nav-header">
          <div className="lb-nav-title">Livre Blanc V4</div>
          <div className="lb-nav-meta">~{READING_TIME_MIN} min · Marketing prédictif & agents IA</div>
          <div className="lb-progress-track">
            <div className="lb-progress-fill" style={{ width: `${scrollPct}%` }} />
          </div>
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

      {/* ---- CONTENT ---- */}
      <div className="lb-content">
        {/* mobile select */}
        <div className="lb-mobile-nav">
          <select
            value={activeId}
            onChange={(e) => scrollToChapter(e.target.value)}
            aria-label="Aller au chapitre"
          >
            {CHAPTERS.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.num ? `Partie ${ch.num} — ` : ''}{ch.label}
              </option>
            ))}
          </select>
        </div>

        {CHAPTERS.map((ch) => (
          <Chapter
            key={ch.id}
            chapter={ch}
            chapterRef={(el) => { chapterRefs.current[ch.id] = el; }}
          />
        ))}

        <div className="lb-end">
          <p>Fin du livre blanc</p>
          <p className="lb-end-sub">Baromètre Data — Agent Marketing Contextuel V1 · Prototype M2 Data Marketing & IA</p>
        </div>
      </div>
    </div>
  );
}
