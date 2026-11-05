const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createService, documentForFixture, issueFromContext, validateFixture, PROPERTY_KEY, resultOf } = require('../src/note.cjs');

const context = { extension: { issue: { id: '10001', key: 'DEPLOY-1' } } };
const reply = (status, value) => ({ status, ok: status >= 200 && status < 300, json: async () => value });

test('write uses the issue from context and keeps all three facts and the demo label', async () => {
  const calls = [];
  const service = createService(async (...args) => { calls.push(args); return reply(201); });
  const saved = await service.replay(context);
  assert.deepEqual(calls, [['10001', PROPERTY_KEY, 'PUT', documentForFixture()]]);
  assert.equal(saved.note.demoData, true);
  assert.equal(saved.note.source, 'fixtures/failed-check.json');
  assert.match(saved.note.service, /checkout/);
  assert.match(saved.note.change, /500 ms/);
  assert.match(saved.note.logLine, /ERROR/);
});

test('repeated and simultaneous replay leaves exactly one stored note', async () => {
  const properties = new Map();
  const service = createService(async (id, key, method, value) => {
    if (method === 'PUT') { properties.set(`${id}:${key}`, structuredClone(value)); return reply(204); }
    return reply(200, { value: properties.get(`${id}:${key}`) });
  });
  await Promise.all([service.replay(context), service.replay(context)]);
  assert.equal(properties.size, 1);
  assert.deepEqual((await service.load(context)).note, documentForFixture());
});

test('an empty issue is a preview only, after checking issue access', async () => {
  const methods = [];
  const service = createService(async (id, key, method) => {
    methods.push(method);
    return reply(method === 'GET' ? 404 : 200);
  });
  const loaded = await service.load(context);
  assert.equal(loaded.note, null);
  assert.equal(loaded.preview.demoData, true);
  assert.deepEqual(methods, ['GET', 'ISSUE']);
});

test('missing or malformed context never reaches Jira', async () => {
  let calls = 0;
  const service = createService(async () => { calls++; });
  for (const ctx of [null, {}, { extension: { issue: { id: '../2', key: 'DEPLOY-1' } } },
    { extension: { issue: { id: '10001', key: '' } } }]) {
    await assert.rejects(service.replay(ctx), { code: 'context' });
  }
  assert.equal(calls, 0);
  assert.deepEqual(issueFromContext(context), { id: '10001', key: 'DEPLOY-1' });
});

test('permission, missing issue, throttling and server failures cannot report success', async () => {
  for (const [status, code] of [[401, 'permission'], [403, 'permission'], [404, 'missing'], [429, 'rate'], [500, 'jira']]) {
    const service = createService(async () => reply(status));
    const result = await resultOf(() => service.replay(context));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, code);
    await assert.rejects(service.load(context), { code });
  }
});

test('network errors and unexpected exceptions do not expose raw details', async () => {
  const service = createService(async () => { throw new Error('private transport details'); });
  const result = await resultOf(() => service.replay(context));
  assert.equal(result.error.code, 'network');
  assert.doesNotMatch(JSON.stringify(result), /private/);
  assert.equal((await resultOf(() => { throw new Error('secret'); })).error.code, 'unexpected');
});

test('changed saved data is detected and replay restores it', async () => {
  let stored = { ...documentForFixture(), demoData: false };
  const service = createService(async (id, key, method, value) => {
    if (method === 'PUT') { stored = value; return reply(200); }
    return reply(200, { value: stored });
  });
  await assert.rejects(service.load(context), { code: 'stored' });
  await service.replay(context);
  assert.deepEqual((await service.load(context)).note, documentForFixture());
});

test('JSON key order does not change the note', async () => {
  const reversed = Object.fromEntries(Object.entries(documentForFixture()).reverse());
  const service = createService(async () => reply(200, { value: reversed }));
  assert.deepEqual((await service.load(context)).note, documentForFixture());
});

test('invalid fixture and malformed Jira responses give useful errors', async () => {
  assert.throws(() => validateFixture({ ...documentForFixture(), demoData: false }), { code: 'fixture' });
  assert.throws(() => validateFixture({ ...documentForFixture(), logLine: '' }), { code: 'fixture' });
  const service = createService(async () => ({ ...reply(200), json: async () => { throw new Error(); } }));
  await assert.rejects(service.load(context), { code: 'jira' });
});
