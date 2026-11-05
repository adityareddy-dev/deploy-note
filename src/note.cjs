const fixture = require('../fixtures/failed-check.json');

const PROPERTY_KEY = 'deploy-note.demo.v1';
const FIXTURE_PATH = 'fixtures/failed-check.json';

class NoteError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function issueFromContext(context) {
  const issue = context?.extension?.issue;
  if (!issue || !/^[1-9]\d{0,19}$/.test(String(issue.id)) ||
      typeof issue.key !== 'string' || !/^[A-Z][A-Z0-9_]*-[1-9]\d*$/.test(issue.key)) {
    throw new NoteError('context', 'Open Deploy Note from a Jira issue and try again.');
  }
  return { id: String(issue.id), key: issue.key };
}

function validateFixture(value) {
  if (!value || value.schemaVersion !== 1 || value.demoData !== true ||
      value.id !== 'checkout-timeout-demo' ||
      !['service', 'change', 'logLine', 'observedAt'].every(key =>
        typeof value[key] === 'string' && value[key].trim() && value[key].length <= 2000) ||
      !Number.isFinite(Date.parse(value.observedAt))) {
    throw new NoteError('fixture', 'The demo fixture is invalid. Restore fixtures/failed-check.json.');
  }
  return value;
}

function documentForFixture() {
  validateFixture(fixture);
  return { ...fixture, source: FIXTURE_PATH };
}

function jiraError(status) {
  if (status === 401 || status === 403) {
    return new NoteError('permission', 'Jira denied access. Sign in with an account that can browse and edit this issue, then retry.');
  }
  if (status === 404) return new NoteError('missing', 'This issue is no longer available to your account. Reopen it in Jira.');
  if (status === 429) return new NoteError('rate', 'Jira is limiting requests. Wait a moment, then retry.');
  return new NoteError('jira', 'Jira could not complete the request. Retry when Jira is available.');
}

function createService(request) {
  async function call(issueId, method, value) {
    try {
      const response = await request(issueId, PROPERTY_KEY, method, value);
      return response;
    } catch {
      throw new NoteError('network', 'Could not reach Jira. Check the connection, then retry.');
    }
  }

  return {
    async load(context) {
      const issue = issueFromContext(context);
      const response = await call(issue.id, 'GET');
      if (response.status === 404) {
        // A missing property and an inaccessible issue both return 404.
        // Verify the issue before reporting an empty note.
        const accessible = await call(issue.id, 'ISSUE');
        if (!accessible.ok) throw jiraError(accessible.status);
        return { issue, note: null, preview: documentForFixture() };
      }
      if (!response.ok) throw jiraError(response.status);
      let data;
      try { data = await response.json(); } catch { throw jiraError(502); }
      const expected = documentForFixture();
      if (!data.value || Object.keys(data.value).length !== Object.keys(expected).length ||
          !Object.keys(expected).every(key => data.value[key] === expected[key])) {
        throw new NoteError('stored', 'The saved note differs from the demo fixture. Replay the fixture to restore it.');
      }
      return { issue, note: data.value, preview: documentForFixture() };
    },
    async replay(context) {
      const issue = issueFromContext(context);
      const note = documentForFixture();
      const response = await call(issue.id, 'PUT', note);
      if (!response.ok) throw jiraError(response.status);
      return { issue, note, preview: note };
    }
  };
}

async function resultOf(action) {
  try { return { ok: true, data: await action() }; }
  catch (error) {
    return { ok: false, error: {
      code: error instanceof NoteError ? error.code : 'unexpected',
      message: error instanceof NoteError ? error.message : 'Deploy Note could not finish. Reload the panel and retry.'
    } };
  }
}

module.exports = { PROPERTY_KEY, FIXTURE_PATH, issueFromContext, validateFixture, documentForFixture, createService, resultOf };
