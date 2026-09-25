import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('salary ledger: equivalent USD text keeps exact amounts and currency', async () => {
  const task = 'tasks/automationbench-hr-5101',
    dir = await mkdtemp(join(tmpdir(), 'usd-record-'));
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const source = await readFile(task + '/solution/solve.ts', 'utf8');
  const block = source
    .slice(source.indexOf('const commands'), source.indexOf('for (const args'))
    .replace('commands: string[][]', 'commands');
  const original: string[][] = JSON.parse(
    vm.runInNewContext(block + '\nJSON.stringify(commands)'),
  );
  const cases: [string, string, boolean][] = [
    ['no_commas', '$97500', true],
    ['decimals', '$97,500.00', true],
    ['wrong', '$97050', false],
    ['currency', '€97500', false],
    ['implicit_usd', '97500', true],
    ['negative', '-$97500', false],
    ['grouping', '$97,50', false],
    ['fractional_cent', '$97500.001', false],
  ];
  try {
    for (const [name, value, expected] of cases) {
      const backend = await startMock(seed);
      try {
        const commands = structuredClone(original);
        for (const c of commands)
          if (c[1] === '+record-upsert') {
            const i = c.indexOf('--json') + 1,
              fields = JSON.parse(c[i]);
            if (fields.employee === 'Nadia Kowalski') fields.new_salary = value;
            c[i] = JSON.stringify(fields);
          }
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, name + '.json'),
          output = join(dir, name);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          expected,
          name,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
