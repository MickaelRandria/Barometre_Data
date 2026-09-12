/**
 * Tests de la couche Ministral (optionnelle).
 *
 * Aucun appel réseau vers api.mistral.ai : le scénario « vraie réponse » passe
 * par un serveur HTTP local pointé via MISTRAL_API_BASE_URL.
 *
 *   node backend/tests/mistralLayer.test.js
 */

import assert from 'node:assert/strict';
import http from 'node:http';

import { analyzeContext } from '../engine/contextEngine.js';
import { calculateScores } from '../engine/predictionLayer.js';
import { detectContextualGap } from '../engine/gapDetection.js';
import { generateRecommendation } from '../engine/agentRecommendation.js';
import { generateVariants } from '../engine/variantGenerator.js';
import { generateVariantsWithLLM } from '../engine/variantGeneratorLLM.js';
import { suggestCustomArticles } from '../engine/wikipediaProxySuggestion.js';
import { detectMessageWeatherContradictions } from '../engine/weatherConsistency.js';

/* ------------------------------------------------------------------ */
/* Harnais minimal                                                     */
/* ------------------------------------------------------------------ */

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

function clearKey() {
  delete process.env.MISTRAL_API_KEY;
  delete process.env.MISTRAL_API_BASE_URL;
}

/* ------------------------------------------------------------------ */
/* Fixtures — météo pluvieuse et froide, volontairement discriminante  */
/* ------------------------------------------------------------------ */

const LATITUDE = '48.8566';

const WEATHER = {
  temperature: 5.2,
  feelsLike: 2.1,
  humidity: 88,
  weatherCode: 61,
  description: 'pluie',
  windSpeed: 14.0,
  precipitation: 1.4,
  observedAt: '2026-01-15T09:00',
  fetchedAt: new Date().toISOString(),
  _live: true,
};

const BRIEF = {
  product: 'Plaid en laine',
  message: 'Découvrez notre nouvelle sélection pour la maison.',
  tone: 'chaleureux',
  audience: 'clients fidèles',
  channel: 'email',
  objective: 'notoriété',
  pressure: 'normale',
};

/** Message conforme : aucune affirmation sur le climat extérieur. */
const GOOD_MESSAGE = 'Prenez le temps de découvrir « Plaid en laine », une parenthèse de douceur à savourer chez vous.';

/** Message fautif : promet du soleil alors que la météo simulée est pluvieuse. */
const BAD_MESSAGE = 'Profitez du soleil pour sortir avec « Plaid en laine » et savourer cette belle journée dehors.';

function buildPipeline() {
  const context = analyzeContext(WEATHER, null, { latitude: LATITUDE });
  const scores = calculateScores(context, BRIEF);
  const gap = detectContextualGap(context, BRIEF, scores);
  const recommendation = generateRecommendation(context, BRIEF, scores, gap);
  return { context, scores, recommendation };
}

function byId(variants, id) {
  const variant = variants.find((entry) => entry.id === id);
  assert.ok(variant, `variante « ${id} » absente du résultat`);
  return variant;
}

/* ------------------------------------------------------------------ */
/* Serveur Ministral simulé                                            */
/* ------------------------------------------------------------------ */

function startMockMistral(payload) {
  const received = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      received.push({
        url: req.url,
        authorization: req.headers.authorization,
        body: (() => { try { return JSON.parse(body); } catch { return null; } })(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'mock-completion',
        model: 'ministral-8b-latest',
        choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(payload) }, finish_reason: 'stop' }],
      }));
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        received,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

console.log('\nCouche Ministral — tests\n');

// Garantit que la fixture « fautive » est bien détectée comme critique/forte :
// sans cela, le test 2 pourrait passer pour une mauvaise raison.
await test('la fixture fautive est réellement une contradiction bloquante', () => {
  const contradictions = detectMessageWeatherContradictions(BAD_MESSAGE, WEATHER);
  const blocking = contradictions.filter((c) => ['critical', 'high'].includes(c.severity));
  assert.ok(blocking.length > 0, 'la météo simulée devrait contredire le message fautif');
});

