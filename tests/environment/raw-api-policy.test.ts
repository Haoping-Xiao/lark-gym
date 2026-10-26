import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
import { readFile } from 'node:fs/promises';
const exec = promisify(execFile);
test('raw API policy applies after parsing global flags without blocking domain commands', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-finance-4087/environment/seed.json',
      'utf8',
    ),
  );
  const server = await startMock(seed);
  const env = { ...process.env, FEISHU_MOCK_URL: server.url };
  try {
    for (const args of [
      ['api', 'GET', '/open-apis/calendar/v4/calendars'],
      ['--as', 'user', 'api', 'GET', '/open-apis/calendar/v4/calendars'],
      ['--as=user', 'api', 'GET', '/open-apis/calendar/v4/calendars'],
      ['api', 'GET', '/open-apis/calendar/v4/calendars', '--as', 'user'],
    ]) {
      await assert.rejects(
        exec(resolve('gyms/lark-cli/bin/lark-cli'), args, { env }),
        (err: any) => {
          assert.match(err.stdout + err.stderr, /no-raw-api|denied|policy/i);
          return true;
        },
      );
      assert.ok(
        server.calls.every(
          (c) => c.path === '/open-apis/authen/v1/user_info' && !c.changed,
        ),
      );
    }
    await exec(
      resolve('gyms/lark-cli/bin/lark-cli'),
      [
        '--as',
        'user',
        'mail',
        '+send',
        '--mailbox',
        'agent@company.example.com',
        '--to',
        'tax@company.example.com',
        '--subject',
        'api',
        '--body',
        'api',
        '--confirm-send',
      ],
      { env },
    );
    assert.ok(server.calls.some((c) => c.status === 200));
  } finally {
    await server.close();
  }
});
