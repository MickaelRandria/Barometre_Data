import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Get weather data by coordinates
app.get('/api/weather/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY || 'demo';

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    const { main, weather, wind } = response.data;

    res.json({
      temperature: main.temp,
      feelsLike: main.feels_like,
      humidity: main.humidity,
      description: weather[0].description,
      icon: weather[0].icon,
      windSpeed: wind.speed
    });
  } catch (error) {
    res.status(500).json({ error: 'Weather API error' });
  }
});

// Analyze product contextual fit
app.post('/api/analyze', (req, res) => {
  try {
    const { product, temperature, season, message } = req.body;

    // Simple scoring logic - will be enhanced
    let score = 50;
    let recommendations = [];

    // Temperature-based adjustments
    if (temperature < 10) {
      if (message?.toLowerCase().includes('cozy') || message?.toLowerCase().includes('warm')) {
        score += 20;
      } else if (message?.toLowerCase().includes('summer') || message?.toLowerCase().includes('beach')) {
        score -= 25;
        recommendations.push('Message mentionnes l\'été alors qu\'il fait froid - ajuste le ton');
      }
    } else if (temperature > 25) {
      if (message?.toLowerCase().includes('light') || message?.toLowerCase().includes('energy')) {
        score += 20;
      } else if (message?.toLowerCase().includes('cozy') || message?.toLowerCase().includes('winter')) {
        score -= 25;
        recommendations.push('Message trop introspectif pour la météo chaude - augmente l\'énergie');
      }
    }

    res.json({
      contextualScore: Math.min(100, Math.max(0, score)),
      recommendations: recommendations.length > 0 ? recommendations : ['Message bien aligné contextually'],
      suggestedAdjustments: {
        tone: temperature < 10 ? 'warm, cozy, introspective' : 'energetic, light, positive',
        valence: temperature < 10 ? 'low (0-40)' : 'high (70-100)',
        timing: temperature < 10 ? 'evening/night' : 'daytime/morning'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
