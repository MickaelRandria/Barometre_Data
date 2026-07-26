/**
 * Contextual Gap Detection - Module 4
 * Détecte les écarts entre le contexte réel et la campagne.
 *
 * Les seuils binaires sur contextType sont remplacés par des seuils sur le
 * continuum contextIndex : plus aucun écart ne dépend d'un dixième de degré.
 */

import { detectMessageWeatherContradictions, detectSeasonalProductMismatch, findKeywords, normalizeText } from './weatherConsistency.js';
import { DISCRIMINANT_THRESHOLD } from './contextEngine.js';

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

/** Orientation des tons, alignée sur predictionLayer. */
const TONE_ORIENTATION = {
  chaleureux: -1, rassurant: -1, inspirationnel: -0.6, premium: -0.3,
  sobre: 0, promotionnel: 0.5, dynamique: 0.8, urgent: 1,
};

function temperatureLabel(context) {
  const temperature = Number(context.weather?.temperature);
  return Number.isFinite(temperature) ? `${temperature} °C` : 'la température actuelle';
}

function addSeasonalProductGap(gaps, context, product, message) {
  const mismatch = detectSeasonalProductMismatch(product, context, message);
  if (!mismatch) return;

  const seasonLabel = mismatch.type === 'winter_in_hot_weather' ? 'hivernal' : 'estival';
  const driverLabel = mismatch.driver === 'temperature'
    ? `la température relevée est de ${mismatch.temperature} °C`
    : `la normale saisonnière du lieu est de ${mismatch.expected} °C à cette date`;

  gaps.push({
    type: 'seasonal_product_mismatch',
    severity: mismatch.severity,
    label: 'Produit saisonnier incohérent',
    detail: `Le produit ou le message contient le terme ${seasonLabel} « ${mismatch.keyword} » alors que ${driverLabel}. Référence retenue : ${mismatch.reference} °C.`,
  });
}

function addMessageWeatherGaps(gaps, context, message) {
  detectMessageWeatherContradictions(message, context.weather).forEach((contradiction) => {
    gaps.push({
      type: 'message_weather_contradiction',
      severity: contradiction.severity || 'critical',
      label: 'Affirmation météo contradictoire',
      detail: `La phrase « ${contradiction.phrase} » constitue une affirmation vérifiable : ${contradiction.claim}. La météo relevée indique ${temperatureLabel(context)} et ${context.weather.description}.`,
    });
  });
}

function addTrendsDivergenceGap(gaps, context) {
  const signal = context.trendsSignal;
  if (!signal || context.trendsStatus !== 'live') return;
  if (typeof signal.orientation !== 'number' || typeof signal.alignment !== 'number') return;
  if (context.sectorWeatherSensitive === false) return;
  // Une divergence n'a de sens que si les deux signaux sont eux-mêmes marqués.
  if (Math.abs(context.contextIndex) < DISCRIMINANT_THRESHOLD) return;
  if (signal.alignment > -0.35) return;

  gaps.push({
    type: 'trends_weather_divergence',
    severity: Math.abs(signal.alignment) >= 0.6 ? 'high' : 'medium',
    label: 'Divergence météo ↔ intention collective',
    detail: `Le contexte météo pointe vers ${context.contextIndex > 0 ? 'la sortie et l’activité' : 'le repli et le confort'} (index ${context.contextIndex}), alors que l’axe d’intention le plus consulté sur Wikipédia est « ${signal.dominant} », orienté à l’inverse (${signal.orientation}). Les deux signaux ne racontent pas la même histoire : arbitrez explicitement lequel vous suivez.`,
  });
}

