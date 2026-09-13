/**
 * Tests du dimensionnement du plan A/B.
 *
 *   node backend/tests/abTestPlan.test.js
 */

import assert from 'node:assert/strict';

import { analyzeContext } from '../engine/contextEngine.js';
import { calculateScores } from '../engine/predictionLayer.js';
import { generateVariants } from '../engine/variantGenerator.js';
import { generateABTestPlan } from '../engine/abTestPlan.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

const WEATHER = {
  temperature: 12.4, feelsLike: 11, humidity: 70, weatherCode: 3,
  description: 'partiellement nuageux', windSpeed: 8, precipitation: 0, _live: true,
};

function plan(overrides = {}) {
  const brief = {
    product: 'Écharpe en laine', message: 'Préparez la rentrée.', tone: 'dynamique',
    audience: 'clients-actifs', channel: 'email', objective: 'engagement', pressure: 'moyen',
    ...overrides,
  };
  const context = analyzeContext(WEATHER, null, { latitude: '48.8566' });
  const scores = calculateScores(context, brief);
  const variants = generateVariants(context, brief, scores, null);
  return { abTest: generateABTestPlan(context, brief, scores, variants), groupCount: variants.variants.length };
}

console.log('\nPlan A/B — dimensionnement\n');

test('la taille d’audience saisie pilote réellement l’échantillon', () => {
  const { abTest } = plan({ audienceSize: '5000' });
  assert.equal(abTest.population.isProvided, true);
  assert.equal(abTest.population.total, 5000);
  assert.match(abTest.population.testSize, /5 ?000|5 000/);
});

test('les 3 groupes reçoivent un effectif chiffré, pas un texte à définir', () => {
  const { abTest } = plan({ audienceSize: '5000' });
  for (const group of abTest.groups) {
    assert.match(group.allocation, /contacts/, `groupe ${group.id} : ${group.allocation}`);
    assert.doesNotMatch(group.allocation, /à définir/i);
  }
});

test('la répartition est égale et ne perd aucun contact à l’arrondi', () => {
  for (const total of [5000, 9999, 1, 2, 7, 100000]) {
    const { abTest, groupCount } = plan({ audienceSize: String(total) });
    const counts = abTest.groups.map((g) => {
      const m = g.allocation.match(/([\d\s  ]+) contacts/);
      return m ? Number(m[1].replace(/[\s  ]/g, '')) : 0;
    });
    assert.equal(counts.length, groupCount);
    assert.equal(counts.reduce((a, b) => a + b, 0), total, `somme incorrecte pour ${total}`);
    // Écart maximal d'un contact entre groupes : la répartition reste égale.
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `répartition déséquilibrée pour ${total}`);
  }
});

test('la durée dépend du canal et n’est jamais « à définir »', () => {
  const cases = [['email', /5 à 7 jours/], ['sms', /2 à 3 jours/], ['push', /2 à 3 jours/], ['paid-social', /7 jours/], ['homepage', /5 jours/]];
  for (const [channel, expected] of cases) {
    const { abTest } = plan({ audienceSize: '5000', channel });
    assert.match(abTest.duration.label, expected, `canal ${channel} : ${abTest.duration.label}`);
    assert.doesNotMatch(abTest.duration.label, /à définir/i);
  }
});

test('un canal inconnu retombe sur une durée par défaut exploitable', () => {
  const { abTest } = plan({ audienceSize: '5000', channel: 'pigeon-voyageur' });
  assert.match(abTest.duration.label, /jours/);
  assert.doesNotMatch(abTest.duration.label, /à définir/i);
});

test('aucune mention de CRM nulle part dans le plan', () => {
  for (const audienceSize of ['5000', '', undefined, '0', 'abc']) {
    const { abTest } = plan({ audienceSize });
    assert.doesNotMatch(JSON.stringify(abTest), /CRM/i, `audienceSize = ${JSON.stringify(audienceSize)}`);
  }
});

test('sans audience : repli propre pointant le champ par son vrai libellé', () => {
  for (const audienceSize of ['', undefined, '0', '-5', 'abc']) {
    const { abTest } = plan({ audienceSize });
    assert.equal(abTest.population.isProvided, false, `pour ${JSON.stringify(audienceSize)}`);
    assert.match(abTest.population.note, /Taille de l’audience/);
    assert.match(abTest.recommendation, /Taille de l’audience/);
    // Les groupes restent lisibles : un pourcentage à défaut d'effectif.
    for (const group of abTest.groups) assert.match(group.allocation, /%/);
  }
});

test('le reste du plan n’est pas altéré', () => {
  const { abTest } = plan({ audienceSize: '5000' });
  assert.ok(abTest.hypothesis.h0.length > 0);
  assert.ok(abTest.hypothesis.h1.length > 0);
  assert.ok(abTest.kpis.length > 0);
  assert.equal(abTest.successCriteria.length, 2);
  // La puissance statistique reste non annoncée : rien n'est inventé.
  assert.match(abTest.statisticalSignificance, /effet minimal détectable/);
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} test(s) réussis.\n`);
if (failed.length) process.exit(1);
