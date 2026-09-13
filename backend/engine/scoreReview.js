/**
 * Relecture Ministral du score global — second avis, jamais un recalcul.
 *
 * La formule de `predictionLayer.js` reste la seule source du chiffre affiché :
 * elle est vérifiable et défendable telle quelle. Ce module la relit APRÈS coup
 * et ne peut produire qu'une chose : un signalement de doute, qui déclenche un
 * badge « à vérifier manuellement » à côté du score, sans jamais le modifier.
 *
 * Toute défaillance (clé absente, timeout, JSON douteux) rend
 * `{ coherent: true, reviewSkipped: true }` : une relecture qui n'a pas eu lieu
 * ne doit jamais se traduire par une fausse alerte à l'écran.
 */

import { MISTRAL_MODEL, callMistralJSON } from './mistralClient.js';
import { SUBSCORE_WEIGHTS } from './predictionLayer.js';

/** Chemin critique du pipeline : on abandonne vite plutôt que faire attendre. */
const REVIEW_TIMEOUT_MS = 4_500;

const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

/** Longueur au-delà de laquelle l'explication cesse d'être « une phrase ». */
const MAX_REASON_LENGTH = 280;

const SUBSCORE_LABELS = {
  meteo: 'Météo / Produit',
  message: 'Message / Ton',
  audience: 'Audience / Pression',
  timing: 'Timing / Canal',
  intention: 'Intention collective',
};

const BRIEF_LABELS = {
  product: 'Produit',
  message: 'Message',
  tone: 'Ton',
  channel: 'Canal',
  audience: 'Audience',
  objective: 'Objectif',
  pressure: 'Pression commerciale',
  city: 'Ville',
};

/** Résultat renvoyé quand la relecture n'a pas pu avoir lieu. */
function skipped(reviewReason) {
  return { coherent: true, confidence: 'low', reason: null, reviewSkipped: true, reviewReason };
}

const SYSTEM_PROMPT = [
  'Tu es un vérificateur de cohérence pour un agent marketing contextuel.',
  '',
  'Ta mission n’est PAS de recalculer le score : il est produit par un moteur de règles',
  'et reste inchangé quoi que tu répondes. Évalue uniquement si ce score semble',
  'globalement cohérent avec le brief et le contexte fournis, ou si tu identifies un',
  'signal évident que la formule aurait pu manquer — par exemple une contradiction',
  'flagrante entre le produit et la météo, ou un message qui affirme quelque chose de',
  'faux sur le contexte réel.',
  '',
  'Ne sois pas sévère par principe. Si le score te semble globalement défendable, même',
  's’il n’est pas parfait, réponds coherent: true. Ne signale une incohérence que si tu',
  'peux la nommer précisément en une phrase.',
  '',
  'Réponds uniquement par un objet JSON strict de la forme :',
  '{"coherent":true,"confidence":"high","reason":null}',
  'ou, en cas d’incohérence :',
  '{"coherent":false,"confidence":"medium","reason":"explication courte en français"}',
  '',
  '`confidence` vaut exactement « high », « medium » ou « low ».',
  '`reason` est une phrase courte en français, et uniquement si coherent vaut false.',
].join('\n');

function describeBrief(brief) {
  return Object.entries(BRIEF_LABELS).map(([field, label]) => {
    const value = String(brief?.[field] ?? '').trim();
    return `  - ${label} : ${value || '(non renseigné)'}`;
  }).join('\n');
}

function describeContext(context) {
  const weather = context?.weather ?? {};
  const lines = [
    `  - Météo : ${weather.description ?? 'non disponible'}, ${weather.temperature ?? '?'} °C (ressenti ${weather.feelsLike ?? '?'} °C)`,
    `  - Saison : ${context?.season?.label ?? 'non déterminée'}`,
    `  - Contexte dominant : ${context?.contextType?.label ?? 'non déterminé'} (indice ${context?.contextIndex ?? '?'})`,
  ];

  const expected = context?.seasonalNormal?.expected;
  const delta = context?.seasonalNormal?.delta;
  if (Number.isFinite(Number(delta))) {
    lines.push(`  - Écart à la normale saisonnière : ${delta > 0 ? '+' : ''}${delta} °C (${expected} °C attendus)`);
  }

  if (context?.trendsSignal?.dominant) {
    lines.push(`  - Signal d’intention collective (Wikimedia) : axe dominant « ${context.trendsSignal.dominant} »`);
  } else {
    lines.push('  - Signal d’intention collective (Wikimedia) : indisponible');
  }

  return lines.join('\n');
}

