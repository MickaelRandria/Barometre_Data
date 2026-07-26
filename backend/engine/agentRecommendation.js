/**
 * Agent Recommendation — Module 5
 *
 * La décision est désormais pilotée par les DÉCALAGES détectés, pas par la
 * position du score dans une bande large. Conséquence : ACTIVER redevient
 * atteignable (aucun gap = activer), et le score module la confiance plutôt
 * que le verdict. Cela supprime aussi la contradiction où le panneau Gap
 * annonçait « activez en l'état » pendant que le verdict disait « adaptez ».
 */

import { DISCRIMINANT_THRESHOLD } from './contextEngine.js';

const CONFIDENCE_ORDER = ['Faible', 'Moyenne', 'Élevée'];

/** La confiance de la recommandation ne peut pas dépasser celle des données. */
function capConfidence(intrinsic, dataLevel) {
  const a = CONFIDENCE_ORDER.indexOf(intrinsic);
  const b = CONFIDENCE_ORDER.indexOf(dataLevel);
  if (a < 0) return dataLevel;
  if (b < 0) return intrinsic;
  return CONFIDENCE_ORDER[Math.min(a, b)];
}

export function generateRecommendation(context, brief, scores, gapResult) {
  const global = scores.global;
  const hasGap = gapResult.hasGap;
  const gapLevel = gapResult.gapLevel;
  const dataLevel = scores.dataConfidence?.level ?? 'Moyenne';
  const criticalGaps = gapResult.gaps.filter((g) => g.severity === 'critical');
  const blockingGaps = gapResult.gaps.filter((g) => ['critical', 'high'].includes(g.severity));

  let action;
  let intrinsicConfidence;
  let justification;
  let risk;
  let recommendation;
  let kpis;

  if (scores.status === 'insufficient_brief') {
    action = 'COMPLÉTER';
    intrinsicConfidence = 'Faible';
    const missing = scores.briefCompleteness.missing.join(', ');
    justification = `Brief insuffisant : ${scores.briefCompleteness.filled} champ(s) sur ${scores.briefCompleteness.total} renseigné(s). Champs manquants : ${missing}.`;
    risk = 'Risque non évaluable : l’agent ne peut pas juger une campagne qui n’est pas décrite.';
    recommendation = `Renseignez au minimum le produit, le message, l’audience et le canal. Aucun score de réceptivité n’est publiable tant que ces éléments manquent — un chiffre calculé sur un brief vide n’aurait aucune valeur de décision.`;
    kpis = ['Aucune projection possible à ce stade', 'Compléter le brief puis relancer l’analyse'];
  } else if (gapLevel === 'critique') {
    action = 'REPORTER';
    // Une contradiction factuelle avec la météo relevée est vérifiable :
    // la confiance intrinsèque est élevée même si le score reste moyen.
    intrinsicConfidence = 'Élevée';
    justification = `${criticalGaps.length} décalage(s) critique(s) contredisent directement le contexte relevé : ${criticalGaps.map((g) => g.label).join(', ')}. Score de réceptivité ${global}/100.`;
    risk = 'Risque élevé — activation en l’état : perte de crédibilité du message et ROI négatif probable.';
    recommendation = `Reportez l’activation. ${criticalGaps.map((g) => g.detail).join(' ')} Corrigez ces points précis avant toute diffusion : ce ne sont pas des préférences de style, ce sont des affirmations ou des associations que le contexte relevé dément.`;
    kpis = ['Ne pas projeter de performance avant réécriture', 'Reprendre le produit et le message, puis relancer l’analyse'];
  } else if (global !== null && global < 35) {
    action = 'REPORTER';
    intrinsicConfidence = 'Moyenne';
    justification = `Score de ${global}/100 : la campagne est faiblement alignée avec le contexte sur l’ensemble des dimensions mesurées, sans qu’un décalage unique explique à lui seul le résultat.`;
    risk = 'Risque élevé — la campagne partirait sans aucun appui contextuel.';
    recommendation = 'Reprenez le brief dans son ensemble : ni le produit, ni le message, ni le ciblage ne trouvent d’appui dans le contexte actuel.';
    kpis = ['Ne pas projeter de performance avant réécriture', 'Reprendre le brief complet'];
  } else if (!hasGap) {
    if (global !== null && global >= 50) {
      action = 'ACTIVER';
      intrinsicConfidence = global >= 75 ? 'Élevée' : 'Moyenne';
      justification = `Aucun décalage détecté entre le message, le produit, le contexte et l’audience. Score de réceptivité ${global}/100${scores.nonDiscriminant.length ? ` (établi sur ${5 - scores.nonDiscriminant.length} dimensions mesurables sur 5)` : ''}.`;
      risk = 'Risque faible — aucune incohérence identifiée avec les conditions relevées.';
      recommendation = buildActivationReco(context, scores);
      kpis = ['Hypothèse à tester : la campagne peut être activée en l’état', 'Mesurer le CTR, les ouvertures et l’engagement contre une référence CRM'];
    } else {
      action = 'OPTIMISER';
      intrinsicConfidence = 'Moyenne';
      justification = `Aucun décalage bloquant, mais un score de ${global}/100 : rien n’est incohérent, rien n’est franchement porteur non plus.`;
      risk = 'Risque faible à modéré — la campagne peut partir, sans effet de levier contextuel.';
      recommendation = generateOptimizationReco(context, brief, scores, gapResult);
      kpis = ['Hypothèse à tester : l’optimisation peut améliorer les résultats', 'Mesurer le message optimisé face à un groupe de contrôle'];
    }
  } else if (gapLevel === 'fort') {
    action = 'ADAPTER';
    intrinsicConfidence = 'Moyenne';
    justification = `Score de ${global}/100. ${blockingGaps.length} décalage(s) important(s) identifié(s) : ${blockingGaps.map((g) => g.label).join(', ')}.`;
    risk = 'Risque modéré à élevé — la campagne sous-performerait sans adaptation.';
    recommendation = generateAdaptationReco(context, brief, scores, gapResult);
    kpis = ['Hypothèse à tester : une adaptation est nécessaire', 'Comparer les variantes avec un groupe de contrôle'];
  } else {
    action = 'OPTIMISER';
    intrinsicConfidence = 'Moyenne';
    justification = `Score de ${global}/100. ${gapResult.gaps.length} point(s) d’attention de sévérité moyenne : ${gapResult.gaps.map((g) => g.label).join(', ')}.`;
    risk = 'Risque modéré — la campagne peut partir, une optimisation améliorerait la résonance.';
    recommendation = generateOptimizationReco(context, brief, scores, gapResult);
    kpis = ['Hypothèse à tester : l’optimisation peut améliorer les résultats', 'Mesurer le message optimisé face à un groupe de contrôle'];
  }

  const confidence = capConfidence(intrinsicConfidence, dataLevel);
  const confidenceNote = confidence !== intrinsicConfidence
    ? `Confiance plafonnée par la fiabilité des données : ${scores.dataConfidence?.summary ?? ''}`
    : scores.dataConfidence?.summary ?? '';

  return {
    action,
    confidence,
    confidenceBasis: 'Confiance dans la décision, compte tenu de la netteté des décalages et de la fiabilité des signaux utilisés.',
    intrinsicConfidence,
    confidenceNote,
    justification,
    risk,
    recommendation,
    kpis,
    toneSuggestions: context.contextType.toneMatch || [],
    bestTiming: suggestTiming(context, brief),
    scoreGlobal: global,
  };
}

