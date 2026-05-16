import { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2 } from 'lucide-react';

export default function BehindTheSongOverlay({ artist, onClose }) {
  const [activeSegment, setActiveSegment] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const segments = artist.behindTheSong.segments;

  // Animation barre progression auto (5 secondes par segment pour démo)
  useEffect(() => {
    setProgress(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          if (activeSegment < segments.length - 1) {
            setActiveSegment((s) => s + 1);
          }
          return 100;
        }
        return p + 1;
      });
    }, 50); // 50ms * 100 = 5s par segment
    return () => clearInterval(intervalRef.current);
  }, [activeSegment, segments.length]);

  function handleTap(e) {
    const half = window.innerWidth / 2;
    if (e.clientX > half) {
      if (activeSegment < segments.length - 1) setActiveSegment((s) => s + 1);
    } else {
      if (activeSegment > 0) setActiveSegment((s) => s - 1);
    }
  }

  const seg = segments[activeSegment];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-overlay)',
        background: 'var(--bts-overlay)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
        animation: 'slideUp 300ms ease forwards',
      }}
      onClick={handleTap}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
      `}</style>

      {/* Barres progression stories */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '12px var(--page-h) 0',
          paddingTop: 'calc(env(safe-area-inset-top, var(--safe-top)) + 12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {segments.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '2px',
              background: 'var(--bts-story-bar)',
              borderRadius: 'var(--r-story)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--bts-story-fill)',
                width:
                  i < activeSegment
                    ? '100%'
                    : i === activeSegment
                    ? `${progress}%`
                    : '0%',
                transition: i === activeSegment ? 'none' : 'none',
                borderRadius: 'var(--r-story)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px var(--page-h)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
        >
          <X size={22} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Behind the Song
        </span>
        <button
          onClick={() => setFocusMode(!focusMode)}
          style={{
            background: focusMode ? 'var(--accent)' : 'var(--bg-pressed)',
            border: 'none',
            borderRadius: 'var(--r-pill)',
            padding: '5px 14px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background var(--t-fast)',
          }}
        >
          Focus
        </button>
      </div>

      {/* Contenu */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 var(--page-h)',
          gap: '24px',
        }}
      >
        {seg.type === 'audio' && <SegmentAudio seg={seg} />}
        {seg.type === 'voicenote' && <SegmentVoiceNote seg={seg} />}
        {seg.type === 'timestamp' && <SegmentTimestamp seg={seg} artist={artist} />}
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--text-tertiary)',
          padding: '16px var(--page-h)',
          paddingBottom: 'calc(var(--miniplayer-h) + var(--navbar-h) + env(safe-area-inset-bottom, 0px) + 16px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Ce contenu n'aurait pas pu être généré par une IA.
      </p>
    </div>
  );
}

function SegmentAudio({ seg }) {
  return (
    <>
      {/* Icône micro + waveform */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--accent-alpha)',
            border: '1px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mic size={32} color="var(--accent)" strokeWidth={1.5} />
        </div>

        {/* Waveform simulée */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: 32 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: `${8 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px`,
                background: 'var(--accent)',
                borderRadius: 2,
                animation: `wave ${0.6 + i * 0.05}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>

      <p
        style={{
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          maxWidth: 320,
        }}
      >
        {seg.content}
      </p>
    </>
  );
}

function SegmentVoiceNote({ seg }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--r-card-lg)',
        padding: '20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Volume2 size={20} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {seg.title}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{seg.duration}</p>
        </div>
      </div>

      {/* Fausse barre audio */}
      <div
        style={{
          height: 4,
          background: 'var(--progress-bg)',
          borderRadius: 'var(--r-progress)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '35%',
            background: 'var(--accent)',
            borderRadius: 'var(--r-progress)',
          }}
        />
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {seg.content}
      </p>
    </div>
  );
}

function SegmentTimestamp({ seg, artist }) {
  return (
    <>
      {/* Pochette */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 'var(--r-card)',
          background: artist.coverGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.2)',
          position: 'relative',
        }}
      >
        {artist.initials}
        {/* Badge timestamp */}
        <span
          style={{
            position: 'absolute',
            bottom: -12,
            background: 'var(--accent)',
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
          }}
        >
          {seg.timestamp}
        </span>
      </div>

      <p
        style={{
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          maxWidth: 300,
          fontStyle: 'italic',
        }}
      >
        {seg.content}
      </p>
    </>
  );
}
