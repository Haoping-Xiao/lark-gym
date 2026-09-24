import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import type { World, ApiCall } from './types.ts';
import { startMock } from './server.ts';
const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
    'unsupported-hook': { type: 'string' },
    'unsupported-policy': { type: 'string' },
    'abort-signal': { type: 'string' },
    state: { type: 'string' },
    ready: { type: 'string' },
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '0' },
  },
});
if (!values.seed || !values.state || !values.ready)
  throw new Error('--seed --state --ready are required');
const seed = JSON.parse(readFileSync(values.seed, 'utf8'));
mkdirSync(dirname(values.state), { recursive: true });
const statePath = values.state;
let abortSignalled = false;
const persist = (world: World, calls: ApiCall[]) => {
  writeFileSync(statePath + '.tmp', JSON.stringify({ seed, world, calls }));
  renameSync(statePath + '.tmp', statePath);
  // Persist authoritative evidence before asking the agent container to stop.
  const aborted = calls.find((call) => call.unsupported?.action === 'abort');
  if (!abortSignalled && aborted && values['abort-signal']) {
    const signalPath = values['abort-signal'];
    mkdirSync(dirname(signalPath), { recursive: true });
    writeFileSync(
      signalPath + '.tmp',
      JSON.stringify({ action: 'abort', call_seq: aborted.seq }),
    );
    renameSync(signalPath + '.tmp', signalPath);
    abortSignalled = true;
  }
};
let onUnsupported;
if (values['unsupported-hook']) {
  const module = await import(
    pathToFileURL(resolve(values['unsupported-hook'])).href
  );
  const policy = module.validatePolicy(
    values['unsupported-policy']
      ? JSON.parse(readFileSync(values['unsupported-policy'], 'utf8'))
      : {},
  );
  onUnsupported = (call: ApiCall) => module.onUnsupported(call, policy);
}
const backend = await startMock(seed, {
  onUnsupported,
  onSnapshot: persist,
  host: values.host,
  port: Number(values.port),
});
persist(backend.world, backend.calls);
writeFileSync(values.ready, backend.url);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await backend.close();
    process.exit(0);
  });
