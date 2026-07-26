/**
 * Activation Plan — Module 7
 * Génère un plan d'activation structuré.
 */

export function generateActivationPlan(context, brief, scores, recommendation, variants) {
  const contextType = context.contextType.id;
  const channel = brief.channel || 'email';
  const audience = brief.audience || 'clients-actifs';
  const pressure = brief.pressure || 'moyen';
  const objective = brief.objective || 'engagement';

  const timing = computeTiming(context, channel);
  const segmentation = computeSegmentation(audience, pressure, scores);
  const actions = computeActions(channel, contextType, objective, variants, recommendation.action);
  const guardrail = computeGuardrail(pressure, audience);

  return {
    canal: {
      primary: channel,
      label: getChannelLabel(channel),
      reason: `Canal sélectionné dans le brief. ${getChannelReason(channel, contextType)}`,
    },
    segment: segmentation,
    timing,
    pressure: {
      level: pressure,
      label: pressure === 'fort' ? 'Forte' : pressure === 'faible' ? 'Faible' : 'Modérée',
      adjusted: guardrail.pressureAdjusted,
      reason: guardrail.reason,
    },
    actions,
    guardrail: guardrail.rules,
    estimatedReach: formatDeclaredAudience(brief.audienceSize),
    estimatedPerformance: {
      ctr: 'À mesurer après campagne',
      openRate: 'À mesurer après campagne',
      conversion: 'À mesurer après campagne',
    },
  };
}

function computeTiming(context, channel) {
  const contextType = context.contextType.id;
  const timeOfDay = context.timeOfDay.id;

  let optimalSlot, reason;

  if (channel === 'email') {
    if (contextType === 'cocooning') {
      optimalSlot = '18h00 - 20h00';
      reason = 'Audience en mode détente, taux d\'ouverture email élevé en soirée.';
    } else if (contextType === 'energy') {
      optimalSlot = '08h00 - 10h00';
      reason = 'Énergie matinale, planification de la journée.';
    } else {
      optimalSlot = '09h00 - 11h00';
      reason = 'Créneau standard optimal pour l\'email marketing.';
    }
  } else if (channel === 'push' || channel === 'sms') {
    if (contextType === 'cocooning') {
      optimalSlot = '17h00 - 19h00';
      reason = 'Transition travail/repos, consultation mobile élevée.';
    } else {
      optimalSlot = '12h00 - 14h00';
      reason = 'Pause déjeuner, pic de consultation mobile.';
    }
  } else if (channel === 'paid-social') {
    optimalSlot = contextType === 'cocooning' ? '20h00 - 22h00' : '17h00 - 20h00';
    reason = contextType === 'cocooning'
      ? 'Scrolling social maximal en soirée cocooning.'
      : 'Fin de journée, audience disponible sur les réseaux.';
  } else {
    optimalSlot = 'Continu';
    reason = 'Canal toujours actif (homepage, display).';
  }

  return {
    optimalSlot,
    reason,
    currentTime: context.timeOfDay.label,
    isOptimalNow: isCurrentTimeOptimal(timeOfDay, channel, contextType),
  };
}

function isCurrentTimeOptimal(timeOfDay, channel, contextType) {
  if (channel === 'email' && timeOfDay === 'morning') return true;
  if (channel === 'push' && timeOfDay === 'midday') return true;
  if (channel === 'paid-social' && ['evening', 'afternoon'].includes(timeOfDay)) return true;
  if (contextType === 'cocooning' && ['evening'].includes(timeOfDay)) return true;
  return false;
}

function computeSegmentation(audience, pressure, scores) {
  const segments = [];

  segments.push({
    id: audience,
    label: getAudienceLabel(audience),
    priority: 'primary',
    size: getAudienceSize(audience),
  });

  if (scores.global >= 70 && audience !== 'prospects') {
    segments.push({
      id: 'lookalike',
      label: 'Audience similaire (lookalike)',
      priority: 'secondary',
      size: 'À définir avec votre base CRM',
    });
  }

  return segments;
}

