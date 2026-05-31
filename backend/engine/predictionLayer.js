/**
 * Prediction Layer — Module 3
 * Calcule le Score de Réceptivité Contextuelle (4 sous-scores).
 */

const COCOONING_PRODUCTS = ['puzzle', 'livre', 'bougie', 'thé', 'plaid', 'intérieur', 'maison', 'confort', 'cocooning', 'détente', 'spa', 'bien-être', 'série', 'film', 'jeu', 'cuisine'];
const ENERGY_PRODUCTS = ['sport', 'outdoor', 'voyage', 'sortie', 'festival', 'plage', 'randonnée', 'vélo', 'running', 'été', 'extérieur', 'piscine', 'barbecue', 'terrasse'];

const COLD_TONE_WORDS = ['chaud', 'confort', 'douillet', 'cocooning', 'chez vous', 'intérieur', 'détente', 'calme', 'doux', 'réconfort', 'maison', 'week-end au chaud', 'cosy'];
const WARM_TONE_WORDS = ['sortie', 'dehors', 'profiter', 'soleil', 'énergie', 'dynamique', 'bouger', 'découvrir', 'extérieur', 'plein air', 'aventure', 'été'];

function normalizeText(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function countMatches(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.filter(kw => normalized.includes(normalizeText(kw))).length;
}

/**
 * Score Météo (25%) — cohérence produit/univers vs contexte météo
 */
function calculateMeteoScore(context, brief) {
  const contextType = context.contextType.id;
  const product = normalizeText(brief.product || '');
  let score = 50;

  if (contextType === 'cocooning') {
    const cocooningHits = COCOONING_PRODUCTS.filter(p => product.includes(normalizeText(p))).length;
    const energyHits = ENERGY_PRODUCTS.filter(p => product.includes(normalizeText(p))).length;
    score += cocooningHits * 15;
    score -= energyHits * 12;
  } else if (contextType === 'energy') {
    const energyHits = ENERGY_PRODUCTS.filter(p => product.includes(normalizeText(p))).length;
    const cocooningHits = COCOONING_PRODUCTS.filter(p => product.includes(normalizeText(p))).length;
    score += energyHits * 15;
    score -= cocooningHits * 10;
  } else {
    score += 10;
  }

  if (!context.isSeasonCoherent) score -= 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Score Message (30%) — cohérence message vs contexte détecté
 */
function calculateMessageScore(context, brief) {
  const contextType = context.contextType.id;
  const message = brief.message || '';
  const tone = brief.tone || '';
  let score = 50;

  if (contextType === 'cocooning') {
    const coldHits = countMatches(message, COLD_TONE_WORDS);
    const warmHits = countMatches(message, WARM_TONE_WORDS);
    score += coldHits * 12;
    score -= warmHits * 15;

    if (['chaleureux', 'inspirationnel', 'rassurant'].includes(tone)) score += 15;
    if (['dynamique', 'urgent'].includes(tone)) score -= 15;
  } else if (contextType === 'energy') {
    const warmHits = countMatches(message, WARM_TONE_WORDS);
    const coldHits = countMatches(message, COLD_TONE_WORDS);
    score += warmHits * 12;
    score -= coldHits * 15;

    if (['dynamique', 'urgent', 'promotionnel'].includes(tone)) score += 15;
    if (['chaleureux', 'rassurant'].includes(tone)) score -= 10;
  } else {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Score Audience (25%) — cohérence audience/objectif/pression
 */
function calculateAudienceScore(context, brief) {
  let score = 60;
  const audience = brief.audience || '';
  const objective = brief.objective || '';
  const pressure = brief.pressure || 'moyen';

  if (audience === 'clients-inactifs' && pressure === 'fort') score -= 20;
  if (audience === 'clients-inactifs' && pressure === 'moyen') score -= 10;
  if (audience === 'paniers-abandonnes' && objective === 'conversion') score += 15;
  if (audience === 'clients-actifs' && objective === 'engagement') score += 10;
  if (audience === 'top-clients' && objective === 'conversion') score += 10;
  if (audience === 'prospects' && objective === 'trafic') score += 10;
  if (audience === 'clients-chauds' && objective === 'conversion') score += 15;

  if (pressure === 'fort' && ['clients-inactifs', 'prospects'].includes(audience)) score -= 15;
  if (pressure === 'faible' && audience === 'clients-chauds') score -= 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Score Timing (20%) — pertinence du moment
 */
function calculateTimingScore(context, brief) {
  let score = 55;
  const timeOfDay = context.timeOfDay.id;
  const channel = brief.channel || '';
  const contextType = context.contextType.id;

  if (channel === 'email' && timeOfDay === 'morning') score += 15;
  if (channel === 'email' && timeOfDay === 'night') score -= 10;
  if (channel === 'push' && timeOfDay === 'night') score -= 20;
  if (channel === 'push' && timeOfDay === 'midday') score += 10;
  if (channel === 'sms' && timeOfDay === 'night') score -= 25;
  if (channel === 'paid-social' && ['evening', 'afternoon'].includes(timeOfDay)) score += 10;
  if (channel === 'homepage') score += 5;

  if (contextType === 'cocooning' && ['evening', 'night'].includes(timeOfDay)) score += 10;
  if (contextType === 'energy' && ['morning', 'midday', 'afternoon'].includes(timeOfDay)) score += 10;

  if (!context.isSeasonCoherent) score -= 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Score global pondéré
 */
export function calculateScores(context, brief) {
  const meteo = calculateMeteoScore(context, brief);
  const message = calculateMessageScore(context, brief);
  const audience = calculateAudienceScore(context, brief);
  const timing = calculateTimingScore(context, brief);

  const global = Math.round(meteo * 0.25 + message * 0.30 + audience * 0.25 + timing * 0.20);

  let interpretation;
  if (global >= 81) interpretation = 'Très forte réceptivité estimée — conditions optimales pour l\'activation.';
  else if (global >= 66) interpretation = 'Bon alignement contextuel — quelques ajustements mineurs possibles.';
  else if (global >= 41) interpretation = 'Cohérence moyenne — optimisation recommandée avant activation.';
  else interpretation = 'Faible cohérence contextuelle — adaptation fortement recommandée.';

  return {
    global,
    subscores: { meteo, message, audience, timing },
    interpretation,
    confidence: global >= 66 ? 'Fort' : global >= 41 ? 'Moyen' : 'Faible',
  };
}
