export function getSeasonalMockWeather(lat) {
  const month = new Date().getMonth();
  const isNorthern = parseFloat(lat) >= 0;
  const isSummer = isNorthern ? (month >= 5 && month <= 8) : (month >= 11 || month <= 2);
  const isWinter = isNorthern ? (month >= 11 || month <= 2) : (month >= 5 && month <= 8);

  if (isSummer) return { temperature: 26 + Math.random() * 6, feelsLike: 28 + Math.random() * 5, humidity: 45 + Math.round(Math.random() * 20), description: 'ciel dégagé', icon: '01d', windSpeed: 3 + Math.random() * 4 };
  if (isWinter) return { temperature: 2 + Math.random() * 6, feelsLike: -1 + Math.random() * 5, humidity: 70 + Math.round(Math.random() * 20), description: 'couvert', icon: '04d', windSpeed: 5 + Math.random() * 8 };
  return { temperature: 14 + Math.random() * 6, feelsLike: 12 + Math.random() * 6, humidity: 55 + Math.round(Math.random() * 20), description: 'partiellement nuageux', icon: '03d', windSpeed: 4 + Math.random() * 5 };
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
