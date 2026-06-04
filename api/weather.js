import { fetchOpenMeteo, getSeasonalMockWeather, setCors } from './_weather.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat et lon requis' });
  }

  try {
    const weather = await fetchOpenMeteo(lat, lon);
    res.json(weather);
  } catch {
    const mock = getSeasonalMockWeather(lat);
    mock.temperature = Math.round(mock.temperature * 10) / 10;
    mock.feelsLike   = Math.round(mock.feelsLike * 10) / 10;
    mock.windSpeed   = Math.round(mock.windSpeed * 10) / 10;
    mock._mock = true;
    mock._fallback = true;
    res.json(mock);
  }
}