export function detectContextualGap(context, brief, scores) {
  const contextIndex = context.contextIndex ?? 0;
  const tone = brief.tone || '';
  const message = normalizeText(brief.message || '');
  const product = brief.product || '';
  const gaps = [];

  // --- Décalage de ton, gradué sur le continuum -----------------------------
  if (tone && Math.abs(contextIndex) >= DISCRIMINANT_THRESHOLD) {
    const toneOrientation = TONE_ORIENTATION[tone] ?? 0;
    const toneAlignment = toneOrientation * contextIndex;
    if (toneAlignment <= -0.45) {
      gaps.push({
        type: 'tone_mismatch',
        severity: toneAlignment <= -0.7 ? 'high' : 'medium',
        label: 'Décalage de ton',
        detail: contextIndex < 0
          ? `Le ton « ${tone} » est trop énergique pour un contexte de repli (index ${contextIndex}). En contexte froid et intérieur, un ton chaleureux, inspirationnel ou rassurant obtient une meilleure résonance.`
          : `Le ton « ${tone} » est trop posé pour un contexte d’activité (index ${contextIndex}). Un ton plus dynamique capterait mieux l’attention.`,
      });
    }
  }

  // --- Décalage de registre du message -------------------------------------
  const warmWords = ['sortie', 'dehors', 'profiter du soleil', 'exterieur', 'plein air', 'ete'];
  const coldWords = ['cocooning', 'chez vous', 'au chaud', 'interieur', 'confort'];

  if (contextIndex <= -DISCRIMINANT_THRESHOLD && findKeywords(message, warmWords).length) {
    gaps.push({
      type: 'message_mismatch',
      severity: contextIndex <= -0.6 ? 'high' : 'medium',
      label: 'Message inadapté au contexte',
      detail: `Le message évoque la sortie ou l’extérieur alors que le contexte penche vers le repli (index ${contextIndex}, ${temperatureLabel(context)}). Il peut créer une dissonance pour le destinataire.`,
    });
  }
  if (contextIndex >= DISCRIMINANT_THRESHOLD && findKeywords(message, coldWords).length) {
    gaps.push({
      type: 'message_mismatch',
      severity: contextIndex >= 0.6 ? 'high' : 'medium',
      label: 'Message inadapté au contexte',
      detail: `Le message évoque le confort intérieur alors que le contexte penche vers l’activité (index ${contextIndex}, ${temperatureLabel(context)}). Il pourrait sembler hors sujet.`,
    });
  }

  addSeasonalProductGap(gaps, context, product, brief.message || '');
  addMessageWeatherGaps(gaps, context, brief.message || '');
  addTrendsDivergenceGap(gaps, context);

  if (brief.pressure === 'fort' && brief.audience === 'clients-inactifs') {
    gaps.push({
      type: 'pressure_mismatch',
      severity: 'high',
      label: 'Pression excessive',
      detail: 'Une pression commerciale forte sur une audience inactive augmente le risque de désabonnement ou de perception négative.',
    });
  }

  if (['sms', 'push'].includes(brief.channel) && contextIndex <= -DISCRIMINANT_THRESHOLD && tone === 'urgent') {
    gaps.push({
      type: 'channel_mismatch',
      severity: 'medium',
      label: 'Canal intrusif en contexte doux',
      detail: 'Un canal push ou SMS avec un ton urgent dans un contexte de repli peut être perçu comme agressif.',
    });
  }

  // --- Brief incomplet : ce n'est pas un décalage, c'est un préalable -------
  const completeness = scores?.briefCompleteness;
  if (completeness?.status === 'insufficient') {
    gaps.push({
      type: 'insufficient_brief',
      severity: 'high',
      label: 'Brief insuffisant',
      detail: `Seuls ${completeness.filled} champ(s) sur ${completeness.total} sont renseignés (manquants : ${completeness.missing.join(', ')}). L’agent ne peut pas évaluer une campagne qui n’est pas décrite.`,
    });
  }

  const hasGap = gaps.length > 0;
  const maxSeverity = gaps.reduce((max, gap) => (
    SEVERITY_ORDER[gap.severity] > SEVERITY_ORDER[max] ? gap.severity : max
  ), 'low');
  const gapLevel = !hasGap ? 'none' : maxSeverity === 'critical' ? 'critique' : maxSeverity === 'high' ? 'fort' : 'moyen';

  let summary;
  let risk;
  let recommendation;
  if (completeness?.status === 'insufficient') {
    summary = `Brief insuffisant pour conclure. ${gaps.length} point(s) bloquant(s) avant toute évaluation.`;
    risk = 'Risque non évaluable : il n’y a pas assez d’éléments décrits pour estimer une réceptivité.';
    recommendation = 'Complétez le brief (produit, message, audience, canal) avant de relancer l’analyse.';
  } else if (!hasGap) {
    summary = 'Alignement contextuel correct. Aucun décalage significatif n’a été détecté entre le message, le produit, le contexte et l’audience.';
    risk = 'Risque faible : la campagne est cohérente avec les conditions actuelles.';
    recommendation = 'Vous pouvez activer la campagne en l’état et surveiller les KPI pour confirmer.';
  } else if (gapLevel === 'critique') {
    summary = `Contextual Gap critique détecté. ${gaps.length} décalage(s) contredisent directement le contexte réel.`;
    risk = 'Risque très élevé : la campagne peut être perçue comme incohérente ou peu crédible.';
    recommendation = 'Reportez l’activation et réécrivez le produit ainsi que le message avant toute diffusion.';
  } else if (gapLevel === 'fort') {
    summary = `Contextual Gap fort détecté. ${gaps.length} décalage(s) ont été identifiés entre votre campagne et le contexte actuel.`;
    risk = 'Risque élevé de baisse du CTR, de faible résonance émotionnelle et de message perçu comme peu pertinent.';
    recommendation = 'Une adaptation est fortement recommandée avant activation. Consultez les variantes proposées par l’agent.';
  } else {
    summary = `Contextual Gap moyen détecté. ${gaps.length} point(s) d’attention ont été identifiés.`;
    risk = 'Risque modéré : le message pourrait sous-performer par rapport à une version contextualisée.';
    recommendation = 'Une optimisation de ton ou de timing améliorerait la réceptivité.';
  }

  return {
    hasGap,
    gapLevel,
    gaps,
    summary,
    risk,
    recommendation,
    contextReal: `${context.weather.description} · ${context.weather.temperature} °C · ${context.season.label} · index ${contextIndex}`,
    messageActual: brief.message || 'Non renseigné',
  };
}
