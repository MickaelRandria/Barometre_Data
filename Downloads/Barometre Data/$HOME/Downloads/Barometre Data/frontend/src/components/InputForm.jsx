import { useState } from 'react';
import '../styles/InputForm.css';

export default function InputForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    latitude: '48.8566',
    longitude: '2.3522',
    product: 'Vêtements cosy',
    season: 'winter',
    message: 'Restez au chaud avec notre collection hiver',
    conversionRate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <h2>Analysez votre contenu marketing</h2>

      <div className="form-section">
        <h3>📍 Géolocalisation</h3>
        <div className="form-group">
          <label>Latitude</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            step="0.0001"
            required
          />
        </div>
        <div className="form-group">
          <label>Longitude</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            step="0.0001"
            required
          />
        </div>
        <small>Paris (48.8566, 2.3522) par défaut</small>
      </div>

      <div className="form-section">
        <h3>🎯 Produit & Contenu</h3>
        <div className="form-group">
          <label>Nom du produit/campagne</label>
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Ex: Vêtements cosy, Crème solaire..."
            required
          />
        </div>
        <div className="form-group">
          <label>Message marketing</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Entrez votre message ou sujet d'email"
            rows="3"
            required
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📅 Contexte saisonnier</h3>
        <div className="form-group">
          <label>Saison</label>
          <select name="season" value={formData.season} onChange={handleChange}>
            <option value="spring">Printemps</option>
            <option value="summer">Été</option>
            <option value="autumn">Automne</option>
            <option value="winter">Hiver</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>📊 Données comportements (optionnel)</h3>
        <div className="form-group">
          <label>Taux de conversion actuel (%)</label>
          <input
            type="number"
            name="conversionRate"
            value={formData.conversionRate}
            onChange={handleChange}
            placeholder="Ex: 2.5"
            step="0.1"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Analyse en cours...' : '🔍 Analyser'}
      </button>
    </form>
  );
}
