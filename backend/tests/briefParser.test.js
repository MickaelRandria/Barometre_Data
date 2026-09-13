/**
 * Tests de l'extraction d'un brief depuis une description libre.
 *
 * Aucun appel réseau externe : Ministral est simulé par un serveur HTTP local.
 *
 *   node backend/tests/briefParser.test.js
 */

import assert from 'node:assert/strict';
import http from 'node:http';

import { PARSED_FIELDS, parseBriefDescription } from '../engine/briefParser.js';
import { BRIEF_ENUMS, BRIEF_FALLBACKS } from '../../shared/briefOptions.js';

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

const DESCRIPTION = 'je veux lancer une campagne email sur nos écharpes en laine pour la rentrée';

const GOOD_PAYLOAD = {
  product: 'Écharpes en laine',
  message: 'Préparez la rentrée avec nos écharpes en laine.',
  tone: 'dynamique',
  audience: 'clients-actifs',
  channel: 'email',
  objective: 'engagement',
  pressure: 'moyen',
  fieldConfidence: {
    product: 'high', message: 'low', tone: 'low', audience: 'low',
    channel: 'high', objective: 'low', pressure: 'low',
  },
};

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

console.log('\nExtraction du brief — tests\n');

await test('extraction nominale : champs remplis et confiances remontées', async () => {
  await withMock(GOOD_PAYLOAD, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);

    assert.equal(result.ok, true);
    assert.equal(result.brief.product, 'Écharpes en laine');
    assert.equal(result.brief.channel, 'email');
    assert.equal(result.brief.tone, 'dynamique');
    assert.equal(result.fieldConfidence.channel, 'high');
    assert.equal(result.fieldConfidence.tone, 'low');
    for (const field of PARSED_FIELDS) {
      assert.ok(result.brief[field] !== undefined, `champ ${field} manquant`);
      assert.ok(['high', 'low'].includes(result.fieldConfidence[field]), `confiance ${field} invalide`);
    }
  });
});

await test('identifiants hors liste : repli sur le défaut et confiance forcée à low', async () => {
  // Exactement les valeurs que suggérerait un prompt mal aligné sur l'app.
  await withMock({
    ...GOOD_PAYLOAD,
    audience: 'tous',
    channel: 'social-media',
    objective: 'fidelisation',
    fieldConfidence: { ...GOOD_PAYLOAD.fieldConfidence, audience: 'high', channel: 'high', objective: 'high' },
  }, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);

    assert.equal(result.ok, true);
    assert.equal(result.brief.audience, BRIEF_FALLBACKS.audience);
    assert.equal(result.brief.channel, BRIEF_FALLBACKS.channel);
    assert.equal(result.brief.objective, BRIEF_FALLBACKS.objective);
    // Une valeur inventée par le modèle n'est jamais une certitude.
    assert.equal(result.fieldConfidence.audience, 'low');
    assert.equal(result.fieldConfidence.channel, 'low');
    assert.equal(result.fieldConfidence.objective, 'low');
    assert.deepEqual(result.coercedFields.sort(), ['audience', 'channel', 'objective']);
  });
});

await test('toute valeur renvoyée appartient aux listes du formulaire', async () => {
  await withMock({ ...GOOD_PAYLOAD, tone: 'ÉNERGIQUE!!', pressure: 'extreme' }, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    for (const field of ['tone', 'audience', 'channel', 'objective', 'pressure']) {
      assert.ok(
        BRIEF_ENUMS[field].includes(result.brief[field]),
        `${field} = « ${result.brief[field] }» hors liste`,
      );
    }
  });
});

await test('casse et espaces tolérés sur les identifiants', async () => {
  await withMock({ ...GOOD_PAYLOAD, channel: '  EMAIL  ', tone: 'Dynamique' }, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    assert.equal(result.brief.channel, 'email');
    assert.equal(result.brief.tone, 'dynamique');
    assert.equal(result.coercedFields.length, 0, 'aucun repli ne devrait être nécessaire');
  });
});

await test('produit vide : repli sur la description, signalé à vérifier', async () => {
  await withMock({ ...GOOD_PAYLOAD, product: '   ' }, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    assert.equal(result.brief.product, DESCRIPTION);
    assert.equal(result.fieldConfidence.product, 'low');
  });
});

await test('textes trop longs : bornés', async () => {
  await withMock({ ...GOOD_PAYLOAD, product: 'a'.repeat(500), message: 'b'.repeat(900) }, {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    assert.ok(result.brief.product.length <= 120, `produit ${result.brief.product.length}`);
    assert.ok(result.brief.message.length <= 300, `message ${result.brief.message.length}`);
  });
});

await test('description trop courte : refus explicite, aucun appel au modèle', async () => {
  await withMock(GOOD_PAYLOAD, {}, async (mock) => {
    const result = await parseBriefDescription('promo');
    assert.equal(result.ok, false);
    assert.match(result.reason, /une phrase/);
    assert.equal(mock.received.length, 0, 'aucun appel ne doit partir pour une description trop courte');
  });
});

await test('sans clé API : échec explicite, jamais un brief vide silencieux', async () => {
  clearKey();
  const result = await parseBriefDescription(DESCRIPTION);
  assert.equal(result.ok, false);
  assert.match(result.reason, /MISTRAL_API_KEY/);
  assert.equal(result.brief, undefined);
});

await test('JSON malformé : échec explicite, aucune exception', async () => {
  await withMock('ceci n’est pas du JSON', {}, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    assert.equal(result.ok, false);
    assert.match(result.reason, /JSON/);
  });
});

await test('erreur HTTP : échec explicite, aucune exception', async () => {
  await withMock({}, { status: 500 }, async () => {
    const result = await parseBriefDescription(DESCRIPTION);
    assert.equal(result.ok, false);
    assert.match(result.reason, /500/);
  });
});

await test('timeout : abandon sous 7 s', async () => {
  await withMock(GOOD_PAYLOAD, { delayMs: 9_000 }, async () => {
    const startedAt = Date.now();
    const result = await parseBriefDescription(DESCRIPTION);
    const elapsed = Date.now() - startedAt;
    assert.equal(result.ok, false);
    assert.ok(elapsed < 7_000, `abandon attendu sous 7 s, observé ${elapsed} ms`);
  });
});

await test('le prompt ne propose que des identifiants réellement acceptés', async () => {
  await withMock(GOOD_PAYLOAD, {}, async (mock) => {
    await parseBriefDescription(DESCRIPTION);
    const systemPrompt = mock.received[0].body.messages.find((m) => m.role === 'system').content;

    for (const [field, values] of Object.entries(BRIEF_ENUMS)) {
      for (const value of values) {
        assert.ok(systemPrompt.includes(value), `${field} : « ${value} » absent du prompt`);
      }
    }
    // Les identifiants inexistants ne doivent jamais être suggérés au modèle.
    for (const ghost of ['social-media', 'fidelisation', 'tous']) {
      assert.ok(!systemPrompt.includes(ghost), `« ${ghost} » ne doit pas figurer dans le prompt`);
    }
  });
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} test(s) réussis.\n`);
if (failed.length) process.exit(1);
