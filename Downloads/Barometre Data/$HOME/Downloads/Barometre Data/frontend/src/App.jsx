import { useState } from 'react';
import axios from 'axios';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (formData) => {
    setLoading(true);
    try {
      // Get weather data
      const weatherResponse = await axios.get(
        `/api/weather/${formData.latitude}/${formData.longitude}`
      );

      // Analyze content
      const analysisResponse = await axios.post('/api/analyze', {
        product: formData.product,
        temperature: weatherResponse.data.temperature,
        season: formData.season,
        message: formData.message
      });

      setResults({
        weather: weatherResponse.data,
        analysis: analysisResponse.data,
        formData
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de l\'analyse. Vérifiez votre entrée.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📊 Barometre Data</h1>
        <p>Optimisez vos stratégies marketing selon la météo et la saisonnalité</p>
      </header>

      <main className="container">
        <InputForm onSubmit={handleAnalyze} loading={loading} />
        {results && <Dashboard data={results} />}
      </main>
    </div>
  );
}
