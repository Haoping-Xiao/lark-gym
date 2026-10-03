import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('event-notification verifies actual CLI effects', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'event-notification-')),
    task = repo + '/tasks/automationbench-simple-3147',
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
      'natural',
      'explicit_user',
      'bot',
      'send_early',
      'no_message',
      'wrong_time',
      'no_video',
      'wrong_details',
    ]) {
      let cs = structuredClone(original);
      const [write, list, msg] = cs;
      if (mode === 'natural')
        msg[msg.length - 1] =
          '已安排 Vendor Onboarding Call：2026年3月10日16:00 UTC 开始，17:00结束，视频会议。';
      if (mode === 'explicit_user') write.push('--as', 'user');
      if (mode === 'bot') write.push('--as', 'bot');
      if (mode === 'send_early') cs = [list, msg, write];
      if (mode === 'no_message') cs = [write];
      if (mode === 'wrong_details')
        msg[msg.length - 1] =
          'Vendor Onboarding Call 已安排在2026-03-10 18:00 UTC开始，持续3小时。';
      if (mode === 'wrong_time' || mode === 'no_video') {
        const o = JSON.parse(write.at(-1));
        if (mode === 'wrong_time') {
          o.start_time.timestamp = String(
            Number(o.start_time.timestamp) + 3600,
          );
          o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
        } else delete o.vc_data;
        write[write.length - 1] = JSON.stringify(o);
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
            ['reference', 'natural', 'explicit_user', 'wrong_details'].includes(
              mode,
            ),
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
