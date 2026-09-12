import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

import { analyzeContext } from './engine/contextEngine.js';
import { calculateScores } from './engine/predictionLayer.js';
import { detectContextualGap } from './engine/gapDetection.js';
import { generateRecommendation } from './engine/agentRecommendation.js';
import { generateVariants } from './engine/variantGenerator.js';
import { generateVariantsWithLLM } from './engine/variantGeneratorLLM.js';
import { generateActivationPlan } from './engine/activationPlan.js';
import { generateABTestPlan } from './engine/abTestPlan.js';
import { evaluateGuardrails } from './engine/guardrails.js';
import { analyzeCampaignResults } from './engine/learningLoop.js';
import { getTrendsCacheKey, getTrendsWithStatus } from './engine/trendsEngine.js';

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
  66: 'pluie verglaçante', 67: 'pluie verglaçante',
  71: 'neige', 73: 'neige', 75: 'neige', 77: 'neige',
  80: 'averses', 81: 'averses', 82: 'averses',
  85: 'averses de neige', 86: 'averses de neige',
  95: 'orage', 96: 'orage', 99: 'orage',
};

async function fetchOpenMeteo(lat, lon) {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat, longitude: lon,
      current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,relative_humidity_2m',
      timezone: 'auto',
    },
    timeout: 5000,
  });
  const c = data.current;
  return {
    temperature: Math.round(c.temperature_2m * 10) / 10,
    feelsLike:   Math.round(c.apparent_temperature * 10) / 10,
    humidity:    c.relative_humidity_2m ?? c.relativehumidity_2m,
    weatherCode: c.weather_code ?? c.weathercode,
    description: WMO_MAP[c.weather_code ?? c.weathercode] ?? 'couvert',
    windSpeed:   Math.round((c.wind_speed_10m ?? c.windspeed_10m) * 10) / 10,
    precipitation: c.precipitation,
    observedAt: c.time ?? null,
    fetchedAt: new Date().toISOString(),
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
const trendsCache = new Map();
const TRENDS_TTL = 6 * 60 * 60 * 1000;

function parseCustomArticles(value) {
  try {
    const articles = JSON.parse(String(value ?? '[]'));
    return Array.isArray(articles) ? articles.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function cleanWikiSnippet(snippet = '') {
  return snippet
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

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
  const now = Date.now();
  const fresh = req.query.fresh === 'true';
  const brief = {
    product: req.query.product ?? '',
    message: req.query.message ?? '',
    customArticles: parseCustomArticles(req.query.customArticles),
  };
  const cacheKey = getTrendsCacheKey(brief);
  const cachedEntry = trendsCache.get(cacheKey);
  const shouldRefresh = fresh || !cachedEntry || now - cachedEntry.storedAt > TRENDS_TTL;
  let entry = cachedEntry;
  if (shouldRefresh) {
    const startedAt = Date.now();
    entry = {
      result: await getTrendsWithStatus('FR', null, brief),
      storedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
    };
    trendsCache.set(cacheKey, entry);
  }
  res.json({ ...entry.result, cached: !shouldRefresh, latencyMs: entry.latencyMs });
});

app.get('/api/wiki-search', async (req, res) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) return res.json({ results: [] });

  try {
    const { data } = await axios.get('https://fr.wikipedia.org/w/api.php', {
      params: { action: 'query', list: 'search', srsearch: query, format: 'json', srlimit: 8, origin: '*' },
      headers: { 'User-Agent': 'BarometreData/1.0 (projet academique M2; contact@exemple.fr)' },
      timeout: 5000,
    });
    res.json({ results: (data.query?.search ?? []).map((result) => ({ title: result.title, snippet: cleanWikiSnippet(result.snippet) })) });
  } catch {
    res.json({ results: [], error: 'Recherche indisponible' });
  }
});

app.post('/api/learning', (req, res) => {
  try {
    res.json(analyzeCampaignResults(req.body));
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    let trendsResult = null;
    try {
      const now = Date.now();
      const cacheKey = getTrendsCacheKey(brief);
      let cacheEntry = trendsCache.get(cacheKey);
      if (!cacheEntry || now - cacheEntry.storedAt > TRENDS_TTL) {
        cacheEntry = { result: await getTrendsWithStatus('FR', weather, brief), storedAt: Date.now() };
        trendsCache.set(cacheKey, cacheEntry);
      }
      trendsResult = cacheEntry.result;
      trends = trendsResult.keywords;
    } catch (error) {
      trendsResult = {
        status: 'unavailable', source: null, keywords: [], dominant: null,
        confidence: 'low', fetchedAt: new Date().toISOString(), dataThrough: null,
        reason: `Signal collectif indisponible : ${error.message}`,
      };
    }

    // 3. Pipeline
    // La latitude est nécessaire au calcul de la normale saisonnière du lieu.
    const context        = analyzeContext(weather, trends, { latitude });
    context.trendsStatus = trendsResult.status;
    context.trendsSource = trendsResult.source;
    context.trendsDataThrough = trendsResult.dataThrough;
    context.trendsFetchedAt = trendsResult.fetchedAt;
    context.trendsReason = trendsResult.reason;
    context.trendsConfidence = trendsResult.confidence;
    context.detectedSector = trendsResult.detectedSector;
    context.sectorLabel = trendsResult.sectorLabel;
    context.sectorConfidence = trendsResult.sectorConfidence;
    context.sectorRationale = trendsResult.sectorRationale;
    context.sectorWeatherSensitive = trendsResult.weatherSensitive !== false;
    context.trendsMomentumLeader = trendsResult.momentumLeader ?? null;
    context.matchedKeywords = trendsResult.matchedKeywords;
    context.customMode = Boolean(trendsResult.customMode);
    context.customArticleCount = trendsResult.customArticleCount ?? 0;
    const scores         = calculateScores(context, brief);
    const gap            = detectContextualGap(context, brief, scores);
    const recommendation = generateRecommendation(context, brief, scores, gap);
    // Couche Ministral strictement opt-in : sans `useMistral`, le pipeline
    // reste exactement celui d'avant, sans aucun appel réseau supplémentaire.
    const variants       = brief.useMistral === true
      ? await generateVariantsWithLLM(context, brief, scores, recommendation)
      : generateVariants(context, brief, scores, recommendation);
    const activation     = generateActivationPlan(context, brief, scores, recommendation, variants);
    const abTest         = generateABTestPlan(context, brief, scores, variants);
    const guardrails     = evaluateGuardrails(context, brief);
    const learning       = {
      status: 'awaiting_results',
      message: 'Renseignez les résultats réels de votre campagne pour obtenir les enseignements de l’agent.',
    };

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
      // null quand aucun signal n'est mesurable : l'endpoint legacy ne
      // fabrique pas davantage de chiffre que le pipeline principal.
      contextualScore: scores.global,
      contextualScoreDisplay: scores.displayGlobal,
      status: scores.status,
      dataConfidence: scores.dataConfidence.level,
      nonDiscriminant: scores.nonDiscriminant,
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
