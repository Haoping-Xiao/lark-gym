import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('onboarding host is the actual creating user', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'onboarding-host-'));
  try {
    for (const num of [3186]) {
      const task = repo + '/tasks/automationbench-simple-' + num,
        seed = JSON.parse(
          await fs.readFile(task + '/environment/seed.json', 'utf8'),
        ),
        src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
        original = JSON.parse(
          vm.runInNewContext(
            src
              .slice(
                src.indexOf('const commands'),
                src.indexOf('for (const args'),
              )
              .replace('commands: string[][]', 'commands') +
              '\nJSON.stringify(commands)',
          ),
        );
      await fs.mkdir(a + '/states-' + num, { recursive: true });
      for (const mode of [
        'reference',
        'explicit_user',
        'bot',
        'bot_then_user_patch',
        'bot_claims_email',
        'user_then_bot_patch',
        'wrong_time',
        'no_video',
      ]) {
        const cs = structuredClone(original),
          o = JSON.parse(cs[0].at(-1));
        if (mode === 'wrong_time') {
          o.start_time.timestamp = String(
            Number(o.start_time.timestamp) + 3600,
          );
          o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
        }
        if (mode === 'no_video') delete o.vc_data;
        if (mode === 'bot_claims_email')
          o.vc_data.host_email = 'agent@company.example.com';
        cs[0][cs[0].length - 1] = JSON.stringify(o);
        if (mode.startsWith('bot')) cs[0].push('--as', 'bot');
        if (mode === 'explicit_user') cs[0].push('--as', 'user');
        if (mode === 'bot_then_user_patch' || mode === 'user_then_bot_patch')
          cs.push([
            'calendar',
            'events',
            'patch',
            '--calendar-id',
            'cal_primary',
            '--event-id',
            'evt_1',
            '--data',
            JSON.stringify({ summary: o.summary }),
            '--as',
            mode === 'bot_then_user_patch' ? 'user' : 'bot',
          ]);
        const b = await startMock(seed);
        try {
          for (const c of cs)
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          await fs.writeFile(
            a + '/states-' + num + '/' + mode + '.json',
            JSON.stringify({ seed, world: b.world, calls: b.calls }),
          );
          for (const before of [false]) {
            const tests = before ? a + '/before-tests-' + num : task + '/tests',
              dest =
                a + '/' + num + '-' + mode + (before ? '-before' : '-program');
            await exec(process.execPath, [tests + '/verify.ts'], {
              env: {
                ...process.env,
                MOCK_STATE: a + '/states-' + num + '/' + mode + '.json',
                VERIFIER_OUTPUT: dest,
              },
              maxBuffer: 8e6,
            });
            const d = JSON.parse(
              await fs.readFile(dest + '/result.json', 'utf8'),
            );
            assert.equal(
              d.business_success,
              ['reference', 'explicit_user', 'user_then_bot_patch'].includes(
                mode,
              ),
              mode,
            );
          }
        } finally {
          await b.close();
        }
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
