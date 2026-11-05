import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Badge, Box, Button, CodeBlock, Heading, Inline, SectionMessage, Spinner, Stack, Text } from '@forge/react';
import { invoke } from '@forge/bridge';

function App() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function run(operation) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = /** @type {{ok: boolean, data?: any, error?: {message?: string}}} */ (await invoke(operation));
      if (!response?.ok) throw new Error(response?.error?.message || 'The request failed. Reload the panel and retry.');
      setData(response.data);
      setSaved(operation === 'replayFixture');
    } catch (failure) {
      setError(failure.message || 'Could not reach Deploy Note. Retry in a moment.');
    } finally { setBusy(false); }
  }

  useEffect(() => { run('loadNote'); }, []);
  const note = data?.note || data?.preview;

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Inline space="space.100" alignBlock="center">
          <Heading as="h2">Failed deployment check</Heading>
          <Badge appearance="added">Demo data</Badge>
        </Inline>
        <Text>A fixed example for investigating a deployment in Jira. No production systems are connected.</Text>
        {error && <SectionMessage title="Could not complete the request" appearance="error"><Text>{error}</Text></SectionMessage>}
        {saved && <SectionMessage title={`Saved on ${data.issue.key}`} appearance="success"><Text>The demo fixture is stored on this issue. Replaying replaces the same note.</Text></SectionMessage>}
        {busy && <Spinner label="Loading Deploy Note" />}
        {note && <Stack space="space.100">
          <Text><Text as="strong">Service: </Text>{note.service}</Text>
          <Text><Text as="strong">Deployed change: </Text>{note.change}</Text>
          <Heading as="h3">Failed log line</Heading>
          <CodeBlock language="text" text={note.logLine} />
          <Text>Fixture: {note.source}</Text>
          <Text>Example check time: {note.observedAt}</Text>
          <Text>{data.note ? `Stored on ${data.issue.key}.` : `Preview only. Nothing has been written to ${data.issue.key} yet.`}</Text>
        </Stack>}
        <Inline space="space.100">
          <Button appearance="primary" isDisabled={busy} onClick={() => run('replayFixture')}>Replay demo fixture</Button>
          <Button isDisabled={busy} onClick={() => run('loadNote')}>Reload saved note</Button>
        </Inline>
        <Text>Replay writes only the demo note on the issue you have open. It does not change the description, status, or comments.</Text>
      </Stack>
    </Box>
  );
}

ForgeReconciler.render(<App />);
