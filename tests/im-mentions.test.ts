import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { openId } from '../gyms/lark-cli/src/mock/domains/contact.ts';
const exec = promisify(execFile);
test('real CLI mentions resolve members and share metadata across send read list with isolated trials', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3187/environment/seed.json',
      'utf8',
    ),
  );
  seed.base.records = [
    {
      record_id: 'manager',
      fields: {
        collection: 'lookup_users',
        id: 'manager',
        name: 'Support Manager',
        email: 'manager@example.com',
      },
    },
    {
      record_id: 'outside',
      fields: { collection: 'lookup_users', id: 'outside', name: 'Outside' },
    },
  ];
  seed.chats = [
    {
      chat_id: 'oc_group',
      name: 'escalations',
      chat_mode: 'group',
      member_ids: ['manager'],
      mention_support: true,
    },
  ];
  seed.messages = [];
  const a = await startMock(seed),
    b = await startMock(seed);
  const cli = (args: string[]) =>
    exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
      env: { ...process.env, FEISHU_MOCK_URL: a.url },
      maxBuffer: 8e6,
    });
  const send = (s: string, uuid?: string) =>
    cli([
      'im',
      '+messages-send',
      '--chat-id',
      'oc_group',
      '--text',
      s,
      ...(uuid ? ['--idempotency-key', uuid] : []),
    ]);
  try {
    await send(
      `<at user_id="${openId('manager')}">Label</at> data sync`,
      'same',
    );
    const m = a.world.messages[0];
    assert.equal(m.mentions[0].id, openId('manager'));
    assert.equal(m.mentions[0].name, 'Support Manager');
    assert.match(JSON.parse(m.body.content).text, /@_user_1 data sync/);
    await send(
      `<at user_id="${openId('manager')}">Label</at> data sync`,
      'same',
    );
    assert.equal(a.world.messages.length, 1);
    await cli(['im', '+chat-messages-list', '--chat-id', 'oc_group']);
    assert.ok(
      a.calls.some(
        (c) =>
          c.method === 'GET' &&
          c.path.startsWith('/open-apis/im/v1/messages?') &&
          JSON.stringify(c.response).includes(openId('manager')),
      ),
    );
    await cli(['im', '+messages-mget', '--message-ids', m.message_id]);
    assert.ok(
      a.calls.some(
        (c) =>
          c.method === 'GET' &&
          c.path.startsWith('/open-apis/im/v1/messages/mget?') &&
          JSON.stringify(c.response).includes(openId('manager')),
      ),
    );
    await send('@Support Manager data sync');
    assert.equal(a.world.messages[1].mentions, undefined);
    await send('<at user_id="ou_missing">Support Manager</at> data sync');
    assert.equal(a.world.messages[2].mentions, undefined);
    await send(
      `<at user_id="${openId('outside')}">Support Manager</at> data sync`,
    );
    assert.equal(a.world.messages[3].mentions, undefined);
    const before = structuredClone(a.world);
    await assert.rejects(send('<at user_id="all">Everyone</at>'));
    assert.equal(a.calls.at(-1)!.status, 501);
    assert.deepEqual(a.world, before);
    assert.equal(b.world.messages.length, 0);
  } finally {
    await a.close();
    await b.close();
  }
});
