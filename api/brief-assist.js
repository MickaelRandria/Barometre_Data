import { setCors } from './_weather.js';
import { qualifyBrief } from '../backend/engine/briefQualifier.js';
import { parseBriefDescription } from '../backend/engine/briefParser.js';

/**
 * Assistance Ministral au brief, avant analyse — deux actions sur une seule route.
 *
 * Les deux étaient initialement deux endpoints distincts. Le plan Hobby de
 * Vercel plafonne à 12 fonctions serverless par déploiement : les regrouper ici
 * libère une place sans retirer aucune capacité. Toute la logique reste dans
 * backend/engine/, cette route ne fait que router.
 *
 *   { action: 'qualify', brief }        -> { issues: [...] }
 *   { action: 'parse', description }    -> { ok, brief, fieldConfidence }
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

    return res.status(400).json({ ok: false, reason: `Action inconnue : « ${action} ».` });
  } catch (error) {
    console.error('Brief assist error:', error);
    // Forme de repli valable pour les deux actions : ni suggestion, ni extraction.
    return res.status(200).json({ issues: [], ok: false, reason: 'Assistance indisponible pour le moment.' });
  }
}
