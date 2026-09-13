/**
 * A/B Test Plan - Module 8
 *
 * Dimensionne le protocole à partir de la taille d'audience saisie dans le
 * Brief. Le module refusait auparavant de dimensionner quoi que ce soit et
 * renvoyait « à définir selon la base CRM » : cette prudence datait d'avant
 * l'ajout du champ « Taille de l'audience » au formulaire, et n'avait plus lieu
 * d'être une fois la donnée réellement disponible.
 *
 * Ce qui reste non calculé l'est toujours pour une bonne raison : sans effet
 * minimal détectable ni référence historique, aucune puissance statistique
 * n'est annonçable, et le module continue de ne rien inventer sur ce point.
 */

/**
 * Fenêtres de mesure usuelles par canal, en jours. Un e-mail se mesure sur un
 * cycle hebdomadaire complet ; une notification ou un SMS se consomment
 * immédiatement et ne justifient pas d'attendre aussi longtemps.
 */
const CHANNEL_DURATION = {
  email: { label: '5 à 7 jours', reason: 'Cycle d’ouverture d’un e-mail : l’essentiel est lu sous 72 h, la traîne se mesure jusqu’à J+7.' },
  sms: { label: '2 à 3 jours', reason: 'Un SMS est lu dans l’heure : au-delà de 72 h, la mesure n’apporte plus rien.' },
  push: { label: '2 à 3 jours', reason: 'Une notification se consomme immédiatement ou pas du tout.' },
  'paid-social': { label: '7 jours', reason: 'Laisser passer la phase d’apprentissage de la plateforme avant de comparer les groupes.' },
  homepage: { label: '5 jours', reason: 'Couvrir un cycle de fréquentation complet, jours ouvrés et week-end.' },
};

const DEFAULT_DURATION = { label: '5 jours', reason: 'Fenêtre de mesure par défaut, à ajuster selon votre rythme de campagne.' };

export function generateABTestPlan(context, brief, scores, variants) {
  const channel = brief.channel || 'email';
  const objective = brief.objective || 'engagement';
  const groupCount = variants.variants.length;
  const population = computePopulation(brief.audienceSize, groupCount);
  const duration = computeDuration(channel);
  const shares = splitEvenly(population.total, groupCount);

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
      allocation: formatAllocation(shares[index], groupCount),
      description: variant.description,
    })),
    population,
    duration,
    kpis: selectKPIs(objective, channel),
    successCriteria: [
      { metric: 'KPI principal', threshold: 'Écart à définir avec votre référence historique', confidence: 'À calculer après saisie de l’effet minimal détectable' },
      { metric: 'Désabonnement', threshold: 'Seuil d’alerte à définir dans votre politique de pression commerciale', confidence: 'Suivi continu' },
    ],
    methodology: population.isProvided
      ? `Protocole A/B/C en répartition égale sur ${population.total.toLocaleString('fr-FR')} contacts, mesuré sur ${duration.label}.`
      : 'Protocole A/B/C en répartition égale. Les effectifs seront calculés dès que la taille de l’audience sera renseignée.',
    statisticalSignificance: population.isProvided
      ? `Puissance non calculable en l’état : l’effet minimal détectable doit être fixé avec votre référence historique pour valider ces ${shares[0].toLocaleString('fr-FR')} contacts par groupe.`
      : 'À définir après saisie de la taille de l’audience et de l’effet minimal détectable.',
    recommendation: population.isProvided
      ? `Répartissez vos ${population.total.toLocaleString('fr-FR')} contacts en ${groupCount} groupes égaux et laissez tourner le test sur ${duration.label} avant de conclure.`
      : 'Renseignez le champ « Taille de l’audience » du Brief pour dimensionner le test.',
  };
}

/**
 * Répartit un effectif en parts égales. Le reste de la division est distribué
 * un par un sur les premiers groupes, pour que la somme retombe exactement sur
 * l'effectif déclaré plutôt que de perdre des contacts à l'arrondi.
 */
function splitEvenly(total, groupCount) {
  if (!Number.isFinite(total) || total <= 0 || groupCount <= 0) {
    return Array.from({ length: Math.max(groupCount, 0) }, () => null);
  }
  const base = Math.floor(total / groupCount);
  const remainder = total - base * groupCount;
  return Array.from({ length: groupCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function formatAllocation(share, groupCount) {
  const percent = groupCount > 0 ? Math.round((100 / groupCount) * 10) / 10 : 0;
  if (share === null) return `${percent} % de l’audience`;
  return `environ ${share.toLocaleString('fr-FR')} contacts (${percent} %)`;
}

function computePopulation(audienceSize, groupCount) {
  const total = Number(audienceSize);
  if (Number.isInteger(total) && total > 0) {
    const shares = splitEvenly(total, groupCount);
    return {
      isProvided: true,
      total,
      totalBase: `${total.toLocaleString('fr-FR')} contacts déclarés`,
      testSize: `${total.toLocaleString('fr-FR')} contacts`,
      perGroup: `environ ${shares[0].toLocaleString('fr-FR')} contacts par groupe`,
      note: `Réparti en ${groupCount} groupes égaux à partir de la taille saisie dans le Brief.`,
    };
  }
  return {
    isProvided: false,
    total: null,
    totalBase: 'Non renseignée',
    testSize: '—',
    perGroup: '—',
    note: 'Renseignez le champ « Taille de l’audience » du Brief pour dimensionner le test.',
  };
}

function computeDuration(channel) {
  return CHANNEL_DURATION[channel] ?? DEFAULT_DURATION;
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
