import { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Play, Mic } from 'lucide-react';
import { artists } from '../data/mockData.js';

export default function ArtistPage({ artistId, onBack, onOpenPlayer }) {
  const artist = artists.find((a) => a.id === artistId) || artists[0];
  const [bioExpanded, setBioExpanded] = useState(false);

  const bts = artist.behindTheSong;

  return (
    <div style={{ paddingBottom: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px var(--page-h)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-base)',
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
        >
          <ChevronLeft size={28} color="var(--text-primary)" strokeWidth={2} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {artist.name}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
          >
            <MoreHorizontal size={24} color="var(--text-primary)" strokeWidth={2} />
          </button>
          <button
            onClick={onOpenPlayer}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 0,
            }}
          >
            <Play size={16} fill="#fff" color="#fff" strokeWidth={0} style={{ marginLeft: 2 }} />
          </button>
        </div>
      </div>

      {/* Photo artiste */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 280,
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: artist.coverGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.15)',
          }}
        >
          {artist.initials}
        </div>
        {/* Overlay gradient bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          }}
        />
        {/* Texte overlay */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {artist.name}
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            {artist.listeners} auditeurs / mois
          </p>
        </div>
      </div>

      {/* Métriques */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0 var(--page-h)',
          marginBottom: 'var(--section-gap)',
        }}
      >
        {[
          { value: artist.listeners, label: 'auditeurs/mois' },
          { value: artist.albums,    label: 'albums' },
          { value: artist.tracks,    label: 'sons' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <p
              style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}
            >
              {stat.value}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Biographie */}
      <div style={{ padding: '0 var(--page-h)', marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ marginBottom: '8px' }}>Biographie</h2>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: bioExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: bioExpanded ? 'visible' : 'hidden',
          }}
        >
          {artist.bio}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            onClick={() => setBioExpanded(!bioExpanded)}
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--r-pill)',
              padding: '6px 20px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            {bioExpanded ? 'Réduire' : 'Voir plus'}
          </button>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: '1px', background: 'var(--separator)', margin: '0 var(--page-h) var(--section-gap)' }} />

      {/* Behind the Song */}
      <div style={{ padding: '0 var(--page-h)', marginBottom: 'var(--section-gap)' }}>
        <div style={{ marginBottom: '8px' }}>
          <h2 className="section-title" style={{ marginBottom: '2px' }}>Behind the Song</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>L'histoire derrière le son</p>
        </div>

        {/* Card BTS */}
        <div
          style={{
            background: 'var(--bts-card-bg)',
            border: '1px solid var(--bts-card-border)',
            borderRadius: 'var(--r-card-lg)',
            padding: 'var(--card-padding)',
            position: 'relative',
          }}
        >
          {/* Badge Exclusif */}
          <span
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--bts-badge-bg)',
              borderRadius: 'var(--r-badge)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: '#fff',
              padding: '2px 6px',
              textTransform: 'uppercase',
            }}
          >
            Exclusif
          </span>

          {/* Icône + titre */}
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}
          >
            <Mic size={20} color="var(--bts-icon)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                  paddingRight: '52px',
                }}
              >
                {artist.name} raconte {bts.trackTitle}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bts.subtitle}</p>
            </div>
          </div>

          {/* Bouton principal */}
          <button
            onClick={onOpenPlayer}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity var(--t-fast)',
            }}
          >
            Écouter l'histoire
          </button>

          {/* Bouton secondaire */}
          <button
            style={{
              display: 'block',
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              background: 'var(--bg-pressed)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'opacity var(--t-fast)',
            }}
          >
            Écouter après la track
          </button>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: '1px', background: 'var(--separator)', margin: '0 var(--page-h) var(--section-gap)' }} />

      {/* Discographie */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ padding: '0 var(--page-h)', marginBottom: '12px' }}>
          Discographie
        </h2>
        <div style={{ display: 'flex', gap: '12px', padding: '0 var(--page-h)', overflowX: 'auto' }}>
          {artist.albums.map((album) => (
            <div key={album.title} style={{ flexShrink: 0, cursor: 'pointer' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 'var(--r-card)',
                  background: album.gradient,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textAlign: 'center',
                  padding: '4px',
                }}
              >
                {album.title}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {album.title}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{album.year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Playlists */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ padding: '0 var(--page-h)', marginBottom: '12px' }}>
          Playlists
        </h2>
        <div style={{ display: 'flex', gap: '12px', padding: '0 var(--page-h)', overflowX: 'auto' }}>
          {artist.playlists.map((pl) => (
            <div key={pl.title} style={{ flexShrink: 0, cursor: 'pointer' }}>
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 'var(--r-card)',
                  background: pl.gradient,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '8px',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  {pl.title}
                </p>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pl.fans}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Artistes similaires */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h2 className="section-title" style={{ padding: '0 var(--page-h)', marginBottom: '12px' }}>
          Artistes similaires
        </h2>
        <div style={{ display: 'flex', gap: '16px', padding: '0 var(--page-h)', overflowX: 'auto' }}>
          {artist.similarArtists.map((name) => (
            <div
              key={name}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `hsl(${name.charCodeAt(0) * 37}deg 50% 30%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {name[0]}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
