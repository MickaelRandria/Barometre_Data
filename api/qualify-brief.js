import { setCors } from './_weather.js';
import { qualifyBrief } from '../backend/engine/briefQualifier.js';

/**
 * Qualification du brief avant analyse.
 *
 * Répond toujours 200 avec `{ issues: [...] }`. Une panne de Ministral, une clé
 * absente ou un timeout rendent `issues: []` : cette étape ne doit jamais
 * empêcher l'utilisateur de lancer son analyse.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ issues: [], error: 'Méthode non autorisée' });

  try {
    const { issues } = await qualifyBrief(req.body ?? {});
    return res.status(200).json({ issues });
  } catch (error) {
    console.error('Brief qualification error:', error);
    return res.status(200).json({ issues: [] });
  }
}
