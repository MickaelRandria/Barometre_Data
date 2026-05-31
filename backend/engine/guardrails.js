/**
 * RGPD Guardrails — Module 9
 * Évalue la conformité RGPD et éthique de la campagne.
 */

const RGPD_RULES = [
  {
    id: 'consent',
    label: 'Consentement explicite',
    description: 'Le contact a donné son consentement pour le canal utilisé.',
    appliesTo: ['sms', 'push', 'email'],
    severity: 'blocking',
  },
  {
    id: 'opt_out',
    label: 'Droit d\'opposition',
    description: 'Lien de désabonnement obligatoire et fonctionnel.',
    appliesTo: ['email', 'sms'],
    severity: 'blocking',
  },
  {
    id: 'data_minimization',
    label: 'Minimisation des données',
    description: 'Seules les données strictement nécessaires sont utilisées.',
    appliesTo: ['all'],
    severity: 'warning',
  },
  {
    id: 'purpose_limitation',
    label: 'Limitation de la finalité',
    description: 'Les données sont utilisées conformément à la finalité déclarée.',
    appliesTo: ['all'],
    severity: 'blocking',
  },
  {
    id: 'retention',
    label: 'Durée de conservation',
    description: 'Les données de campagne sont supprimées après la durée légale.',
    appliesTo: ['all'],
    severity: 'warning',
  },
  {
    id: 'transparency',
    label: 'Transparence',
    description: 'L\'expéditeur est clairement identifié.',
    appliesTo: ['email', 'sms', 'push'],
    severity: 'blocking',
  },
  {
    id: 'sending_hours',
    label: 'Horaires d\'envoi',
    description: 'Respect de la plage 8h-21h pour SMS et push (LCEN).',
    appliesTo: ['sms', 'push'],
    severity: 'blocking',
  },
  {
    id: 'pressure_cap',
    label: 'Cap de pression',
    description: 'Respect du nombre maximum de sollicitations par période.',
    appliesTo: ['all'],
    severity: 'warning',
  },
];

const ETHICAL_RULES = [
  {
    id: 'no_manipulation',
    label: 'Pas de manipulation',
    description: 'Le message ne doit pas exploiter les biais cognitifs de manière abusive.',
    triggers: ['urgent', 'fort'],
  },
  {
    id: 'vulnerable_audiences',
    label: 'Audiences vulnérables',
    description: 'Attention particulière pour les audiences inactives (risque de harcèlement perçu).',
    triggers: ['clients-inactifs'],
  },
  {
    id: 'data_ethics',
    label: 'Éthique des données',
    description: 'Les données météo/contextuelles sont utilisées pour améliorer la pertinence, pas pour manipuler.',
    triggers: ['all'],
  },
  {
    id: 'ai_transparency',
    label: 'Transparence IA',
    description: 'Le consommateur peut savoir que le message est personnalisé par IA si demandé.',
    triggers: ['all'],
  },
];

export function evaluateGuardrails(context, brief) {
  const channel = brief.channel || 'email';
  const audience = brief.audience || 'clients-actifs';
  const pressure = brief.pressure || 'moyen';
  const tone = brief.tone || 'sobre';
  const timeOfDay = context.timeOfDay.id;

  const rgpdChecks = evaluateRGPD(channel, timeOfDay);
  const ethicalChecks = evaluateEthics(tone, pressure, audience);
  const dataUsed = identifyDataUsed(brief);
  const riskLevel = computeRiskLevel(rgpdChecks, ethicalChecks);

  return {
    rgpd: {
      status: rgpdChecks.every(c => c.status === 'ok') ? 'conforme' : 'attention',
      checks: rgpdChecks,
    },
    ethics: {
      status: ethicalChecks.every(c => c.status === 'ok') ? 'conforme' : 'attention',
      checks: ethicalChecks,
    },
    dataUsed,
    riskLevel,
    summary: generateGuardrailSummary(rgpdChecks, ethicalChecks, riskLevel),
    recommendations: generateGuardrailRecos(rgpdChecks, ethicalChecks),
  };
}

