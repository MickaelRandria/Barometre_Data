import { useState } from 'react';
import './globals.css';

import NavBar from './components/NavBar.jsx';
import MiniPlayer from './components/MiniPlayer.jsx';

import { currentTrack } from './data/mockData.js';

// Pages — lazy imports remplacés par des placeholders jusqu'à ce qu'elles soient créées
import HomePage from './pages/HomePage.jsx';
import ArtistPage from './pages/ArtistPage.jsx';
import PlayerPage from './pages/PlayerPage.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'artist' | 'player'
  const [selectedArtistId, setSelectedArtistId] = useState(1);

  function navigate(page, payload) {
    if (page === 'artist') setSelectedArtistId(payload);
    setCurrentPage(page);
  }

  function renderPage() {
    if (currentPage === 'player') {
      return <PlayerPage track={currentTrack} onBack={() => setCurrentPage('home')} />;
    }
    if (currentPage === 'artist') {
      return (
        <ArtistPage
          artistId={selectedArtistId}
          onBack={() => setCurrentPage('home')}
          onOpenPlayer={() => setCurrentPage('player')}
        />
      );
    }
    // Home / Explorer / Library / Search — pour l'instant tous affichent HomePage
    return (
      <HomePage
        onOpenArtist={(id) => navigate('artist', id)}
        onOpenPlayer={() => setCurrentPage('player')}
      />
    );
  }

  // Le player plein écran prend tout l'écran
  if (currentPage === 'player') {
    return (
      <div className="app-wrapper">
        <PlayerPage track={currentTrack} onBack={() => setCurrentPage('home')} />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Zone scrollable */}
      <div className="scroll-area">
        {renderPage()}
      </div>

      {/* MiniPlayer sticky au-dessus de la NavBar */}
      <MiniPlayer track={currentTrack} onOpen={() => setCurrentPage('player')} />

      {/* NavBar sticky en bas */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
