import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const seed = () => ({
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
    records: [],
    fields: [],
    resource_discovery: true,
  },
});
test('missing Base table catalog returns 404 and permits recovery without inventing a board', async () => {
  const a = await startMock(seed()),
    b = await startMock(seed()),
    before = structuredClone(a.world);
  const cli = (backend: any, token: string) =>
    exec(
      resolve('gyms/lark-cli/bin/lark-cli'),
      ['base', '+table-list', '--base-token', token],
      { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
    );
  try {
    await assert.rejects(cli(a, 'brd_mktg'));
    assert.equal(a.calls.at(-1)?.status, 404);
    await cli(a, 'base_test');
    assert.equal(a.calls.at(-1)?.status, 200);
    assert.deepEqual(a.world, before);
    assert.deepEqual(b.world, before);
    assert.equal(b.calls.length, 0);
    assert.equal(
      a.calls.some((c) => c.status === 501),
      false,
    );
  } finally {
    await a.close();
    await b.close();
  }
});
