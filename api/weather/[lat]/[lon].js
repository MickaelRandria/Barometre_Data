import axios from 'axios';
import { getSeasonalMockWeather, setCors } from '../../_weather.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'demo') {
    const mock = getSeasonalMockWeather(lat);
    mock.temperature = Math.round(mock.temperature * 10) / 10;
    mock.feelsLike = Math.round(mock.feelsLike * 10) / 10;
    mock.windSpeed = Math.round(mock.windSpeed * 10) / 10;
    mock._mock = true;
    return res.json(mock);
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
    );
    const { main, weather, wind } = response.data;
    res.json({
      temperature: main.temp,
      feelsLike: main.feels_like,
      humidity: main.humidity,
      description: weather[0].description,
      icon: weather[0].icon,
      windSpeed: wind.speed,
    });
  } catch {
    const mock = getSeasonalMockWeather(lat);
    mock.temperature = Math.round(mock.temperature * 10) / 10;
    mock.feelsLike = Math.round(mock.feelsLike * 10) / 10;
    mock.windSpeed = Math.round(mock.windSpeed * 10) / 10;
    mock._mock = true;
    mock._fallback = true;
    res.json(mock);
  }
}
