import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isDeepStrictEqual } from 'node:util';
const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath)
  throw new Error(
    'Usage: node scripts/compare-cli-contracts.mjs <manifest.json> <report.json>',
  );
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const exec = promisify(execFile);
const normalize = (value, ids) => {
  if (typeof value === 'string') return ids[value] ?? value;
  if (Array.isArray(value)) return value.map((v) => normalize(v, ids));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        /^(access_token|refresh_token|authorization|client_secret|app_secret)$/i.test(
          key,
        )
          ? '[REDACTED]'
          : normalize(v, ids),
      ]),
    );
  return value;
};
async function run(side, args) {
  let result;
  try {
    result = {
      ...(await exec(side.binary, [...(side.prefix_args || []), ...args], {
        timeout: 60000,
        maxBuffer: 4 * 1024 * 1024,
        env: process.env,
      })),
      code: 0,
    };
  } catch (error) {
    result = error;
  }
  const text = result.stdout || result.stderr;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(
      'CLI must return JSON; refusing to persist unstructured output',
    );
  }
  return { exit_code: result.code, body: normalize(body, side.ids || {}) };
}
const results = [];
for (const scenario of manifest.scenarios) {
  if (scenario.writes && !process.argv.includes('--allow-test-tenant-writes')) {
    results.push({
      name: scenario.name,
      status: 'not_run',
      reason: 'write scenario requires explicit test-tenant execution option',
    });
    continue;
  }
  const mock = await run(manifest.mock, scenario.mock_args);
  const real = await run(manifest.real, scenario.real_args);
  results.push({
    name: scenario.name,
    status: isDeepStrictEqual(mock, real) ? 'match' : 'difference',
    mock,
    real,
  });
}
await writeFile(
  outputPath,
  JSON.stringify({ scope: manifest.scope, results }, null, 2),
);
if (results.some((result) => result.status === 'difference'))
  process.exitCode = 1;
