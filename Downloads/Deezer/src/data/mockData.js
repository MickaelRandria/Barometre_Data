// ============================================================
// DEEZER — Mock Data
// ============================================================

export const currentTrack = {
  id: 1,
  title: 'La Lettre',
  artist: 'Booba',
  album: 'Mauvais Œil',
  year: 2000,
  duration: 214, // secondes
  progress: 45,  // secondes
  explicit: true,
  coverGradient: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0a0a0a 100%)',
};

export const artists = [
  {
    id: 1,
    name: 'Booba',
    listeners: '4,2M',
    albums: 12,
    tracks: 87,
    bio: 'Booba, de son vrai nom Élie Yaffa, est un rappeur franco-sénégalais né à Boulogne-Billancourt. Figure incontournable du rap français, il est connu pour son style agressif, ses métaphores acérées et sa longévité dans une scène en perpétuelle évolution. Fondateur du label 92i, il a marqué plusieurs générations avec des albums comme Lunatic, Panthéon, ou encore CBGB.',
    coverGradient: 'linear-gradient(180deg, #2d1b69 0%, #11998e 100%)',
    initials: 'B',
    similarArtists: ['Kaaris', 'SCH', 'Freeze Corleone', 'Damso', 'Jul'],
    playlists: [
      { title: 'Rap FR 2000s', fans: '1,2M fans', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
      { title: 'Trap FR', fans: '890K fans', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
      { title: '92i Essentiels', fans: '450K fans', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    ],
    albums: [
      { title: 'Mauvais Œil', year: 2000, gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
      { title: 'Panthéon', year: 2010, gradient: 'linear-gradient(135deg, #2c3e50, #3498db)' },
      { title: 'ULTRA', year: 2018, gradient: 'linear-gradient(135deg, #0f0c29, #302b63)' },
      { title: 'CBGB', year: 2021, gradient: 'linear-gradient(135deg, #1a0a2e, #6a11cb)' },
    ],
    behindTheSong: {
      trackTitle: 'La Lettre',
      subtitle: 'Écrit en prison en 1998 · 2 min 34',
      story: 'Booba a écrit ce morceau en prison en 1998. C\'est une correspondance avec Ali pendant son incarcération alors que Lunatic commençait à percer. Capsule audio : "J\'avais rien d\'autre que du temps et un carnet. Ali était dehors, le groupe commençait à buzzer, et moi j\'étais là à écrire des lettres que je savais qu\'il lirait sur scène."',
      segments: [
        {
          type: 'audio',
          title: 'Booba raconte La Lettre',
          content: 'J\'avais rien d\'autre que du temps et un carnet. Ali était dehors, le groupe commençait à buzzer, et moi j\'étais là à écrire des lettres que je savais qu\'il lirait sur scène. Cette punchline, je l\'ai écrite la nuit avant mon jugement.',
          duration: '2 min 34',
        },
        {
          type: 'voicenote',
          title: 'Voice note originale',
          content: 'Enregistrement sur répondeur depuis la prison. La qualité est volontairement laissée brute.',
          duration: '0:47',
        },
        {
          type: 'timestamp',
          title: 'À 0:45 dans le morceau',
          content: '"Cette punchline, je l\'ai écrite la nuit avant mon jugement." — Booba, 2023',
          timestamp: '0:45',
        },
      ],
    },
  },
  {
    id: 2,
    name: 'Senzo',
    listeners: '94k',
    albums: 1,
    tracks: 6,
    bio: 'Senzo est un artiste émergent originaire d\'Aubervilliers. Son EP "Genèse" capturé dans une chambre de 9m², montre une sensibilité brute et une écriture personnelle.',
    coverGradient: 'linear-gradient(180deg, #f7971e 0%, #ffd200 100%)',
    initials: 'S',
    similarArtists: ['Laylow', 'Nekfeu', 'Vald', 'Lomepal'],
    playlists: [
      { title: 'Rap Indé FR', fans: '320K fans', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
      { title: 'Nouvelles Voix', fans: '180K fans', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    ],
    albums: [
      { title: 'Genèse', year: 2024, gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    ],
    behindTheSong: {
      trackTitle: 'Brûler',
      subtitle: 'Premier morceau enregistré · 1 min 58',
      story: 'Premier morceau enregistré dans une chambre de 9m² à Aubervilliers. Voice note enregistrée sur iPhone avant le studio.',
      segments: [
        {
          type: 'voicenote',
          title: 'Maquette iPhone originale',
          content: 'Enregistrée sur iPhone 11 dans sa chambre à 3h du matin. Le bruit du quartier est audible en fond.',
          duration: '1:12',
        },
        {
          type: 'audio',
          title: 'Senzo raconte Brûler',
          content: 'J\'avais pas de studio, pas d\'argent. J\'ai pris mon téléphone et j\'ai chanté dans ma couette pour étouffer le son. Ma mère dormait dans la pièce d\'à côté.',
          duration: '1 min 58',
        },
      ],
    },
  },
];

export const homeData = {
  recentPlaylists: [
    { id: 1, title: 'Flow', type: 'flow', gradient: 'linear-gradient(135deg, #A238FF 0%, #FF5C8A 100%)' },
    { id: 2, title: 'Rap FR', subtitle: 'Mix · Deezer', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
    { id: 3, title: 'Mauvais Œil', subtitle: 'Album · Booba', gradient: 'linear-gradient(135deg, #2c3e50, #3498db)' },
    { id: 4, title: 'Chill', subtitle: 'Playlist · Toi', gradient: 'linear-gradient(135deg, #0f0c29, #302b63)' },
    { id: 5, title: 'Workout', subtitle: 'Mix · Deezer', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    { id: 6, title: 'Rap US', subtitle: 'Mix · Deezer', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { id: 7, title: 'Soirée', subtitle: 'Playlist · Toi', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { id: 8, type: 'pin', title: 'Épingler', gradient: null },
  ],
  mixes: [
    {
      id: 1,
      title: 'Mix inspiré par Booba',
      artist: 'Booba & similaires',
      coverGradient: 'linear-gradient(135deg, #1a0a2e, #16213e)',
      initials: 'B',
      suggestGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    },
    {
      id: 2,
      title: 'Mix inspiré par Senzo',
      artist: 'Senzo & similaires',
      coverGradient: 'linear-gradient(135deg, #f7971e, #ffd200)',
      initials: 'S',
      suggestGradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    },
  ],
  flowMoods: [
    { label: 'Calme', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { label: 'Énergie', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    { label: 'Mélancolie', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    { label: 'Concentration', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { label: 'Fête', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  ],
};
