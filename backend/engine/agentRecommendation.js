/**
 * Agent Recommendation — Module 5
 * Génère une recommandation structurée basée sur le contexte, les scores et les gaps.
 */

export function generateRecommendation(context, brief, scores, gapResult) {
  const contextType = context.contextType.id;
  const global = scores.global;
  const hasGap = gapResult.hasGap;
  const gapLevel = gapResult.gapLevel;

  let action, confidence, justification, risk, recommendation, kpis;

  if (global >= 81 && !hasGap) {
    action = 'ACTIVER';
    confidence = 'Très élevée';
    justification = `Le score global de ${global}/100 indique un alignement optimal entre votre campagne et le contexte actuel. Aucun décalage détecté.`;
    risk = 'Risque minimal — conditions idéales pour l\'activation.';
    recommendation = 'Activez la campagne en l\'état. Les conditions contextuelles sont optimales pour maximiser la réceptivité de votre audience.';
    kpis = ['CTR attendu : +15-25% vs moyenne', 'Taux d\'ouverture : supérieur à la baseline', 'Engagement : fort'];
  } else if (global >= 66 && gapLevel !== 'fort') {
    action = 'OPTIMISER';
    confidence = 'Élevée';
    justification = `Score de ${global}/100 — bon alignement avec des marges d'amélioration. ${hasGap ? `${gapResult.gaps.length} point(s) d'attention identifié(s).` : ''}`;
    risk = 'Risque faible à modéré — quelques ajustements amélioreraient les performances.';
    recommendation = generateOptimizationReco(context, brief, scores, gapResult);
    kpis = ['CTR attendu : +5-15% vs moyenne avec optimisation', 'Potentiel d\'amélioration identifié sur le message'];
  } else if (global >= 41) {
    action = 'ADAPTER';
    confidence = 'Moyenne';
    justification = `Score de ${global}/100 — cohérence moyenne détectée. ${hasGap ? `Gap ${gapLevel} identifié : ${gapResult.gaps.map(g => g.label).join(', ')}.` : 'Plusieurs axes d\'optimisation possibles.'}`;
    risk = 'Risque modéré — la campagne pourrait sous-performer sans adaptation.';
    recommendation = generateAdaptationReco(context, brief, scores, gapResult);
    kpis = ['CTR attendu : baseline sans adaptation', 'Potentiel : +10-20% avec adaptation contextuelle'];
  } else {
    action = 'REPORTER';
    confidence = 'Faible';
    justification = `Score de ${global}/100 — faible cohérence contextuelle. ${hasGap ? `Gap fort détecté : ${gapResult.gaps.map(g => g.label).join(', ')}.` : 'Le contexte actuel n\'est pas favorable.'}`;
    risk = 'Risque élevé — activation en l\'état risque un ROI négatif et une dégradation de l\'image.';
    recommendation = 'Reportez l\'activation ou procédez à une refonte complète du message. Le contexte actuel est défavorable à votre campagne.';
    kpis = ['CTR attendu : inférieur à la baseline', 'Risque de désabonnement élevé', 'ROI potentiellement négatif'];
  }

  const toneSuggestions = context.contextType.toneMatch || [];
  const bestTiming = suggestTiming(context, brief);

  return {
    action,
    confidence,
    justification,
    risk,
    recommendation,
    kpis,
    toneSuggestions,
    bestTiming,
    scoreGlobal: global,
  };
}

function generateOptimizationReco(context, brief, scores, gapResult) {
  const parts = [];
  const subscores = scores.subscores;

  if (subscores.message < 60) {
    parts.push(`Ajustez le ton de votre message vers un registre plus ${context.contextType.toneMatch[0] || 'adapté'}.`);
  }
  if (subscores.timing < 60) {
    parts.push('Décalez l\'envoi vers un créneau plus réceptif.');
  }
  if (subscores.meteo < 60) {
    parts.push('Adaptez le produit/univers mis en avant au contexte météo actuel.');
  }

  if (gapResult.hasGap) {
    const topGap = gapResult.gaps[0];
    parts.push(`Corrigez le ${topGap.label.toLowerCase()} identifié.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Quelques optimisations mineures possibles sur le timing et le ton.';
}

function generateAdaptationReco(context, brief, scores, gapResult) {
  const contextType = context.contextType.id;
  const parts = [];

  if (contextType === 'cocooning') {
    parts.push('Réorientez votre message vers l\'univers confort/intérieur.');
    parts.push('Privilégiez un ton chaleureux ou inspirationnel.');
  } else if (contextType === 'energy') {
    parts.push('Dynamisez votre message avec des références à l\'extérieur et l\'activité.');
    parts.push('Adoptez un ton plus dynamique et engageant.');
  }

  if (scores.subscores.audience < 50) {
    parts.push('Reconsidérez le ciblage audience ou réduisez la pression commerciale.');
  }

  if (gapResult.hasGap && gapResult.gapLevel === 'fort') {
    parts.push('Les décalages identifiés nécessitent une adaptation significative avant activation.');
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Une adaptation globale du message et du timing est recommandée.';
}

function suggestTiming(context, brief) {
  const contextType = context.contextType.id;
  const channel = brief.channel || 'email';

  if (channel === 'email') {
    if (contextType === 'cocooning') return { slot: 'Soirée (18h-20h)', reason: 'Audience disponible en mode détente' };
    if (contextType === 'energy') return { slot: 'Matin (8h-10h)', reason: 'Énergie maximale, planification de la journée' };
    return { slot: 'Matin (9h-11h)', reason: 'Créneau standard optimal pour l\'email' };
  }
  if (channel === 'push' || channel === 'sms') {
    if (contextType === 'cocooning') return { slot: 'Fin d\'après-midi (17h-19h)', reason: 'Transition vers le mode repos' };
    if (contextType === 'energy') return { slot: 'Mi-journée (11h-13h)', reason: 'Pause, consultation mobile élevée' };
    return { slot: 'Mi-journée (12h-14h)', reason: 'Pic de consultation mobile' };
  }
  if (channel === 'paid-social') {
    if (contextType === 'cocooning') return { slot: 'Soirée (20h-22h)', reason: 'Scrolling social maximal en soirée' };
    return { slot: 'Fin de journée (17h-20h)', reason: 'Audience disponible sur les réseaux' };
  }

  return { slot: 'Matin (9h-11h)', reason: 'Créneau par défaut recommandé' };
}
