import { Mic, Heart, SkipForward } from 'lucide-react';

export default function MiniPlayer({ track, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        position: 'sticky',
        bottom: 'var(--navbar-h)',
        zIndex: 'var(--z-miniplayer)',
        height: 'var(--miniplayer-h)',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--page-h)',
        gap: '12px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Pochette */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          background: track.coverGradient,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      />

      {/* Titre + artiste */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {track.title}
        </p>
        <p
          style={{
            fontSize: '12px',
            fontWeight: 400,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {track.artist}
        </p>
      </div>

      {/* Actions */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}
      >
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          aria-label="Behind the Song"
        >
          <Mic size={20} color="var(--accent)" strokeWidth={2} />
        </button>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          aria-label="Aimer"
        >
          <Heart size={20} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          aria-label="Suivant"
        >
          <SkipForward size={20} color="var(--text-primary)" strokeWidth={2} />
        </button>
      </div>

      {/* Barre de progression */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--progress-bg)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(track.progress / track.duration) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 'var(--r-progress)',
          }}
        />
      </div>
    </div>
  );
}
