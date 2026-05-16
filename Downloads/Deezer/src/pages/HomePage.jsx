import { Bell, Plus } from 'lucide-react';
import { homeData, artists } from '../data/mockData.js';

export default function HomePage({ onOpenArtist, onOpenPlayer }) {
  return (
    <div style={{ paddingTop: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--page-h)',
          marginBottom: '24px',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          M
        </div>

        {/* Logo */}
        <span
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          Deezer
        </span>

        {/* Cloche */}
        <div style={{ position: 'relative' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          >
            <Bell size={24} color="var(--text-primary)" strokeWidth={2} />
          </button>
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF5C8A',
              border: '1.5px solid var(--bg-base)',
            }}
          />
        </div>
      </div>

      {/* Grille playlists récentes */}
      <div style={{ padding: '0 var(--page-h)', marginBottom: 'var(--section-gap)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          {homeData.recentPlaylists.map((item) => (
            <PlaylistCard key={item.id} item={item} onOpenPlayer={onOpenPlayer} />
          ))}
        </div>
      </div>

      {/* Section Mixes */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ padding: '0 var(--page-h)', marginBottom: '12px' }}>
          Mixes inspirés par
        </h2>
        {homeData.mixes.map((mix) => (
          <MixRow key={mix.id} mix={mix} onOpenArtist={() => onOpenArtist(mix.id)} />
        ))}
      </div>

      {/* Section Flow Moods */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            padding: '0 var(--page-h)',
            marginBottom: '12px',
          }}
        >
          Flow, la bande-son de tes émotions
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '0 var(--page-h)',
            overflowX: 'auto',
          }}
        >
          {homeData.flowMoods.map((mood) => (
            <FlowMoodCircle key={mood.label} mood={mood} />
          ))}
        </div>
      </div>

      {/* Artistes — accès rapide */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ padding: '0 var(--page-h)', marginBottom: '12px' }}>
          Artistes
        </h2>
        <div style={{ display: 'flex', gap: '12px', padding: '0 var(--page-h)', overflowX: 'auto' }}>
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaylistCard({ item, onOpenPlayer }) {
  if (item.type === 'pin') {
    return (
      <button
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-card)',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <Plus size={18} strokeWidth={2} color="var(--text-secondary)" />
        Épingler
      </button>
    );
  }

  if (item.type === 'flow') {
    return (
      <button
        onClick={onOpenPlayer}
        style={{
          background: item.gradient,
          border: 'none',
          borderRadius: 'var(--r-card)',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Flow</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenPlayer}
      style={{
        background: item.gradient || 'var(--bg-card)',
        border: 'none',
        borderRadius: 'var(--r-card)',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        overflow: 'hidden',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </p>
        {item.subtitle && (
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.subtitle}
          </p>
        )}
      </div>
    </button>
  );
}

function MixRow({ mix, onOpenArtist }) {
  return (
    <button
      onClick={onOpenArtist}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px var(--page-h)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {/* Pochette principale */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--r-card)',
          background: mix.coverGradient,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        {mix.initials}
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {mix.title}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{mix.artist}</p>
      </div>

      {/* Pochette suggérée */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--r-card)',
          background: mix.suggestGradient,
          flexShrink: 0,
        }}
      />
    </button>
  );
}

function FlowMoodCircle({ mood }) {
  return (
    <button
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: mood.gradient,
        }}
      />
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {mood.label}
      </span>
    </button>
  );
}

function ArtistCard({ artist, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: artist.coverGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {artist.initials}
      </div>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {artist.name}
      </span>
    </button>
  );
}
