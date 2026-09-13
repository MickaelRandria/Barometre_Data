import { setCors } from './_weather.js';
import { parseBriefDescription } from '../backend/engine/briefParser.js';

/**
 * Transforme une description libre en brief structuré pré-rempli.
 *
 * Contrairement aux autres endpoints Ministral du projet, l'échec est remonté
 * explicitement (`ok: false` + message) : sans extraction il n'y a rien à
 * pré-remplir, et l'interface doit pouvoir basculer sur la saisie manuelle en
 * le disant clairement plutôt que de rendre un formulaire vide sans raison.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'Méthode non autorisée' });
  }

  try {
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
  } catch (error) {
    console.error('Brief parsing error:', error);
    return res.status(200).json({ ok: false, reason: 'Génération indisponible pour le moment.' });
  }
}
