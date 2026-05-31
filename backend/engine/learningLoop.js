/**
 * Learning Loop — Module 10
 * Simule l'analyse post-campagne et le feedback loop.
 */

export function analyzeCampaignResults(campaignData, originalScores) {
  const {
    sent = 10000,
    opened = 2200,
    clicked = 350,
    converted = 45,
    unsubscribed = 12,
    variant = 'standard',
  } = campaignData || {};

  const metrics = computeMetrics(sent, opened, clicked, converted, unsubscribed);
  const performance = evaluatePerformance(metrics, originalScores);
  const learnings = extractLearnings(metrics, performance, variant);
  const nextActions = suggestNextActions(performance, learnings);

  return {
    metrics,
    performance,
    learnings,
    nextActions,
    feedback: generateFeedbackSummary(performance, learnings),
  };
}

function computeMetrics(sent, opened, clicked, converted, unsubscribed) {
  return {
    sent,
    opened,
    clicked,
    converted,
    unsubscribed,
    openRate: ((opened / sent) * 100).toFixed(1),
    ctr: ((clicked / sent) * 100).toFixed(1),
    ctor: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0',
    conversionRate: ((converted / sent) * 100).toFixed(2),
    unsubscribeRate: ((unsubscribed / sent) * 100).toFixed(2),
  };
}

function evaluatePerformance(metrics, originalScores) {
  const benchmarks = {
    openRate: 22.0,
    ctr: 3.2,
    conversionRate: 0.45,
    unsubscribeRate: 0.25,
  };

  const openDelta = parseFloat(metrics.openRate) - benchmarks.openRate;
  const ctrDelta = parseFloat(metrics.ctr) - benchmarks.ctr;
  const convDelta = parseFloat(metrics.conversionRate) - benchmarks.conversionRate;
  const unsubDelta = parseFloat(metrics.unsubscribeRate) - benchmarks.unsubscribeRate;

  const overallScore = (
    (openDelta > 0 ? 25 : openDelta > -5 ? 15 : 5) +
    (ctrDelta > 0 ? 30 : ctrDelta > -1 ? 18 : 5) +
    (convDelta > 0 ? 25 : convDelta > -0.2 ? 15 : 5) +
    (unsubDelta < 0 ? 20 : unsubDelta < 0.1 ? 12 : 0)
  );

  let verdict;
  if (overallScore >= 80) verdict = 'Excellente performance — l\'approche contextuelle a surperformé.';
  else if (overallScore >= 60) verdict = 'Bonne performance — résultats conformes aux attentes.';
  else if (overallScore >= 40) verdict = 'Performance moyenne — optimisation possible.';
  else verdict = 'Sous-performance — l\'approche nécessite une révision.';

  return {
    overallScore,
    verdict,
    vsBenchmark: {
      openRate: { value: openDelta.toFixed(1), status: openDelta > 0 ? 'above' : 'below' },
      ctr: { value: ctrDelta.toFixed(1), status: ctrDelta > 0 ? 'above' : 'below' },
      conversionRate: { value: convDelta.toFixed(2), status: convDelta > 0 ? 'above' : 'below' },
      unsubscribeRate: { value: unsubDelta.toFixed(2), status: unsubDelta < 0.1 ? 'ok' : 'alert' },
    },
    predictionAccuracy: computePredictionAccuracy(originalScores, overallScore),
  };
}

function computePredictionAccuracy(originalScores, actualPerformance) {
  if (!originalScores) return { accuracy: 'N/A', note: 'Pas de score prédictif initial.' };

  const predictedPerf = originalScores.global;
  const diff = Math.abs(predictedPerf - actualPerformance);

  if (diff <= 10) return { accuracy: 'Haute', note: `Écart de ${diff} points — prédiction fiable.` };
  if (diff <= 20) return { accuracy: 'Moyenne', note: `Écart de ${diff} points — calibration à affiner.` };
  return { accuracy: 'Faible', note: `Écart de ${diff} points — modèle à recalibrer.` };
}

