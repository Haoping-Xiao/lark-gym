import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { openId } from '../gyms/lark-cli/src/mock/domains/contact.ts';
const exec = promisify(execFile);
test('rich post mentions keep their member identity across read and preserve formatting without state leaks', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3187/environment/seed.json',
      'utf8',
    ),
  );
  seed.chats[0].post_support = true;
  const a = await startMock(seed),
    b = await startMock(seed),
    manager = openId('support_manager');
  const cli = (args: string[]) =>
    exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
      env: { ...process.env, FEISHU_MOCK_URL: a.url },
      maxBuffer: 8e6,
    });
  const post = {
    zh_cn: {
      title: 'data sync 警报',
      content: [
        [
          { tag: 'at', user_id: manager, user_name: 'Support Manager' },
          { tag: 'text', text: '请处理故障', style: ['bold'] },
        ],
        [
          {
            tag: 'a',
            text: '查看工单',
            href: 'https://company.example.com/ticket/1',
          },
        ],
      ],
    },
  };
  const send = (content: unknown) =>
    cli([
      'im',
      '+messages-send',
      '--chat-id',
      'oc_CESC01',
      '--msg-type',
      'post',
      '--content',
      JSON.stringify(content),
    ]);
  try {
    await send(post);
    const m = a.world.messages[0];
    assert.equal(m.msg_type, 'post');
    assert.equal(m.mentions[0].id, manager);
    assert.deepEqual(JSON.parse(m.body.content), post);
    await cli(['im', '+messages-mget', '--message-ids', m.message_id]);
    const get = a.calls.find((c) => c.path.includes('/messages/mget'));
    assert.ok(get);
    assert.ok(JSON.stringify(get.response).includes(manager));
    assert.equal(b.world.messages.length, 0);
    const invalid = structuredClone(post);
    const invalidMention = invalid.zh_cn.content[0][0];
    assert.ok('user_id' in invalidMention);
    invalidMention.user_id = 'ou_invalid';
    await send(invalid);
    assert.equal(a.world.messages[1].mentions, undefined);
    const before = structuredClone(a.world);
    await assert.rejects(
      send({
        zh_cn: {
          title: 'unsupported',
          content: [[{ tag: 'img', image_key: 'image' }]],
        },
      }),
    );
    assert.equal(a.calls.at(-1)!.status, 501);
    assert.deepEqual(a.world, before);
    await assert.rejects(
      send({
        zh_cn: {
          content: [
            [
              {
                tag: 'md',
                text: '<at user_id=\"' + manager + '\">Manager</at>',
              },
            ],
          ],
        },
      }),
    );
    assert.equal(a.calls.at(-1)!.status, 501);
    assert.deepEqual(a.world, before);
  } finally {
    await a.close();
    await b.close();
  }
});
