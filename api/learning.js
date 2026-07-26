import { analyzeCampaignResults } from '../backend/engine/learningLoop.js';
import { setCors } from './_weather.js';

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    return res.json(analyzeCampaignResults(req.body));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
