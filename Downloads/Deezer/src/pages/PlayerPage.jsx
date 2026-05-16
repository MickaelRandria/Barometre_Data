import { useState } from 'react';
import {
  ChevronDown,
  MoreHorizontal,
  Share2,
  Plus,
  Heart,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Volume2,
  ListMusic,
  Mic,
} from 'lucide-react';
import { artists } from '../data/mockData.js';
import BehindTheSongOverlay from './BehindTheSongOverlay.jsx';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerPage({ track, onBack }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBTS, setShowBTS] = useState(false);
  const artist = artists.find((a) => a.name === track.artist) || artists[0];

  const progressPct = (track.progress / track.duration) * 100;
  const remaining = track.duration - track.progress;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        background: 'var(--bg-player)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
        padding: '0 var(--page-h)',
        paddingTop: 'env(safe-area-inset-top, var(--safe-top))',
        paddingBottom: 'env(safe-area-inset-bottom, var(--safe-bottom))',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          paddingBottom: '16px',
        }}
      >
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
        >
          <ChevronDown size={28} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p className="supertitle">ALBUM</p>
          <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>
            {track.album}
          </p>
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
        >
          <MoreHorizontal size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
      </div>

      {/* Pochette */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 'var(--r-card)',
            background: track.coverGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          {track.artist[0]}
        </div>

        {/* Bouton BTS sur la pochette */}
        <button
          onClick={() => setShowBTS(true)}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          <Mic size={14} color="var(--accent)" strokeWidth={2} />
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>Paroles</span>
        </button>
      </div>

      {/* Actions row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Share2 size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Plus size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Heart size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
      </div>

      {/* Track info */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          {track.explicit && (
            <span
              style={{
                background: 'var(--text-tertiary)',
                color: 'var(--bg-base)',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '2px',
                padding: '1px 4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              E
            </span>
          )}
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {track.title}
          </p>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text-secondary)' }}>
          {track.artist} · {track.album}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            height: '3px',
            background: 'var(--progress-bg)',
            borderRadius: 'var(--r-progress)',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'var(--progress-fill)',
              borderRadius: 'var(--r-progress)',
              position: 'relative',
            }}
          >
            {/* Thumb */}
            <div
              style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(track.progress)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            -{formatTime(remaining)}
          </span>
        </div>
      </div>

      {/* Contrôles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Repeat size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <SkipBack size={28} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
            transition: 'transform var(--t-spring)',
          }}
        >
          {isPlaying ? (
            <Pause size={26} fill="var(--bg-player)" color="var(--bg-player)" strokeWidth={0} />
          ) : (
            <Play size={26} fill="var(--bg-player)" color="var(--bg-player)" strokeWidth={0} style={{ marginLeft: 2 }} />
          )}
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <SkipForward size={28} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Shuffle size={24} color="var(--text-primary)" strokeWidth={2} />
        </button>
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <Volume2 size={22} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button
          style={{
            background: 'var(--bg-pressed)',
            border: 'none',
            borderRadius: 'var(--r-pill)',
            padding: '8px 20px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Lancer un mix
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
          <ListMusic size={22} color="var(--text-primary)" strokeWidth={2} />
        </button>
      </div>

      {/* BTS Overlay */}
      {showBTS && (
        <BehindTheSongOverlay artist={artist} onClose={() => setShowBTS(false)} />
      )}
    </div>
  );
}
