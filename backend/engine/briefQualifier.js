/**
 * Qualification du brief AVANT analyse — couche Ministral, strictement facultative.
 *
 * Cette étape ne calcule rien et ne touche à aucun score : elle relit ce que
 * l'utilisateur a saisi et propose au plus deux clarifications. Toute
 * défaillance (clé absente, timeout, JSON douteux) se traduit par un tableau
 * vide, jamais par une erreur : l'utilisateur doit toujours pouvoir lancer son
 * analyse, et le parcours sans Ministral doit rester identique à aujourd'hui.
 */

import { MISTRAL_MODEL, callMistralJSON } from './mistralClient.js';

/**
 * Champs adressables par une suggestion. Une suggestion visant un champ absent
 * de cette liste est écartée : le bouton « Préciser » doit toujours pouvoir
 * donner le focus à un champ réel du formulaire.
 */
export const QUALIFIABLE_FIELDS = [
  'product', 'message', 'tone', 'audience', 'channel', 'objective', 'pressure', 'city',
];

const FIELD_LABELS = {
  product: 'Produit / Univers',
  message: 'Message principal',
  tone: 'Ton',
  audience: 'Audience',
  channel: 'Canal',
  objective: 'Objectif',
  pressure: 'Pression commerciale',
  city: 'Ville',
};

/** Deux suggestions au maximum : au-delà, l'encart cesse d'être une aide. */
const MAX_ISSUES = 2;

/** Longueur au-delà de laquelle une question cesse d'être « courte et actionnable ». */
const MAX_QUESTION_LENGTH = 240;

/** Chemin critique d'une interaction : on abandonne vite plutôt que faire attendre. */
const QUALIFY_TIMEOUT_MS = 4_500;

const SEVERITIES = ['info', 'warning'];

const SYSTEM_PROMPT = [
  'Tu es un assistant qui aide à qualifier un brief de campagne marketing avant son analyse.',
  'Tu n’évalues jamais la performance ni la pertinence marketing du brief : un autre moteur',
  's’en charge. Tu ne juges que la clarté et la complétude de ce qui a été saisi.',
  '',
  'Identifie UNIQUEMENT les problèmes suivants, s’ils existent :',
  '1. Le champ produit est trop vague pour être catégorisé par secteur',
  '   (ex. « un truc sympa » plutôt que « écharpe en laine »).',
  '2. Le message contient une affirmation ambiguë sur le moment ou la saison',
  '   qui n’est pas explicite.',
  '3. Il y a une contradiction interne évidente entre deux champs',
  '   (ex. ton « urgent » mais objectif « branding long terme »).',
  '4. Un champ obligatoire semble vide ou quasi vide.',
  '',
  'Règles de sortie :',
  '- Jamais plus de 2 problèmes. Priorise les plus importants.',
  '- Si tout est clair, renvoie un tableau vide. Ne force jamais une remarque.',
  '- `question` est une question de clarification courte et actionnable, en français,',
  '  adressée à l’utilisateur, au ton constructif — jamais un reproche.',
  `- \`field\` vaut exactement l’une de ces valeurs : ${QUALIFIABLE_FIELDS.join(', ')}.`,
  '- `severity` vaut exactement « info » ou « warning ».',
  '',
  'Réponds uniquement par un objet JSON strict de la forme :',
  '{"issues":[{"field":"product","severity":"warning","question":"..."}]}',
].join('\n');

function buildUserPrompt(brief) {
  const lines = QUALIFIABLE_FIELDS.map((field) => {
    const value = String(brief?.[field] ?? '').trim();
    return `- ${FIELD_LABELS[field]} (${field}) : ${value || '(vide)'}`;
  });
  return ['Voici le brief à qualifier :', ...lines, '', 'Analyse-le selon les règles fournies.'].join('\n');
}

/**
 * La sortie du modèle n'est jamais reprise telle quelle : champ inconnu,
 * sévérité fantaisiste ou question vide font écarter la suggestion.
 * Une seule suggestion par champ, pour que « Préciser » reste sans ambiguïté.
 */
function sanitizeIssues(data) {
  const raw = Array.isArray(data?.issues) ? data.issues : [];
  const seenFields = new Set();
  const issues = [];

  for (const entry of raw) {
    const field = String(entry?.field ?? '').trim();
    if (!QUALIFIABLE_FIELDS.includes(field) || seenFields.has(field)) continue;

    const question = String(entry?.question ?? '').replace(/\s+/g, ' ').trim();
    if (!question) continue;

    const severity = SEVERITIES.includes(String(entry?.severity ?? '').trim())
      ? String(entry.severity).trim()
      // Une sévérité non reconnue est rétrogradée : dans le doute, on informe
      // plutôt que d'alerter.
      : 'info';

    seenFields.add(field);
    issues.push({
      field,
      label: FIELD_LABELS[field],
      severity,
      question: question.length > MAX_QUESTION_LENGTH
        ? `${question.slice(0, MAX_QUESTION_LENGTH - 1).trimEnd()}…`
        : question,
    });

    if (issues.length >= MAX_ISSUES) break;
  }

  return issues;
}

/**
 * @returns {Promise<{ issues: Array<{field, label, severity, question}>, reason: string | null }>}
 *
 * `issues` est vide dès que la qualification n'a pas abouti. L'appelant n'a
 * jamais à distinguer « rien à signaler » de « Ministral indisponible » pour
 * décider s'il laisse partir l'analyse : dans les deux cas, elle part.
 *
 * Ne lève jamais.
 */
export async function qualifyBrief(brief) {
  try {
    const result = await callMistralJSON({
      model: MISTRAL_MODEL,
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(brief),
      temperature: 0.2,
      maxTokens: 400,
      timeoutMs: QUALIFY_TIMEOUT_MS,
    });

    if (!result.ok) return { issues: [], reason: result.reason };

    return { issues: sanitizeIssues(result.data), reason: null };
  } catch (error) {
    return { issues: [], reason: `Qualification ignorée : ${error?.message ?? 'erreur inconnue'}` };
  }
}
