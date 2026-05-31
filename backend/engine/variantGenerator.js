/**
 * Variant Generator — Module 6
 * Génère 3 variantes de message : standard, contextualisé, agentique optimisé.
 */

const TONE_TEMPLATES = {
  chaleureux: {
    openers: ['Envie de douceur ?', 'Un moment rien qu\'à vous.', 'Offrez-vous du réconfort.'],
    closers: ['Profitez de ce moment.', 'Laissez-vous tenter.', 'Vous le méritez.'],
  },
  dynamique: {
    openers: ['C\'est le moment !', 'Ne manquez pas ça.', 'L\'énergie est là !'],
    closers: ['Foncez !', 'À vous de jouer.', 'Saisissez l\'instant.'],
  },
  urgent: {
    openers: ['Dernières heures !', 'Ne passez pas à côté.', 'Maintenant ou jamais.'],
    closers: ['Plus que quelques places.', 'Offre limitée.', 'N\'attendez plus.'],
  },
  inspirationnel: {
    openers: ['Et si vous osiez ?', 'Imaginez...', 'Découvrez un nouvel horizon.'],
    closers: ['Laissez-vous inspirer.', 'L\'aventure commence ici.', 'Explorez sans limites.'],
  },
  rassurant: {
    openers: ['On est là pour vous.', 'En toute sérénité.', 'Faites-vous confiance.'],
    closers: ['Sans engagement.', 'Satisfaction garantie.', 'On vous accompagne.'],
  },
  promotionnel: {
    openers: ['Offre exclusive !', 'Rien que pour vous.', 'Économisez maintenant.'],
    closers: ['Code promo inclus.', 'Livraison offerte.', 'Profitez-en vite.'],
  },
  sobre: {
    openers: ['Information importante.', 'À noter.', 'Pour votre information.'],
    closers: ['Bonne continuation.', 'À bientôt.', 'Cordialement.'],
  },
};

const CONTEXT_ENRICHMENTS = {
  cocooning: {
    ambiance: ['au chaud', 'confortablement installé(e)', 'dans votre cocon'],
    imagery: ['plaid', 'tasse fumante', 'lumière tamisée', 'soirée au calme'],
    verbs: ['se lover', 'savourer', 'se détendre', 'profiter'],
  },
  energy: {
    ambiance: ['sous le soleil', 'en plein air', 'dehors'],
    imagery: ['ciel bleu', 'énergie', 'mouvement', 'liberté'],
    verbs: ['explorer', 's\'évader', 'bouger', 'découvrir'],
  },
  urgency: {
    ambiance: ['rapidement', 'en un clic', 'sans attendre'],
    imagery: ['efficacité', 'simplicité', 'gain de temps'],
    verbs: ['agir', 'commander', 'réserver', 'sécuriser'],
  },
  inspiration: {
    ambiance: ['à votre rythme', 'en toute curiosité', 'librement'],
    imagery: ['tendances', 'nouveautés', 'exclusivités', 'sélection'],
    verbs: ['découvrir', 'explorer', 'imaginer', 's\'inspirer'],
  },
  neutral: {
    ambiance: ['aujourd\'hui', 'cette semaine', 'pour vous'],
    imagery: ['sélection', 'actualités', 'nouveautés'],
    verbs: ['découvrir', 'profiter', 'explorer'],
  },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateVariants(context, brief, scores, recommendation) {
  const contextType = context.contextType.id;
  const originalMessage = brief.message || '';
  const product = brief.product || 'notre sélection';
  const tone = brief.tone || 'sobre';
  const channel = brief.channel || 'email';
  const audience = brief.audience || '';

  const toneData = TONE_TEMPLATES[tone] || TONE_TEMPLATES.sobre;
  const contextData = CONTEXT_ENRICHMENTS[contextType] || CONTEXT_ENRICHMENTS.neutral;
  const bestTone = context.contextType.toneMatch[0] || tone;
  const bestToneData = TONE_TEMPLATES[bestTone] || TONE_TEMPLATES.sobre;
  const bestContextData = contextData;

  const maxLength = getMaxLength(channel);

  const variant1 = {
    id: 'standard',
    label: 'Standard (original)',
    description: 'Votre message tel quel, sans adaptation contextuelle.',
    message: originalMessage || `${pickRandom(toneData.openers)} Découvrez ${product}. ${pickRandom(toneData.closers)}`,
    tone,
    contextAdapted: false,
    expectedLift: '0% (baseline)',
    score: scores.subscores.message,
  };

  const variant2Message = buildContextualizedMessage(originalMessage, product, tone, toneData, contextData, channel);
  const variant2 = {
    id: 'contextualized',
    label: 'Contextualisé',
    description: `Message adapté au contexte ${context.contextType.label} détecté.`,
    message: truncate(variant2Message, maxLength),
    tone,
    contextAdapted: true,
    expectedLift: '+8-15% CTR estimé',
    score: Math.min(100, scores.subscores.message + 12),
  };

  const variant3Message = buildAgenticMessage(product, bestTone, bestToneData, bestContextData, audience, channel);
  const variant3 = {
    id: 'agentic',
    label: 'Agentique (optimisé)',
    description: `Message généré par l'agent avec ton ${bestTone} optimal pour le contexte.`,
    message: truncate(variant3Message, maxLength),
    tone: bestTone,
    contextAdapted: true,
    expectedLift: '+15-30% CTR estimé',
    score: Math.min(100, scores.subscores.message + 22),
  };

  return {
    variants: [variant1, variant2, variant3],
    bestVariant: 'agentic',
    contextType: context.contextType.label,
    reasoning: `Le contexte ${context.contextType.label} favorise un ton ${bestTone}. La variante agentique maximise l'alignement contextuel.`,
  };
}

function buildContextualizedMessage(original, product, tone, toneData, contextData, channel) {
  if (original) {
    const ambiance = pickRandom(contextData.ambiance);
    const verb = pickRandom(contextData.verbs);
    return `${original} — Idéal pour ${verb} ${ambiance}.`;
  }

  const opener = pickRandom(toneData.openers);
  const ambiance = pickRandom(contextData.ambiance);
  const closer = pickRandom(toneData.closers);
  return `${opener} ${ambiance}, découvrez ${product}. ${closer}`;
}

function buildAgenticMessage(product, bestTone, toneData, contextData, audience, channel) {
  const opener = pickRandom(toneData.openers);
  const ambiance = pickRandom(contextData.ambiance);
  const imagery = pickRandom(contextData.imagery);
  const verb = pickRandom(contextData.verbs);
  const closer = pickRandom(toneData.closers);

  if (channel === 'sms' || channel === 'push') {
    return `${opener} ${product} — ${verb} ${ambiance}. ${closer}`;
  }

  return `${opener} ${ambiance}, c'est le moment de ${verb} ${product}. ${imagery} au rendez-vous. ${closer}`;
}

function getMaxLength(channel) {
  switch (channel) {
    case 'sms': return 160;
    case 'push': return 120;
    case 'email': return 500;
    default: return 300;
  }
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + '...';
}
