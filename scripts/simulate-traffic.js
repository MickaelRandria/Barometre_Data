import { createStore, clearSimulation } from '../backend/analytics/store.js';
import { generateSimulation } from './simulation-data.js';

try {
  const { events, calibration, weeks } = generateSimulation();
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ dryRun: true, calibration, events: events.length, weeks }, null, 2));
  } else {
    const store = createStore({ timeout: 120000 });
    const removed = await clearSimulation(store);
    const grouped = new Map();
    for (const event of events) {
      const key = `events:${event.timestamp.slice(0, 10)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(JSON.stringify(event));
    }
    const commands = [...grouped].flatMap(([key, values]) => [
      ['RPUSH', key, ...values],
      ['EXPIREAT', key, Date.parse(`${key.slice(7)}T00:00:00Z`) / 1000 + 90 * 86400],
    ]);
    const results = await store(commands, { atomic: true });
    if (results.some((value, index) => index % 2 ? value !== 1 : !Number.isInteger(value) || value < 1)) throw Error('storage_write_failed');
    console.log(`V0 : ${events.length} événements insérés sur 14 jours glissants ; ${removed} anciens événements de simulation remplacés.`);
    console.log(`S-1 : ${weeks.previous} événements / 14 sessions. S : ${weeks.current} événements / 16 sessions.`);
    console.log(`Calibration : population ${calibration.population}, ouvreurs ${calibration.openers} (${calibration.openRate} %), cliqueurs ${calibration.clickers} (${calibration.clickRate} %).`);
    console.log('Source : simulation. Période de test abstraite, aucun historique de diffusion réelle.');
    console.log('Avant la diffusion Cultura : npm run clear:simulation. Seuls les événements source=simulation seront retirés ; le trafic live reste intact.');
  }
} catch {
  console.error('Simulation non terminée. Vérifier le stockage et les variables serveur ; relancer pour remplacer un éventuel jeu partiel.');
  process.exitCode = 1;
}
