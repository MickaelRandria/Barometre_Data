# Accès administrateur

Ouvrir l’application, cliquer sur **Administration** dans la barre supérieure,
la navigation latérale ou le menu mobile, puis saisir le mot de passe.
Le lien `/?admin=true` ouvre également le formulaire. Les anciennes clés d’URL
ne donnent plus accès au dashboard.

Le mot de passe est validé par `api/admin-session.js` avec `ADMIN_PASSWORD`,
une variable serveur. `ADMIN_SESSION_SECRET` signe une session valable 8 heures.
Le cookie de connexion est HttpOnly, SameSite=Strict et Secure sur HTTPS.
Il sert exclusivement à la connexion admin, jamais au tracking d’audience.
La session est vérifiée à l’ouverture, au retour sur la fenêtre et chaque minute.
Le bouton **Se déconnecter** efface le cookie de connexion.

Les deux secrets se trouvent dans `.env.local` à la racine (ignoré par Git)
et dans les variables serveur du projet Vercel. Ne pas utiliser de variable `VITE_*`
pour le mot de passe. Une modification des secrets Vercel nécessite un redéploiement.

En local, depuis la racine :

```bash
node --env-file=.env.local backend/server.js
npm run dev --prefix frontend
```

Deux versions utilisent exactement le même composant et les mêmes cartes : **V0**
(simulation, sélection par défaut) et **V1** (trafic réel). `mockAnalytics.js`
reste intact mais n’est plus importé. Le badge près du titre identifie la version.
`GET /api/analytics` renvoie V0 ; `?source=live` renvoie explicitement V1.
La lecture reste réservée à l’admin. Elle parcourt toutes les clés journalières
disponibles, puis filtre la source avant les calculs. Aucun événement brut ni
identifiant individuel n’est transmis au navigateur.

La seule temporalité visible est **S vs S-1** : deux fenêtres contiguës de sept
jours UTC, ancrées sur le dernier événement de la source choisie. Les totaux globaux
couvrent tous les événements conservés. Si S-1 vaut zéro, la variation est indéfinie.
**Actualiser** recharge les chiffres. Les exports gardent `source`, `version` et
les définitions des métriques pour conserver leur provenance.

Depuis la racine, Node 22.9+ et variables serveur dans `.env.local` :

```bash
npm run simulate:traffic -- --dry-run
npm run simulate:traffic
# Capture V0 dans l’admin, puis avant la diffusion :
npm run clear:simulation
# Capture V1 après la diffusion réelle.
```

La simulation remplace uniquement les anciens événements marqués `simulation`.
Elle crée 90 événements, 30 sessions et 15 cliqueurs (population de référence 50),
avec S-1 = 14 sessions et S = 16. Ses horodatages sont calculés à l’exécution,
sur les 14 dates UTC précédentes, sans jamais dépasser 14 jours d’ancienneté.
Ces dates techniques ne sont pas affichées comme un historique de diffusion.
Le nettoyage retire les valeurs marquées par `LREM`, sans reconstruire les listes,
sans toucher aux ajouts live concurrents ni aux événements anciens sans source.

Le stockage Upstash doit être connecté au projet Vercel avec `KV_REST_API_URL`
et `KV_REST_API_TOKEN`, puis le projet redéployé. Sans stockage, la vue réelle
affiche un état de configuration ; elle n’utilise aucun jeu de secours.
La collecte commence à l’activation, sans reprise des visites antérieures.
Les sessions sont distinctes par onglet et chargement : ce ne sont pas des visiteurs
uniques. Les clics couvrent les navigations entre sections, pas tous les boutons.
Les pages de lecture contiennent jusqu’à 1 000 événements ; au-delà de 200 000
événements globaux, la lecture échoue explicitement au lieu de tronquer les totaux.
Le champ « visiteurs uniques » suit la définition demandée pour l’exercice :
identifiants de session distincts, pas personnes uniques. Le taux d’engagement
désigne les sessions avec un clic ; durée et nouveaux/connus ne sont pas mesurables.

Validation : `npm run test:admin`, `npm run test:tracking`, `npm run test:analytics`, `npm run build --prefix frontend`.
