/**
 * A/B Test Plan — Module 8
 * Génère un plan de test A/B structuré.
 */

export function generateABTestPlan(context, brief, scores, variants) {
  const channel = brief.channel || 'email';
  const audience = brief.audience || 'clients-actifs';
  const objective = brief.objective || 'engagement';

  const hypothesis = buildHypothesis(context, brief, scores);
  const groups = buildGroups(variants);
  const population = computePopulation(audience, channel);
  const duration = computeDuration(channel, audience);
  const kpis = selectKPIs(objective, channel);
  const successCriteria = defineSuccessCriteria(objective, channel, scores);

  return {
    hypothesis,
    groups,
    population,
    duration,
    kpis,
    successCriteria,
    methodology: 'Test A/B/C séquentiel avec allocation proportionnelle.',
    statisticalSignificance: '95% (p < 0.05)',
    recommendation: `Déployez le test sur ${population.testSize} avant généralisation. Durée recommandée : ${duration.label}.`,
  };
}

function buildHypothesis(context, brief, scores) {
  const contextLabel = context.contextType.label;
  const tone = brief.tone || 'sobre';

  return {
    h0: `Le message original (ton ${tone}) performe de manière identique quelle que soit l'adaptation contextuelle.`,
    h1: `Un message adapté au contexte "${contextLabel}" génère un taux d'engagement significativement supérieur (+10% minimum).`,
    rationale: `Le score de cohérence message est de ${scores.subscores.message}/100. L'hypothèse teste si l'adaptation contextuelle produit un lift mesurable.`,
  };
}

function buildGroups(variants) {
  return variants.variants.map((v, i) => ({
    id: String.fromCharCode(65 + i),
    label: `Groupe ${String.fromCharCode(65 + i)} — ${v.label}`,
    variant: v.id,
    allocation: i === 0 ? '33%' : i === 1 ? '33%' : '34%',
    description: v.description,
  }));
}

function computePopulation(audience, channel) {
  const baseSizes = {
    'clients-actifs': 45000,
    'clients-inactifs': 25000,
    'paniers-abandonnes': 8000,
    'top-clients': 10000,
    'prospects': 30000,
    'clients-chauds': 15000,
  };

  const totalBase = baseSizes[audience] || 20000;
  const testPercentage = 20;
  const testSize = Math.round(totalBase * testPercentage / 100);

  return {
    totalBase: `~${(totalBase / 1000).toFixed(0)}k contacts`,
    testPercentage: `${testPercentage}%`,
    testSize: `~${(testSize / 1000).toFixed(1)}k contacts`,
    perGroup: `~${(testSize / 3 / 1000).toFixed(1)}k par groupe`,
    minimumDetectableEffect: '5% (MDE)',
  };
}

function computeDuration(channel, audience) {
  if (channel === 'email') {
    return {
      label: '48-72h',
      hours: 72,
      reason: 'Fenêtre standard pour mesurer les ouvertures et clics email.',
      checkpoints: ['T+4h : premiers résultats', 'T+24h : résultats intermédiaires', 'T+72h : résultats finaux'],
    };
  }
  if (channel === 'push' || channel === 'sms') {
    return {
      label: '24-48h',
      hours: 48,
      reason: 'Réaction rapide attendue sur les canaux push/SMS.',
      checkpoints: ['T+2h : premiers résultats', 'T+12h : résultats intermédiaires', 'T+48h : résultats finaux'],
    };
  }
  if (channel === 'paid-social') {
    return {
      label: '5-7 jours',
      hours: 168,
      reason: 'Nécessite un temps d\'apprentissage algorithmique (Meta/Google).',
      checkpoints: ['T+24h : premiers signaux', 'T+72h : stabilisation', 'T+7j : résultats finaux'],
    };
  }

  return {
    label: '72h',
    hours: 72,
    reason: 'Durée standard de test.',
    checkpoints: ['T+24h : résultats intermédiaires', 'T+72h : résultats finaux'],
  };
}

function selectKPIs(objective, channel) {
  const kpis = [];

  if (channel === 'email') {
    kpis.push({ id: 'open_rate', label: 'Taux d\'ouverture', primary: objective === 'engagement' });
    kpis.push({ id: 'ctr', label: 'Taux de clic (CTR)', primary: true });
  } else {
    kpis.push({ id: 'ctr', label: 'Taux de clic (CTR)', primary: true });
  }

  if (objective === 'conversion') {
    kpis.push({ id: 'conversion_rate', label: 'Taux de conversion', primary: true });
    kpis.push({ id: 'revenue', label: 'Revenu par envoi', primary: false });
  }

  if (objective === 'trafic') {
    kpis.push({ id: 'visits', label: 'Visites générées', primary: true });
    kpis.push({ id: 'bounce_rate', label: 'Taux de rebond', primary: false });
  }

  if (objective === 'engagement') {
    kpis.push({ id: 'time_on_site', label: 'Temps passé', primary: false });
    kpis.push({ id: 'pages_viewed', label: 'Pages vues / session', primary: false });
  }

  kpis.push({ id: 'unsubscribe', label: 'Taux de désabonnement', primary: false });

  return kpis;
}

function defineSuccessCriteria(objective, channel, scores) {
  const criteria = [];

  criteria.push({
    metric: 'CTR',
    threshold: '+10% vs contrôle (Groupe A)',
    confidence: '95%',
  });

  if (objective === 'conversion') {
    criteria.push({
      metric: 'Conversion',
      threshold: '+5% vs contrôle',
      confidence: '95%',
    });
  }

  criteria.push({
    metric: 'Désabonnement',
    threshold: '< 0.3% (seuil d\'alerte)',
    confidence: 'Monitoring continu',
  });

  criteria.push({
    metric: 'Winner declaration',
    threshold: 'Significativité statistique atteinte (p < 0.05)',
    confidence: 'Automatique à T+fin',
  });

  return criteria;
}
