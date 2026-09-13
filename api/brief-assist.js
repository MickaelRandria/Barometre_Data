import { setCors } from './_weather.js';
import { qualifyBrief } from '../backend/engine/briefQualifier.js';
import { parseBriefDescription } from '../backend/engine/briefParser.js';
import { suggestCustomArticles } from '../backend/engine/wikipediaProxySuggestion.js';

/**
 * Assistance Ministral au brief, avant analyse — trois actions sur une seule route.
 *
 * Elles étaient destinées à autant d'endpoints distincts. Le plan Hobby de
 * Vercel plafonne à 12 fonctions serverless par déploiement : les regrouper ici
 * libère des places sans retirer aucune capacité. Toute la logique reste dans
 * backend/engine/, cette route ne fait que router.
 *
 *   { action: 'qualify', brief }          -> { issues: [...] }
 *   { action: 'parse', description }      -> { ok, brief, fieldConfidence }
 *   { action: 'suggest-articles', brief } -> { ok, articles, detail }
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'Méthode non autorisée' });
  }

  const action = String(req.body?.action ?? '').trim();

  try {
    if (action === 'qualify') {
      // Répond toujours 200 : une panne ne doit jamais retenir l'utilisateur.
      const { issues } = await qualifyBrief(req.body?.brief ?? {});
      return res.status(200).json({ issues });
    }

    if (action === 'parse') {
      const result = await parseBriefDescription(req.body?.description);
      if (!result.ok) {
        // Le détail technique reste côté serveur ; l'utilisateur lit un message clair.
        console.warn('Brief parsing unavailable:', result.reason);
        return res.status(200).json({ ok: false, reason: result.userMessage });
      }
      return res.status(200).json({
        ok: true,
        brief: result.brief,
        fieldConfidence: result.fieldConfidence,
      });
    }

    if (action === 'suggest-articles') {
      // Les titres viennent de la recherche Wikipédia, jamais du modèle seul.
      const result = await suggestCustomArticles(req.body?.brief ?? {});
      if (!result.ok) console.warn('Article suggestion unavailable:', result.reason);
      return res.status(200).json({
        ok: result.ok,
        articles: result.articles,
        detail: result.detail,
        reason: result.ok
          ? null
          : (result.userMessage ?? 'Suggestion indisponible. Ajoutez vos articles à la main.'),
      });
    }

    return res.status(400).json({ ok: false, reason: `Action inconnue : « ${action} ».` });
  } catch (error) {
    console.error('Brief assist error:', error);
    // Forme de repli valable pour les trois actions.
    return res.status(200).json({ issues: [], ok: false, articles: [], detail: [], reason: 'Assistance indisponible pour le moment.' });
  }
}
