# Baromètre Data — Agent Marketing Contextuel

Prototype d'agent marketing contextuel : à partir d'un brief de campagne (produit, message, audience, canal, objectif, pression) et de la météo en temps réel, il calcule un score de réceptivité contextuelle, détecte les décalages message ↔ contexte, génère des variantes de message, un plan d'activation, un plan A/B test, vérifie les garde-fous RGPD et simule un learning loop post-campagne.

## Stack

- **Frontend** : React 18 + Vite 5
- **Backend** : Node.js + Express 4 (ES modules)
- **API externe** : OpenWeather (avec fallback mock saisonnier si pas de clé)

## Structure

```
.
├── backend/
│   ├── engine/              # 9 modules du moteur agentique
│   │   ├── contextEngine.js
│   │   ├── predictionLayer.js
│   │   ├── gapDetection.js
│   │   ├── agentRecommendation.js
│   │   ├── variantGenerator.js
│   │   ├── activationPlan.js
│   │   ├── abTestPlan.js
│   │   ├── guardrails.js
│   │   └── learningLoop.js
│   ├── server.js            # Express + routes /api/health, /api/weather, /api/agent
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Composants + logique UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js       # Proxy /api → http://localhost:3001
│   └── package.json
└── .env.example
```

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Configuration

Créer un fichier `backend/.env` à partir de `.env.example` :

```
PORT=3001
OPENWEATHER_API_KEY=demo
NODE_ENV=development
```

Avec `OPENWEATHER_API_KEY=demo`, le backend retourne des données météo simulées (mock saisonnier réaliste). Pour utiliser de vraies données, créer une clé gratuite sur [openweathermap.org](https://openweathermap.org/api).

## Lancement

Dans deux terminaux séparés :

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Endpoints

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Santé de l'API |
| `GET` | `/api/weather/:lat/:lon` | Météo brute pour une position |
| `POST` | `/api/agent` | Pipeline agent complet (10 modules) |
| `POST` | `/api/analyze` | Version simplifiée (legacy) |

### Payload `/api/agent`

```json
{
  "product": "bougie parfumée",
  "message": "Un moment cocooning",
  "tone": "chaleureux",
  "audience": "clients-actifs",
  "channel": "email",
  "objective": "engagement",
  "pressure": "moyen",
  "lat": "48.8566",
  "lon": "2.3522"
}
```

Retourne `context`, `scores`, `gap`, `recommendation`, `variants`, `activation`, `abTest`, `guardrails`, `learning`, `meta`.

## Build production

```bash
cd frontend
npm run build   # → dist/
npm run preview # serveur de preview local
```

## Contexte académique

Prototype M2 Data Marketing & IA.
