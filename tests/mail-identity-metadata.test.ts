import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';

const exec = promisify(execFile);
const seed = async () =>
  JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
const cli = async (url: string, ...args: string[]) =>
  JSON.parse(
    (
      await exec(
        resolve('gyms/lark-cli/bin/lark-cli'),
        [...args, '--format', 'json'],
        { env: { ...process.env, FEISHU_MOCK_URL: url } },
      )
    ).stdout,
  ).data;

test('real CLI shares mailbox identity and distinguishes user from bot access', async () => {
  const initial = await seed(),
    backend = await startMock(initial);
  try {
    const profile = await cli(
      backend.url,
      'mail',
      'user_mailboxes',
      'profile',
      '--user-mailbox-id',
      'me',
      '--as',
      'user',
    );
    assert.equal(profile.primary_email_address, 'agent@company.example.com');
    const accessible = await cli(
      backend.url,
      'mail',
      'user_mailboxes',
      'accessible_mailboxes',
      '--user-mailbox-id',
      'me',
      '--as',
      'user',
    );
    assert.deepEqual(accessible.accessible_mailboxes, [
      {
        email_address: profile.primary_email_address,
        email_type: 'USER_PRIMARY',
      },
    ]);
    const bot = await cli(
      backend.url,
      'mail',
      'user_mailboxes',
      'accessible_mailboxes',
      '--user-mailbox-id',
      profile.primary_email_address,
      '--as',
      'bot',
    );
    assert.deepEqual(bot, accessible);
    assert.ok(
      backend.calls.some((c) => c.identity === 'bot' && c.status === 200),
    );
    assert.ok(
      backend.calls.some(
        (c) => c.identity === 'user' && c.path.endsWith('/profile'),
      ),
    );
    await assert.rejects(
      cli(
        backend.url,
        'mail',
        'user_mailboxes',
        'profile',
        '--user-mailbox-id',
        'me',
        '--as',
        'bot',
      ),
    );
    await assert.rejects(
      cli(
        backend.url,
        'mail',
        'user_mailboxes',
        'accessible_mailboxes',
        '--user-mailbox-id',
        'me',
        '--as',
        'bot',
      ),
    );
    assert.equal(backend.calls.at(-1)?.status, 400);
    assert.deepEqual(backend.world, initial);
    assert.ok(backend.calls.every((c) => !c.changed && c.status !== 501));
  } finally {
    await backend.close();
  }
});

test('mail lookup rejects unsupported options and other mailboxes without fabricating access', async () => {
  const initial = await seed(),
    backend = await startMock(initial);
  const get = (path: string, bot = false) =>
    fetch(backend.url + path, {
      headers: {
        authorization: 'Bearer local-evaluation-only' + (bot ? '-bot' : ''),
      },
    });
  try {
    assert.equal(
      (await get('/open-apis/mail/v1/user_mailboxes/me/profile', true)).status,
      403,
    );
    assert.equal(
      (await get('/open-apis/authen/v1/user_info', true)).status,
      403,
    );
    assert.equal(
      (await get('/open-apis/mail/v1/user_mailboxes/other@example.com/profile'))
        .status,
      400,
    );
    assert.equal(
      (
        await get(
          '/open-apis/mail/v1/user_mailboxes/other@example.com/accessible_mailboxes',
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await get(
          '/open-apis/mail/v1/user_mailboxes/me/profile?unimplemented=1',
        )
      ).status,
      501,
    );
    assert.equal(
      (await get('/open-apis/mail/v1/user_mailboxes/me/messages')).status,
      501,
    );
    assert.deepEqual(backend.world, initial);
    assert.ok(backend.calls.every((c) => !c.changed));
  } finally {
    await backend.close();
  }
});

test('real CLI Base details use the same live metadata as Drive and isolate trials', async () => {
  const one = await seed(),
    two = await seed();
  one.base.name = '业务台账 A';
  two.base.name = '业务台账 B';
  const a = await startMock(one),
    b = await startMock(two);
  try {
    for (const [backend, initial] of [
      [a, one],
      [b, two],
    ] as const) {
      const info = await cli(
        backend.url,
        'base',
        '+base-get',
        '--base-token',
        initial.base.app_token,
      );
      assert.deepEqual(info.base, {
        base_token: initial.base.app_token,
        name: initial.base.name,
      });
      const drive = await cli(
        backend.url,
        'drive',
        'files',
        'list',
        '--page-size',
        '100',
      );
      assert.equal(
        drive.files.find((f: any) => f.token === info.base.base_token).name,
        info.base.name,
      );
      await assert.rejects(
        cli(backend.url, 'base', '+base-get', '--base-token', 'base_absent'),
      );
      assert.equal(backend.calls.at(-1)?.status, 404);
      assert.deepEqual(backend.world, initial);
    }
  } finally {
    await a.close();
    await b.close();
  }
});
