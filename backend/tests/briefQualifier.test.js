/**
 * Tests de la qualification de brief.
 *
 * Aucun appel réseau externe : Ministral est simulé par un serveur HTTP local
 * pointé via MISTRAL_API_BASE_URL.
 *
 *   node backend/tests/briefQualifier.test.js
 */

import assert from 'node:assert/strict';
import http from 'node:http';

import { QUALIFIABLE_FIELDS, qualifyBrief } from '../engine/briefQualifier.js';

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

const BRIEF = {
  product: 'un truc pour l’été',
  message: 'Profitez du moment.',
  tone: 'urgent',
  audience: 'clients-actifs',
  channel: 'email',
  objective: 'notoriete',
  pressure: 'moyen',
  city: 'Paris',
};

/**
 * @param {object|string} payload contenu renvoyé par le faux modèle
 * @param {{delayMs?: number, status?: number}} options
 */
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

console.log('\nQualification de brief — tests\n');

await test('sans clé API : aucune suggestion, aucune exception', async () => {
  clearKey();
  const result = await qualifyBrief(BRIEF);
  assert.deepEqual(result.issues, []);
  assert.match(result.reason, /MISTRAL_API_KEY/);
});

await test('suggestions valides : normalisées et enrichies du libellé de champ', async () => {
  await withMock({
    issues: [
      { field: 'product', severity: 'warning', question: 'De quel produit précis s’agit-il ?' },
      { field: 'tone', severity: 'info', question: 'Le ton urgent sert-il bien un objectif de notoriété ?' },
    ],
  }, {}, async (mock) => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.equal(issues.length, 2);
    assert.equal(issues[0].field, 'product');
    assert.equal(issues[0].label, 'Produit / Univers');
    assert.equal(issues[0].severity, 'warning');
    assert.match(issues[0].question, /produit précis/);
    assert.equal(issues[1].field, 'tone');
    assert.equal(issues[1].severity, 'info');

    // Le brief part bien en entier dans le prompt.
    const userPrompt = mock.received[0].body.messages.find((m) => m.role === 'user').content;
    for (const field of QUALIFIABLE_FIELDS) assert.match(userPrompt, new RegExp(`\\(${field}\\)`));
  });
});

await test('brief clair : tableau vide, rien n’est inventé', async () => {
  await withMock({ issues: [] }, {}, async () => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.deepEqual(issues, []);
  });
});

await test('champ inconnu écarté, sévérité fantaisiste rétrogradée en info', async () => {
  await withMock({
    issues: [
      { field: 'budget_marketing', severity: 'warning', question: 'Quel est le budget ?' },
      { field: 'message', severity: 'CATASTROPHE', question: 'À quelle saison fait référence « le moment » ?' },
    ],
  }, {}, async () => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.equal(issues.length, 1, 'le champ hors formulaire doit être écarté');
    assert.equal(issues[0].field, 'message');
    assert.equal(issues[0].severity, 'info');
  });
});

await test('jamais plus de 2 suggestions, une seule par champ', async () => {
  await withMock({
    issues: [
      { field: 'product', severity: 'warning', question: 'Question 1 sur le produit ?' },
      { field: 'product', severity: 'warning', question: 'Question 2 sur le produit ?' },
      { field: 'message', severity: 'info', question: 'Question sur le message ?' },
      { field: 'tone', severity: 'info', question: 'Question sur le ton ?' },
      { field: 'city', severity: 'info', question: 'Question sur la ville ?' },
    ],
  }, {}, async () => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.equal(issues.length, 2);
    assert.deepEqual(issues.map((i) => i.field), ['product', 'message']);
  });
});

await test('question vide ou non textuelle écartée', async () => {
  await withMock({
    issues: [
      { field: 'product', severity: 'warning', question: '   ' },
      { field: 'message', severity: 'info', question: null },
    ],
  }, {}, async () => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.deepEqual(issues, []);
  });
});

await test('JSON malformé : aucune suggestion, aucune exception', async () => {
  await withMock('ceci n’est pas du JSON', {}, async () => {
    const { issues, reason } = await qualifyBrief(BRIEF);
    assert.deepEqual(issues, []);
    assert.match(reason, /JSON/);
  });
});

await test('erreur HTTP : aucune suggestion, aucune exception', async () => {
  await withMock({}, { status: 500 }, async () => {
    const { issues, reason } = await qualifyBrief(BRIEF);
    assert.deepEqual(issues, []);
    assert.match(reason, /500/);
  });
});

await test('timeout : abandon sous 5 s, aucune suggestion', async () => {
  await withMock({ issues: [{ field: 'product', severity: 'warning', question: 'Trop tard ?' }] },
    { delayMs: 6_000 }, async () => {
      const startedAt = Date.now();
      const { issues } = await qualifyBrief(BRIEF);
      const elapsed = Date.now() - startedAt;
      assert.deepEqual(issues, []);
      assert.ok(elapsed < 5_500, `abandon attendu sous 5,5 s, observé ${elapsed} ms`);
    });
});

await test('question trop longue : tronquée, jamais un pavé', async () => {
  await withMock({
    issues: [{ field: 'product', severity: 'info', question: 'a'.repeat(900) }],
  }, {}, async () => {
    const { issues } = await qualifyBrief(BRIEF);
    assert.equal(issues.length, 1);
    assert.ok(issues[0].question.length <= 240, `longueur ${issues[0].question.length}`);
  });
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} test(s) réussis.\n`);
if (failed.length) process.exit(1);
