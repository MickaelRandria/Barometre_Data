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

/**
 * Appelé depuis le formulaire : l'utilisateur attend devant son écran, et
 * chaque candidat est ensuite résolu par une recherche Wikipédia (5 s), en
 * parallèle. 6 s se sont révélées trop justes en conditions réelles ; 8 s
 * laissent la marge sans faire patienter indéfiniment.
 */
const SUGGEST_TIMEOUT_MS = 8_000;

const WIKI_API = 'https://fr.wikipedia.org/w/api.php';
const USER_AGENT = 'BarometreData/1.0 (projet academique M2; contact@exemple.fr)';

const SYSTEM_PROMPT = [
  'Tu aides à choisir des articles de l’encyclopédie Wikipédia francophone qui serviront de',
  'proxys d’intention : la fréquentation quotidienne de l’article sert d’indicateur indirect',
  'de l’envie collective correspondant à une dimension.',
  '',
  'Règles :',
  '- Une dimension ne reçoit un article que si le rapport avec le produit est DIRECT :',
  '  l’article doit désigner une situation où l’on utilise, porte, consomme ou pratique',
  '  réellement ce produit. Un lien passant par une chaîne de conséquences',
  '  (« ce produit fait gagner du temps, donc du temps libre, donc du loisir ») n’est pas',
  '  un lien direct : c’est une association décorative.',
  '- N’essaie JAMAIS de remplir les cinq dimensions. La plupart des produits n’en',
  '  concernent que deux ou trois. Omettre une dimension est le comportement attendu,',
  '  pas un échec : deux axes honnêtes valent mieux que cinq dont trois sont plaqués.',
  '- Contre-exemples de ce qu’il ne faut jamais produire : pour un logiciel de',
  '  comptabilité, « activité extérieure » ou « loisirs créatifs » n’ont aucun proxy',
  '  défendable — il faut les omettre, pas les remplir avec un salon professionnel ou',
  '  un article d’informatique. Pour une automobile, « bien-être » n’en a pas non plus.',
  '- Propose un sujet encyclopédique général (un objet, une pratique, un lieu), jamais une',
  '  marque, un produit commercial, une personne ni un événement daté.',
  '- Un seul titre par dimension, en français, sans underscore ni parenthèse ajoutée.',
  '- Justifie chaque choix en une phrase courte qui nomme la situation d’usage concrète.',
  '  Si tu n’arrives pas à écrire cette phrase sans détour, c’est que la dimension',
  '  doit être omise.',
  '',
  'Une dimension décrit la SITUATION DE LA PERSONNE au moment où elle a envie du',
  'produit — pas le domaine professionnel ou technique du produit :',
  '- cocooning : rester chez soi, confort domestique, soirée au calme.',
  '- sortie : sortir, voir du monde, restaurant, spectacle, ville.',
  '- activité extérieure : plein air, sport, nature, marche, vélo.',
  '- bien-être : prendre soin de soi, détente, sommeil, santé.',
  '- loisirs créatifs : pratique manuelle amateur, fabriquer soi-même.',
  '',
  'Un logiciel de comptabilité ne relève d’aucune de ces cinq situations : la',
  'bonne réponse pour lui est une liste vide. Ne classe jamais un article dans',
  'une dimension au seul motif qu’il parle du même sujet que le produit.',
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

/** Normalisation pour comparer un candidat et un titre résolu. */
function significantWords(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((word) => word.length >= 4),
  );
}

/**
 * Le titre rendu par la recherche doit encore parler du candidat.
 *
 * Sans ce contrôle, « Fabrication de bougies » ressortait en « Zézette de Sète »
 * (une pâtisserie) : la recherche plein texte renvoie toujours un premier
 * résultat, même sans rapport. Un candidat d'un seul mot court n'ayant aucun mot
 * significatif, on accepte alors le résultat tel quel, faute de pouvoir comparer.
 */
