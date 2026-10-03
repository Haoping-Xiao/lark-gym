import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('native mail contract 3170 preserves workflow and semantic review', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-mail-3170-')),
    task = repo + '/tasks/automationbench-simple-3170',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
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
      'dollar',
      'natural',
      'uppercase',
      'one_batch',
      'string_count',
      'decimal_count',
      'exponent_count',
      'near_wrong_count',
      'no_currency',
      'euros',
      'wrong_amount',
      'missing_weekly',
      'missing_literal',
      'send_early',
      'partial_then_send',
      'numeric_cell',
      'wrong_deals',
      'wrong_week',
    ]) {
      let cs = structuredClone(original);
      const [read, week, deals, revenue, msg] = cs;
      let body = 'Week of Feb 23：成交12单，收入340K美元。';
      if (mode === 'dollar')
        body = 'Week of Feb 23, 12 deals closed, $340K revenue.';
      if (mode === 'natural')
        body = 'Feb 23 当周成交12单，收入34万美元（340K USD）。';
      if (mode === 'uppercase') {
        body = 'Week of Feb 23，成交12单，收入340k美元。';
        msg[msg.indexOf('--subject') + 1] = 'WEEKLY 周报';
      }
      if (mode === 'no_currency') body = 'Week of Feb 23：成交12单，收入340K。';
      if (mode === 'euros') body = 'Week of Feb 23：成交12单，收入340K欧元。';
      if (mode === 'wrong_amount')
        body = 'Week of Feb 23：成交12单，收入350K美元。';
      if (mode === 'missing_weekly')
        msg[msg.indexOf('--subject') + 1] = '业绩周报';
      if (mode === 'missing_literal')
        body = 'Week of Feb 23：成交12单，收入34万美元。';
      msg[msg.indexOf('--body') + 1] = body;
      if (mode === 'send_early') cs = [msg, read, week, deals, revenue];
      if (mode === 'partial_then_send') cs = [read, week, msg, deals, revenue];
      if (mode === 'one_batch') {
        week[week.length - 1] = JSON.stringify([
          [{ value: 'Week of Feb 23' }, { value: 12 }, { value: '340K' }],
        ]);
        cs = [read, week, msg];
      }
      for (const [m, value] of [
        ['string_count', '12'],
        ['decimal_count', '12.0'],
        ['exponent_count', '1.2e1'],
        ['near_wrong_count', '12.00000000000000000001'],
        ['wrong_deals', 13],
      ])
        if (mode === m) deals[deals.length - 1] = JSON.stringify([[{ value }]]);
      if (mode === 'numeric_cell')
        revenue[revenue.length - 1] = JSON.stringify([[{ value: 340000 }]]);
      if (mode === 'wrong_week')
        week[week.length - 1] = JSON.stringify([[{ value: 'Week of Mar 2' }]]);
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const f = a + '/states/' + mode + '.json';
        await fs.writeFile(
          f,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: f,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '-program/result.json'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'dollar',
            'natural',
            'uppercase',
            'one_batch',
            'string_count',
            'decimal_count',
            'exponent_count',
            'no_currency',
            'euros',
          ].includes(mode),
          mode,
        );
        if (d.business_success) assert.equal(d.semantic.required, true);
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
