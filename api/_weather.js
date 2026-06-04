import axios from 'axios';

const WMO_MAP = {
  0: 'ciel dégagé',
  1: 'partiellement nuageux', 2: 'partiellement nuageux', 3: 'partiellement nuageux',
  45: 'brouillard', 48: 'brouillard',
  51: 'pluie', 53: 'pluie', 55: 'pluie',
  61: 'pluie', 63: 'pluie', 65: 'pluie',
  71: 'neige', 73: 'neige', 75: 'neige',
  80: 'averses', 81: 'averses', 82: 'averses',
  95: 'orage', 96: 'orage', 99: 'orage',
};

export async function fetchOpenMeteo(lat, lon) {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,relativehumidity_2m',
      timezone: 'auto',
    },
    timeout: 5000,
  });
  const c = data.current;
  return {
    temperature: Math.round(c.temperature_2m * 10) / 10,
    feelsLike: Math.round(c.apparent_temperature * 10) / 10,
    humidity: c.relativehumidity_2m,
    description: WMO_MAP[c.weathercode] ?? 'couvert',
    windSpeed: Math.round(c.windspeed_10m * 10) / 10,
    precipitation: c.precipitation,
    _live: true,
  };
}

export function getSeasonalMockWeather(lat) {
  const month = new Date().getMonth();
  const isNorthern = parseFloat(lat) >= 0;
  const isSummer = isNorthern ? (month >= 5 && month <= 8) : (month >= 11 || month <= 2);
  const isWinter = isNorthern ? (month >= 11 || month <= 2) : (month >= 5 && month <= 8);

  if (isSummer) return { temperature: 26 + Math.random() * 6, feelsLike: 28 + Math.random() * 5, humidity: 45 + Math.round(Math.random() * 20), description: 'ciel dégagé', windSpeed: 3 + Math.random() * 4 };
  if (isWinter) return { temperature: 2 + Math.random() * 6, feelsLike: -1 + Math.random() * 5, humidity: 70 + Math.round(Math.random() * 20), description: 'couvert', windSpeed: 5 + Math.random() * 8 };
  return { temperature: 14 + Math.random() * 6, feelsLike: 12 + Math.random() * 6, humidity: 55 + Math.round(Math.random() * 20), description: 'partiellement nuageux', windSpeed: 4 + Math.random() * 5 };
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
