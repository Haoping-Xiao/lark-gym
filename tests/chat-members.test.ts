import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Membership CLI writes are readable, idempotent, permission checked and run-isolated', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-hr-5029/environment/seed.json',
      'utf8',
    ),
  );
  const a = await startMock(seed),
    b = await startMock(seed);
  const cli = (backend: typeof a, op: string, ids?: string[]) =>
    exec(
      resolve('gyms/lark-cli/bin/lark-cli'),
      [
        'im',
        'chat.members',
        op,
        ...(op === 'delete' ? ['--yes'] : []),
        '--chat-id',
        'oc_C_ENG',
        '--member-id-type',
        'user_id',
        ...(ids ? ['--data', JSON.stringify({ id_list: ids })] : []),
      ],
      { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
    );
  try {
    await cli(a, 'create', ['U_SARAH']);
    await cli(a, 'create', ['U_SARAH']);
    assert.deepEqual(
      a.world.chats.find((c: { chat_id: string }) => c.chat_id === 'oc_C_ENG')!
        .member_ids,
      ['U_SARAH'],
    );
    assert.match((await cli(a, 'get')).stdout, /U_SARAH/);
    assert.doesNotMatch((await cli(b, 'get')).stdout, /U_SARAH/);
    await assert.rejects(cli(a, 'create', ['U_MARCUS', 'missing']));
    assert.doesNotMatch((await cli(a, 'get')).stdout, /U_MARCUS/);
    a.world.chats.find(
      (c: { chat_id: string }) => c.chat_id === 'oc_C_ENG',
    )!.can_manage_members = false;
    await assert.rejects(cli(a, 'delete', ['U_SARAH']));
    assert.match((await cli(a, 'get')).stdout, /U_SARAH/);
    a.world.chats.find(
      (c: { chat_id: string }) => c.chat_id === 'oc_C_ENG',
    )!.can_manage_members = true;
    await cli(a, 'delete', ['U_SARAH']);
    assert.doesNotMatch((await cli(a, 'get')).stdout, /U_SARAH/);
    assert.ok(
      a.calls.some((c: { mutations: { kind: string }[] }) =>
        c.mutations.some((m) => m.kind === 'chat'),
      ),
    );
  } finally {
    await a.close();
    await b.close();
  }
});

test('Created group is readable across chat/member/message APIs and isolated from other runs', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-sales-609/environment/seed.json',
      'utf8',
    ),
  );
  const a = await startMock(seed),
    b = await startMock(seed);
  const cli = (backend: typeof a, args: string[]) =>
    exec(resolve('gyms/lark-cli/bin/lark-cli'), ['im', ...args], {
      env: { ...process.env, FEISHU_MOCK_URL: backend.url },
    });
  try {
    const before = structuredClone(a.world.chats);
    await assert.rejects(
      cli(a, [
        'chats',
        'create',
        '--user-id-type',
        'user_id',
        '--data',
        JSON.stringify({
          name: 'Invalid',
          user_id_list: ['U_SCHEN', 'missing'],
        }),
      ]),
    );
    assert.deepEqual(a.world.chats, before);
    const result = JSON.parse(
      (
        await cli(a, [
          'chats',
          'create',
          '--user-id-type',
          'user_id',
          '--data',
          JSON.stringify({
            name: 'Account room',
            description: 'Customer account',
            user_id_list: ['U_SCHEN'],
          }),
        ])
      ).stdout,
    );
    const id = result.data.chat_id;
    assert.ok(id);
    assert.match(
      (await cli(a, ['chats', 'get', '--chat-id', id])).stdout,
      /Customer account/,
    );
    assert.match(
      (
        await cli(a, [
          'chat.members',
          'get',
          '--chat-id',
          id,
          '--member-id-type',
          'user_id',
        ])
      ).stdout,
      /U_SCHEN/,
    );
    await cli(a, ['+messages-send', '--chat-id', id, '--text', 'Welcome']);
    assert.match(
      (await cli(a, ['+chat-messages-list', '--chat-id', id])).stdout,
      /Welcome/,
    );
    assert.doesNotMatch((await cli(b, ['+chat-list'])).stdout, /Account room/);
    await assert.rejects(cli(b, ['chats', 'get', '--chat-id', id]));
    b.world.chat_creation_allowed = false;
    await assert.rejects(
      cli(b, [
        'chats',
        'create',
        '--user-id-type',
        'user_id',
        '--data',
        '{"name":"Denied"}',
      ]),
    );
    assert.deepEqual(b.world.chats, seed.chats);
  } finally {
    await a.close();
    await b.close();
  }
});
