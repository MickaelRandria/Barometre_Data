import { getSeasonalMockWeather, setCors } from './_weather.js';
import { analyzeContext } from '../backend/engine/contextEngine.js';
import { calculateScores } from '../backend/engine/predictionLayer.js';
import { detectContextualGap } from '../backend/engine/gapDetection.js';

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const brief = req.body;
    const weather = getSeasonalMockWeather('48.8566');
    weather.temperature = Math.round(weather.temperature * 10) / 10;
    weather._mock = true;

    const context = analyzeContext(weather);
    const scores = calculateScores(context, brief);
    const gap = detectContextualGap(context, brief, scores);

    res.json({
      // null quand aucun signal n'est mesurable : l'endpoint legacy ne
      // fabrique pas davantage de chiffre que le pipeline principal.
      contextualScore: scores.global,
      contextualScoreDisplay: scores.displayGlobal,
      status: scores.status,
      dataConfidence: scores.dataConfidence.level,
      nonDiscriminant: scores.nonDiscriminant,
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
}