function evaluateRGPD(channel, timeOfDay) {
  return RGPD_RULES
    .filter(rule => rule.appliesTo.includes('all') || rule.appliesTo.includes(channel))
    .map(rule => {
      let status = 'ok';
      let note = '';

      if (rule.id === 'sending_hours' && ['sms', 'push'].includes(channel)) {
        if (timeOfDay === 'night') {
          status = 'blocked';
          note = 'Envoi interdit : hors plage horaire légale (avant 8h ou après 21h).';
        } else {
          note = 'Plage horaire respectée.';
        }
      } else if (rule.id === 'consent') {
        note = 'Vérifier que le consentement est collecté pour ce canal.';
        status = 'check';
      } else if (rule.id === 'opt_out') {
        note = 'Lien de désabonnement à inclure obligatoirement.';
        status = 'check';
      } else {
        note = 'Conforme (vérification automatique).';
      }

      return {
        id: rule.id,
        label: rule.label,
        description: rule.description,
        severity: rule.severity,
        status,
        note,
      };
    });
}

function evaluateEthics(tone, pressure, audience) {
  return ETHICAL_RULES.map(rule => {
    let status = 'ok';
    let note = '';

    if (rule.id === 'no_manipulation' && tone === 'urgent' && pressure === 'fort') {
      status = 'warning';
      note = 'Combinaison ton urgent + pression forte : risque de perception manipulatoire.';
    } else if (rule.id === 'vulnerable_audiences' && audience === 'clients-inactifs') {
      status = 'warning';
      note = 'Audience inactive : limiter la fréquence, privilégier un ton doux.';
    } else if (rule.id === 'no_manipulation' && tone === 'urgent') {
      status = 'info';
      note = 'Ton urgent : vérifier que l\'urgence est réelle (stock limité, deadline).';
    } else {
      note = 'Conforme aux principes éthiques.';
    }

    return {
      id: rule.id,
      label: rule.label,
      description: rule.description,
      status,
      note,
    };
  });
}

function identifyDataUsed(brief) {
  const data = [];

  data.push({
    type: 'Données météo',
    source: 'OpenWeather API',
    purpose: 'Détection du contexte environnemental',
    retention: 'Temps réel (non stockée)',
    legal: 'Données publiques — pas de consentement requis',
  });

  data.push({
    type: 'Données de brief',
    source: 'Saisie utilisateur',
    purpose: 'Paramétrage de la campagne',
    retention: 'Session uniquement',
    legal: 'Données professionnelles B2B — pas de traitement de données personnelles',
  });

  if (brief.audience) {
    data.push({
      type: 'Segmentation audience',
      source: 'CRM / CDP',
      purpose: 'Ciblage de la campagne',
      retention: 'Conforme à la politique de rétention CRM',
      legal: 'Consentement requis pour les communications commerciales',
    });
  }

  return data;
}

function computeRiskLevel(rgpdChecks, ethicalChecks) {
  const hasBlocked = rgpdChecks.some(c => c.status === 'blocked');
  const hasWarning = ethicalChecks.some(c => c.status === 'warning');
  const checkCount = rgpdChecks.filter(c => c.status === 'check').length;

  if (hasBlocked) return { level: 'high', label: 'Élevé', color: 'red' };
  if (hasWarning && checkCount > 2) return { level: 'medium', label: 'Modéré', color: 'orange' };
  if (hasWarning || checkCount > 0) return { level: 'low', label: 'Faible', color: 'yellow' };
  return { level: 'minimal', label: 'Minimal', color: 'green' };
}

function generateGuardrailSummary(rgpdChecks, ethicalChecks, riskLevel) {
  const blocked = rgpdChecks.filter(c => c.status === 'blocked');
  const warnings = ethicalChecks.filter(c => c.status === 'warning');

  if (blocked.length > 0) {
    return `⚠️ Blocage RGPD détecté : ${blocked.map(b => b.label).join(', ')}. Activation impossible en l'état.`;
  }
  if (warnings.length > 0) {
    return `Points d'attention éthiques : ${warnings.map(w => w.label).join(', ')}. Revue recommandée avant activation.`;
  }
  return 'Conformité RGPD et éthique validée. Aucun blocage détecté.';
}

function generateGuardrailRecos(rgpdChecks, ethicalChecks) {
  const recos = [];

  const blocked = rgpdChecks.filter(c => c.status === 'blocked');
  blocked.forEach(b => {
    recos.push({ priority: 'high', action: `Corriger : ${b.label}`, detail: b.note });
  });

  const warnings = ethicalChecks.filter(c => c.status === 'warning');
  warnings.forEach(w => {
    recos.push({ priority: 'medium', action: `Vérifier : ${w.label}`, detail: w.note });
  });

  const checks = rgpdChecks.filter(c => c.status === 'check');
  checks.forEach(c => {
    recos.push({ priority: 'low', action: `Confirmer : ${c.label}`, detail: c.note });
  });

  return recos;
}
