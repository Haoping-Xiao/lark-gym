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
test('exit dates: normal slots vary; date, duration and explicit catchup time stay strict', async () => {
  const task = 'tasks/automationbench-hr-5108',
    dir = await mkdtemp(join(tmpdir(), 'exit-window-'));
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
  const cases: [string, boolean][] = [
    ['reference', true],
    ['normal14', true],
    ['all10', true],
    ['wrong_day', false],
    ['long', false],
    ['catchup14', false],
    ['wrong_title', false],
  ];
  try {
    for (const [mode, expected] of cases) {
      const backend = await startMock(seed);
      try {
        const commands = structuredClone(original);
        for (const c of commands)
          if (c[0] === 'calendar' && c[1] === 'events' && c[2] === 'create') {
            const i = c.indexOf('--data') + 1,
              data = JSON.parse(c[i]);
            const karen = data.summary.includes('Karen Blake'),
              olivia = data.summary.includes('Olivia Strand');
            let delta = 0;
            if (mode === 'normal14' && karen) delta = -3600;
            if (mode === 'all10' && !olivia) delta = -18000;
            if (mode === 'wrong_day' && karen) delta = 86400;
            if (mode === 'catchup14' && olivia) delta = -3600;
            data.start_time.timestamp = String(
              Number(data.start_time.timestamp) + delta,
            );
            data.end_time.timestamp = String(
              Number(data.end_time.timestamp) +
                delta +
                (mode === 'long' && karen ? 1800 : 0),
            );
            if (mode === 'wrong_title' && karen)
              data.summary = 'Exit interview - Leo Tanaka';
            c[i] = JSON.stringify(data);
          }
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        // Notice consistency is a separate semantic check, not inferred from this structural result.
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          expected,
          mode,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
