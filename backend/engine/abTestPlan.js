/**
 * A/B Test Plan - Module 8
 * Prépare un protocole sans inventer la taille de population ou le gain attendu.
 */

export function generateABTestPlan(context, brief, scores, variants) {
  const channel = brief.channel || 'email';
  const objective = brief.objective || 'engagement';
  const population = computePopulation(brief.audienceSize);
  const duration = computeDuration(channel);

  return {
    hypothesis: {
      h0: `Le message original performe de manière identique quelle que soit l’adaptation au contexte ${context.contextType.label}.`,
      h1: 'Une variante adaptée au contexte produit un écart mesurable par rapport au groupe de contrôle.',
      rationale: `Le sous-score Message/Ton est de ${scores.subscores.message}/100. Ce chiffre est calculé par le moteur de cohérence, pas par une campagne mesurée.`,
    },
    groups: variants.variants.map((variant, index) => ({
      id: String.fromCharCode(65 + index),
      label: `Groupe ${String.fromCharCode(65 + index)} : ${variant.label}`,
      variant: variant.id,
      allocation: 'À définir selon la base CRM',
      description: variant.description,
    })),
    population,
    duration,
    kpis: selectKPIs(objective, channel),
    successCriteria: [
      { metric: 'KPI principal', threshold: 'Écart à définir avec votre référence historique', confidence: 'À calculer après saisie de la taille de base et du MDE' },
      { metric: 'Désabonnement', threshold: 'Seuil d’alerte à définir dans votre politique CRM', confidence: 'Suivi continu' },
    ],
    methodology: 'Protocole A/B/C à paramétrer avec les effectifs réels de votre CRM.',
    statisticalSignificance: 'À définir après saisie de la taille de la base et de l’effet minimal détectable.',
    recommendation: population.isProvided
      ? `Utilisez les ${population.testSize} renseignés pour dimensionner les groupes avec votre équipe CRM.`
      : 'Renseignez la taille de l’audience dans le Brief avant de dimensionner le test.',
  };
}

function computePopulation(audienceSize) {
  const total = Number(audienceSize);
  if (Number.isInteger(total) && total > 0) {
    return {
      isProvided: true,
      totalBase: `${total.toLocaleString('fr-FR')} contacts déclarés`,
      testSize: `${total.toLocaleString('fr-FR')} contacts disponibles`,
      perGroup: 'Répartition à définir avec votre base CRM',
      note: 'Taille de l’audience saisie dans le Brief.',
    };
  }
  return {
    isProvided: false,
    totalBase: 'Non renseignée',
    testSize: 'À définir selon votre base CRM',
    perGroup: 'À définir',
    note: 'Ajoutez la taille de l’audience dans le Brief pour dimensionner le test.',
  };
}

function computeDuration(channel) {
  if (channel === 'email') return { label: 'À définir', reason: 'Attendre la fenêtre de mesure propre à votre campagne e-mail.' };
  if (channel === 'push' || channel === 'sms') return { label: 'À définir', reason: 'Définir une fenêtre compatible avec votre fréquence de sollicitation.' };
  if (channel === 'paid-social') return { label: 'À définir', reason: 'Définir une fenêtre compatible avec la phase d’apprentissage de la plateforme.' };
  return { label: 'À définir', reason: 'Définir une durée de mesure adaptée au canal.' };
}

function selectKPIs(objective, channel) {
  const kpis = channel === 'email'
    ? [{ id: 'open_rate', label: 'Taux d’ouverture', primary: objective === 'engagement' }, { id: 'ctr', label: 'Taux de clic (CTR)', primary: true }]
    : [{ id: 'ctr', label: 'Taux de clic (CTR)', primary: true }];

  if (objective === 'conversion') kpis.push({ id: 'conversion_rate', label: 'Taux de conversion', primary: true });
  if (objective === 'trafic') kpis.push({ id: 'visits', label: 'Visites générées', primary: true });
  if (objective === 'engagement') kpis.push({ id: 'time_on_site', label: 'Temps passé', primary: false });
  kpis.push({ id: 'unsubscribe', label: 'Taux de désabonnement', primary: false });
  return kpis;
}
