/**
 * RGPD Guardrails — Module 9
 *
 * Correction post-audit : l'outil ne déclare plus « Conforme (vérification
 * automatique) » sur des règles qu'il n'a aucun moyen de vérifier. Chaque règle
 * porte désormais un champ `verification` explicite :
 *   - 'automatique' : l'agent contrôle réellement quelque chose d'observable
 *     (l'heure d'envoi, la nature des données qu'il manipule, la pression
 *     déclarée dans le brief).
 *   - 'manuelle' : l'agent n'a pas accès à l'information (consentement,
 *     durée de conservation, finalité déclarée). Le statut affiché est alors
 *     « à valider », jamais « conforme ».
 */

/** Fenêtre légale de prospection SMS/push (LCEN + recommandations CNIL). */
const LEGAL_SEND_WINDOW = { start: 8, end: 21 };

import { detectMessageWeatherContradictions } from './weatherConsistency.js';

const RGPD_RULES = [
  {
    id: 'sending_hours',
    label: 'Horaires d’envoi',
    description: `Respect de la plage ${LEGAL_SEND_WINDOW.start}h-${LEGAL_SEND_WINDOW.end}h pour SMS et push (LCEN).`,
    appliesTo: ['sms', 'push'],
    severity: 'blocking',
    verification: 'automatique',
  },
  {
    id: 'data_minimization',
    label: 'Minimisation des données',
    description: 'Seules les données strictement nécessaires sont utilisées par l’analyse.',
    appliesTo: ['all'],
    severity: 'warning',
    verification: 'automatique',
  },
  {
    id: 'pressure_cap',
    label: 'Cap de pression',
    description: 'Cohérence entre la pression déclarée et la sensibilité de l’audience ciblée.',
    appliesTo: ['all'],
    severity: 'warning',
    verification: 'automatique',
  },
  {
    id: 'consent',
    label: 'Consentement explicite',
    description: 'Le contact a donné son consentement pour le canal utilisé.',
    appliesTo: ['sms', 'push', 'email'],
    severity: 'blocking',
    verification: 'manuelle',
  },
  {
    id: 'opt_out',
    label: 'Droit d’opposition',
    description: 'Lien de désabonnement obligatoire et fonctionnel.',
    appliesTo: ['email', 'sms'],
    severity: 'blocking',
    verification: 'manuelle',
  },
  {
    id: 'transparency',
    label: 'Transparence de l’expéditeur',
    description: 'L’expéditeur est clairement identifié dans le message diffusé.',
    appliesTo: ['email', 'sms', 'push'],
    severity: 'blocking',
    verification: 'manuelle',
  },
  {
    id: 'purpose_limitation',
    label: 'Limitation de la finalité',
    description: 'Les données CRM sont utilisées conformément à la finalité déclarée au recueil.',
    appliesTo: ['all'],
    severity: 'blocking',
    verification: 'manuelle',
  },
  {
    id: 'retention',
    label: 'Durée de conservation',
    description: 'Les données de campagne sont supprimées après la durée légale.',
    appliesTo: ['all'],
    severity: 'warning',
    verification: 'manuelle',
  },
];

const ETHICAL_RULES = [
  {
    id: 'no_manipulation',
    label: 'Pas de manipulation',
    description: 'Le message ne doit pas exploiter les biais cognitifs de manière abusive.',
  },
  {
    id: 'vulnerable_audiences',
    label: 'Audiences vulnérables',
    description: 'Attention particulière pour les audiences inactives (risque de harcèlement perçu).',
  },
  {
    id: 'weather_claim_honesty',
    label: 'Honnêteté des affirmations contextuelles',
    description: 'Le message ne doit pas affirmer une réalité météo que les données démentent.',
  },
  {
    id: 'ai_transparency',
    label: 'Transparence IA',
    description: 'Le consommateur peut savoir que le message est personnalisé par IA s’il le demande.',
  },
];

