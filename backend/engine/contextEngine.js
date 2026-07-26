/**
 * Context Engine — Module 2
 *
 * Le contexte n'est plus un palier binaire (< 12 °C = cocooning, > 22 °C = energy)
 * mais un CONTINUUM signé, contextIndex ∈ [-1, +1] :
 *   -1 = fortement orienté repli/confort, +1 = fortement orienté sortie/activité.
 *
 * Il combine trois composantes, dont l'écart à la normale saisonnière du lieu :
 * 22 °C en février et 22 °C en août ne racontent pas la même histoire
 * comportementale, et l'index le reflète.
 */

import { computeDeltaToNormal } from './weatherConsistency.js';

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

/** Seuil au-delà duquel le signal météo est jugé discriminant. */
export const DISCRIMINANT_THRESHOLD = 0.30;

/** Orientation comportementale de chaque axe d'intention collective. */
export const AXIS_ORIENTATION = {
  cocooning: -1,
  'loisirs créatifs': -0.5,
  'bien-être': -0.15,
  sortie: 0.9,
  'activité extérieure': 1,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function getSeason(month) {
  if (month >= 2 && month <= 4) return { id: 'spring', label: 'Printemps' };
  if (month >= 5 && month <= 7) return { id: 'summer', label: 'Été' };
  if (month >= 8 && month <= 10) return { id: 'autumn', label: 'Automne' };
  return { id: 'winter', label: 'Hiver' };
}

function getTimeOfDay() {
  const h = new Date().getHours();
  // L'heure exacte est conservée : les guardrails légaux (fenêtre 8h-21h)
  // ne peuvent pas se contenter d'un créneau approximatif.
  if (h >= 6 && h < 12) return { id: 'morning', label: 'Matin', hour: h };
  if (h >= 12 && h < 14) return { id: 'midday', label: 'Mi-journée', hour: h };
  if (h >= 14 && h < 18) return { id: 'afternoon', label: 'Après-midi', hour: h };
  if (h >= 18 && h < 22) return { id: 'evening', label: 'Soirée', hour: h };
  return { id: 'night', label: 'Nuit', hour: h };
}

/** Contribution du ciel au continuum (luminosité et praticabilité extérieure). */
function computeSkyIndex(weather) {
  const description = (weather?.description || '').toLowerCase();
  const code = Number(weather?.weatherCode);
  const precipitation = Number(weather?.precipitation ?? 0);

  if ([71, 73, 75, 77, 85, 86].includes(code) || description.includes('neige')) return -0.5;
  if (precipitation > 0 || [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)
    || /pluie|averse|orage|bruine/.test(description)) return -0.35;
  if ([45, 48].includes(code) || /brouillard/.test(description)) return -0.25;
  if ([3].includes(code) || /couvert/.test(description)) return -0.15;
  if (/nuageux/.test(description)) return -0.1;
  if ([0, 1].includes(code) || /degage|dégagé|soleil|clear|sun/.test(description)) return 0.25;
  return 0;
}

/**
 * Continuum contextuel : 55 % température ressentie absolue,
 * 30 % anomalie saisonnière, 15 % état du ciel.
 */
function computeContextIndex(weather, seasonalNormal) {
  const temperature = Number(weather?.temperature);
  const reference = Number.isFinite(temperature) ? temperature : seasonalNormal.expected;

  const thermalIndex = clamp((reference - 18) / 12, -1, 1);
  const anomalyIndex = seasonalNormal.delta === null ? 0 : clamp(seasonalNormal.delta / 6, -1, 1);
  const skyIndex = computeSkyIndex(weather);

  const contextIndex = clamp(0.55 * thermalIndex + 0.30 * anomalyIndex + 0.15 * skyIndex, -1, 1);
  const seasonIndex = clamp((seasonalNormal.expected - 18) / 10, -1, 1);
  // Index utilisé pour juger la cohérence lexicale d'un brief : il intègre la
  // saison, ce qui permet de pénaliser un produit hivernal en juillet même
  // lorsque la journée elle-même est fraîche.
  const effectiveIndex = clamp(0.65 * contextIndex + 0.35 * seasonIndex, -1, 1);

  return {
    contextIndex: round2(contextIndex),
    seasonIndex: round2(seasonIndex),
    effectiveIndex: round2(effectiveIndex),
    components: {
      thermalIndex: round2(thermalIndex),
      anomalyIndex: round2(anomalyIndex),
      skyIndex: round2(skyIndex),
    },
  };
}

function typeFromIndex(contextIndex) {
  if (contextIndex <= -DISCRIMINANT_THRESHOLD) return CONTEXT_TYPES.COCOONING;
  if (contextIndex >= DISCRIMINANT_THRESHOLD) return CONTEXT_TYPES.ENERGY;
  return CONTEXT_TYPES.NEUTRAL;
}

function intensityLabel(contextIndex) {
  const magnitude = Math.abs(contextIndex);
  if (magnitude >= 0.6) return 'marqué';
  if (magnitude >= DISCRIMINANT_THRESHOLD) return 'modéré';
  if (magnitude >= 0.12) return 'faible';
  return 'non discriminant';
}

/**
 * Signal d'intention collective : la dominance s'appuie sur attentionIndex
 * (volume + dynamique) et non sur le seul momentum relatif.
 */
function computeTrendsSignal(trends, contextIndex) {
  const usable = trends.filter((t) => t && typeof t.keyword === 'string');
  if (!usable.length) return null;

  const ranked = [...usable].sort((a, b) => (
    (b.attentionIndex ?? b.value ?? 0) - (a.attentionIndex ?? a.value ?? 0)
  ));
  const top = ranked[0];
  const orientation = AXIS_ORIENTATION[top.keyword];
  const hasOrientation = typeof orientation === 'number';

  // Cohérence entre l'axe d'intention dominant et le continuum météo.
  const alignment = hasOrientation ? round2(orientation * contextIndex) : null;

  return {
    dominant: top.keyword,
    dominantAttention: top.attentionIndex ?? top.value ?? null,
    dominantMomentum: top.momentum ?? null,
    orientation: hasOrientation ? orientation : null,
    alignment,
    // Conservé pour compatibilité d'affichage : dominance au momentum seul.
    momentumLeader: [...usable].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]?.keyword ?? null,
    confidence: hasOrientation && Math.abs(alignment) >= 0.3 ? 'high' : 'medium',
    keywords: usable,
    ranked: ranked.map((t) => t.keyword),
  };
}

