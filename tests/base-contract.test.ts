import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI projection, pagination, write/read and group search share state', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  delete seed.base.tables;
  seed.base.records = [
    {
      record_id: 'rec_first',
      fields: {
        collection: 'tickets',
        subject: 'Invoice A',
        description: 'First body',
      },
    },
    {
      record_id: 'rec_second',
      fields: {
        collection: 'tickets',
        subject: 'Invoice B',
        description: 'Second body',
      },
    },
  ];
  seed.base.fields = ['collection', 'subject', 'description'].map((name) => ({
    name,
    type: 'text',
  }));
  const backend = await startMock(seed);
  const cli = async (...args: string[]) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: backend.url },
        })
      ).stdout,
    );
  const common = ['--base-token', 'base_crm', '--table-id', 'tbl_crm'];
  try {
    const first = await cli(
      'base',
      '+record-get',
      ...common,
      '--record-id',
      'rec_second',
      '--field-id',
      'subject',
      '--field-id',
      'description',
      '--format',
      'json',
    );
    assert.deepEqual(first.data.fields, ['subject', 'description']);
    assert.deepEqual(first.data.data, [['Invoice B', 'Second body']]);
    const only = await cli(
      'base',
      '+record-get',
      ...common,
      '--record-id',
      'rec_first',
      '--field-id',
      'fld_1',
      '--format',
      'json',
    );
    assert.deepEqual(only.data.fields, ['subject']);
    assert.deepEqual(only.data.data, [['Invoice A']]);
    const page = await cli(
      'base',
      '+record-list',
      ...common,
      '--offset',
      '1',
      '--limit',
      '1',
      '--format',
      'json',
    );
    assert.deepEqual(page.data.record_id_list, ['rec_second']);
    await cli(
      'base',
      '+record-upsert',
      ...common,
      '--record-id',
      'rec_second',
      '--json',
      '{"subject":"Changed"}',
    );
    const after = await cli(
      'base',
      '+record-get',
      ...common,
      '--record-id',
      'rec_second',
      '--field-id',
      'subject',
      '--format',
      'json',
    );
    assert.deepEqual(after.data.data, [['Changed']]);
    const list = await cli(
      'base',
      '+record-list',
      ...common,
      '--format',
      'json',
    );
    assert.ok(list.data.data.some((row: unknown[]) => row.includes('Changed')));
    await cli('base', '+table-get', ...common);
    const search = await cli(
      'im',
      '+chat-search',
      '--query',
      seed.chats.find((c: { chat_type: string }) => c.chat_type !== 'p2p').name,
      '--chat-modes',
      'group',
      '--format',
      'json',
    );
    assert.ok(
      search.data.chats.some(
        (chat: { chat_id: string }) => chat.chat_id === 'oc_updates',
      ),
    );
    assert.equal(backend.calls.filter((c) => c.status === 501).length, 0);
    await assert.rejects(
      cli(
        'base',
        '+record-get',
        ...common,
        '--record-id',
        'rec_first',
        '--field-id',
        'missing',
      ),
    );
    assert.equal(backend.calls.at(-1)?.changed, false);
  } finally {
    await backend.close();
  }
});
