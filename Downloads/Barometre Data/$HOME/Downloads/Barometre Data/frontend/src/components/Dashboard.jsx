import '../styles/Dashboard.css';

export default function Dashboard({ data }) {
  const { weather, analysis, formData } = data;

  return (
    <div className="dashboard">
      <h2>📈 Résultats de l'analyse</h2>

      <div className="results-grid">
        {/* Météo actuelle */}
        <div className="card weather-card">
          <h3>🌡️ Météo en direct</h3>
          <div className="weather-info">
            <p className="temp">{weather.temperature}°C</p>
            <p className="description">{weather.description}</p>
            <p className="feels-like">Ressenti: {weather.feelsLike}°C</p>
            <p className="humidity">Humidité: {weather.humidity}%</p>
            <p className="wind">Vent: {weather.windSpeed} km/h</p>
          </div>
        </div>

        {/* Score contextuel */}
        <div className="card score-card">
          <h3>✅ Score contextuel</h3>
          <div className="score-display">
            <div className="score-value">{analysis.contextualScore}</div>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{
                  width: `${analysis.contextualScore}%`,
                  backgroundColor: analysis.contextualScore > 70 ? '#10b981' : analysis.contextualScore > 40 ? '#f59e0b' : '#ef4444'
                }}
              ></div>
            </div>
          </div>
          <p className="score-interpretation">
            {analysis.contextualScore > 70
              ? '✅ Excellent alignement contextuel'
              : analysis.contextualScore > 40
              ? '⚠️ Alignement moyen - ajustements recommandés'
              : '❌ Faible alignement - modifications nécessaires'}
          </p>
        </div>

        {/* Recommandations */}
        <div className="card recommendations-card">
          <h3>💡 Recommandations</h3>
          <ul>
            {analysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Ajustements suggérés */}
        <div className="card adjustments-card">
          <h3>🎨 Ajustements suggérés</h3>
          <div className="adjustments">
            <div className="adjustment-item">
              <label>Ton recommandé:</label>
              <p>{analysis.suggestedAdjustments.tone}</p>
            </div>
            <div className="adjustment-item">
              <label>Valence émotionnelle:</label>
              <p>{analysis.suggestedAdjustments.valence}</p>
            </div>
            <div className="adjustment-item">
              <label>Timing optimal:</label>
              <p>{analysis.suggestedAdjustments.timing}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="summary">
        <h3>📝 Récapitulatif de l'analyse</h3>
        <p>
          <strong>Produit:</strong> {formData.product}
        </p>
        <p>
          <strong>Localisation:</strong> {formData.latitude}, {formData.longitude}
        </p>
        <p>
          <strong>Contexte:</strong> {formData.season} - {weather.temperature}°C
        </p>
      </div>
    </div>
  );
}
