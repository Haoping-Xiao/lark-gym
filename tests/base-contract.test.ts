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
  // This environment contract owns its discovery fixture independently of tasks.
  seed.chats = [
    { chat_id: 'oc_updates', name: 'Contract test group', chat_mode: 'group' },
  ];
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

test('real CLI record search and scalar filters observe writes before pagination', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  delete seed.base.tables;
  seed.base.fields = [
    { name: 'subject', type: 'text' },
    { name: 'score', type: 'number' },
  ];
  seed.base.records = [
    { record_id: 'one', fields: { subject: 'Alpha invoice', score: 10 } },
    { record_id: 'two', fields: { subject: 'Beta invoice', score: 20 } },
    { record_id: 'three', fields: { subject: 'Alpha renewal', score: 30 } },
  ];
  const backend = await startMock(seed);
  const cli = async (...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [
            'base',
            ...args,
            '--base-token',
            'base_crm',
            '--table-id',
            'tbl_crm',
            '--format',
            'json',
          ],
          { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
        )
      ).stdout,
    );
  try {
    const search = await cli(
      '+record-search',
      '--keyword',
      'ALPHA',
      '--search-field',
      'subject',
      '--field-id',
      'subject',
      '--offset',
      '1',
      '--limit',
      '1',
    );
    assert.deepEqual(search.data.record_id_list, ['three']);
    assert.deepEqual(search.data.data, [['Alpha renewal']]);
    const filter = JSON.stringify({
      logic: 'and',
      conditions: [['score', '>=', 20]],
    });
    const listed = await cli(
      '+record-list',
      '--filter-json',
      filter,
      '--limit',
      '1',
    );
    assert.deepEqual(listed.data.record_id_list, ['two']);
    assert.equal(listed.data.total, 2);
    assert.equal(listed.data.has_more, true);
    await cli(
      '+record-upsert',
      '--record-id',
      'two',
      '--json',
      '{"subject":"Alpha updated","score":40}',
    );
    const updated = await cli(
      '+record-search',
      '--keyword',
      'Alpha',
      '--search-field',
      'subject',
      '--filter-json',
      JSON.stringify({ logic: 'and', conditions: [['score', '>', 30]] }),
    );
    assert.deepEqual(updated.data.record_id_list, ['two']);
    const exact = await cli(
      '+record-list',
      '--filter-json',
      JSON.stringify({
        logic: 'or',
        conditions: [
          ['subject', '==', 'Alpha updated'],
          ['score', '==', 10],
        ],
      }),
    );
    assert.deepEqual(exact.data.record_id_list, ['one', 'two']);
    await assert.rejects(
      cli(
        '+record-list',
        '--filter-json',
        JSON.stringify({
          logic: 'and',
          conditions: [['subject', 'intersects', ['Alpha']]],
        }),
      ),
      /ENV_UNSUPPORTED/,
    );
    await assert.rejects(
      cli(
        '+record-search',
        '--json',
        JSON.stringify({
          keyword: 'Alpha',
          search_fields: ['subject'],
          view_id: 'unknown',
        }),
      ),
      /ENV_UNSUPPORTED/,
    );
    assert.equal(backend.world.base.records.length, 3);
  } finally {
    await backend.close();
  }
});
