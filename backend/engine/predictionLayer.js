/**
 * Prediction Layer - Module 3
 * Calcule le Score de Réceptivité Contextuelle et ses justifications.
 *
 * Trois principes corrigés :
 *  1. Aucun sous-score n'est jamais une constante forfaitaire. Le produit et le
 *     message sont TOUJOURS analysés lexicalement, y compris en zone de
 *     température intermédiaire, en les croisant avec le continuum contextuel.
 *  2. Quand aucun signal n'est réellement mesurable, l'outil le déclare
 *     (nonDiscriminant) au lieu d'afficher un chiffre plein arbitraire.
 *  3. Le signal d'intention collective (Wikimedia) entre effectivement dans le
 *     score, via un sous-score dédié — il n'était auparavant jamais lu.
 */

import {
  detectMessageWeatherContradictions,
  detectSeasonalProductMismatch,
  findKeywords,
  SUMMER_PRODUCT_WORDS,
  WINTER_PRODUCT_WORDS,
} from './weatherConsistency.js';
import { DISCRIMINANT_THRESHOLD } from './contextEngine.js';

const COCOONING_PRODUCTS = ['puzzle', 'livre', 'bougie', 'thé', 'plaid', 'intérieur', 'maison', 'confort', 'cocooning', 'détente', 'spa', 'bien-être', 'série', 'film', 'jeu', 'cuisine'];
const ENERGY_PRODUCTS = ['sport', 'outdoor', 'voyage', 'sortie', 'festival', 'plage', 'randonnée', 'vélo', 'running', 'été', 'extérieur', 'piscine', 'barbecue', 'terrasse'];

const COLD_TONE_WORDS = ['chaud', 'confort', 'douillet', 'cocooning', 'chez vous', 'intérieur', 'détente', 'calme', 'doux', 'réconfort', 'maison', 'week-end au chaud', 'cosy'];
const WARM_TONE_WORDS = ['sortie', 'dehors', 'profiter', 'soleil', 'énergie', 'dynamique', 'bouger', 'découvrir', 'extérieur', 'plein air', 'aventure', 'été'];

/** Orientation comportementale de chaque ton disponible dans le brief. */
const TONE_ORIENTATION = {
  chaleureux: -1,
  rassurant: -1,
  inspirationnel: -0.6,
  premium: -0.3,
  sobre: 0,
  promotionnel: 0.5,
  dynamique: 0.8,
  urgent: 1,
};

/** Pondération des sous-scores. Le signal collectif pèse désormais 12 %. */
export const SUBSCORE_WEIGHTS = {
  meteo: 0.22,
  message: 0.28,
  audience: 0.22,
  timing: 0.16,
  intention: 0.12,
};

const BRIEF_FIELDS = ['product', 'message', 'tone', 'audience', 'channel', 'objective'];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampScore(score) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function unique(list) {
  return [...new Set(list)];
}

function createReason(field, value, impact, text) {
  return { field, value: value || 'Non renseigné', impact: Math.round(impact), text };
}

function quote(list) {
  return list.map((item) => `« ${item} »`).join(', ');
}

/* ------------------------------------------------------------------ */
/* Complétude du brief                                                 */
/* ------------------------------------------------------------------ */

export function evaluateBriefCompleteness(brief = {}) {
  const filled = BRIEF_FIELDS.filter((field) => String(brief[field] ?? '').trim().length > 0);
  const missing = BRIEF_FIELDS.filter((field) => !filled.includes(field));
  const ratio = filled.length / BRIEF_FIELDS.length;
  const status = filled.length <= 2 ? 'insufficient' : filled.length <= 4 ? 'partial' : 'complete';
  return { filled: filled.length, total: BRIEF_FIELDS.length, missing, ratio, status };
}

/* ------------------------------------------------------------------ */
/* Sous-score Météo / Produit                                          */
/* ------------------------------------------------------------------ */

