const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {create, act} = require('react-test-renderer');
const {documentForFixture} = require('../src/note.cjs');

test('failed reload clears the old storage claim and a successful retry restores it', async () => {
  const responses = [];
  let app;
  const ui = new Proxy({__esModule: true, default: {render: element => {app = element;}}}, {
    get: (target, key) => target[key] || key
  });
  const source = ts.transpileModule(readFileSync('src/frontend/index.jsx', 'utf8'), {
    compilerOptions: {jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true}
  }).outputText;
  vm.runInNewContext(source, {exports: {}, require: name => {
    if (name === 'react') return React;
    if (name === '@forge/react') return ui;
    if (name === '@forge/bridge') return {invoke: async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    }};
    throw new Error(name);
  }});
  const saved = {ok: true, data: {issue: {key: 'DEPLOY-1'}, note: documentForFixture()}};
  responses.push(saved);
  let panel;
  await act(async () => {panel = create(app);});
  const text = () => JSON.stringify(panel.toJSON());
  const reload = () => panel.root.findAllByType('Button').find(b => b.props.children === 'Reload saved note');
  assert.match(text(), /Stored on DEPLOY-1/);
  for (const failure of [{ok: false, error: {message: 'Jira denied access.'}}, new Error('Connection failed.')]) {
    responses.push(failure);
    await act(async () => {await reload().props.onClick();});
    assert.match(text(), /Could not complete the request/);
    assert.doesNotMatch(text(), /Stored on|Saved on|checkout-api/);
    responses.push(saved);
    await act(async () => {await reload().props.onClick();});
    assert.match(text(), /Stored on DEPLOY-1/);
    assert.doesNotMatch(text(), /Could not complete the request/);
  }
  await act(async () => panel.unmount());
});
