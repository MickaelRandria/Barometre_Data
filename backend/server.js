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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', modules: 10 });
});

function getSeasonalMockWeather(lat) {
  const month = new Date().getMonth();
  const isNorthern = parseFloat(lat) >= 0;
  const isSummer = isNorthern ? (month >= 5 && month <= 8) : (month >= 11 || month <= 2);
  const isWinter = isNorthern ? (month >= 11 || month <= 2) : (month >= 5 && month <= 8);

  if (isSummer) return { temperature: 26 + Math.random() * 6, feelsLike: 28 + Math.random() * 5, humidity: 45 + Math.round(Math.random() * 20), description: 'ciel dégagé', icon: '01d', windSpeed: 3 + Math.random() * 4 };
  if (isWinter) return { temperature: 2 + Math.random() * 6, feelsLike: -1 + Math.random() * 5, humidity: 70 + Math.round(Math.random() * 20), description: 'couvert', icon: '04d', windSpeed: 5 + Math.random() * 8 };
  return { temperature: 14 + Math.random() * 6, feelsLike: 12 + Math.random() * 6, humidity: 55 + Math.round(Math.random() * 20), description: 'partiellement nuageux', icon: '03d', windSpeed: 4 + Math.random() * 5 };
}

app.get('/api/weather/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey === 'demo') {
      const mock = getSeasonalMockWeather(lat);
      mock.temperature = Math.round(mock.temperature * 10) / 10;
      mock.feelsLike = Math.round(mock.feelsLike * 10) / 10;
      mock.windSpeed = Math.round(mock.windSpeed * 10) / 10;
      mock._mock = true;
      return res.json(mock);
    }

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
  } catch (error) {
    const mock = getSeasonalMockWeather(req.params.lat);
    mock.temperature = Math.round(mock.temperature * 10) / 10;
    mock.feelsLike = Math.round(mock.feelsLike * 10) / 10;
    mock.windSpeed = Math.round(mock.windSpeed * 10) / 10;
    mock._mock = true;
    mock._fallback = true;
    res.json(mock);
  }
});

/**
 * POST /api/agent — Full Agent Marketing Contextuel pipeline
 * Accepts enriched brief (10 fields) and returns complete agent output.
 */
app.post('/api/agent', async (req, res) => {
  try {
    const brief = req.body;
    const {
      product,
      message,
      tone,
      audience,
      channel,
      objective,
      pressure,
      lat,
      lon,
    } = brief;

    // 1. Fetch weather
    let weather;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const latitude = lat || '48.8566';
    const longitude = lon || '2.3522';

    if (!apiKey || apiKey === 'demo') {
      weather = getSeasonalMockWeather(latitude);
      weather.temperature = Math.round(weather.temperature * 10) / 10;
      weather.feelsLike = Math.round(weather.feelsLike * 10) / 10;
      weather.windSpeed = Math.round(weather.windSpeed * 10) / 10;
      weather._mock = true;
    } else {
      try {
        const resp = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=fr`
        );
        const { main, weather: w, wind } = resp.data;
        weather = {
          temperature: main.temp,
          feelsLike: main.feels_like,
          humidity: main.humidity,
          description: w[0].description,
          windSpeed: wind.speed,
        };
      } catch {
        weather = getSeasonalMockWeather(latitude);
        weather.temperature = Math.round(weather.temperature * 10) / 10;
        weather._mock = true;
        weather._fallback = true;
      }
    }

    // 2. Context Engine
    const context = analyzeContext(weather);

    // 3. Prediction Layer
    const scores = calculateScores(context, brief);

    // 4. Gap Detection
    const gap = detectContextualGap(context, brief, scores);

    // 5. Agent Recommendation
    const recommendation = generateRecommendation(context, brief, scores, gap);

    // 6. Variant Generator
    const variants = generateVariants(context, brief, scores, recommendation);

    // 7. Activation Plan
    const activation = generateActivationPlan(context, brief, scores, recommendation, variants);

    // 8. A/B Test Plan
    const abTest = generateABTestPlan(context, brief, scores, variants);

    // 9. RGPD Guardrails
    const guardrails = evaluateGuardrails(context, brief);

    // 10. Learning Loop (simulation)
    const simulatedData = simulateResults(scores, variants.bestVariant);
    const learning = analyzeCampaignResults(simulatedData, scores);

    res.json({
      context,
      scores,
      gap,
      recommendation,
      variants,
      activation,
      abTest,
      guardrails,
      learning,
      meta: {
        analyzedAt: new Date().toISOString(),
        version: '2.0',
        modules: 10,
      },
    });
  } catch (error) {
    console.error('Agent pipeline error:', error);
    res.status(500).json({ error: 'Agent pipeline error', details: error.message });
  }
});

// Legacy analyze endpoint (backwards compatible)
app.post('/api/analyze', (req, res) => {
  try {
    const { product, message, tone, audience, channel, objective, pressure } = req.body;
    const brief = { product, message, tone, audience, channel, objective, pressure };

    const weather = getSeasonalMockWeather('48.8566');
    weather.temperature = Math.round(weather.temperature * 10) / 10;
    weather._mock = true;

    const context = analyzeContext(weather);
    const scores = calculateScores(context, brief);
    const gap = detectContextualGap(context, brief, scores);

    res.json({
      contextualScore: scores.global,
      interpretation: scores.interpretation,
      context: {
        type: context.contextType.label,
        weather: context.weather,
        season: context.season.label,
      },
      gap: {
        hasGap: gap.hasGap,
        level: gap.gapLevel,
        summary: gap.summary,
      },
      scores: scores.subscores,
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
