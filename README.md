# Baromètre Data — Agent Marketing Contextuel

Prototype d'agent marketing contextuel : à partir d'un brief de campagne (produit, message, audience, canal, objectif, pression) et de la météo en temps réel, il calcule un score de réceptivité contextuelle, détecte les décalages message ↔ contexte, génère des variantes de message, un plan d'activation, un plan A/B test, vérifie les garde-fous RGPD et calcule les enseignements post-campagne à partir de résultats saisis.

## Stack

- **Frontend** : React 18 + Vite 5
- **Backend** : Node.js + Express 4 (ES modules)
- **APIs externes** : Open-Meteo pour la météo live et Wikimedia Pageviews pour l'attention collective

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

## Données externes et transparence

- La météo provient d’Open-Meteo, sans cache applicatif. L’interface affiche l’heure de récupération et identifie clairement tout fallback météo comme simulé.
- Le signal collectif provient de Wikimedia Pageviews sur des articles Wikipédia français, agrégés par axe d'intention. Chaque axe compare sa moyenne des 7 derniers jours à sa propre moyenne sur 90 jours, avec des données arrêtées à J-2 pour respecter leur latence de publication.
- Le statut est `live` seulement si au moins trois axes disposent de données Wikimedia. Sinon, l'application affiche explicitement une estimation saisonnière fondée sur la météo et le calendrier. Ce repli ne doit jamais être interprété comme une donnée Wikimedia live.
- La Learning Loop ne simule pas de campagne. Les métriques et enseignements ne sont calculés qu’après saisie des résultats réels de campagne.

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
| `GET` | `/api/trends` | Signal collectif Wikimedia Pageviews et son statut |
| `POST` | `/api/agent` | Pipeline agent complet (10 modules) |
| `POST` | `/api/analyze` | Version simplifiée (legacy) |
| `POST` | `/api/track` | Capture de visites et clics, stockage privé Redis |

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

## Capture d’audience réelle

### Accès administrateur

Le bouton **Administration** est disponible dans la barre supérieure, la sidebar et
le menu mobile. Il ouvre un formulaire ; `/?admin=true` ouvre le même écran.
Le serveur valide `ADMIN_PASSWORD` et signe un cookie de connexion HttpOnly valable
8 heures avec `ADMIN_SESSION_SECRET`. Le bouton **Se déconnecter** ferme la session.
Les anciennes clés d’URL et `VITE_ADMIN_KEY` ne sont plus utilisées.
Ces deux nouveaux secrets se configurent uniquement côté serveur, jamais en `VITE_*`.
Le cookie de connexion admin est distinct du tracking : aucun cookie n’est envoyé
par `/api/track`. Voir `frontend/ADMIN_DEMO.md` pour les commandes locales.

Tests de connexion : `npm run test:admin`.

Après connexion, **V0** (simulation, par défaut) et **V1** (trafic réel) utilisent
le même `AdminDashboard.jsx`. `src/data/mockAnalytics.js` reste intact mais n’est
plus importé. `GET /api/analytics` renvoie V0 et `?source=live` renvoie V1,
toujours avec une session admin (cookie HttpOnly, chemin `/api`). Toutes les clés
journalières disponibles sont parcourues avec SCAN et lectures paginées ; la source
est filtrée avant agrégation. **Actualiser** relit les métriques ; CSV/JSON incluent
la source et la version. La seule dimension temporelle affichée est la sparkline
**S vs S-1**, deux fenêtres de sept jours ancrées sur la dernière date de la source.
Sans stockage, la vue indique la configuration manquante au lieu d’afficher des
chiffres statiques. Un stockage vide affiche zéro. Aucun endpoint de lecture public
n’est ajouté et aucun identifiant de session n’est exposé dans les agrégats.
La lecture pagine par 1 000 événements et échoue explicitement au-delà de 200 000
événements globaux, sans tronquer silencieusement les résultats.

Simulation de l’exercice : `npm run simulate:traffic` remplace uniquement le jeu V0
par 90 événements répartis sur 14 dates UTC glissantes, sans événement antérieur
de plus de 14 jours à l’exécution. Population de référence : 50 ; 30 sessions
(60 %) et 15 cliqueurs (30 %). S-1 compte 14 sessions et S en compte 16.
`npm run clear:simulation` retire uniquement `source=simulation` et préserve
le trafic live, y compris les anciennes captures sans champ source.
Voir `frontend/ADMIN_DEMO.md` pour le déroulé des deux captures pédagogiques.

### Stockage retenu

