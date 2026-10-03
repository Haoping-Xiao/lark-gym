import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('single-event preserves source calendar semantics through real CLI', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'single-event-')),
    task = repo + '/tasks/automationbench-simple-3132',
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
      'empty',
      'natural',
      'lowercase',
      'weekly',
      'limited_ten',
      'wrong_time',
      'wrong_title',
      'missing_attendee',
    ]) {
      const cs = structuredClone(original),
        o = JSON.parse(cs[0].at(-1));
      if (mode === 'empty') o.recurrence = '';
      if (mode === 'natural') o.summary = 'Acme Corp 客户需求沟通';
      if (mode === 'lowercase') o.summary = 'acme corp discovery call';
      if (mode === 'weekly') o.recurrence = 'FREQ=WEEKLY';
      if (mode === 'limited_ten') o.recurrence = 'FREQ=WEEKLY;COUNT=10';
      if (mode === 'wrong_time') {
        o.start_time.timestamp = String(Number(o.start_time.timestamp) + 3600);
        o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
      }
      if (mode === 'wrong_title') o.summary = 'Other Corp discovery call';
      cs[0][cs[0].length - 1] = JSON.stringify(o);
      if (mode === 'missing_attendee') {
        const q = JSON.parse(cs[1].at(-1));
        q.attendees.pop();
        cs[1][cs[1].length - 1] = JSON.stringify(q);
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        for (const before of [false]) {
          const tests = before ? a + '/before-tests' : task + '/tests',
            dest = a + '/' + mode + (before ? '-before' : '-program');
          await exec(process.execPath, [tests + '/verify.ts'], {
            env: {
              ...process.env,
              MOCK_STATE: a + '/states/' + mode + '.json',
              VERIFIER_OUTPUT: dest,
            },
            maxBuffer: 8e6,
          });
          const d = JSON.parse(
            await fs.readFile(dest + '/result.json', 'utf8'),
          );
          assert.equal(
            d.business_success,
            ['reference', 'empty', 'natural', 'lowercase'].includes(mode),
            mode,
          );
        }
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
