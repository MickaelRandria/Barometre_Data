/**
 * Tests de la relecture Ministral du score.
 *
 * Aucun appel réseau externe : Ministral est simulé par un serveur HTTP local.
 *
 *   node backend/tests/scoreReview.test.js
 */

import assert from 'node:assert/strict';
import http from 'node:http';

import { analyzeContext } from '../engine/contextEngine.js';
import { calculateScores, SUBSCORE_WEIGHTS } from '../engine/predictionLayer.js';
import { reviewScoreCoherence } from '../engine/scoreReview.js';

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

const WEATHER = {
  temperature: 28.4, feelsLike: 30.1, humidity: 42, weatherCode: 0,
  description: 'ciel dégagé', windSpeed: 6.2, precipitation: 0, _live: true,
};

const BRIEF = {
  product: 'Doudoune en duvet', message: 'Préparez l’hiver avec notre nouvelle collection.',
  tone: 'chaleureux', audience: 'clients-actifs', channel: 'email',
  objective: 'conversion', pressure: 'moyen', city: 'Paris',
};

function buildPipeline() {
  const context = analyzeContext(WEATHER, null, { latitude: '48.8566' });
  const scores = calculateScores(context, BRIEF);
  return { context, scores };
}

function startMockMistral(payload, { delayMs = 0, status = 200 } = {}) {
  const received = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      received.push({ body: (() => { try { return JSON.parse(body); } catch { return null; } })() });
      const respond = () => {
        if (status !== 200) { res.writeHead(status); res.end('{}'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          choices: [{ message: { content: typeof payload === 'string' ? payload : JSON.stringify(payload) } }],
        }));
      };
      if (delayMs) setTimeout(respond, delayMs); else respond();
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        received,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

async function withMock(payload, options, run) {
  const mock = await startMockMistral(payload, options);
  try {
    process.env.MISTRAL_API_KEY = 'test-key-not-a-real-secret';
    process.env.MISTRAL_API_BASE_URL = mock.baseUrl;
    return await run(mock);
  } finally {
    clearKey();
    await mock.close();
  }
}

console.log('\nRelecture du score — tests\n');

await test('sans clé API : relecture sautée, jamais de fausse alerte', async () => {
  clearKey();
  const { context, scores } = buildPipeline();
  const review = await reviewScoreCoherence(BRIEF, context, scores);

  assert.equal(review.coherent, true, 'une relecture absente ne doit jamais alerter');
  assert.equal(review.reviewSkipped, true);
  assert.equal(review.confidence, 'low');
  assert.equal(review.reason, null);
});

await test('incohérence signalée et justifiée : remontée telle quelle', async () => {
  await withMock({
    coherent: false,
    confidence: 'high',
    reason: 'Une doudoune promue à 28 °C contredit le contexte détecté.',
  }, {}, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);

    assert.equal(review.coherent, false);
    assert.equal(review.confidence, 'high');
    assert.match(review.reason, /doudoune/i);
    assert.equal(review.reviewSkipped, false);
  });
});

await test('score cohérent : aucun signalement', async () => {
  await withMock({ coherent: true, confidence: 'high', reason: null }, {}, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    assert.equal(review.coherent, true);
    assert.equal(review.reason, null);
    assert.equal(review.reviewSkipped, false);
  });
});

await test('incohérence SANS explication : signalement écarté', async () => {
  await withMock({ coherent: false, confidence: 'high', reason: '   ' }, {}, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    assert.equal(review.coherent, true, 'un badge qu’on ne sait pas justifier ne doit pas s’afficher');
    assert.equal(review.reason, null);
  });
});

await test('confiance fantaisiste rétrogradée en low', async () => {
  await withMock({ coherent: false, confidence: 'ABSOLUE', reason: 'Contradiction produit/météo.' }, {}, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    assert.equal(review.confidence, 'low');
    assert.equal(review.coherent, false);
  });
});

await test('le prompt transmet le score et les poids réels de la formule', async () => {
  await withMock({ coherent: true, confidence: 'high', reason: null }, {}, async (mock) => {
    const { context, scores } = buildPipeline();
    await reviewScoreCoherence(BRIEF, context, scores);

    const userPrompt = mock.received[0].body.messages.find((m) => m.role === 'user').content;
    assert.match(userPrompt, new RegExp(`Score global : ${scores.global}/100`));
    assert.match(userPrompt, /Doudoune en duvet/);
    assert.match(userPrompt, /28\.4 °C/);
    // Les poids viennent de SUBSCORE_WEIGHTS, pas de constantes recopiées.
    for (const weight of Object.values(SUBSCORE_WEIGHTS)) {
      assert.match(userPrompt, new RegExp(`poids ${Math.round(weight * 100)} %`));
    }
    // Les 5 sous-scores sont décrits, pas seulement 4.
    assert.match(userPrompt, /Intention collective/);
  });
});

await test('score non publiable : relecture sans objet, aucun appel au modèle', async () => {
  await withMock({ coherent: false, confidence: 'high', reason: 'ne devrait pas être lu' }, {}, async (mock) => {
    const { context } = buildPipeline();
    const notMeasurable = { global: null, status: 'not_measurable', subscores: {}, nonDiscriminant: [] };
    const review = await reviewScoreCoherence(BRIEF, context, notMeasurable);

    assert.equal(review.coherent, true);
    assert.equal(review.reviewSkipped, true);
    assert.equal(mock.received.length, 0, 'aucun appel ne doit partir pour un score non publiable');
  });
});

await test('JSON malformé : relecture sautée, aucune exception', async () => {
  await withMock('pas du JSON du tout', {}, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    assert.equal(review.coherent, true);
    assert.equal(review.reviewSkipped, true);
  });
});

await test('erreur HTTP : relecture sautée, aucune exception', async () => {
  await withMock({}, { status: 503 }, async () => {
    const { context, scores } = buildPipeline();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    assert.equal(review.coherent, true);
    assert.equal(review.reviewSkipped, true);
    assert.match(review.reviewReason, /503/);
  });
});

await test('timeout : abandon sous 5 s, aucune alerte', async () => {
  await withMock({ coherent: false, confidence: 'high', reason: 'Trop tard.' }, { delayMs: 6_000 }, async () => {
    const { context, scores } = buildPipeline();
    const startedAt = Date.now();
    const review = await reviewScoreCoherence(BRIEF, context, scores);
    const elapsed = Date.now() - startedAt;

    assert.equal(review.coherent, true);
    assert.equal(review.reviewSkipped, true);
    assert.ok(elapsed < 5_500, `abandon attendu sous 5,5 s, observé ${elapsed} ms`);
  });
});

await test('le score n’est jamais modifié par la relecture', async () => {
  await withMock({ coherent: false, confidence: 'high', reason: 'Incohérence majeure.' }, {}, async () => {
    const { context, scores } = buildPipeline();
    const before = JSON.parse(JSON.stringify(scores));
    await reviewScoreCoherence(BRIEF, context, scores);
    assert.deepEqual(JSON.parse(JSON.stringify(scores)), before);
  });
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} test(s) réussis.\n`);
if (failed.length) process.exit(1);