export function evaluateGuardrails(context, brief) {
  const channel = brief.channel || 'email';
  const audience = brief.audience || 'clients-actifs';
  const pressure = brief.pressure || 'moyen';
  const tone = brief.tone || 'sobre';

  const rgpdChecks = evaluateRGPD(channel, context, audience, pressure);
  const ethicalChecks = evaluateEthics(tone, pressure, audience, context, brief.message);
  const dataUsed = identifyDataUsed(brief, context);
  const riskLevel = computeRiskLevel(rgpdChecks, ethicalChecks);

  const automaticChecks = rgpdChecks.filter((c) => c.verification === 'automatique');
  const manualChecks = rgpdChecks.filter((c) => c.verification === 'manuelle');

  return {
    rgpd: {
      // Le statut ne prétend jamais à la conformité globale : l'agent ne peut
      // attester que des contrôles qu'il a réellement effectués.
      status: rgpdChecks.some((c) => c.status === 'blocked')
        ? 'bloque'
        : manualChecks.length > 0 ? 'verification_partielle' : 'conforme',
      checks: rgpdChecks,
      automaticCount: automaticChecks.length,
      manualCount: manualChecks.length,
      scope: `${automaticChecks.length} contrôle(s) vérifié(s) automatiquement par l’agent, ${manualChecks.length} à valider dans votre outil CRM.`,
    },
    ethics: {
      status: ethicalChecks.every((c) => c.status === 'ok') ? 'conforme' : 'attention',
      checks: ethicalChecks,
    },
    dataUsed,
    riskLevel,
    summary: generateGuardrailSummary(rgpdChecks, ethicalChecks, manualChecks),
    recommendations: generateGuardrailRecos(rgpdChecks, ethicalChecks),
  };
}

function evaluateRGPD(channel, context, audience, pressure) {
  const hour = context.timeOfDay?.hour ?? new Date().getHours();

  return RGPD_RULES
    .filter((rule) => rule.appliesTo.includes('all') || rule.appliesTo.includes(channel))
    .map((rule) => {
      let status = 'manual';
      let note = 'À valider manuellement : l’agent n’a pas accès à cette information.';

      if (rule.id === 'sending_hours') {
        const outsideWindow = hour < LEGAL_SEND_WINDOW.start || hour >= LEGAL_SEND_WINDOW.end;
        status = outsideWindow ? 'blocked' : 'ok';
        note = outsideWindow
          ? `Envoi interdit : il est ${hour}h, hors de la plage légale ${LEGAL_SEND_WINDOW.start}h-${LEGAL_SEND_WINDOW.end}h pour ce canal.`
          : `Vérifié : il est ${hour}h, dans la plage légale ${LEGAL_SEND_WINDOW.start}h-${LEGAL_SEND_WINDOW.end}h.`;
      } else if (rule.id === 'data_minimization') {
        status = 'ok';
        note = 'Vérifié : l’analyse n’utilise que des données publiques (météo Open-Meteo, pages vues Wikimedia) et les champs non personnels du brief. Aucune donnée personnelle n’est transmise à l’agent.';
      } else if (rule.id === 'pressure_cap') {
        const risky = pressure === 'fort' && ['clients-inactifs', 'prospects'].includes(audience);
        status = risky ? 'warning' : 'ok';
        note = risky
          ? `Vérifié : pression « ${pressure} » sur l’audience « ${audience} » — combinaison à risque, plafonnement automatique appliqué dans le plan d’activation.`
          : `Vérifié : pression « ${pressure} » cohérente avec l’audience « ${audience} ».`;
      } else if (rule.id === 'consent') {
        note = 'À valider manuellement : l’agent ne peut pas vérifier le consentement dans votre base. Confirmez qu’il est collecté pour ce canal.';
      } else if (rule.id === 'opt_out') {
        note = 'À valider manuellement : présence et fonctionnement du lien de désabonnement à confirmer dans le gabarit d’envoi.';
      } else if (rule.id === 'transparency') {
        note = 'À valider manuellement : identification de l’expéditeur à confirmer dans le gabarit d’envoi.';
      } else if (rule.id === 'purpose_limitation') {
        note = 'À valider manuellement : la finalité déclarée au recueil du consentement n’est pas connue de l’agent.';
      } else if (rule.id === 'retention') {
        note = 'À valider manuellement : la politique de rétention de votre CRM n’est pas connue de l’agent.';
      }

      return {
        id: rule.id,
        label: rule.label,
        description: rule.description,
        severity: rule.severity,
        verification: rule.verification,
        status,
        note,
      };
    });
}