function extractLearnings(metrics, performance, variant) {
  const learnings = [];

  if (parseFloat(metrics.ctr) > 4.0) {
    learnings.push({
      type: 'positive',
      insight: 'CTR supérieur à 4% — le message a fortement résonné avec l\'audience.',
      action: 'Capitaliser sur ce type de formulation pour les prochaines campagnes.',
    });
  }

  if (parseFloat(metrics.unsubscribeRate) > 0.3) {
    learnings.push({
      type: 'negative',
      insight: 'Taux de désabonnement élevé — pression perçue comme trop forte.',
      action: 'Réduire la fréquence d\'envoi pour ce segment. Revoir le cap de pression.',
    });
  }

  if (parseFloat(metrics.openRate) > 25) {
    learnings.push({
      type: 'positive',
      insight: 'Taux d\'ouverture élevé — l\'objet/preview est performant.',
      action: 'Réutiliser ce format d\'objet pour les prochains envois.',
    });
  }

  if (parseFloat(metrics.ctor) < 10) {
    learnings.push({
      type: 'negative',
      insight: 'CTOR faible — le contenu ne convertit pas après ouverture.',
      action: 'Revoir le body du message : CTA plus visible, proposition de valeur plus claire.',
    });
  }

  if (variant === 'agentic' && performance.overallScore >= 70) {
    learnings.push({
      type: 'positive',
      insight: 'La variante agentique (optimisée par contexte) a surperformé.',
      action: 'Valider l\'approche contextuelle pour ce segment/canal.',
    });
  }

  if (learnings.length === 0) {
    learnings.push({
      type: 'neutral',
      insight: 'Performance dans la norme — pas de signal fort à retenir.',
      action: 'Continuer avec la stratégie actuelle, tester de nouvelles variantes.',
    });
  }

  return learnings;
}

function suggestNextActions(performance, learnings) {
  const actions = [];

  if (performance.overallScore >= 70) {
    actions.push({
      priority: 'high',
      action: 'Généraliser la variante gagnante',
      detail: 'Déployer le message performant sur l\'ensemble du segment.',
      timeline: 'Immédiat',
    });
  }

  const negatives = learnings.filter(l => l.type === 'negative');
  if (negatives.length > 0) {
    actions.push({
      priority: 'high',
      action: 'Corriger les points faibles',
      detail: negatives.map(n => n.action).join(' '),
      timeline: 'Avant prochaine campagne',
    });
  }

  actions.push({
    priority: 'medium',
    action: 'Affiner le modèle prédictif',
    detail: `Accuracy : ${performance.predictionAccuracy.accuracy}. ${performance.predictionAccuracy.note}`,
    timeline: 'Continu',
  });

  actions.push({
    priority: 'low',
    action: 'Documenter les learnings',
    detail: 'Enregistrer les résultats pour enrichir la base de connaissances.',
    timeline: 'Post-campagne',
  });

  return actions;
}

function generateFeedbackSummary(performance, learnings) {
  const positives = learnings.filter(l => l.type === 'positive').length;
  const negatives = learnings.filter(l => l.type === 'negative').length;

  if (performance.overallScore >= 70) {
    return `Campagne réussie (score ${performance.overallScore}/100). ${positives} signal(s) positif(s) identifié(s). L'approche contextuelle est validée.`;
  }
  if (performance.overallScore >= 50) {
    return `Performance correcte (score ${performance.overallScore}/100). ${negatives > 0 ? `${negatives} point(s) à améliorer.` : 'Pas de signal d\'alerte.'} Optimisation possible.`;
  }
  return `Sous-performance détectée (score ${performance.overallScore}/100). ${negatives} problème(s) identifié(s). Révision de l'approche recommandée.`;
}

export function simulateResults(scores, variant = 'standard') {
  const baseMetrics = {
    standard: { openRate: 22, ctr: 3.2, convRate: 0.45 },
    contextualized: { openRate: 26, ctr: 4.1, convRate: 0.58 },
    agentic: { openRate: 29, ctr: 5.3, convRate: 0.72 },
  };

  const base = baseMetrics[variant] || baseMetrics.standard;
  const scoreBonus = (scores.global - 50) / 100;

  const sent = 10000;
  const opened = Math.round(sent * (base.openRate + scoreBonus * 5) / 100);
  const clicked = Math.round(sent * (base.ctr + scoreBonus * 2) / 100);
  const converted = Math.round(sent * (base.convRate + scoreBonus * 0.3) / 100);
  const unsubscribed = Math.round(sent * (0.15 + (variant === 'standard' ? 0.05 : 0)) / 100);

  return { sent, opened, clicked, converted, unsubscribed, variant };
}