function calculateMeteoScore(context, brief) {
  const product = brief.product || '';
  const message = brief.message || '';
  const text = `${product} ${message}`.trim();
  const effective = context.effectiveIndex ?? 0;
  const reasons = [];
  let score = 50;

  const coldHits = unique([
    ...findKeywords(text, COCOONING_PRODUCTS),
    ...findKeywords(text, WINTER_PRODUCT_WORDS),
  ]);
  const warmHits = unique([
    ...findKeywords(text, ENERGY_PRODUCTS),
    ...findKeywords(text, SUMMER_PRODUCT_WORDS),
  ]);
  const total = coldHits.length + warmHits.length;

  let nonDiscriminant = false;

  if (total === 0) {
    if (context.weatherDiscriminant) {
      // Le contexte est net mais le brief ne s'y raccroche pas : opportunité manquée.
      score -= 6;
      reasons.push(createReason(
        'Produit + message',
        text || 'Non renseigné',
        -6,
        `Le contexte est ${context.intensity} (index ${context.contextIndex}) mais ni le produit ni le message ne comportent de terme saisonnier : l’opportunité de contextualisation n’est pas exploitée.`,
      ));
    } else {
      nonDiscriminant = true;
      reasons.push(createReason(
        'Produit + message',
        text || 'Non renseigné',
        0,
        `Aucun terme saisonnier détecté dans le produit ni dans le message, et le signal météo n’est pas discriminant (index ${context.contextIndex}, ${context.weather.temperature} °C pour ${context.seasonalNormal?.expected} °C attendus). Ce sous-score n’est pas mesurable pour ce brief.`,
      ));
    }
  } else {
    const orientation = (warmHits.length - coldHits.length) / total;
    const strength = Math.min(1, total / 3);
    const alignment = orientation * effective;
    const impact = 45 * alignment * (0.4 + 0.6 * strength);
    score += impact;

    const detected = [];
    if (coldHits.length) detected.push(`orientation repli/confort (${quote(coldHits)})`);
    if (warmHits.length) detected.push(`orientation sortie/activité (${quote(warmHits)})`);

    reasons.push(createReason(
      'Produit + message',
      text,
      impact,
      `Lexique détecté : ${detected.join(' et ')}. Croisé avec le continuum contextuel (index effectif ${round2(effective)}, ${context.weather.temperature} °C pour ${context.seasonalNormal?.expected} °C attendus en ${context.season.label.toLowerCase()}), l’alignement ressort à ${round2(alignment)}.`,
    ));
  }

  if (!context.isSeasonCoherent) {
    const delta = context.seasonalNormal?.delta;
    score -= 8;
    reasons.push(createReason(
      'Anomalie saisonnière',
      `${context.weather.temperature} °C`,
      -8,
      `L’écart à la normale saisonnière atteint ${delta} °C : le comportement d’achat est moins prévisible que d’ordinaire, la fiabilité de la cohérence produit/météo est réduite.`,
    ));
  }

  const seasonalMismatch = detectSeasonalProductMismatch(product, context, message);
  if (seasonalMismatch) {
    score += seasonalMismatch.impact;
    reasons.push(createReason(
      'Produit saisonnier',
      product || message,
      seasonalMismatch.impact,
      `Le terme « ${seasonalMismatch.keyword} » est saisonnièrement incohérent : référence retenue ${seasonalMismatch.reference} °C (${seasonalMismatch.driver}), contre ${seasonalMismatch.expected} °C attendus à cette période.`,
    ));
    nonDiscriminant = false;
  }

  return { score: clampScore(score), reasons, nonDiscriminant, coldHits, warmHits };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Sous-score Message / Ton                                            */
/* ------------------------------------------------------------------ */

function calculateMessageScore(context, brief) {
  const message = String(brief.message || '').trim();
  const tone = brief.tone || '';
  const contextIndex = context.contextIndex ?? 0;
  const reasons = [];
  let score = 50;
  let nonDiscriminant = false;

  if (!message) {
    score -= 25;
    reasons.push(createReason('Message', 'Non renseigné', -25, 'Aucun message n’a été saisi : il n’y a rien à évaluer, et rien à activer.'));
    reasons.push(createReason('Ton', tone, 0, 'Le ton ne peut pas être évalué sans message.'));
    return { score: clampScore(score), reasons, nonDiscriminant: true, contradictions: [] };
  }

  const coldTone = findKeywords(message, COLD_TONE_WORDS);
  const warmTone = findKeywords(message, WARM_TONE_WORDS);
  const total = coldTone.length + warmTone.length;

  if (total === 0) {
    if (context.weatherDiscriminant) {
      score -= 5;
      reasons.push(createReason('Message', message, -5, `Le message ne comporte aucun marqueur de registre alors que le contexte est ${context.intensity} : il reste neutre là où il pourrait résonner.`));
    } else {
      nonDiscriminant = true;
      reasons.push(createReason('Message', message, 0, `Aucun marqueur de registre détecté et signal météo non discriminant (index ${contextIndex}) : l’alignement message/contexte n’est pas mesurable ici.`));
    }
  } else {
    const orientation = (warmTone.length - coldTone.length) / total;
    const strength = Math.min(1, total / 3);
    const alignment = orientation * contextIndex;
    const impact = 30 * alignment * (0.4 + 0.6 * strength);
    score += impact;

    const detected = [];
    if (coldTone.length) detected.push(`registre confort (${quote(coldTone)})`);
    if (warmTone.length) detected.push(`registre sortie (${quote(warmTone)})`);
    reasons.push(createReason(
      'Message',
      message,
      impact,
      `${detected.join(' et ')}. Face à un contexte d’index ${contextIndex} (${context.contextType.label}), l’alignement de registre ressort à ${round2(alignment)}.`,
    ));
  }

  if (tone) {
    const toneOrientation = TONE_ORIENTATION[tone] ?? 0;
    const alignmentTone = toneOrientation * contextIndex;
    const toneImpact = 18 * alignmentTone;
    score += toneImpact;
    reasons.push(createReason(
      'Ton',
      tone,
      toneImpact,
      toneOrientation === 0
        ? `Le ton « ${tone} » est neutre sur l’axe repli/sortie : il n’avantage ni ne pénalise ce contexte.`
        : `Le ton « ${tone} » est orienté ${toneOrientation < 0 ? 'repli/réassurance' : 'énergie/action'} (${toneOrientation}) face à un contexte d’index ${contextIndex} : alignement ${round2(alignmentTone)}.`,
    ));
  } else {
    reasons.push(createReason('Ton', 'Non renseigné', 0, 'Aucun ton n’a été précisé : l’agent ne peut pas vérifier son adéquation au contexte.'));
  }

  if (message.length < 20) {
    score -= 8;
    reasons.push(createReason('Message', message, -8, `Message très court (${message.length} caractères) : trop peu de matière pour porter une contextualisation crédible.`));
  }

  const contradictions = detectMessageWeatherContradictions(message, context.weather);
  contradictions.forEach((contradiction) => {
    score += contradiction.impact;
    reasons.push(createReason(
      'Message',
      contradiction.phrase,
      contradiction.impact,
      `Affirmation vérifiable et fausse : ${contradiction.claim}, alors que la météo relevée indique ${context.weather.temperature} °C et ${context.weather.description}.`,
    ));
  });
  if (contradictions.length) nonDiscriminant = false;

  return { score: clampScore(score), reasons, nonDiscriminant, contradictions };
}

/* ------------------------------------------------------------------ */
/* Sous-score Audience / Pression                                      */
/* ------------------------------------------------------------------ */

function calculateAudienceScore(context, brief) {
  let score = 60;
  const audience = brief.audience || '';
  const objective = brief.objective || '';
  const pressure = brief.pressure || 'moyen';
  const reasons = [];
  const campaignValue = `audience : ${audience || 'Non renseignée'}, objectif : ${objective || 'Non renseigné'}, pression : ${pressure}`;

  const addAdjustment = (impact, text) => {
    score += impact;
    reasons.push(createReason('Audience / objectif / pression', campaignValue, impact, text));
  };

  if (audience === 'clients-inactifs' && pressure === 'fort') addAdjustment(-20, 'Une pression forte sur des clients inactifs augmente le risque de désengagement.');
  if (audience === 'clients-inactifs' && pressure === 'moyen') addAdjustment(-10, 'Une pression modérée sur des clients inactifs appelle encore de la prudence.');
  if (audience === 'paniers-abandonnes' && objective === 'conversion') addAdjustment(15, 'L’objectif de conversion est cohérent avec une relance de panier abandonné.');
  if (audience === 'clients-actifs' && objective === 'engagement') addAdjustment(10, 'L’objectif d’engagement est cohérent avec une audience déjà active.');
  if (audience === 'top-clients' && objective === 'conversion') addAdjustment(10, 'L’objectif de conversion est pertinent pour les meilleurs clients.');
  if (audience === 'prospects' && objective === 'trafic') addAdjustment(10, 'L’objectif de trafic est pertinent pour des prospects.');
  if (audience === 'clients-chauds' && objective === 'conversion') addAdjustment(15, 'L’objectif de conversion est pertinent pour une audience à forte intention.');
  if (pressure === 'fort' && ['clients-inactifs', 'prospects'].includes(audience)) addAdjustment(-15, 'Une pression forte est risquée pour cette audience peu engagée.');
  if (pressure === 'faible' && audience === 'clients-chauds') addAdjustment(-5, 'Une pression faible peut sous-exploiter une audience déjà très réceptive.');

  if (!audience) {
    addAdjustment(-10, 'Aucune audience n’a été renseignée : le ciblage ne peut pas être évalué.');
  } else if (!reasons.length) {
    addAdjustment(0, 'Cette combinaison audience, objectif et pression ne déclenche pas d’ajustement spécifique.');
  }

  return { score: clampScore(score), reasons, nonDiscriminant: !audience && !objective };
}

/* ------------------------------------------------------------------ */
/* Sous-score Timing / Canal                                           */
/* ------------------------------------------------------------------ */

function calculateTimingScore(context, brief) {
  let score = 55;
  const timeOfDay = context.timeOfDay.id;
  const channel = brief.channel || '';
  const contextIndex = context.contextIndex ?? 0;
  const reasons = [];

  const addAdjustment = (impact, text) => {
    score += impact;
    reasons.push(createReason('Canal', channel || 'Non renseigné', impact, text));
  };

  if (!channel) {
    addAdjustment(-10, 'Aucun canal n’a été renseigné : le créneau d’envoi ne peut pas être évalué.');
    return { score: clampScore(score), reasons, nonDiscriminant: true };
  }

  if (channel === 'email' && timeOfDay === 'morning') addAdjustment(15, 'L’email est adapté à une diffusion le matin.');
  if (channel === 'email' && timeOfDay === 'night') addAdjustment(-10, 'L’email est moins adapté à une diffusion nocturne.');
  if (channel === 'push' && timeOfDay === 'night') addAdjustment(-20, 'Une notification push la nuit est intrusive.');
  if (channel === 'push' && timeOfDay === 'midday') addAdjustment(10, 'Une notification push à midi peut capter une audience disponible.');
  if (channel === 'sms' && timeOfDay === 'night') addAdjustment(-25, 'Un SMS la nuit est fortement intrusif.');
  if (channel === 'paid-social' && ['evening', 'afternoon'].includes(timeOfDay)) addAdjustment(10, 'Les Social Ads sont adaptées à ce moment de consultation.');
  if (channel === 'homepage') addAdjustment(5, 'La homepage reste disponible sans interrompre le visiteur.');

  if (contextIndex <= -DISCRIMINANT_THRESHOLD && ['evening', 'night'].includes(timeOfDay)) {
    addAdjustment(10, `Le moment est cohérent avec un contexte de confort intérieur (index ${contextIndex}).`);
  }
  if (contextIndex >= DISCRIMINANT_THRESHOLD && ['morning', 'midday', 'afternoon'].includes(timeOfDay)) {
    addAdjustment(10, `Le moment soutient un contexte actif et extérieur (index ${contextIndex}).`);
  }
  if (!context.isSeasonCoherent) addAdjustment(-5, 'Une météo atypique pour la saison réduit la prévisibilité du bon créneau.');
  if (!reasons.length) addAdjustment(0, 'Le canal ne déclenche pas d’ajustement temporel spécifique à cette heure.');

  return { score: clampScore(score), reasons, nonDiscriminant: false };
}

/* ------------------------------------------------------------------ */
/* Sous-score Intention collective (Wikimedia) — désormais branché      */
/* ------------------------------------------------------------------ */

function calculateIntentionScore(context, brief) {
  const reasons = [];
  const signal = context.trendsSignal;
  const status = context.trendsStatus || (signal ? 'live' : 'unavailable');
  let score = 50;

  if (!signal || status === 'unavailable') {
    reasons.push(createReason('Signal collectif', 'Indisponible', 0, `Aucun signal d’intention collective exploitable (${context.trendsReason || 'source indisponible'}). Ce sous-score n’entre pas dans l’arbitrage.`));
    return { score, reasons, nonDiscriminant: true };
  }

  if (status === 'seasonal_estimate') {
    reasons.push(createReason('Signal collectif', 'Estimation saisonnière', 0, 'Le signal repose sur une estimation saisonnière, pas sur des pages vues réelles : il est affiché à titre indicatif et n’influence pas le score.'));
    return { score, reasons, nonDiscriminant: true };
  }

  if (context.sectorWeatherSensitive === false) {
    reasons.push(createReason('Signal collectif', context.sectorLabel || 'Secteur détecté', 0, `Le secteur « ${context.sectorLabel} » n’est pas météo-sensible : croiser son intention collective avec la météo n’aurait pas de sens. Le signal est affiché sans être pondéré.`));
    return { score, reasons, nonDiscriminant: true };
  }

  if (typeof signal.orientation !== 'number') {
    const momentum = Number(signal.dominantMomentum);
    const momentumTerm = Number.isFinite(momentum) ? clamp((momentum - 1) / 0.25, -1, 1) : 0;
    const impact = 12 * momentumTerm;
    score += impact;
    reasons.push(createReason(
      'Signal collectif',
      signal.dominant,
      impact,
      `Axe « ${signal.dominant} » (sélection personnalisée) : progression de ${Math.round((momentum - 1) * 100)} % sur 7 jours face à sa propre moyenne 90 jours. Aucune orientation comportementale n’est présumée pour un axe choisi manuellement — seule la dynamique est retenue.`,
    ));
    return { score: clampScore(score), reasons, nonDiscriminant: false };
  }

  const alignment = signal.alignment ?? 0;
  const alignImpact = 28 * alignment;
  score += alignImpact;
  reasons.push(createReason(
    'Signal collectif',
    signal.dominant,
    alignImpact,
    `L’axe d’intention dominant est « ${signal.dominant} » (orientation ${signal.orientation}, indice d’attention ${signal.dominantAttention}/100). Face à un contexte météo d’index ${context.contextIndex}, la cohérence des deux signaux ressort à ${round2(alignment)}${alignment < -0.35 ? ' — les deux signaux divergent nettement.' : alignment > 0.35 ? ' — les deux signaux se renforcent.' : '.'}`,
  ));

  const momentum = Number(signal.dominantMomentum);
  if (Number.isFinite(momentum)) {
    const momentumTerm = clamp((momentum - 1) / 0.25, -1, 1);
    const momentumImpact = 10 * momentumTerm;
    score += momentumImpact;
    reasons.push(createReason(
      'Dynamique de l’axe',
      `momentum ${momentum}`,
      momentumImpact,
      `Les pages vues de l’axe « ${signal.dominant} » sont ${momentum >= 1 ? 'en hausse' : 'en baisse'} de ${Math.abs(Math.round((momentum - 1) * 100))} % sur les 7 derniers jours face à sa moyenne 90 jours.`,
    ));
  }

  return { score: clampScore(score), reasons, nonDiscriminant: false };
}

/* ------------------------------------------------------------------ */
/* Confiance dans les DONNÉES (distincte du score de réceptivité)      */
/* ------------------------------------------------------------------ */

export function computeDataConfidence(context, completeness) {
  const degraded = [];
  const solid = [];

  if (context.weather?.isMock) degraded.push('Météo simulée (Open-Meteo injoignable)');
  else solid.push('Météo temps réel Open-Meteo');

  const trendsStatus = context.trendsStatus || (context.trendsSignal ? 'live' : 'unavailable');
  if (trendsStatus === 'live') solid.push('Pages vues Wikimedia réelles');
  else if (trendsStatus === 'seasonal_estimate') degraded.push('Signal collectif estimé, non mesuré');
  else degraded.push('Signal collectif indisponible');

  if (context.customMode) {
    solid.push('Articles Wikipédia choisis manuellement');
  } else if (context.sectorConfidence === 'high') {
    solid.push(`Secteur « ${context.sectorLabel} » détecté avec certitude`);
  } else {
    degraded.push(`Secteur mal identifié (${context.sectorLabel || 'inconnu'}, confiance ${context.sectorConfidence || 'basse'})`);
  }

  if (completeness?.status === 'insufficient') degraded.push(`Brief incomplet (${completeness.filled}/${completeness.total} champs renseignés)`);
  else if (completeness?.status === 'partial') degraded.push(`Brief partiellement renseigné (${completeness.filled}/${completeness.total} champs)`);

  let level;
  if (completeness?.status === 'insufficient' || degraded.length >= 2) level = 'Faible';
  else if (degraded.length === 1) level = 'Moyenne';
  else level = 'Élevée';

  return {
    level,
    degraded,
    solid,
    summary: degraded.length === 0
      ? 'Tous les signaux utilisés sont mesurés en temps réel et le brief est complet.'
      : `${degraded.length} signal(aux) dégradé(s) : ${degraded.join(' · ')}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Assemblage                                                          */
/* ------------------------------------------------------------------ */

export function calculateScores(context, brief) {
  const completeness = evaluateBriefCompleteness(brief);

  const meteo = calculateMeteoScore(context, brief);
  const message = calculateMessageScore(context, brief);
  const audience = calculateAudienceScore(context, brief);
  const timing = calculateTimingScore(context, brief);
  const intention = calculateIntentionScore(context, brief);

  const parts = { meteo, message, audience, timing, intention };

  // Les sous-scores non mesurables sont exclus du calcul et leur poids est
  // redistribué : on ne dilue pas le score avec des 50 de remplissage.
  const measurable = Object.entries(parts).filter(([, part]) => !part.nonDiscriminant);
  const measurableWeight = measurable.reduce((sum, [key]) => sum + SUBSCORE_WEIGHTS[key], 0);

  const global = measurableWeight > 0
    ? Math.round(measurable.reduce((sum, [key, part]) => sum + part.score * SUBSCORE_WEIGHTS[key], 0) / measurableWeight)
    : null;

  const nonDiscriminant = Object.entries(parts)
    .filter(([, part]) => part.nonDiscriminant)
    .map(([key]) => key);

  const dataConfidence = computeDataConfidence(context, completeness);

  let interpretation;
  if (completeness.status === 'insufficient') {
    interpretation = `Brief insuffisant : ${completeness.filled} champ(s) sur ${completeness.total} renseigné(s). Aucun score de réceptivité n’est publiable en l’état.`;
  } else if (global === null) {
    interpretation = 'Aucun signal mesurable pour ce brief : l’agent ne peut pas produire de score défendable.';
  } else if (global >= 78) interpretation = 'Très forte réceptivité estimée : conditions favorables à l’activation.';
  else if (global >= 62) interpretation = 'Bon alignement contextuel : quelques ajustements mineurs restent possibles.';
  else if (global >= 42) interpretation = 'Cohérence moyenne : une optimisation est recommandée avant activation.';
  else interpretation = 'Faible cohérence contextuelle : une adaptation est fortement recommandée.';

  if (global !== null && nonDiscriminant.length) {
    interpretation += ` Score établi sur ${measurable.length} des ${Object.keys(parts).length} dimensions — ${nonDiscriminant.length} non mesurable(s) pour ce brief.`;
  }

  return {
    global,
    // Affichage par paliers de 5 : la granularité réelle du modèle ne justifie
    // pas d'annoncer une précision à l'unité près.
    displayGlobal: global === null ? null : Math.round(global / 5) * 5,
    status: completeness.status === 'insufficient' ? 'insufficient_brief' : global === null ? 'not_measurable' : 'ok',
    subscores: {
      meteo: meteo.score,
      message: message.score,
      audience: audience.score,
      timing: timing.score,
      intention: intention.score,
    },
    weights: SUBSCORE_WEIGHTS,
    nonDiscriminant,
    measurableWeight: Math.round(measurableWeight * 100) / 100,
    reasons: {
      meteo: meteo.reasons,
      message: message.reasons,
      audience: audience.reasons,
      timing: timing.reasons,
      intention: intention.reasons,
    },
    interpretation,
    // Palier du score lui-même — ne prétend PAS mesurer la fiabilité des données.
    band: global === null ? 'Non mesurable' : global >= 62 ? 'Fort' : global >= 42 ? 'Moyen' : 'Faible',
    // Fiabilité réelle des signaux utilisés, indépendante du score obtenu.
    dataConfidence,
    briefCompleteness: completeness,
  };
}
