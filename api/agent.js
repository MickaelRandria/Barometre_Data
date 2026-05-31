import axios from 'axios';
import { getSeasonalMockWeather, setCors } from './_weather.js';
import { analyzeContext } from '../backend/engine/contextEngine.js';
import { calculateScores } from '../backend/engine/predictionLayer.js';
import { detectContextualGap } from '../backend/engine/gapDetection.js';
import { generateRecommendation } from '../backend/engine/agentRecommendation.js';
import { generateVariants } from '../backend/engine/variantGenerator.js';
import { generateActivationPlan } from '../backend/engine/activationPlan.js';
import { generateABTestPlan } from '../backend/engine/abTestPlan.js';
import { evaluateGuardrails } from '../backend/engine/guardrails.js';
import { analyzeCampaignResults, simulateResults } from '../backend/engine/learningLoop.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const brief = req.body;
    const { lat, lon } = brief;
    const latitude = lat || '48.8566';
    const longitude = lon || '2.3522';
    const apiKey = process.env.OPENWEATHER_API_KEY;

    let weather;
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

    const context = analyzeContext(weather);
    const scores = calculateScores(context, brief);
    const gap = detectContextualGap(context, brief, scores);
    const recommendation = generateRecommendation(context, brief, scores, gap);
    const variants = generateVariants(context, brief, scores, recommendation);
    const activation = generateActivationPlan(context, brief, scores, recommendation, variants);
    const abTest = generateABTestPlan(context, brief, scores, variants);
    const guardrails = evaluateGuardrails(context, brief);
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
}
