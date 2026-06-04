import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

import { analyzeContext } from './engine/contextEngine.js';
import { calculateScores } from './engine/predictionLayer.js';
import { detectContextualGap } from './engine/gapDetection.js';
import { generateRecommendation } from './engine/agentRecommendation.js';
import { generateVariants } from './engine/variantGenerator.js';
import { generateActivationPlan } from './engine/activationPlan.js';
import { generateABTestPlan } from './engine/abTestPlan.js';
import { evaluateGuardrails } from './engine/guardrails.js';
import { analyzeCampaignResults, simulateResults } from './engine/learningLoop.js';
import { getTrends } from './engine/trendsEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* ---- WMO weather code → description ---- */
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

async function fetchOpenMeteo(lat, lon) {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat, longitude: lon,
      current: 'temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,relativehumidity_2m',
      timezone: 'auto',
    },
    timeout: 5000,
  });
  const c = data.current;
  return {
    temperature: Math.round(c.temperature_2m * 10) / 10,
    feelsLike:   Math.round(c.apparent_temperature * 10) / 10,
    humidity:    c.relativehumidity_2m,
    description: WMO_MAP[c.weathercode] ?? 'couvert',
    windSpeed:   Math.round(c.windspeed_10m * 10) / 10,
    precipitation: c.precipitation,
    _live: true,
  };
}

function getSeasonalMockWeather(lat) {
  const month = new Date().getMonth();
  const isNorthern = parseFloat(lat) >= 0;
  const isSummer = isNorthern ? (month >= 5 && month <= 8) : (month >= 11 || month <= 2);
  const isWinter = isNorthern ? (month >= 11 || month <= 2) : (month >= 5 && month <= 8);
  if (isSummer) return { temperature: 26 + Math.random() * 6, feelsLike: 28 + Math.random() * 5, humidity: 45 + Math.round(Math.random() * 20), description: 'ciel dégagé', windSpeed: 3 + Math.random() * 4 };
  if (isWinter) return { temperature: 2 + Math.random() * 6, feelsLike: -1 + Math.random() * 5, humidity: 70 + Math.round(Math.random() * 20), description: 'couvert', windSpeed: 5 + Math.random() * 8 };
  return { temperature: 14 + Math.random() * 6, feelsLike: 12 + Math.random() * 6, humidity: 55 + Math.round(Math.random() * 20), description: 'partiellement nuageux', windSpeed: 4 + Math.random() * 5 };
}

/* ---- Trends cache ---- */
let trendsCache = { data: null, fetchedAt: null };
const TRENDS_TTL = 6 * 60 * 60 * 1000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', modules: 10 });
});

app.get('/api/weather/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  try {
    res.json(await fetchOpenMeteo(lat, lon));
  } catch {
    const mock = getSeasonalMockWeather(lat);
    mock.temperature = Math.round(mock.temperature * 10) / 10;
    mock.feelsLike   = Math.round(mock.feelsLike * 10) / 10;
    mock.windSpeed   = Math.round(mock.windSpeed * 10) / 10;
    mock._mock = true;
    mock._fallback = true;
    res.json(mock);
  }
});

app.get('/api/trends', async (req, res) => {
  try {
    const now = Date.now();
    if (!trendsCache.data || !trendsCache.fetchedAt || now - trendsCache.fetchedAt > TRENDS_TTL) {
      trendsCache.data = await getTrends('FR');
      trendsCache.fetchedAt = now;
    }
    res.json({ trends: trendsCache.data, fetchedAt: trendsCache.fetchedAt });
  } catch (error) {
    res.status(500).json({ error: 'Trends unavailable', details: error.message });
  }
});

app.post('/api/agent', async (req, res) => {
  try {
    const brief = req.body;
    const latitude  = brief.lat  || '48.8566';
    const longitude = brief.lon  || '2.3522';

    // 1. Météo
    let weather;
    try {
      weather = await fetchOpenMeteo(latitude, longitude);
    } catch {
      weather = getSeasonalMockWeather(latitude);
      weather.temperature = Math.round(weather.temperature * 10) / 10;
      weather.feelsLike   = Math.round(weather.feelsLike * 10) / 10;
      weather.windSpeed   = Math.round(weather.windSpeed * 10) / 10;
      weather._mock = true;
      weather._fallback = true;
    }

    // 2. Tendances
    let trends = null;
    try {
      const now = Date.now();
      if (!trendsCache.data || !trendsCache.fetchedAt || now - trendsCache.fetchedAt > TRENDS_TTL) {
        trendsCache.data = await getTrends('FR');
        trendsCache.fetchedAt = now;
      }
      trends = trendsCache.data;
    } catch { /* silent */ }

    // 3. Pipeline
    const context        = analyzeContext(weather, trends);
    const scores         = calculateScores(context, brief);
    const gap            = detectContextualGap(context, brief, scores);
    const recommendation = generateRecommendation(context, brief, scores, gap);
    const variants       = generateVariants(context, brief, scores, recommendation);
    const activation     = generateActivationPlan(context, brief, scores, recommendation, variants);
    const abTest         = generateABTestPlan(context, brief, scores, variants);
    const guardrails     = evaluateGuardrails(context, brief);
    const simulatedData  = simulateResults(scores, variants.bestVariant);
    const learning       = analyzeCampaignResults(simulatedData, scores);

    res.json({
      context, scores, gap, recommendation, variants,
      activation, abTest, guardrails, learning,
      meta: { analyzedAt: new Date().toISOString(), version: '2.1', modules: 10 },
    });
  } catch (error) {
    console.error('Agent pipeline error:', error);
    res.status(500).json({ error: 'Agent pipeline error', details: error.message });
  }
});

// Legacy endpoint (backwards compatible)
app.post('/api/analyze', (req, res) => {
  try {
    const { product, message, tone, audience, channel, objective, pressure } = req.body;
    const brief = { product, message, tone, audience, channel, objective, pressure };
    const weather = getSeasonalMockWeather('48.8566');
    weather.temperature = Math.round(weather.temperature * 10) / 10;
    weather._mock = true;
    const context = analyzeContext(weather);
    const scores  = calculateScores(context, brief);
    const gap     = detectContextualGap(context, brief, scores);
    res.json({
      contextualScore: scores.global,
      interpretation:  scores.interpretation,
      context: { type: context.contextType.label, weather: context.weather, season: context.season.label },
      gap:     { hasGap: gap.hasGap, level: gap.gapLevel, summary: gap.summary },
      scores:  scores.subscores,
    });
  } catch {
    res.status(500).json({ error: 'Analysis error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