export function titleMatchesCandidate(candidate, title) {
  const wanted = significantWords(candidate);
  if (!wanted.size) return true;
  const found = significantWords(title);
  for (const word of wanted) {
    if (found.has(word)) return true;
    // Tolère les variations morphologiques : « bougies » / « bougie ».
    for (const other of found) {
      if (other.startsWith(word.slice(0, 4)) && word.startsWith(other.slice(0, 4))) return true;
    }
  }
  return false;
}

/**
 * Parenthèse d'homonymie désignant une œuvre, une personne ou un événement daté.
 *
 * Le prompt les interdit déjà, mais la résolution Wikipédia peut y mener seule :
 * le candidat « Peau » ressortait en « Peau d'Âne (film, 1970) ». Un proxy
 * d'intention doit être un sujet général, pas un film.
 */
const WORK_DISAMBIGUATION = /\((?:film|t[ée]l[ée]film|roman|livre|album|chanson|single|s[ée]rie|s[ée]rie t[ée]l[ée]vis[ée]e|jeu vid[ée]o|groupe|opéra|pièce|bande dessin[ée]e|manga|homonymie)[^)]*\)|\([^)]*(?:19|20)\d{2}\)/i;

export function isGeneralTopic(title) {
  return !WORK_DISAMBIGUATION.test(String(title ?? ''));
}

async function wikiQuery(params) {
  const { data } = await axios.get(WIKI_API, {
    params: { action: 'query', format: 'json', origin: '*', ...params },
    headers: { 'User-Agent': USER_AGENT },
    timeout: 5_000,
  });
  return data;
}

/**
 * Résout un candidat en un vrai titre d'article Wikipédia.
 *
 * D'abord une résolution exacte du titre (redirections suivies), qui est fiable.
 * À défaut seulement, une recherche plein texte, dont le résultat doit encore
 * correspondre au candidat. Renvoie `null` si rien ne convient : on abandonne la
 * dimension plutôt que de retenir un article sans rapport.
 */
async function resolveArticleTitle(candidate) {
  const query = String(candidate ?? '').replaceAll('_', ' ').trim();
  if (query.length < 2) return null;

  // 1. Titre exact, redirections suivies.
  try {
    const data = await wikiQuery({ titles: query, redirects: 1 });
    const pages = Object.values(data?.query?.pages ?? {});
    const page = pages[0];
    if (page && page.missing === undefined && typeof page.title === 'string' && page.title.trim()
        && isGeneralTopic(page.title)) {
      return page.title.trim();
    }
  } catch {
    // On tente la recherche ci-dessous.
  }

  // 2. Recherche plein texte, validée contre le candidat.
  try {
    const data = await wikiQuery({ list: 'search', srsearch: query, srlimit: 3 });
    for (const hit of data?.query?.search ?? []) {
      const title = typeof hit?.title === 'string' ? hit.title.trim() : '';
      if (title && isGeneralTopic(title) && titleMatchesCandidate(query, title)) return title;
    }
  } catch {
    return null;
  }

  return null;
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
      timeoutMs: SUGGEST_TIMEOUT_MS,
    });

    if (!result.ok) {
      return { ok: false, articles: [], detail: [], reason: result.reason };
    }

    const suggestions = normalizeSuggestions(result.data).slice(0, MAX_ARTICLES);
    if (!suggestions.length) {
      // Réponse légitime, pas une panne : aucun axe n'a de proxy défendable pour
      // ce produit. C'est exactement ce que l'audit de sectorMapping.js attend.
      return {
        ok: false,
        noDefensibleAxis: true,
        articles: [],
        detail: [],
        reason: 'Aucune dimension exploitable dans la réponse du modèle.',
        userMessage: 'Aucun axe d’intention défendable pour ce produit. Le mapping automatique reste le plus honnête.',
      };
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
        noDefensibleAxis: true,
        articles: [],
        detail: [],
        reason: 'Aucun candidat n’a pu être résolu en article Wikipédia existant.',
        userMessage: 'Aucun article Wikipédia correspondant n’a été trouvé. Ajoutez vos articles à la main.',
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
