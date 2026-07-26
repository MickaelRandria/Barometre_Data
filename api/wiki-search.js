import axios from 'axios';
import { setCors } from './_weather.js';

const USER_AGENT = 'BarometreData/1.0 (projet academique M2; contact@exemple.fr)';

function cleanSnippet(snippet = '') {
  return snippet
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = String(req.query?.q ?? '').trim();
  if (query.length < 2) return res.status(200).json({ results: [] });

  try {
    const { data } = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        format: 'json',
        srlimit: 8,
        origin: '*',
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5_000,
    });

    return res.status(200).json({
      results: (data.query?.search ?? []).map((result) => ({
        title: result.title,
        snippet: cleanSnippet(result.snippet),
      })),
    });
  } catch {
    return res.status(200).json({ results: [], error: 'Recherche indisponible' });
  }
}