await test('1. sans MISTRAL_API_KEY, repli intégral sur les gabarits, sans exception', async () => {
  clearKey();
  const { context, scores, recommendation } = buildPipeline();

  const deterministic = generateVariants(context, BRIEF, scores, recommendation);
  const result = await generateVariantsWithLLM(context, BRIEF, scores, recommendation);

  assert.equal(result.mistral.used, false);
  assert.match(result.mistral.reason, /MISTRAL_API_KEY/);

  // Forme strictement identique au déterministe, au champ `source` près.
  assert.equal(result.variants.length, deterministic.variants.length);
  assert.equal(result.bestVariant, deterministic.bestVariant);
  assert.equal(result.contextType, deterministic.contextType);
  assert.equal(result.reasoning, deterministic.reasoning);

  for (const [index, variant] of result.variants.entries()) {
    assert.equal(variant.source, 'template');
    assert.equal(variant.message, deterministic.variants[index].message);
    assert.equal(variant.id, deterministic.variants[index].id);
    assert.equal(variant.tone, deterministic.variants[index].tone);
  }
});

await test('2. repli granulaire : seule la variante contredisant la météo est remplacée', async () => {
  const mock = await startMockMistral({
    variants: [
      { id: 'contextualized', message: GOOD_MESSAGE },
      { id: 'agentic', message: BAD_MESSAGE },
    ],
  });

  try {
    process.env.MISTRAL_API_KEY = 'test-key-not-a-real-secret';
    process.env.MISTRAL_API_BASE_URL = mock.baseUrl;

    const { context, scores, recommendation } = buildPipeline();
    const deterministic = generateVariants(context, BRIEF, scores, recommendation);
    const result = await generateVariantsWithLLM(context, BRIEF, scores, recommendation);

    // La variante saine est retenue telle quelle.
    const contextualized = byId(result.variants, 'contextualized');
    assert.equal(contextualized.source, 'mistral');
    assert.equal(contextualized.message, GOOD_MESSAGE);

    // La variante fautive retombe sur son équivalent déterministe — et sur lui seul.
    const agentic = byId(result.variants, 'agentic');
    assert.equal(agentic.source, 'template');
    assert.equal(agentic.message, byId(deterministic.variants, 'agentic').message);
    assert.notEqual(agentic.message, BAD_MESSAGE);

    // La variante « standard » n'est jamais déléguée au modèle.
    const standard = byId(result.variants, 'standard');
    assert.equal(standard.source, 'template');
    assert.equal(standard.message, byId(deterministic.variants, 'standard').message);

    assert.equal(result.mistral.used, true);
    assert.match(result.mistral.reason, /agentic/);
    assert.doesNotMatch(result.mistral.reason, /contextualized/);

    // La requête sortante est bien celle attendue.
    assert.equal(mock.received.length, 1);
    const request = mock.received[0];
    assert.equal(request.url, '/v1/chat/completions');
    assert.equal(request.authorization, 'Bearer test-key-not-a-real-secret');
    assert.equal(request.body.model, 'ministral-8b-latest');
    assert.equal(request.body.response_format.type, 'json_object');

    // Le prompt ne transporte que des faits déjà calculés.
    const userPrompt = request.body.messages.find((m) => m.role === 'user').content;
    assert.match(userPrompt, /Plaid en laine/);
    assert.match(userPrompt, new RegExp(context.contextType.label));
    assert.match(userPrompt, /longueur maximale : 500 caractères/);
  } finally {
    clearKey();
    await mock.close();
  }
});

await test('2b. JSON malformé ou variante absente : repli complet, sans exception', async () => {
  const mock = await startMockMistral({ variants: [{ id: 'contextualized', message: 'trop court' }] });

  try {
    process.env.MISTRAL_API_KEY = 'test-key-not-a-real-secret';
    process.env.MISTRAL_API_BASE_URL = mock.baseUrl;

    const { context, scores, recommendation } = buildPipeline();
    const deterministic = generateVariants(context, BRIEF, scores, recommendation);
    const result = await generateVariantsWithLLM(context, BRIEF, scores, recommendation);

    assert.equal(result.mistral.used, false);
    for (const [index, variant] of result.variants.entries()) {
      assert.equal(variant.source, 'template');
      assert.equal(variant.message, deterministic.variants[index].message);
    }
  } finally {
    clearKey();
    await mock.close();
  }
});

await test('3. suggestCustomArticles renvoie { ok: false } proprement sans clé', async () => {
  clearKey();
  const result = await suggestCustomArticles(BRIEF);

  assert.equal(result.ok, false);
  assert.deepEqual(result.articles, []);
  assert.deepEqual(result.detail, []);
  assert.match(result.reason, /MISTRAL_API_KEY/);
});

/* ------------------------------------------------------------------ */

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} test(s) réussis.\n`);
if (failed.length) process.exit(1);
