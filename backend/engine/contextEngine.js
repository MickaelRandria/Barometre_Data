/**
 * Context Engine — Module 2
 * Analyse le contexte réel ou simulé et détermine le type dominant.
 */

const CONTEXT_TYPES = {
  COCOONING: {
    id: 'cocooning',
    label: 'Cocooning',
    description: 'Froid, pluie, faible luminosité — contexte maison/confort.',
    keywords: ['confort', 'chaleur', 'intérieur', 'détente', 'cocooning', 'maison', 'douceur'],
    toneMatch: ['chaleureux', 'inspirationnel', 'rassurant'],
  },
  ENERGY: {
    id: 'energy',
    label: 'Énergie / Sortie',
    description: 'Soleil, chaleur, contexte extérieur, loisirs, social.',
    keywords: ['sortie', 'extérieur', 'énergie', 'soleil', 'activité', 'dynamique', 'plage'],
    toneMatch: ['dynamique', 'urgent', 'promotionnel'],
  },
  URGENCY: {
    id: 'urgency',
    label: 'Urgence / Efficacité',
    description: 'Utilisateur peu disponible — message court recommandé.',
    keywords: ['rapide', 'maintenant', 'dernière chance', 'limité'],
    toneMatch: ['urgent', 'sobre'],
  },
  INSPIRATION: {
    id: 'inspiration',
    label: 'Inspiration / Exploration',
    description: 'Navigation longue, audience disponible — contenus éditoriaux recommandés.',
    keywords: ['découvrir', 'explorer', 'inspiration', 'idées', 'tendances'],
    toneMatch: ['inspirationnel', 'premium', 'chaleureux'],
  },
  NEUTRAL: {
    id: 'neutral',
    label: 'Neutre',
    description: 'Aucun signal contextuel fort détecté.',
    keywords: [],
    toneMatch: ['sobre', 'dynamique'],
  },
};

function getSeason(month) {
  if (month >= 2 && month <= 4) return { id: 'spring', label: 'Printemps' };
  if (month >= 5 && month <= 7) return { id: 'summer', label: 'Été' };
  if (month >= 8 && month <= 10) return { id: 'autumn', label: 'Automne' };
  return { id: 'winter', label: 'Hiver' };
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return { id: 'morning', label: 'Matin' };
  if (h >= 12 && h < 14) return { id: 'midday', label: 'Mi-journée' };
  if (h >= 14 && h < 18) return { id: 'afternoon', label: 'Après-midi' };
  if (h >= 18 && h < 22) return { id: 'evening', label: 'Soirée' };
  return { id: 'night', label: 'Nuit' };
}

function detectContextType(weather, season) {
  const temp = weather?.temperature ?? 15;
  const description = (weather?.description || '').toLowerCase();
  const humidity = weather?.humidity ?? 50;

  const isRainy = description.includes('pluie') || description.includes('rain') || description.includes('drizzle');
  const isCloudy = description.includes('couvert') || description.includes('nuageux') || description.includes('cloud') || description.includes('overcast');
  const isSunny = description.includes('soleil') || description.includes('clear') || description.includes('dégagé') || description.includes('sun');
  const isCold = temp < 12;
  const isWarm = temp > 22;
  const isVeryWarm = temp > 28;

  if (isCold && (isRainy || isCloudy)) return CONTEXT_TYPES.COCOONING;
  if (isCold && !isSunny) return CONTEXT_TYPES.COCOONING;
  if (isRainy && !isWarm) return CONTEXT_TYPES.COCOONING;
  if (isVeryWarm && isSunny) return CONTEXT_TYPES.ENERGY;
  if (isWarm && isSunny) return CONTEXT_TYPES.ENERGY;
  if (isWarm && !isRainy) return CONTEXT_TYPES.ENERGY;
  if (season?.id === 'winter' && isCold) return CONTEXT_TYPES.COCOONING;
  if (season?.id === 'summer' && isWarm) return CONTEXT_TYPES.ENERGY;

  return CONTEXT_TYPES.NEUTRAL;
}

export function analyzeContext(weather) {
  const now = new Date();
  const season = getSeason(now.getMonth());
  const timeOfDay = getTimeOfDay();
  const contextType = detectContextType(weather, season);

  const isSeasonCoherent = (() => {
    const temp = weather?.temperature ?? 15;
    if (season.id === 'winter' && temp > 20) return false;
    if (season.id === 'summer' && temp < 12) return false;
    return true;
  })();

  const interpretation = generateInterpretation(contextType, weather, season);

  return {
    weather: {
      temperature: weather?.temperature ?? null,
      feelsLike: weather?.feelsLike ?? null,
      humidity: weather?.humidity ?? null,
      description: weather?.description ?? 'Non disponible',
      windSpeed: weather?.windSpeed ?? null,
      isMock: weather?._mock ?? false,
    },
    season,
    timeOfDay,
    contextType: {
      id: contextType.id,
      label: contextType.label,
      description: contextType.description,
      toneMatch: contextType.toneMatch,
    },
    isSeasonCoherent,
    interpretation,
  };
}

function generateInterpretation(contextType, weather, season) {
  const temp = weather?.temperature ?? 15;
  const desc = weather?.description || '';

  switch (contextType.id) {
    case 'cocooning':
      return `Contexte détecté : Cocooning. La combinaison ${temp < 10 ? 'froid' : 'fraîcheur'}${desc.toLowerCase().includes('pluie') || desc.toLowerCase().includes('rain') ? ' + pluie' : ''} en ${season.label.toLowerCase()} favorise des messages orientés confort, inspiration et réassurance.`;
    case 'energy':
      return `Contexte détecté : Énergie/Sortie. ${temp > 25 ? 'La chaleur' : 'Le beau temps'} et la saison ${season.label.toLowerCase()} favorisent des messages dynamiques, orientés activité et extérieur.`;
    case 'urgency':
      return `Contexte détecté : Urgence/Efficacité. Le contexte suggère un utilisateur peu disponible — privilégiez un message court et impactant.`;
    case 'inspiration':
      return `Contexte détecté : Inspiration/Exploration. Le contexte est propice à des contenus éditoriaux longs, inspirationnels et immersifs.`;
    default:
      return `Contexte détecté : Neutre. Aucun signal fort ne domine — adaptez selon votre objectif prioritaire.`;
  }
}

export { CONTEXT_TYPES, getSeason, getTimeOfDay };