function computeActions(channel, contextType, objective, variants, recommendationAction) {
  if (recommendationAction === 'REPORTER') {
    return [
      {
        step: 1,
        action: 'Suspendre l’activation',
        detail: 'Ne pas diffuser la campagne tant que les contradictions produit, message et météo ne sont pas corrigées.',
        status: 'blocked',
      },
      {
        step: 2,
        action: 'Réécrire le brief',
        detail: `Reprendre le produit et le message avant de tester la variante « ${variants.bestVariant} » sur un nouveau contexte.`,
        status: 'pending',
      },
    ];
  }

  const actions = [];

  actions.push({
    step: 1,
    action: 'Préparer le contenu',
    detail: `Utiliser la variante "${variants.bestVariant}" recommandée par l'agent.`,
    status: 'ready',
  });

  actions.push({
    step: 2,
    action: 'Configurer le ciblage',
    detail: 'Appliquer la segmentation définie et les exclusions RGPD.',
    status: 'pending',
  });

  actions.push({
    step: 3,
    action: 'Planifier l\'envoi',
    detail: 'Programmer l\'activation sur le créneau optimal identifié.',
    status: 'pending',
  });

  actions.push({
    step: 4,
    action: 'Activer le test A/B',
    detail: 'Déployer les variantes sur les groupes test avant envoi massif.',
    status: 'pending',
  });

  actions.push({
    step: 5,
    action: 'Monitorer les KPIs',
    detail: `Suivre ${objective === 'conversion' ? 'le taux de conversion' : objective === 'trafic' ? 'le trafic généré' : 'l\'engagement'} en temps réel.`,
    status: 'pending',
  });

  return actions;
}

function computeGuardrail(pressure, audience) {
  const rules = [];
  let pressureAdjusted = pressure;
  let reason = '';

  if (pressure === 'fort' && ['clients-inactifs', 'prospects'].includes(audience)) {
    pressureAdjusted = 'moyen';
    reason = 'Pression réduite automatiquement : audience sensible au sur-sollicitation.';
    rules.push('Pression commerciale limitée à 1 message/semaine pour cette audience.');
  }

  rules.push('Respecter le cap de pression défini dans la politique CRM.');
  rules.push('Exclure les opt-out et les profils RGPD non-conformes.');
  rules.push('Appliquer la fenêtre d\'envoi légale (8h-21h pour SMS/push).');

  if (!reason) reason = 'Pression conforme aux guidelines.';

  return { pressureAdjusted, reason, rules };
}

function getChannelLabel(channel) {
  const labels = {
    email: 'Email',
    sms: 'SMS',
    push: 'Push notification',
    'paid-social': 'Social Ads',
    homepage: 'Homepage personnalisée',
    display: 'Display / Programmatique',
  };
  return labels[channel] || channel;
}

function getChannelReason(channel, contextType) {
  if (channel === 'email' && contextType === 'cocooning') return 'Format idéal pour du contenu immersif en contexte détente.';
  if (channel === 'push' && contextType === 'energy') return 'Format court adapté à une audience en mouvement.';
  if (channel === 'paid-social') return 'Bon reach pour la notoriété et le retargeting.';
  return 'Canal adapté à l\'objectif défini.';
}

function getAudienceLabel(audience) {
  const labels = {
    'clients-actifs': 'Clients actifs',
    'clients-inactifs': 'Clients inactifs',
    'paniers-abandonnes': 'Paniers abandonnés',
    'top-clients': 'Top clients (VIP)',
    'prospects': 'Prospects',
    'clients-chauds': 'Clients chauds',
  };
  return labels[audience] || audience;
}

function getAudienceSize() {
  return 'À définir avec votre base CRM';
}

function formatDeclaredAudience(audienceSize) {
  const total = Number(audienceSize);
  if (Number.isInteger(total) && total > 0) return `${total.toLocaleString('fr-FR')} contacts déclarés`;
  return 'À définir selon votre base CRM';
}
