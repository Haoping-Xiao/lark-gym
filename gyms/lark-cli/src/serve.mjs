import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { startMock } from './server.mjs';
const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
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
const persist = (world, calls) => {
  writeFileSync(values.state + '.tmp', JSON.stringify({ seed, world, calls }));
  renameSync(values.state + '.tmp', values.state);
};
const backend = await startMock(seed, {
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
