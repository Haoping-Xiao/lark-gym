import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const seed = (workspace?: string) => ({
  now: '2026-02-24T09:00:00Z',
  spreadsheet_token: 'ss_unused',
  sheets: {},
  calendars: [],
  events: [],
  chats: [],
  messages: [],
  base: {
    app_token: 'base_test',
    table_id: 'tbl_test',
    name: 'Projects',
    records: [],
    fields: [],
    workspace_discovery: true,
    ...(workspace ? { workspace_token: workspace } : {}),
  },
});
const cli = async (b: any, args: string[]) =>
  JSON.parse(
    (
      await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
        env: { ...process.env, FEISHU_MOCK_URL: b.url },
      })
    ).stdout,
  ).data;
test('workspace entity reads derive the existing Base and preserve instance boundaries', async () => {
  const a = await startMock(seed('ws_left')),
    b = await startMock(seed('ws_right'));
  const before = structuredClone(a.world);
  try {
    const list = await cli(a, [
      'base',
      '+workspace-entity-list',
      '--workspace-token',
      'ws_left',
      '--page-size',
      '1',
      '--as',
      'user',
    ]);
    assert.deepEqual(list.entities, [
      {
        token: 'base_test',
        name: 'Projects',
        entity_type: 'base',
        url: 'https://company.feishu.cn/base/base_test',
      },
    ]);
    assert.equal(list.has_more, false);
    const meta = await cli(a, [
      'base',
      '+base-get',
      '--base-token',
      'base_test',
      '--as',
      'user',
    ]);
    assert.equal(meta.base.workspace_token, 'ws_left');
    assert.equal(meta.base.name, list.entities[0].name);
    const empty = await cli(a, [
      'base',
      '+workspace-entity-list',
      '--workspace-token',
      'ws_left',
      '--type',
      'baseapp',
      '--as',
      'user',
    ]);
    assert.deepEqual(empty.entities, []);
    const page = await cli(a, [
      'base',
      '+workspace-entity-list',
      '--workspace-token',
      'ws_left',
      '--page-size',
      '1',
      '--page-token',
      '1',
      '--as',
      'user',
    ]);
    assert.deepEqual(page.entities, []);
    await assert.rejects(
      cli(b, [
        'base',
        '+workspace-entity-list',
        '--workspace-token',
        'ws_left',
        '--as',
        'user',
      ]),
    );
    assert.equal(b.calls.at(-1)?.status, 404);
    assert.equal(b.calls.at(-1)?.unsupported, undefined);
    const own = await cli(b, [
      'base',
      '+workspace-entity-list',
      '--workspace-token',
      'ws_right',
      '--type',
      'base',
      '--as',
      'user',
    ]);
    assert.equal(own.entities[0].token, 'base_test');
    assert.deepEqual(a.world, before);
  } finally {
    await a.close();
    await b.close();
  }
});
test('business workspace field does not grant or invent a Feishu workspace', async () => {
  const s = seed();
  s.base.records.push({
    record_id: 'rec_x',
    fields: { workspace: 'ws_prod' },
  } as never);
  const b = await startMock(s);
  const before = structuredClone(b.world);
  try {
    await assert.rejects(
      cli(b, [
        'base',
        '+workspace-entity-list',
        '--workspace-token',
        'ws_prod',
        '--as',
        'user',
      ]),
    );
    assert.equal(b.calls.at(-1)?.status, 404);
    assert.equal(b.calls.at(-1)?.unsupported, undefined);
    assert.deepEqual(b.world, before);
  } finally {
    await b.close();
  }
});
