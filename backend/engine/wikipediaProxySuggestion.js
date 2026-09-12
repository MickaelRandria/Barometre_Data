/**
 * Suggestion d'articles Wikipédia servant de proxys d'intention, assistée par Ministral.
 *
 * Le titre proposé par le modèle n'est JAMAIS retenu tel quel : il n'est qu'une
 * requête de recherche. Le titre final vient systématiquement de l'API de
 * recherche de fr.wikipedia.org, exactement l'appel déjà utilisé par
 * `api/wiki-search.js`. Un candidat sans résultat de recherche est abandonné —
 * on ne fabrique jamais un titre d'article.
 *
 * La philosophie de `sectorMapping.js` est reprise telle quelle : une dimension
 * sans rapport sémantique défendable est simplement absente. Mieux vaut trois
 * axes honnêtes que cinq dont deux sont décoratifs.
 */

import axios from 'axios';
import { MISTRAL_MODEL, callMistralJSON } from './mistralClient.js';

/** Dimensions du moteur — identiques aux clés de `articlesByDimension`. */
export const PROXY_DIMENSIONS = ['cocooning', 'sortie', 'activité extérieure', 'bien-être', 'loisirs créatifs'];

/** Plafond volontaire : au-delà, le signal se dilue plus qu'il ne s'enrichit. */
const MAX_ARTICLES = 5;

const WIKI_API = 'https://fr.wikipedia.org/w/api.php';
const USER_AGENT = 'BarometreData/1.0 (projet academique M2; contact@exemple.fr)';

const SYSTEM_PROMPT = [
  'Tu aides à choisir des articles de l’encyclopédie Wikipédia francophone qui serviront de',
  'proxys d’intention : la fréquentation quotidienne de l’article sert d’indicateur indirect',
  'de l’envie collective correspondant à une dimension.',
  '',
  'Règles :',
  '- Une dimension ne reçoit un article que si le rapport sémantique avec le produit est',
  '  défendable en une phrase. Sinon, OMETS la dimension : une dimension absente vaut',
  '  toujours mieux qu’une association décorative.',
  '- Propose un sujet encyclopédique général (un objet, une pratique, un lieu), jamais une',
  '  marque, un produit commercial, une personne ni un événement daté.',
  '- Un seul titre par dimension, en français, sans underscore ni parenthèse ajoutée.',
  '- Justifie chaque choix en une phrase courte.',
  '',
  `Dimensions autorisées : ${PROXY_DIMENSIONS.join(', ')}.`,
  '',
  'Réponds uniquement par un objet JSON de la forme :',
  '{"suggestions":[{"dimension":"cocooning","article":"Titre","reason":"..."}]}',
].join('\n');

function buildUserPrompt(brief) {
  const product = String(brief?.product ?? '').trim() || 'non précisé';
  const message = String(brief?.message ?? '').trim();
  const lines = [`Produit : ${product}`];
  if (message) lines.push(`Message de campagne : ${message}`);
  if (brief?.audience) lines.push(`Audience : ${brief.audience}`);
  lines.push('', 'Propose au plus un article par dimension pertinente. Omets les dimensions sans lien défendable.');
  return lines.join('\n');
}

/**
 * Résout un candidat en un vrai titre d'article via la recherche Wikipédia.
 * Renvoie `null` si la recherche ne rend aucun résultat : on abandonne alors la
 * dimension plutôt que de retenir le titre inventé par le modèle.
 */
async function resolveArticleTitle(candidate) {
  const query = String(candidate ?? '').replaceAll('_', ' ').trim();
  if (query.length < 2) return null;

  try {
    const { data } = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        srlimit: 1,
        origin: '*',
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5_000,
    });
    const title = data?.query?.search?.[0]?.title;
    return typeof title === 'string' && title.trim() ? title.trim() : null;
  } catch {
    return null;
  }
}

function normalizeSuggestions(data) {
  const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
  const seenDimensions = new Set();
  const normalized = [];

  for (const entry of list) {
    const dimension = String(entry?.dimension ?? '').trim().toLowerCase();
    const matched = PROXY_DIMENSIONS.find((d) => d.toLowerCase() === dimension);
    if (!matched || seenDimensions.has(matched)) continue;

    const candidate = String(entry?.article ?? '').trim();
    if (!candidate) continue;

    seenDimensions.add(matched);
    normalized.push({
      dimension: matched,
      candidate,
      reason: String(entry?.reason ?? '').trim() || 'Aucune justification fournie par le modèle.',
    });
  }

  return normalized;
}

/**
 * @returns {Promise<{ ok: boolean, articles: string[], detail: Array<{dimension: string, article: string, reason: string}>, reason?: string }>}
 *
 * `articles` est directement assignable à `brief.customArticles` : le mode
 * personnalisé de `trendsEngine.js` (`normalizeCustomArticles`) s'active alors
 * sans aucune autre modification du pipeline.
 *
 * Ne lève jamais.
 */
export async function suggestCustomArticles(brief) {
  try {
    const result = await callMistralJSON({
      model: MISTRAL_MODEL,
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(brief),
      temperature: 0.3,
      maxTokens: 600,
    });

    if (!result.ok) {
      return { ok: false, articles: [], detail: [], reason: result.reason };
    }

    const suggestions = normalizeSuggestions(result.data).slice(0, MAX_ARTICLES);
    if (!suggestions.length) {
      return { ok: false, articles: [], detail: [], reason: 'Aucune dimension exploitable dans la réponse du modèle.' };
    }

    const resolved = await Promise.all(suggestions.map(async (suggestion) => {
      const article = await resolveArticleTitle(suggestion.candidate);
      return article ? { dimension: suggestion.dimension, article, reason: suggestion.reason } : null;
    }));

    const detail = [];
    const seenArticles = new Set();
    for (const entry of resolved) {
      if (!entry || seenArticles.has(entry.article)) continue;
      seenArticles.add(entry.article);
      detail.push(entry);
      if (detail.length >= MAX_ARTICLES) break;
    }

    if (!detail.length) {
      return {
        ok: false,
        articles: [],
        detail: [],
        reason: 'Aucun candidat n’a pu être résolu en article Wikipédia existant.',
      };
    }

    return { ok: true, articles: detail.map((entry) => entry.article), detail };
  } catch (error) {
    return {
      ok: false,
      articles: [],
      detail: [],
      reason: `Suggestion d’articles ignorée : ${error?.message ?? 'erreur inconnue'}`,
    };
  }
}
