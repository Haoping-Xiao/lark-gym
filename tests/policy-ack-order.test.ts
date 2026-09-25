import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('policy acknowledgments: per-person sending precedes Sent; record dependency stays opt-in', async () => {
  const task = 'tasks/automationbench-hr-5079',
    dir = await mkdtemp(join(tmpdir(), 'policy-order-'));
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
  const sent = cells.filter((c) => !c.includes('C4')),
    deferred = cells.find((c) => c.includes('C4'))!;
  const reads = original.filter(
    (c) => !['+record-upsert', '+messages-send', '+cells-set'].includes(c[1]),
  );
  try {
    await cp(task + '/tests', dir + '/tests', { recursive: true });
    for (const required of [false, true])
      for (const mode of [
        'interleaved',
        'deferred_first',
        'notify_before_record',
        'early_status',
      ]) {
        const expected = JSON.parse(
          await readFile(task + '/tests/expected.json', 'utf8'),
        );
        if (required)
          expected.entity_order[0].record = {
            collection: 'signature_requests',
            equals: { email: 'alice.park@company.example.com' },
          };
        await writeFile(dir + '/tests/expected.json', JSON.stringify(expected));
        const commands =
          mode === 'interleaved'
            ? [
                ...reads,
                ...records,
                ...messages.flatMap((m, i) => [m, sent[i]]),
                deferred,
              ]
            : mode === 'deferred_first'
              ? [...reads, deferred, ...records, ...messages, ...sent]
              : mode === 'notify_before_record'
                ? [...reads, ...messages, ...records, ...cells]
                : [...reads, ...records, ...sent, ...messages, deferred];
        const backend = await startMock(seed);
        try {
          for (const args of commands)
            await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
              env: { ...process.env, FEISHU_MOCK_URL: backend.url },
            });
          const state = join(dir, 'state.json'),
            output = join(dir, `${required}-${mode}`);
          await writeFile(
            state,
            JSON.stringify({
              seed,
              world: backend.world,
              calls: backend.calls,
            }),
          );
          await exec(process.execPath, [dir + '/tests/verify.ts'], {
            env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
          });
          const result = JSON.parse(
            await readFile(output + '/result.json', 'utf8'),
          );
          assert.equal(
            result.business_success,
            mode !== 'early_status' &&
              !(required && mode === 'notify_before_record'),
            `${required}-${mode}`,
          );
        } finally {
          await backend.close();
        }
      }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