export function analyzeContext(weather, trends = null, options = {}) {
  const now = options.date instanceof Date ? options.date : new Date();
  const latitude = options.latitude ?? weather?.latitude ?? null;
  const season = getSeason(now.getMonth());
  const timeOfDay = getTimeOfDay();

  const seasonalNormal = computeDeltaToNormal(weather, { latitude, date: now });
  const indices = computeContextIndex(weather, seasonalNormal);
  const contextType = typeFromIndex(indices.contextIndex);
  const weatherDiscriminant = Math.abs(indices.contextIndex) >= DISCRIMINANT_THRESHOLD;

  // Une météo est « atypique » quand elle s'écarte franchement de sa normale.
  const isSeasonCoherent = seasonalNormal.delta === null || Math.abs(seasonalNormal.delta) <= 6;

  const interpretation = generateInterpretation(contextType, weather, season, seasonalNormal, indices);
  const trendsSignal = Array.isArray(trends) && trends.length > 0
    ? computeTrendsSignal(trends, indices.contextIndex)
    : null;

  return {
    weather: {
      temperature: weather?.temperature ?? null,
      feelsLike: weather?.feelsLike ?? null,
      humidity: weather?.humidity ?? null,
      description: weather?.description ?? 'Non disponible',
      windSpeed: weather?.windSpeed ?? null,
      precipitation: weather?.precipitation ?? null,
      weatherCode: weather?.weatherCode ?? null,
      observedAt: weather?.observedAt ?? null,
      fetchedAt: weather?.fetchedAt ?? null,
      isMock: Boolean(weather?._mock || weather?._fallback),
      _fallback: Boolean(weather?._fallback),
      _live: Boolean(weather?._live),
    },
    season,
    timeOfDay,
    contextType: {
      id: contextType.id,
      label: contextType.label,
      description: contextType.description,
      toneMatch: contextType.toneMatch,
    },
    contextIndex: indices.contextIndex,
    seasonIndex: indices.seasonIndex,
    effectiveIndex: indices.effectiveIndex,
    indexComponents: indices.components,
    intensity: intensityLabel(indices.contextIndex),
    weatherDiscriminant,
    seasonalNormal,
    isSeasonCoherent,
    interpretation,
    trendsSignal,
  };
}

function describeAnomaly(seasonalNormal) {
  if (seasonalNormal.delta === null) return '';
  const absDelta = Math.abs(seasonalNormal.delta);
  if (absDelta < 1.5) return `conforme à la normale du lieu (${seasonalNormal.expected} °C attendus)`;
  const direction = seasonalNormal.delta > 0 ? 'au-dessus' : 'en dessous';
  return `${absDelta} °C ${direction} de la normale saisonnière (${seasonalNormal.expected} °C attendus)`;
}

function generateInterpretation(contextType, weather, season, seasonalNormal, indices) {
  const temp = weather?.temperature ?? seasonalNormal.expected;
  const anomaly = describeAnomaly(seasonalNormal);
  const suffix = anomaly ? `, soit ${anomaly}` : '';

  switch (contextType.id) {
    case 'cocooning':
      return `Contexte Cocooning (index ${indices.contextIndex}). ${temp} °C en ${season.label.toLowerCase()}${suffix} : le contexte favorise des messages orientés confort, inspiration et réassurance.`;
    case 'energy':
      return `Contexte Énergie/Sortie (index ${indices.contextIndex}). ${temp} °C en ${season.label.toLowerCase()}${suffix} : le contexte favorise des messages dynamiques, orientés activité et extérieur.`;
    default:
      return `Contexte intermédiaire (index ${indices.contextIndex}). ${temp} °C en ${season.label.toLowerCase()}${suffix} : le signal météo ne penche ni vers le repli ni vers la sortie. L'analyse repose alors principalement sur le lexique du brief, l'audience et le timing.`;
  }
}

export { CONTEXT_TYPES, getSeason, getTimeOfDay, computeSkyIndex };
