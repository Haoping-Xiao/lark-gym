import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('native thread reads share incoming and sent messages, projections, folders and mailbox boundaries', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const a = await startMock(seed),
    b = await startMock(seed),
    box = 'support@company.example.com',
    source = seed.mail.messages[0];
  const cli = (...args: string[]) =>
    exec(
      resolve('gyms/lark-cli/bin/lark-cli'),
      ['mail', ...args, '--as', 'user'],
      { env: { ...process.env, FEISHU_MOCK_URL: a.url }, maxBuffer: 8e6 },
    );
  const read = () =>
    a.calls
      .filter((c) => c.path.includes('/threads/' + source.thread_id))
      .at(-1)!;
  try {
    await cli('+thread', '--mailbox', box, '--thread-id', source.thread_id);
    assert.equal(read().status, 200);
    assert.equal(read().changed, false);
    assert.equal(
      (read().response as any).data.thread.messages[0].body_plain_text,
      source.body_plain_text,
    );
    await cli(
      '+reply',
      '--mailbox',
      box,
      '--message-id',
      source.message_id,
      '--body',
      '收到，我们将检查账单。',
      '--confirm-send',
    );
    await cli('+thread', '--mailbox', box, '--thread-id', source.thread_id);
    assert.equal((read().response as any).data.thread.messages.length, 2);
    assert.equal(b.world.mail!.messages.length, 1);
    await cli(
      'user_mailbox.threads',
      'get',
      '--user-mailbox-id',
      box,
      '--thread-id',
      source.thread_id,
      '--params',
      '{"format":"metadata"}',
    );
    assert.ok(
      (read().response as any).data.thread.messages.every(
        (m: any) => m.body_plain_text === undefined,
      ),
    );
    await cli(
      'user_mailbox.threads',
      'list',
      '--user-mailbox-id',
      box,
      '--params',
      '{"page_size":1,"folder_id":"SENT"}',
    );
    const listing = a.calls.filter((c) => c.path.includes('/threads?')).at(-1)!;
    assert.equal((listing.response as any).data.items[0].id, source.thread_id);
    const before = structuredClone(a.world);
    await assert.rejects(cli('+thread', '--thread-id', source.thread_id));
    assert.equal(a.calls.at(-1)!.status, 404);
    assert.deepEqual(a.world, before);
    await cli(
      'user_mailbox.messages',
      'trash',
      '--user-mailbox-id',
      box,
      '--message-id',
      source.message_id,
    );
    await cli('+thread', '--mailbox', box, '--thread-id', source.thread_id);
    assert.equal((read().response as any).data.thread.messages.length, 1);
    await cli(
      '+thread',
      '--mailbox',
      box,
      '--thread-id',
      source.thread_id,
      '--include-spam-trash',
    );
    assert.equal((read().response as any).data.thread.messages.length, 2);
  } finally {
    await a.close();
    await b.close();
  }
});
