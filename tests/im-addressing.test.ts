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
      'tasks/automationbench-hr-5039/environment/seed.json',
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

test('real CLI contact IDs resolve and send to the same isolated P2P state', async () => {
  const initial = await seed(),
    a = await startMock(initial),
    b = await startMock(initial);
  try {
    const found = await cli(
      a.url,
      'contact',
      '+search-user',
      '--query',
      'lisa.wang@company.example.com',
    );
    assert.equal(found.users.length, 1);
    const user = found.users[0];
    const before = await cli(
      a.url,
      'im',
      '+chat-messages-list',
      '--user-id',
      user.open_id,
    );
    assert.deepEqual(
      before,
      await cli(
        a.url,
        'im',
        '+chat-messages-list',
        '--chat-id',
        user.p2p_chat_id,
      ),
    );
    assert.deepEqual(a.world, initial);
    await cli(
      a.url,
      'im',
      '+messages-send',
      '--user-id',
      user.open_id,
      '--text',
      'user addressing proof',
    );
    await cli(
      a.url,
      'im',
      '+messages-send',
      '--user-id',
      user.open_id,
      '--text',
      'bot addressing proof',
      '--as',
      'bot',
    );
    const byUser = await cli(
      a.url,
      'im',
      '+chat-messages-list',
      '--user-id',
      user.open_id,
    );
    assert.deepEqual(
      byUser,
      await cli(
        a.url,
        'im',
        '+chat-messages-list',
        '--chat-id',
        user.p2p_chat_id,
      ),
    );
    assert.equal(byUser.total, before.total + 2);
    assert.match(JSON.stringify(byUser), /user addressing proof/);
    assert.match(JSON.stringify(byUser), /bot addressing proof/);
    assert.equal(a.world.messages.at(-1)?.chat_id, user.p2p_chat_id);
    assert.deepEqual(b.world, initial);
    const count = a.calls.length;
    await assert.rejects(
      cli(
        a.url,
        'im',
        '+chat-messages-list',
        '--user-id',
        user.open_id,
        '--as',
        'bot',
      ),
    );
    assert.ok(
      a.calls
        .slice(count)
        .every((c) => !c.changed && !c.path.startsWith('/open-apis/im/')),
    );
    await assert.rejects(
      cli(
        a.url,
        'im',
        '+chat-messages-list',
        '--user-id',
        'ou_mock_000000000000000000000000',
      ),
    );
    assert.deepEqual(a.world.chats, initial.chats);
    assert.ok(a.calls.every((c) => c.status === 200));
  } finally {
    await a.close();
    await b.close();
  }
});

test('P2P lookup enforces user identity and validates batch inputs without creating chats', async () => {
  const initial = await seed(),
    b = await startMock(initial);
  const post = (
    body: unknown,
    query = 'chatter_id_type=open_id',
    bot = false,
  ) =>
    fetch(b.url + '/open-apis/im/v1/chat_p2p/batch_query?' + query, {
      method: 'POST',
      headers: {
        authorization: 'Bearer local-evaluation-only' + (bot ? '-bot' : ''),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  try {
    assert.equal(
      (await post({ chatter_ids: ['ou_absent'] }, undefined, true)).status,
      403,
    );
    assert.equal((await post({ chatter_ids: 'ou_absent' })).status, 400);
    assert.equal((await post({ chatter_ids: [] })).status, 400);
    assert.equal(
      (await post({ chatter_ids: ['ou_absent'] }, 'chatter_id_type=union_id'))
        .status,
      501,
    );
    assert.equal(
      (await post({ chatter_ids: ['ou_absent'], extra: true })).status,
      501,
    );
    const unknown = await post({ chatter_ids: ['ou_absent'] });
    assert.deepEqual((await unknown.json()).data, { p2p_chats: [] });
    assert.deepEqual(b.world, initial);
    assert.ok(b.calls.every((c) => !c.changed));
  } finally {
    await b.close();
  }
});

test('real CLI unsupported message formats are coverage gaps with no message writes', async () => {
  const initial = await seed(),
    b = await startMock(initial);
  try {
    const chat = initial.chats.find((c: any) => c.chat_mode === 'p2p').chat_id;
    await assert.rejects(
      cli(
        b.url,
        'im',
        '+messages-send',
        '--chat-id',
        chat,
        '--markdown',
        '**unsupported format**',
      ),
    );
    assert.equal(b.calls.at(-1)?.status, 501);
    assert.deepEqual(b.world, initial);
    assert.ok(b.calls.every((c) => !c.changed));
  } finally {
    await b.close();
  }
});

test('real CLI message retries deduplicate within fixture time and remain isolated', async () => {
  const initial = await seed(),
    a = await startMock(initial),
    b = await startMock(initial);
  try {
    const found = await cli(
      a.url,
      'contact',
      '+search-user',
      '--query',
      'lisa.wang@company.example.com',
    );
    const user = found.users[0];
    const send = (url: string, text = 'retry proof', byUser = true) =>
      cli(
        url,
        'im',
        '+messages-send',
        byUser ? '--user-id' : '--chat-id',
        byUser ? user.open_id : user.p2p_chat_id,
        '--text',
        text,
        '--idempotency-key',
        'retry-proof',
      );
    const first = await send(a.url);
    assert.deepEqual(await send(a.url), first);
    assert.deepEqual(await send(a.url, 'retry proof', false), first);
    assert.equal(a.world.messages.length, initial.messages.length + 1);
    assert.equal(a.calls.at(-1)?.changed, false);
    await assert.rejects(send(a.url, 'conflicting text'));
    assert.equal(a.calls.at(-1)?.status, 501);
    assert.equal(a.world.messages.length, initial.messages.length + 1);
    await send(b.url);
    assert.equal(b.world.messages.length, initial.messages.length + 1);
    a.world.now = new Date(
      Date.parse(initial.now) + 61 * 60 * 1000,
    ).toISOString();
    const later = await send(a.url);
    assert.notDeepEqual(later, first);
    assert.equal(a.world.messages.length, initial.messages.length + 2);
    assert.equal(b.world.messages.length, initial.messages.length + 1);
  } finally {
    await a.close();
    await b.close();
  }
});
