/**
 * Variant Generator - Module 6
 * Produit des variantes réécrites et sans projection de performance chiffrée.
 */

import { detectMessageWeatherContradictions, detectSeasonalProductMismatch } from './weatherConsistency.js';

function productLabel(product) {
  return String(product || 'notre sélection').replace(/\s+/g, ' ').trim();
}

function buildContextualizedMessage(context, product, hasCriticalMismatch) {
  if (hasCriticalMismatch) {
    return `Découvrez « ${product} ». Cette prise de parole est à programmer lorsque le contexte sera plus adapté.`;
  }

  if (context.contextType.id === 'cocooning') {
    return `Découvrez « ${product} », une sélection pensée pour vos moments chez vous.`;
  }
  if (context.contextType.id === 'energy') {
    return `Découvrez « ${product} », une sélection conçue pour accompagner vos envies du moment.`;
  }
  return `Découvrez « ${product} », une sélection à explorer selon vos envies.`;
}

function buildAgenticMessage(context, product, hasCriticalMismatch) {
  if (hasCriticalMismatch) {
    return `La météo actuelle ne favorise pas « ${product} ». Reportez cette prise de parole et privilégiez une offre adaptée au contexte.`;
  }

  if (context.contextType.id === 'cocooning') {
    return `Prenez le temps de découvrir « ${product} ». Une sélection idéale pour une parenthèse de douceur à la maison.`;
  }
  if (context.contextType.id === 'energy') {
    return `Découvrez « ${product} » et choisissez une sélection en accord avec le rythme de votre journée.`;
  }
  return `Découvrez « ${product} » et trouvez la sélection qui vous ressemble.`;
}

export function getMaxLength(channel) {
  if (channel === 'sms') return 160;
  if (channel === 'push') return 120;
  if (channel === 'email') return 500;
  return 300;
}

export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function generateVariants(context, brief, scores, recommendation) {
  const product = productLabel(brief.product);
  const originalMessage = String(brief.message || '').trim() || `Découvrez « ${product} ».`;
  const channel = brief.channel || 'email';
  const productMismatch = detectSeasonalProductMismatch(product, context, brief.message);
  const messageContradictions = detectMessageWeatherContradictions(brief.message, context.weather);
  // Seuls les décalages critiques ou forts justifient de recommander un report
  // dans la variante : un décalage « moyen » ne doit pas geler la prise de parole.
  const hasCriticalMismatch = Boolean(
    (productMismatch && ['critical', 'high'].includes(productMismatch.severity))
    || messageContradictions.some((c) => ['critical', 'high'].includes(c.severity)),
  );
  const contextualized = truncate(buildContextualizedMessage(context, product, hasCriticalMismatch), getMaxLength(channel));
  const agentic = truncate(buildAgenticMessage(context, product, hasCriticalMismatch), getMaxLength(channel));

  return {
    variants: [
      {
        id: 'standard',
        label: 'Standard (original)',
        description: 'Message d’origine, sans adaptation contextuelle.',
        message: originalMessage,
        tone: brief.tone || 'sobre',
        contextAdapted: false,
        expectedLift: 'Sans projection chiffrée',
        score: null,
        scoreBasis: 'Aucun score de variante n’est calculé sans données de campagne mesurées.',
      },
      {
        id: 'contextualized',
        label: 'Contextualisée',
        description: hasCriticalMismatch ? 'Réécriture qui retire les affirmations incompatibles avec la météo réelle.' : `Réécriture adaptée au contexte ${context.contextType.label}.`,
        message: contextualized,
        tone: context.contextType.toneMatch[0] || brief.tone || 'sobre',
        contextAdapted: true,
        expectedLift: 'Hypothèse à tester en A/B',
        score: null,
        scoreBasis: 'La pertinence doit être validée par un test avec groupe de contrôle.',
      },
      {
        id: 'agentic',
        label: 'Agentique',
        description: hasCriticalMismatch ? 'Réécriture priorisant la cohérence avec la météo et la recommandation de report.' : 'Réécriture complète avec un ton adapté au contexte.',
        message: agentic,
        tone: context.contextType.toneMatch[0] || brief.tone || 'sobre',
        contextAdapted: true,
        expectedLift: 'Hypothèse à tester en A/B',
        score: null,
        scoreBasis: 'La pertinence doit être validée par un test avec groupe de contrôle.',
      },
    ],
    bestVariant: hasCriticalMismatch ? 'agentic' : 'contextualized',
    contextType: context.contextType.label,
    reasoning: hasCriticalMismatch
      ? 'Une contradiction avec la météo réelle a été détectée. Les variantes adaptées retirent cette affirmation et recommandent un report si nécessaire.'
      : `Le contexte ${context.contextType.label} guide la réécriture. Les résultats doivent être mesurés avant de conclure à un gain.`,
  };
}
