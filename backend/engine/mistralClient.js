/**
 * Client Ministral partagé — couche LLM strictement optionnelle.
 *
 * Principe directeur : ce module ne lève jamais. Toute défaillance (clé
 * absente, réseau, quota, JSON malformé) se traduit par `{ ok: false, reason }`,
 * jamais par une exception. Les appelants doivent pouvoir se replier sur leur
 * résultat déterministe sans jamais entourer l'appel d'un try/catch.
 */

import axios from 'axios';

/** Modèle utilisé pour l'ensemble des appels Ministral du projet. */
export const MISTRAL_MODEL = 'ministral-8b-latest';

/** Surchargeable pour pointer un serveur mock local pendant les tests. */
const DEFAULT_BASE_URL = 'https://api.mistral.ai';

const DEFAULT_TIMEOUT_MS = 12_000;

function getBaseUrl() {
  const raw = String(process.env.MISTRAL_API_BASE_URL || '').trim();
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/**
 * Extrait le premier objet JSON d'une réponse. Ministral respecte en principe
 * `response_format: json_object`, mais un modèle 8B peut encadrer sa sortie
 * d'un bloc Markdown : on retente une extraction avant d'abandonner.
 */
function parseJsonContent(content) {
  const raw = String(content ?? '').trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    // On retombe sur l'extraction ci-dessous.
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Appelle Ministral en mode JSON.
 *
 * @returns {Promise<{ ok: true, data: object } | { ok: false, reason: string }>}
 */
export async function callMistralJSON({
  model = MISTRAL_MODEL,
  system,
  user,
  temperature = 0.4,
  maxTokens = 600,
} = {}) {
  const apiKey = String(process.env.MISTRAL_API_KEY || '').trim();
  if (!apiKey) {
    return { ok: false, reason: 'MISTRAL_API_KEY absente : couche LLM désactivée.' };
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: String(system) });
  messages.push({ role: 'user', content: String(user ?? '') });

  let response;
  try {
    response = await axios.post(
      `${getBaseUrl()}/v1/chat/completions`,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: DEFAULT_TIMEOUT_MS,
      },
    );
  } catch (error) {
    const status = error?.response?.status;
    return {
      ok: false,
      reason: `Appel Ministral en échec${status ? ` (HTTP ${status})` : ''} : ${error?.message ?? 'erreur inconnue'}`,
    };
  }

  const content = response?.data?.choices?.[0]?.message?.content;
  const data = parseJsonContent(content);
  if (!data) {
    return { ok: false, reason: 'Réponse Ministral non exploitable : JSON absent ou malformé.' };
  }

  return { ok: true, data };
}
