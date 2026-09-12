import { fetchOpenMeteo, getSeasonalMockWeather, setCors } from './_weather.js';
import { getTrendsCacheKey, getTrendsWithStatus } from '../backend/engine/trendsEngine.js';
import { analyzeContext } from '../backend/engine/contextEngine.js';
import { calculateScores } from '../backend/engine/predictionLayer.js';
import { detectContextualGap } from '../backend/engine/gapDetection.js';
import { generateRecommendation } from '../backend/engine/agentRecommendation.js';
import { generateVariants } from '../backend/engine/variantGenerator.js';
import { generateVariantsWithLLM } from '../backend/engine/variantGeneratorLLM.js';
import { generateActivationPlan } from '../backend/engine/activationPlan.js';
import { generateABTestPlan } from '../backend/engine/abTestPlan.js';
import { evaluateGuardrails } from '../backend/engine/guardrails.js';

const trendsCache = new Map();
const TRENDS_TTL = 6 * 60 * 60 * 1000; // 6 heures

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const brief = req.body;
    const { lat, lon } = brief;
    const latitude = lat || '48.8566';
    const longitude = lon || '2.3522';

    // 1. Météo — Open-Meteo avec fallback saisonnier
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

    // 2. Tendances — cache 6h, fallback silencieux
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
        version: '2.1',
        modules: 10,
      },
    });
  } catch (error) {
    console.error('Agent pipeline error:', error);
    res.status(500).json({ error: 'Agent pipeline error', details: error.message });
  }
}
