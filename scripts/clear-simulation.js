import { createStore, clearSimulation } from '../backend/analytics/store.js';

try {
  const count = await clearSimulation(createStore({ timeout: 120000 }));
  console.log(`${count} événements source=simulation supprimés. Événements live et historiques sans source préservés.`);
} catch {
  console.error('Nettoyage non terminé. Vérifier le stockage et les variables serveur, puis relancer clear:simulation.');
  process.exitCode = 1;
}
