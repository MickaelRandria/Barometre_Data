/**
 * Extraction d'un brief structuré depuis une description en langage naturel.
 *
 * Ce module ne fait qu'une chose : proposer un pré-remplissage. Il n'écrit
 * jamais dans le pipeline, et l'utilisateur revoit chaque champ avant de lancer
 * l'analyse. Contrairement aux autres couches Ministral du projet, il n'a PAS
 * de repli silencieux : sans extraction, il n'y a rien à pré-remplir, donc
 * l'échec est remonté explicitement pour que l'interface bascule proprement sur
 * la saisie manuelle.
 */

import { MISTRAL_MODEL, callMistralJSON } from './mistralClient.js';
import { BRIEF_ENUMS, BRIEF_FALLBACKS } from '../../shared/briefOptions.js';

/** Un peu plus long que les autres couches : l'utilisateur attend un résultat. */
const PARSE_TIMEOUT_MS = 6_000;

/** Au-delà, on ne décrit plus une campagne en une phrase. */
const MAX_DESCRIPTION_LENGTH = 600;

const MAX_PRODUCT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 300;

const CONFIDENCE_LEVELS = ['high', 'low'];

/**
 * Message affiché à l'utilisateur quand l'extraction échoue. Le détail
 * technique reste dans `reason`, pour les logs : une trace réseau brute dans
 * l'interface inquiète sans rien apprendre à personne.
 */
const UNAVAILABLE_MESSAGE = 'Génération indisponible pour le moment. Renseignez les champs ci-dessous.';

/** Champs pré-remplis, dans l'ordre du formulaire. */
export const PARSED_FIELDS = ['product', 'message', 'tone', 'audience', 'channel', 'objective', 'pressure'];

const SYSTEM_PROMPT = [
  'Tu transformes une description libre de campagne marketing en brief structuré.',
  '',
  'Complète intelligemment ce qui n’est pas dit explicitement, à partir du contexte :',
  'une campagne « rentrée » suggère souvent un ton dynamique et un objectif',
  'd’engagement, sauf indication contraire. Mais ne confonds jamais ce qui est dit',
  'avec ce que tu déduis.',
  '',
  'Champs attendus :',
  '- product : le produit ou l’univers concerné, reformulé clairement.',
  '- message : un message marketing court et naturel, cohérent avec la description.',
  '  Écris-le toi-même s’il n’est pas donné. Une à deux phrases, sans chiffre inventé,',
  '  sans pourcentage, sans date limite et sans code promo.',
  `- tone : exactement l’une de ces valeurs : ${BRIEF_ENUMS.tone.join(', ')}.`,
  `- audience : exactement l’une de ces valeurs : ${BRIEF_ENUMS.audience.join(', ')}.`,
  `- channel : exactement l’une de ces valeurs : ${BRIEF_ENUMS.channel.join(', ')}.`,
  `- objective : exactement l’une de ces valeurs : ${BRIEF_ENUMS.objective.join(', ')}.`,
  `- pressure : exactement l’une de ces valeurs : ${BRIEF_ENUMS.pressure.join(', ')}.`,
  '',
  'N’invente jamais d’identifiant : n’utilise que les valeurs listées ci-dessus,',
  'telles quelles, sans les traduire ni les reformuler.',
  '',
  'Ajoute un objet `fieldConfidence` donnant, pour chacun des champs',
  `(${PARSED_FIELDS.join(', ')}), « high » si l’information est dite explicitement`,
  'dans la description, « low » si tu l’as déduite ou choisie par défaut.',
  '',
  'Si la description est trop vague pour un champ, mets une valeur par défaut',
  'raisonnable et « low » pour ce champ.',
  '',
  'Réponds uniquement par un objet JSON strict de la forme :',
  '{"product":"...","message":"...","tone":"dynamique","audience":"prospects",',
  '"channel":"email","objective":"engagement","pressure":"moyen",',
  '"fieldConfidence":{"product":"high","message":"low","tone":"low","audience":"low",',
  '"channel":"high","objective":"low","pressure":"low"}}',
].join('\n');

function truncate(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/**
 * Un identifiant hors liste retombe sur le défaut, et sa confiance est forcée à
 * « low » : une valeur que le modèle a inventée n'est jamais une certitude.
 */
function resolveEnum(field, rawValue) {
  const value = String(rawValue ?? '').trim().toLowerCase();
  if (BRIEF_ENUMS[field].includes(value)) return { value, coerced: false };
  return { value: BRIEF_FALLBACKS[field], coerced: true };
}

function resolveConfidence(raw, coerced) {
  if (coerced) return 'low';
  return CONFIDENCE_LEVELS.includes(String(raw ?? '').trim()) ? String(raw).trim() : 'low';
}

/**
 * Rien de ce que renvoie le modèle n'est repris tel quel : les identifiants sont
 * validés contre `BRIEF_ENUMS`, les textes nettoyés et bornés.
 */
function sanitizeParsed(data, description) {
  const rawConfidence = data?.fieldConfidence ?? {};
  const brief = {};
  const fieldConfidence = {};
  const coercedFields = [];

  for (const field of ['tone', 'audience', 'channel', 'objective', 'pressure']) {
    const { value, coerced } = resolveEnum(field, data?.[field]);
    brief[field] = value;
    fieldConfidence[field] = resolveConfidence(rawConfidence[field], coerced);
    if (coerced) coercedFields.push(field);
  }

  const product = String(data?.product ?? '').replace(/\s+/g, ' ').trim();
  const message = String(data?.message ?? '').replace(/\s+/g, ' ').trim();

  // Sans produit exploitable, il n'y a pas de brief : on reprend la description
  // de l'utilisateur plutôt que d'inventer, et on le signale par « low ».
  brief.product = truncate(product || description, MAX_PRODUCT_LENGTH);
  fieldConfidence.product = product ? resolveConfidence(rawConfidence.product, false) : 'low';

  brief.message = truncate(message, MAX_MESSAGE_LENGTH);
  fieldConfidence.message = message ? resolveConfidence(rawConfidence.message, false) : 'low';

  return { brief, fieldConfidence, coercedFields };
}

/**
 * @returns {Promise<{ ok: true, brief: object, fieldConfidence: object } | { ok: false, reason: string, userMessage: string }>}
 *
 * Ne lève jamais. Un `ok: false` signifie qu'il n'y a rien à pré-remplir :
 * l'interface doit laisser l'utilisateur saisir son brief à la main.
 */
export async function parseBriefDescription(description) {
  try {
    const text = String(description ?? '').replace(/\s+/g, ' ').trim();
    if (text.length < 10) {
      const tooShort = 'Décrivez votre campagne en une phrase pour lancer la génération.';
      return { ok: false, reason: tooShort, userMessage: tooShort };
    }

    const result = await callMistralJSON({
      model: MISTRAL_MODEL,
      system: SYSTEM_PROMPT,
      user: `Description de l’utilisateur : « ${truncate(text, MAX_DESCRIPTION_LENGTH)} »`,
      temperature: 0.3,
      maxTokens: 600,
      timeoutMs: PARSE_TIMEOUT_MS,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason, userMessage: UNAVAILABLE_MESSAGE };
    }

    const { brief, fieldConfidence, coercedFields } = sanitizeParsed(result.data, truncate(text, MAX_PRODUCT_LENGTH));
    return { ok: true, brief, fieldConfidence, coercedFields };
  } catch (error) {
    return {
      ok: false,
      reason: `Extraction impossible : ${error?.message ?? 'erreur inconnue'}`,
      userMessage: UNAVAILABLE_MESSAGE,
    };
  }
}
