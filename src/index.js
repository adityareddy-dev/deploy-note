import api, { route } from '@forge/api';
import Resolver from '@forge/resolver';
import { createService, resultOf } from './note.cjs';

const service = createService(async (issueId, propertyKey, method, value) => {
  const client = api.asUser();
  if (method === 'ISSUE') {
    return client.requestJira(route`/rest/api/3/issue/${issueId}?fields=id`);
  }
  return client.requestJira(route`/rest/api/3/issue/${issueId}/properties/${propertyKey}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(value ? { body: JSON.stringify(value) } : {})
  });
});

const resolver = new Resolver();
resolver.define('loadNote', ({ context }) => resultOf(() => service.load(context)));
resolver.define('replayFixture', ({ context }) => resultOf(() => service.replay(context)));
export const handler = resolver.getDefinitions();