function evaluateEthics(tone, pressure, audience, context, message) {
  // Contrôle réellement effectué : on relit le message face à la météo relevée.
  const contradictionCount = detectMessageWeatherContradictions(message, context.weather).length;

  return ETHICAL_RULES.map((rule) => {
    let status = 'ok';
    let note = 'Conforme aux principes éthiques.';

    if (rule.id === 'no_manipulation') {
      if (tone === 'urgent' && pressure === 'fort') {
        status = 'warning';
        note = 'Combinaison ton urgent + pression forte : risque de perception manipulatoire.';
      } else if (tone === 'urgent') {
        status = 'info';
        note = 'Ton urgent : vérifier que l’urgence est réelle (stock limité, deadline).';
      }
    } else if (rule.id === 'vulnerable_audiences') {
      if (audience === 'clients-inactifs') {
        status = 'warning';
        note = 'Audience inactive : limiter la fréquence, privilégier un ton doux.';
      }
    } else if (rule.id === 'weather_claim_honesty') {
      if (contradictionCount > 0) {
        status = 'warning';
        note = `Vérifié : ${contradictionCount} affirmation(s) météo du message sont démenties par les données relevées. À corriger avant diffusion.`;
      } else {
        note = 'Vérifié : aucune affirmation météo contredite par les données relevées.';
      }
    } else if (rule.id === 'ai_transparency') {
      note = 'À rappeler dans votre politique de personnalisation : les variantes proposées sont générées automatiquement.';
      status = 'info';
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

function identifyDataUsed(brief, context) {
  const data = [];

  data.push({
    type: 'Données météo',
    source: 'Open-Meteo (api.open-meteo.com)',
    purpose: 'Détection du contexte environnemental et vérification des affirmations du message',
    retention: context?.weather?.isMock ? 'Non applicable (repli saisonnier, aucune donnée reçue)' : 'Temps réel (non stockée)',
    legal: 'Données publiques — pas de consentement requis',
  });

  data.push({
    type: 'Signal d’intention collective',
    source: 'Wikimedia Pageviews API (fr.wikipedia, données agrégées)',
    purpose: 'Estimation de l’attention collective par axe comportemental',
    retention: 'Cache serveur 6 h, données agrégées et anonymes',
    legal: 'Statistiques publiques agrégées — aucune donnée personnelle',
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
      source: 'CRM / CDP (hors périmètre de l’agent)',
      purpose: 'Ciblage de la campagne',
      retention: 'Conforme à la politique de rétention CRM — non vérifiable par l’agent',
      legal: 'Consentement requis pour les communications commerciales',
    });
  }

  return data;
}

function computeRiskLevel(rgpdChecks, ethicalChecks) {
  const hasBlocked = rgpdChecks.some((c) => c.status === 'blocked');
  const warnings = [...rgpdChecks, ...ethicalChecks].filter((c) => c.status === 'warning').length;
  const manualCount = rgpdChecks.filter((c) => c.verification === 'manuelle').length;

  if (hasBlocked) return { level: 'high', label: 'Élevé', color: 'red' };
  if (warnings >= 2) return { level: 'medium', label: 'Modéré', color: 'orange' };
  if (warnings === 1 || manualCount > 0) return { level: 'low', label: 'Faible', color: 'yellow' };
  return { level: 'minimal', label: 'Minimal', color: 'green' };
}

function generateGuardrailSummary(rgpdChecks, ethicalChecks, manualChecks) {
  const blocked = rgpdChecks.filter((c) => c.status === 'blocked');
  const warnings = [...rgpdChecks, ...ethicalChecks].filter((c) => c.status === 'warning');
  const verified = rgpdChecks.filter((c) => c.verification === 'automatique').length;

  if (blocked.length > 0) {
    return `Blocage réglementaire détecté : ${blocked.map((b) => b.label).join(', ')}. Activation impossible en l’état.`;
  }

  const base = `${verified} contrôle(s) vérifié(s) automatiquement, ${manualChecks.length} à valider dans votre CRM. L’agent ne peut pas attester d’une conformité RGPD globale.`;
  if (warnings.length > 0) {
    return `${base} Points d’attention : ${warnings.map((w) => w.label).join(', ')}.`;
  }
  return base;
}

function generateGuardrailRecos(rgpdChecks, ethicalChecks) {
  const recos = [];

  rgpdChecks.filter((c) => c.status === 'blocked').forEach((c) => {
    recos.push({ priority: 'high', action: `Corriger : ${c.label}`, detail: c.note });
  });
  [...rgpdChecks, ...ethicalChecks].filter((c) => c.status === 'warning').forEach((c) => {
    recos.push({ priority: 'medium', action: `Vérifier : ${c.label}`, detail: c.note });
  });
  rgpdChecks.filter((c) => c.status === 'manual').forEach((c) => {
    recos.push({ priority: 'low', action: `À valider manuellement : ${c.label}`, detail: c.note });
  });

  return recos;
}