function buildActivationReco(context, scores) {
  const parts = ['Activez la campagne en l’état.'];
  if (Math.abs(context.contextIndex) >= DISCRIMINANT_THRESHOLD) {
    parts.push(`Le contexte est ${context.intensity} (index ${context.contextIndex}, ${context.weather.temperature} °C pour ${context.seasonalNormal?.expected} °C attendus) et votre brief va dans le même sens.`);
  } else {
    parts.push(`Le contexte météo est peu discriminant aujourd’hui (index ${context.contextIndex}) : l’activation repose surtout sur la cohérence audience, pression et timing, pas sur un effet météo.`);
  }
  if (scores.nonDiscriminant.length) {
    parts.push(`À noter : ${scores.nonDiscriminant.length} dimension(s) n’ont pas pu être mesurées pour ce brief (${scores.nonDiscriminant.join(', ')}).`);
  }
  return parts.join(' ');
}

function generateOptimizationReco(context, brief, scores, gapResult) {
  const parts = [];
  const subscores = scores.subscores;
  const nonMeasurable = new Set(scores.nonDiscriminant);

  if (!nonMeasurable.has('message') && subscores.message < 55) {
    parts.push(`Ajustez le registre du message vers un ton plus ${context.contextType.toneMatch[0] || 'adapté'}.`);
  }
  if (!nonMeasurable.has('timing') && subscores.timing < 55) {
    parts.push('Décalez l’envoi vers un créneau plus réceptif.');
  }
  if (!nonMeasurable.has('meteo') && subscores.meteo < 55) {
    parts.push('Adaptez le produit ou l’univers mis en avant au contexte relevé.');
  }
  if (!nonMeasurable.has('intention') && subscores.intention < 45) {
    parts.push('Le signal d’intention collective ne soutient pas cet angle : envisagez un axe produit plus proche de ce que votre audience consulte réellement.');
  }
  gapResult.gaps.forEach((gap) => parts.push(`Corrigez : ${gap.label.toLowerCase()}.`));

  if (nonMeasurable.size) {
    parts.push(`${nonMeasurable.size} dimension(s) non mesurable(s) pour ce brief (${[...nonMeasurable].join(', ')}) : les renseigner donnerait un arbitrage plus net.`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Quelques optimisations mineures possibles sur le timing et le ton.';
}

function generateAdaptationReco(context, brief, scores, gapResult) {
  const parts = [];

  if (context.contextIndex <= -DISCRIMINANT_THRESHOLD) {
    parts.push('Réorientez le message vers l’univers confort/intérieur et privilégiez un ton chaleureux ou inspirationnel.');
  } else if (context.contextIndex >= DISCRIMINANT_THRESHOLD) {
    parts.push('Dynamisez le message avec des références à l’extérieur et à l’activité, et adoptez un ton plus engageant.');
  }

  if (scores.subscores.audience < 50) {
    parts.push('Reconsidérez le ciblage audience ou réduisez la pression commerciale.');
  }

  gapResult.gaps
    .filter((gap) => ['critical', 'high'].includes(gap.severity))
    .forEach((gap) => parts.push(gap.detail));

  return parts.length > 0 ? parts.join(' ') : 'Une adaptation globale du message et du timing est recommandée.';
}

function suggestTiming(context, brief) {
  const channel = brief.channel || 'email';
  const index = context.contextIndex ?? 0;
  const cocooning = index <= -DISCRIMINANT_THRESHOLD;
  const energetic = index >= DISCRIMINANT_THRESHOLD;

  if (channel === 'email') {
    if (cocooning) return { slot: 'Soirée (18h-20h)', reason: 'Audience disponible en mode détente' };
    if (energetic) return { slot: 'Matin (8h-10h)', reason: 'Énergie maximale, planification de la journée' };
    return { slot: 'Matin (9h-11h)', reason: 'Créneau standard optimal pour l’email' };
  }
  if (channel === 'push' || channel === 'sms') {
    if (cocooning) return { slot: 'Fin d’après-midi (17h-19h)', reason: 'Transition vers le mode repos' };
    if (energetic) return { slot: 'Mi-journée (11h-13h)', reason: 'Pause, consultation mobile élevée' };
    return { slot: 'Mi-journée (12h-14h)', reason: 'Pic de consultation mobile' };
  }
  if (channel === 'paid-social') {
    if (cocooning) return { slot: 'Soirée (20h-22h)', reason: 'Scrolling social maximal en soirée' };
    return { slot: 'Fin de journée (17h-20h)', reason: 'Audience disponible sur les réseaux' };
  }

  return { slot: 'Matin (9h-11h)', reason: 'Créneau par défaut recommandé' };
}