/**
 * Décrit les sous-scores depuis `SUBSCORE_WEIGHTS`, source unique des poids :
 * recopier des pondérations dans le prompt les ferait diverger de la formule
 * au premier ajustement.
 */
function describeScores(scores) {
  const nonDiscriminant = new Set(scores?.nonDiscriminant ?? []);
  const lines = Object.entries(SUBSCORE_WEIGHTS).map(([key, weight]) => {
    const label = SUBSCORE_LABELS[key] ?? key;
    const value = scores?.subscores?.[key];
    const percent = Math.round(weight * 100);
    if (nonDiscriminant.has(key)) {
      return `  - ${label} (poids ${percent} %) : non mesurable pour ce brief, exclu du calcul`;
    }
    return `  - ${label} (poids ${percent} %) : ${value ?? '?'}/100`;
  });

  return [
    `  Score global : ${scores?.global}/100 (palier affiché : ${scores?.displayGlobal}/100, niveau « ${scores?.band} »)`,
    ...lines,
    `  Fiabilité des données : ${scores?.dataConfidence?.level ?? 'inconnue'}`,
  ].join('\n');
}

function buildUserPrompt(brief, context, scores) {
  return [
    'BRIEF DE CAMPAGNE',
    describeBrief(brief),
    '',
    'CONTEXTE DÉTECTÉ',
    describeContext(context),
    '',
    'SCORE CALCULÉ PAR LE MOTEUR DE RÈGLES',
    describeScores(scores),
    '',
    'Ce score te semble-t-il globalement cohérent avec ce brief et ce contexte ?',
  ].join('\n');
}

/**
 * La sortie du modèle n'est jamais reprise telle quelle. En particulier, un
 * `coherent: false` sans explication nommée est traité comme cohérent : on
 * n'affiche pas un badge d'alerte qu'on serait incapable de justifier.
 */
function sanitizeReview(data) {
  const coherent = data?.coherent !== false;
  const confidence = CONFIDENCE_LEVELS.includes(String(data?.confidence ?? '').trim())
    ? String(data.confidence).trim()
    : 'low';

  if (coherent) return { coherent: true, confidence, reason: null, reviewSkipped: false };

  const reason = String(data?.reason ?? '').replace(/\s+/g, ' ').trim();
  if (!reason) {
    return {
      coherent: true,
      confidence,
      reason: null,
      reviewSkipped: false,
      reviewReason: 'Incohérence signalée sans explication : signalement écarté.',
    };
  }

  return {
    coherent: false,
    confidence,
    reason: reason.length > MAX_REASON_LENGTH
      ? `${reason.slice(0, MAX_REASON_LENGTH - 1).trimEnd()}…`
      : reason,
    reviewSkipped: false,
  };
}

/**
 * @returns {Promise<{ coherent: boolean, confidence: 'high'|'medium'|'low', reason: string|null, reviewSkipped: boolean, reviewReason?: string }>}
 *
 * `coherent: false` n'altère jamais le score : il n'ajoute qu'un signalement.
 * Ne lève jamais.
 */
export async function reviewScoreCoherence(brief, context, scores) {
  try {
    // Un score non mesurable n'a rien à relire : la formule a déjà refusé de
    // publier un chiffre, il n'y a pas de cohérence à vérifier.
    if (!Number.isFinite(Number(scores?.global)) || scores?.status !== 'ok') {
      return skipped('Score non publiable : relecture sans objet.');
    }

    const result = await callMistralJSON({
      model: MISTRAL_MODEL,
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(brief, context, scores),
      temperature: 0.2,
      maxTokens: 300,
      timeoutMs: REVIEW_TIMEOUT_MS,
    });

    if (!result.ok) return skipped(result.reason);

    return sanitizeReview(result.data);
  } catch (error) {
    return skipped(`Relecture ignorée : ${error?.message ?? 'erreur inconnue'}`);
  }
}
