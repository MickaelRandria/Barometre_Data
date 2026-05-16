# 📊 Barometre Data

Plateforme BtoB de prédiction contextuelle marketing basée sur la météo et la saisonnalité.

## 🎯 Concept

Adaptez vos stratégies marketing en temps réel selon:
- **Géolocalisation** des clients
- **Contexte météorologique** actuel
- **Saisonnalité** biologique et comportementale

## 📁 Structure du projet

```
barometre-data/
├── frontend/          # React + Vite (http://localhost:3000)
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
├── backend/           # Node.js/Express API (http://localhost:3001)
│   ├── server.js
│   └── package.json
└── README.md
```

## 🚀 Démarrage rapide

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend tournera sur `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend tournera sur `http://localhost:3000`

## 🔧 Configuration

### Backend - Variables d'environnement

Créer un fichier `.env` dans `backend/`:

```env
PORT=3001
OPENWEATHER_API_KEY=your_key_here
NODE_ENV=development
```

Obtenir une API key: https://openweathermap.org/api

## 📋 MVP Features

- [x] Input form (géoloc + produit + message)
- [x] Intégration OpenWeather API
- [x] Analyse contextuelle basique
- [x] Dashboard avec recommandations
- [ ] Calendrier éditorial optimisé
- [ ] Import données comportements clients
- [ ] Dashboard avancé avec courbes
- [ ] Déploiement Vercel

## 🔗 API Endpoints

### GET `/api/health`
Vérifier que l'API fonctionne

### GET `/api/weather/:lat/:lon`
Récupérer la météo en temps réel
```json
{
  "temperature": 12.5,
  "feelsLike": 10.2,
  "humidity": 65,
  "description": "light rain",
  "windSpeed": 5.2
}
```

### POST `/api/analyze`
Analyser un contenu
```json
{
  "product": "Vêtements cosy",
  "temperature": 12.5,
  "season": "winter",
  "message": "Restez au chaud..."
}
```

## 📊 Roadmap

### Phase 1 (MVP)
- ✅ Interface basique
- ✅ API météo
- ⏳ Score contextuel simple

### Phase 2
- 🔄 Dashboard avancé
- 🔄 Calendrier édito
- 🔄 Métriques de conversion

### Phase 3
- 🎯 Machine learning (prédiction d'impact)
- 🎯 Multi-langue
- 🎯 Export rapports

## 📝 Notes

- Utilise OpenWeather API (gratuit jusqu'à 60 calls/min)
- Frontend proxy vers backend en dev via Vite
- Stockage des données via localStorage pour le MVP

## 🚢 Déploiement Vercel

```bash
vercel
```

Les fonctions serverless Express se déploieront automatiquement.

---

**Auteur:** Mickael Randrianandraina  
**Livre Blanc:** Data & Saisonnalité
