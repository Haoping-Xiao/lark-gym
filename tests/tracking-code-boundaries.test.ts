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
test('tracking codes retain exact tokens and article association across formatting and row order', async () => {
  const task = 'tasks/automationbench-marketing-1083',
    dir = await mkdtemp(join(tmpdir(), 'tracking-codes-'));
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
  try {
    for (const mode of [
      'reference',
      'semicolon',
      'reverse_codes',
      'reverse_rows',
      'labels',
      'missing_batch',
      'missing_item',
      'wrong_item',
      'lowercase',
      'suffix',
      'prefix',
      'numeric',
      'wrong_total',
    ]) {
      const commands = structuredClone(original);
      for (const c of commands) {
        if (c[1] === '+cells-set') {
          const i = c.indexOf('--cells') + 1,
            ri = c.indexOf('--range') + 1,
            range = c[ri],
            d = JSON.parse(c[i]);
          let v = d[0][0].value;
          if (range.startsWith('D')) {
            const [batch, item] = v.split(' ');
            if (mode === 'semicolon') v = [batch, item].join('; ');
            if (['reverse_codes', 'reverse_rows'].includes(mode))
              v = [item, batch].join('; ');
            if (mode === 'labels') v = `Batch: ${batch}; Item: ${item}`;
            if (range === 'D2') {
              if (mode === 'missing_batch') v = item;
              if (mode === 'missing_item') v = batch;
              if (mode === 'wrong_item') v = [batch, 'REPR-C007-Q1'].join(' ');
              if (mode === 'lowercase') v = v.toLowerCase();
              if (mode === 'suffix') v += '-WRONG';
              if (mode === 'prefix') v = 'WRONG-' + v;
              if (mode === 'numeric') v = 772;
            }
          }
          d[0][0].value = v;
          c[i] = JSON.stringify(d);
          if (mode === 'reverse_rows')
            c[ri] =
              range[0] +
              ({ '2': '4', '3': '3', '4': '2' } as Record<string, string>)[
                range.slice(1)
              ];
        }
        if (mode === 'wrong_total' && c[1] === '+messages-send') {
          const i = c.indexOf('--text') + 1;
          c[i] = c[i].replace('20,900', '20,901');
        }
      }
      const backend = await startMock(seed);
      try {
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
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          [
            'reference',
            'semicolon',
            'reverse_codes',
            'reverse_rows',
            'labels',
          ].includes(mode),
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
