/**
 * Contextual Gap Detection — Module 4
 * Détecte le décalage entre contexte réel et message de la marque.
 */

export function detectContextualGap(context, brief, scores) {
  const contextType = context.contextType.id;
  const tone = brief.tone || '';
  const message = (brief.message || '').toLowerCase();
  const product = (brief.product || '').toLowerCase();
  const messageScore = scores.subscores.message;

  const gaps = [];

  // Détection gap ton vs contexte
  if (contextType === 'cocooning' && ['dynamique', 'urgent'].includes(tone)) {
    gaps.push({
      type: 'tone_mismatch',
      severity: 'high',
      label: 'Décalage de ton',
      detail: 'Le ton choisi est trop énergique pour un contexte cocooning. Les consommateurs en contexte froid/intérieur sont plus réceptifs à un ton chaleureux ou inspirationnel.',
    });
  }
  if (contextType === 'energy' && ['rassurant', 'chaleureux'].includes(tone)) {
    gaps.push({
      type: 'tone_mismatch',
      severity: 'medium',
      label: 'Décalage de ton',
      detail: 'Le ton est trop posé pour un contexte énergie/sortie. Un ton plus dynamique pourrait mieux capter l\'attention.',
    });
  }

  // Détection gap message vs contexte
  const warmWords = ['sortie', 'dehors', 'profiter du soleil', 'extérieur', 'plein air', 'été'];
  const coldWords = ['cocooning', 'chez vous', 'au chaud', 'intérieur', 'confort'];

  if (contextType === 'cocooning') {
    const hasWarmMessage = warmWords.some(w => message.includes(w));
    if (hasWarmMessage) {
      gaps.push({
        type: 'message_mismatch',
        severity: 'high',
        label: 'Message inadapté au contexte',
        detail: 'Le message évoque la sortie ou l\'extérieur alors que le contexte est cocooning. Risque de dissonance cognitive pour le destinataire.',
      });
    }
  }
  if (contextType === 'energy') {
    const hasColdMessage = coldWords.some(w => message.includes(w));
    if (hasColdMessage) {
      gaps.push({
        type: 'message_mismatch',
        severity: 'medium',
        label: 'Message inadapté au contexte',
        detail: 'Le message évoque le confort intérieur alors que le contexte est énergie/sortie. Le message pourrait sembler hors sujet.',
      });
    }
  }

  // Détection gap pression vs audience
  if (brief.pressure === 'fort' && brief.audience === 'clients-inactifs') {
    gaps.push({
      type: 'pressure_mismatch',
      severity: 'high',
      label: 'Pression excessive',
      detail: 'Pression commerciale forte sur une audience inactive — risque élevé de désabonnement ou perception négative.',
    });
  }

  // Détection gap canal vs contexte
  if (['sms', 'push'].includes(brief.channel) && contextType === 'cocooning' && tone === 'urgent') {
    gaps.push({
      type: 'channel_mismatch',
      severity: 'medium',
      label: 'Canal intrusif en contexte doux',
      detail: 'Un canal push/SMS avec un ton urgent dans un contexte cocooning peut être perçu comme agressif.',
    });
  }

  // Résumé
  const hasGap = gaps.length > 0;
  const maxSeverity = gaps.reduce((max, g) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[g.severity] > order[max] ? g.severity : max;
  }, 'low');

  const gapLevel = !hasGap ? 'none' : maxSeverity === 'high' ? 'fort' : 'moyen';

  let summary, risk, recommendation;

  if (!hasGap) {
    summary = 'Alignement contextuel correct. Aucun décalage significatif détecté entre le message, le contexte et l\'audience.';
    risk = 'Risque faible — le message est cohérent avec les conditions actuelles.';
    recommendation = 'Vous pouvez activer la campagne en l\'état. Surveillez les KPI pour confirmer.';
  } else if (gapLevel === 'fort') {
    summary = `Contextual Gap fort détecté. ${gaps.length} décalage(s) identifié(s) entre votre campagne et le contexte actuel.`;
    risk = 'Risque élevé de baisse du CTR, faible résonance émotionnelle, message perçu comme peu pertinent.';
    recommendation = 'Adaptation fortement recommandée avant activation. Consultez les variantes proposées par l\'agent.';
  } else {
    summary = `Contextual Gap moyen détecté. ${gaps.length} point(s) d'attention identifié(s).`;
    risk = 'Risque modéré — le message pourrait sous-performer par rapport à une version contextualisée.';
    recommendation = 'Optimisation recommandée. Un ajustement de ton ou de timing améliorerait la réceptivité.';
  }

  return {
    hasGap,
    gapLevel,
    gaps,
    summary,
    risk,
    recommendation,
    contextReal: `${context.weather.description} · ${context.weather.temperature}°C · ${context.season.label}`,
    messageActual: brief.message || 'Non renseigné',
  };
}