**Upstash Redis via le Marketplace Vercel**, plan **Free**, région **Francfort (`fra1`)**,
avec `autoUpgrade=false`, `prodPack=false` et `eviction=false`.
[Vercel KV n’est plus proposé](https://vercel.com/docs/redis) : Upstash est son
remplaçant clé-valeur. Le plan gratuit est sélectionné explicitement, sans bascule
automatique vers une offre payante. Les limites du plan restent applicables.

L’endpoint utilise l’API REST Redis avec `fetch` natif : aucune dépendance ajoutée.
Chaque POST valide ajoute un événement à la liste privée `events:YYYY-MM-DD` (UTC).
`RPUSH` et `EXPIREAT` sont exécutés dans une
[transaction REST](https://upstash.com/docs/redis/features/restapi#transactions).
Des visites simultanées ne peuvent donc pas écraser les événements d’une autre
requête, contrairement à la réécriture d’un fichier JSON unique.
Les listes expirent au début du jour UTC J+90, soit au plus 90 jours de conservation.

### Configuration Vercel

1. Dans le projet `barometre-data`, ouvrir **Storage → Create Database → Upstash Redis**.
2. Accepter les conditions du fournisseur si Vercel le demande, choisir **Free**,
   désactiver **Auto Upgrade** et connecter le stockage au projet.
3. Vérifier les variables serveur `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
   Les noms natifs `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont
   également reconnus si leurs équivalents `KV_*` sont absents.
4. Reconstruire et déployer le projet. Ne jamais préfixer les secrets Redis par `VITE_`.

Commande CLI équivalente, après `vercel link` :

```bash
vercel integration add upstash/upstash-kv --name barometre-audience --plan free \
  --metadata primaryRegion=fra1 --metadata autoUpgrade=false \
  --metadata eviction=false --metadata prodPack=false
vercel env pull .env.local --environment=development
```

Le téléchargement `.env.local` doit rester à la racine, ignoré par Git.
Pour tester localement la vraie persistance (Node 22+), depuis la racine :

```bash
node --env-file=.env.local backend/server.js
npm run dev --prefix frontend
```

Vite envoie `/api/track` vers le même handler Express que celui utilisé sur Vercel,
en préservant le Host pour le contrôle CORS. Sans secrets valides, l’endpoint répond
`503 {"ok":false}` ; il ne prétend jamais avoir enregistré un événement.

### Événements et navigation

```json
{
  "type": "pageview",
  "page": "/livre-blanc",
  "section": "livre-blanc",
  "sessionId": "7a967201-4230-4f5d-a24c-123456789abc"
}
```

Le serveur ajoute `timestamp` en ISO UTC et impose `source: 'live'`, indépendamment
de la valeur envoyée par le client. Le script privé impose `source: 'simulation'`.
Une réponse `200 {"ok":true}` signifie que Redis a confirmé l’écriture et l’expiration.
`OPTIONS` renvoie 204 ; les autres méthodes, formats, origines tierces et données
invalides sont rejetés. Le corps est limité à 1 Ko et seuls les six champs décrits
sont stockés. Aucun corps ou header de requête n’est journalisé par ce handler.

| State React | Page logique | Section enregistrée |
| --- | --- | --- |
| `livre` | `/livre-blanc` | `livre-blanc` |
| `brief` | `/brief-generator` | `brief` |
| `weather` | `/signaux-meteo` | `signaux-meteo` |
| `overview` | `/overview-dashboard` | `overview-dashboard` |
| `analyses` | `/analyses` | `analyses` |

Ces libellés sont centralisés dans `shared/tracking.js` et reprennent la nomenclature
demandée pour le futur branchement. Le mock historique conserve ses anciens noms
`signaux` et `overview` : il n’est pas modifié par ce chantier.

- Un `pageview` est émis au chargement et lorsque le contenu affiché change.
  Le double montage d’effets en React StrictMode ne double pas la première visite.
- Un `click` est émis sur les navigations de la sidebar, des onglets, du menu mobile
  et des boutons d’accès aux sections. Cliquer à nouveau la section courante produit
  un clic mais pas une nouvelle vue.
- Quand l’application affiche son formulaire de brief faute de résultat d’analyse,
  la vue enregistrée est `brief`, même si le clic ciblait `overview-dashboard`.
  Une analyse terminée affiche `overview-dashboard` et produit une vue, pas un clic artificiel.
- La section admin n’est jamais enregistrée. Une navigation depuis l’admin vers
  une section publique est comptée normalement.
- `frontend/src/track.js` diffère l’envoi, utilise `fetch` sans credentials ni referrer,
  avec `keepalive` et un délai maximal de 3 secondes. Aucun await dans les interactions,
  aucune erreur affichée et aucune relance automatique. Les bloqueurs ou pannes réseau
  peuvent donc entraîner une sous-mesure sans perturber l’application.

### Données minimisées

L’identifiant aléatoire UUID existe uniquement en mémoire JavaScript. Il est renouvelé
à chaque rechargement ou nouvel onglet ; ni cookie, ni localStorage, ni sessionStorage.
Il ne permet pas de reconnaître un visiteur d’une session à l’autre. La vue réelle
affiche donc des sessions de navigation, des vues et des clics. Le libellé
« visiteurs uniques » signifie ici identifiants de session distincts, avec cette
précision dans le dashboard. La rétention et la durée ne sont pas mesurables.

Le stockage applicatif ne reçoit ni IP, ni user-agent, ni referrer, ni URL avec ses
paramètres, ni nom, email, contenu de brief ou géolocalisation. L’identifiant technique
reste une donnée de session à minimiser : ces mesures ne constituent pas une attestation
d’anonymat ou d’exemption RGPD. Les journaux réseau propres à Vercel/Upstash sont distincts
de cette collecte applicative. Les événements bruts éphémères sont agrégés à la
demande pour la vue réelle, sans exposition des événements individuels au navigateur.

### Vérifications

```bash
npm run test:tracking
npm run test:analytics
npm run build --prefix frontend
```

Les tests couvrent le filtrage des données, CORS, les méthodes, l’horodatage serveur,
l’ajout concurrent, l’expiration, les pannes fournisseur, les sessions éphémères et
le comportement non bloquant du client. Pour constater la capture après déploiement,
ouvrir l’application, changer de section, puis consulter `events:YYYY-MM-DD` avec
`LRANGE` dans la console privée Upstash. Ne pas créer d’endpoint de lecture public.
