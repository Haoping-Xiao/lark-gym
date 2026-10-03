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
test('Processed requires current registrations and delivered notification for that employee', async () => {
  const task = 'tasks/automationbench-hr-5070',
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
    cells = original.filter((c) => c[1] === '+cells-set');
  const reads = original.filter(
    (c) => !['+record-upsert', '+messages-send', '+cells-set'].includes(c[1]),
  );
  const remove = [
    'base',
    '+record-delete',
    '--base-token',
    'base_crm',
    '--table-id',
    records[0][records[0].indexOf('--table-id') + 1],
    '--record-id',
    'rec_created_1',
    '--yes',
  ];
  const reset = structuredClone(cells[0]);
  reset[reset.indexOf('--cells') + 1] = '[[{"value":"Pending"}]]';
  const cases: [string, string[][], boolean][] = [
    ['reference', original, true],
    ['notify_first', [...reads, ...messages, ...records, ...cells], true],
    [
      'per_person',
      [
        ...reads,
        ...records.slice(0, 2),
        ...messages,
        cells[0],
        ...records.slice(2),
        cells[1],
      ],
      true,
    ],
    ['early_all', [...reads, ...messages, ...cells, ...records], false],
    [
      'early_ian',
      [
        ...reads,
        ...records.slice(0, 2),
        ...messages,
        ...cells,
        ...records.slice(2),
      ],
      false,
    ],
    [
      'deleted',
      [...reads, ...records, ...messages, remove, ...cells, records[0]],
      false,
    ],
    [
      'restored',
      [...reads, ...records, ...messages, remove, records[0], ...cells],
      true,
    ],
    [
      'second_transition',
      [
        ...reads,
        ...records,
        ...messages,
        ...cells,
        reset,
        remove,
        cells[0],
        records[0],
      ],
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
