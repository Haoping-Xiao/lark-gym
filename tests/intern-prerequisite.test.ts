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
test('Conditional onboarding requires a complete Legal notice only for that intern', async () => {
  const task = 'tasks/automationbench-hr-5066',
    dir = await mkdtemp(join(tmpdir(), 'offboarding-order-'));
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
  const records = original.filter((c) => c[1] === '+record-upsert'),
    messages = original.filter((c) => c[1] === '+messages-send'),
    reads = original.filter(
      (c) => !['+record-upsert', '+messages-send'].includes(c[1]),
    );
  const legal = messages[0],
    clear = messages.slice(1, 5),
    taylor = messages.slice(5);
  const partial = structuredClone(legal);
  partial[partial.indexOf('--text') + 1] = 'Taylor Kim | Conditional';
  const cases: [string, string[][], boolean][] = [
    ['reference', original, true],
    [
      'clear_first',
      [
        ...reads,
        ...records.slice(0, 2),
        ...clear,
        legal,
        records[2],
        ...taylor,
      ],
      true,
    ],
    ['mentor_first', [...reads, legal, ...taylor, ...records, ...clear], true],
    [
      'welcome_first',
      [...reads, legal, taylor[1], ...records, taylor[0], ...clear],
      true,
    ],
    [
      'early_record',
      [
        ...reads,
        records[2],
        legal,
        ...records.slice(0, 2),
        ...clear,
        ...taylor,
      ],
      false,
    ],
    [
      'early_mentor',
      [...reads, taylor[0], legal, ...records, ...clear, taylor[1]],
      false,
    ],
    [
      'early_welcome',
      [...reads, taylor[1], legal, ...records, ...clear, taylor[0]],
      false,
    ],
    [
      'partial_notice',
      [...reads, partial, ...records, ...clear, ...taylor, legal],
      false,
    ],
  ];
  try {
    for (const [name, commands, expected] of cases) {
      const backend = await startMock(seed);
      try {
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
