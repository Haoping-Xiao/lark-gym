import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Overdue flags preserve each original owner and subject', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'overdue-owner-')),
    task = repo + '/tasks/automationbench-sales-1206',
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
      'reverse_order',
      'natural_description',
      'missing_0',
      'missing_1',
      'missing_2',
      'empty_0',
      'empty_1',
      'empty_2',
      'wrong_0',
      'wrong_1',
      'wrong_2',
      'swap',
      'text_only',
      'wrong_subject',
      'wrong_priority',
    ]) {
      let cs = structuredClone(original),
        rs = cs.filter((c) => c[1] === '+record-upsert'),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'reverse_order')
        cs = [
          ...cs.filter(
            (c) =>
              c[1] !== 'impossible' &&
              c[1] !== '+record-upsert' &&
              c[1] !== '+messages-send',
          ),
          ...rs.reverse(),
          cs.at(-1),
        ];
      if (mode === 'natural_description')
        for (const c of rs)
          change(
            c,
            (o) =>
              (o.description =
                '原事项：' +
                o.description +
                '。依跟进政策核查，已逾期，需原负责人处理。'),
          );
      const match = mode.match(/^(missing|empty|wrong)_(\d)$/);
      if (match)
        change(rs[+match[2]], (o) => {
          if (match[1] === 'missing') delete o.assigned_to_id;
          else o.assigned_to_id = match[1] === 'empty' ? '' : '005xx000001USR9';
        });
      if (mode === 'swap') {
        change(rs[0], (o) => (o.assigned_to_id = '005xx000001USR2'));
        change(rs[1], (o) => (o.assigned_to_id = '005xx000001USR1'));
      }
      if (mode === 'text_only')
        for (const c of rs)
          change(c, (o) => {
            o.description += ' 原负责人 ' + o.assigned_to_id;
            delete o.assigned_to_id;
          });
      if (mode === 'wrong_subject')
        change(rs[0], (o) => (o.subject = 'OVERDUE: Apex followup'));
      if (mode === 'wrong_priority')
        change(rs[0], (o) => (o.priority = 'Normal'));
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
          ['reference', 'reverse_order', 'natural_description'].includes(mode),
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
