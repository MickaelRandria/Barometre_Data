/**
 * Learning Loop - Module 10
 * Analyse uniquement des résultats de campagne saisis par l'utilisateur.
 */

function toNonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`Le champ « ${field} » doit être un entier positif ou nul.`);
  }
  return number;
}

function validateCampaignData(campaignData) {
  const sent = toNonNegativeInteger(campaignData?.sent, 'envoyés');
  const opened = toNonNegativeInteger(campaignData?.opened, 'ouverts');
  const clicked = toNonNegativeInteger(campaignData?.clicked, 'cliqués');
  const converted = toNonNegativeInteger(campaignData?.converted, 'convertis');
  const unsubscribed = toNonNegativeInteger(campaignData?.unsubscribed ?? 0, 'désabonnés');

  if (sent === 0) throw new Error('Le nombre d’envois doit être supérieur à zéro.');
  if (opened > sent) throw new Error('Le nombre d’ouverts ne peut pas dépasser le nombre d’envois.');
  if (clicked > sent) throw new Error('Le nombre de clics ne peut pas dépasser le nombre d’envois.');
  if (converted > sent) throw new Error('Le nombre de conversions ne peut pas dépasser le nombre d’envois.');
  if (unsubscribed > sent) throw new Error('Le nombre de désabonnements ne peut pas dépasser le nombre d’envois.');

  return { sent, opened, clicked, converted, unsubscribed, variant: campaignData?.variant || 'non renseignée' };
}

function rate(value, base, decimals = 1) {
  return Number(((value / base) * 100).toFixed(decimals));
}

function computeMetrics(data) {
  return {
    sent: data.sent,
    opened: data.opened,
    clicked: data.clicked,
    converted: data.converted,
    unsubscribed: data.unsubscribed,
    openRate: rate(data.opened, data.sent),
    ctr: rate(data.clicked, data.sent),
    ctor: data.opened > 0 ? rate(data.clicked, data.opened) : 0,
    conversionRate: rate(data.converted, data.sent, 2),
    unsubscribeRate: rate(data.unsubscribed, data.sent, 2),
  };
}

function evaluatePerformance(metrics) {
  const openContribution = Math.min(25, (metrics.openRate / 50) * 25);
  const ctrContribution = Math.min(30, (metrics.ctr / 10) * 30);
  const conversionContribution = Math.min(25, (metrics.conversionRate / 5) * 25);
  const unsubscribeContribution = Math.max(0, 20 - Math.min(20, metrics.unsubscribeRate * 20));
  const overallScore = Math.round(openContribution + ctrContribution + conversionContribution + unsubscribeContribution);

  return {
    overallScore,
    verdict: 'Score calculé à partir des résultats saisis. Interprétez-le avec vos repères historiques de campagne.',
    methodology: 'Formule transparente : ouverture sur 25 points, CTR sur 30 points, conversion sur 25 points et désabonnement sur 20 points. Chaque composante est plafonnée à son poids.',
    contributions: {
      openRate: Number(openContribution.toFixed(1)),
      ctr: Number(ctrContribution.toFixed(1)),
      conversionRate: Number(conversionContribution.toFixed(1)),
      unsubscribeRate: Number(unsubscribeContribution.toFixed(1)),
    },
  };
}

function extractLearnings(metrics, variant) {
  const learnings = [
    {
      type: 'neutral',
      insight: `Résultats saisis pour la variante « ${variant} » : ${metrics.openRate}% d’ouverture, ${metrics.ctr}% de CTR et ${metrics.conversionRate}% de conversion.`,
      action: 'Comparez ces taux à vos résultats historiques et à un groupe de contrôle avant toute généralisation.',
    },
  ];

  if (metrics.unsubscribeRate > 0.3) {
    learnings.push({
      type: 'negative',
      insight: `Le taux de désabonnement saisi est de ${metrics.unsubscribeRate}%.`,
      action: 'Vérifiez la pression commerciale, le ciblage et les motifs de désinscription avant le prochain envoi.',
    });
  }

  if (metrics.ctor < 10 && metrics.opened > 0) {
    learnings.push({
      type: 'negative',
      insight: `Le CTOR calculé est de ${metrics.ctor}%.`,
      action: 'Analysez la clarté du contenu et du CTA avec un test de variante contrôlé.',
    });
  }

  return learnings;
}

export function analyzeCampaignResults(campaignData) {
  const data = validateCampaignData(campaignData);
  const metrics = computeMetrics(data);
  const performance = evaluatePerformance(metrics);
  const learnings = extractLearnings(metrics, data.variant);

  return {
    status: 'calculated_from_user_input',
    metrics,
    performance,
    learnings,
    feedback: 'Ces enseignements proviennent exclusivement des résultats saisis dans ce formulaire.',
  };
}
