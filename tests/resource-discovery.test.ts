import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI discovers business resources without a per-task catalogue', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const backend = await startMock(seed);
  const cli = async (...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [...args, '--format', 'json'],
          {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          },
        )
      ).stdout,
    );
  try {
    const list = await cli(
      'drive',
      'files',
      'list',
      '--params',
      '{"page_size":1}',
    );
    assert.equal(list.data.files.length, 1);
    assert.equal(list.data.has_more, true);
    const next = await cli(
      'drive',
      'files',
      'list',
      '--params',
      JSON.stringify({ page_size: 1, page_token: list.data.next_page_token }),
    );
    assert.notEqual(next.data.files[0].token, list.data.files[0].token);
    const search = await cli('drive', '+search', '--query', '客服工单');
    assert.ok(
      search.data.results.some(
        (r: any) => r.result_meta.token === seed.base.app_token,
      ),
    );
    const table = seed.base.tables.find((t: any) => t.collection === 'tickets');
    await cli(
      'base',
      '+record-upsert',
      '--base-token',
      seed.base.app_token,
      '--table-id',
      table.table_id,
      '--json',
      '{"subject":"unique-discovery-write","description":"new"}',
    );
    const after = await cli(
      'drive',
      '+search',
      '--query',
      'unique-discovery-write',
    );
    assert.equal(after.data.total, 1);
    const titleOnly = await cli(
      'drive',
      '+search',
      '--query',
      'unique-discovery-write',
      '--only-title',
    );
    assert.equal(titleOnly.data.total, 0);
    assert.equal(backend.calls.filter((c) => c.status === 501).length, 0);
    assert.equal(
      (
        await cli(
          'drive',
          '+search',
          '--query',
          '客服工单',
          '--doc-types',
          'sheet',
        )
      ).data.total,
      0,
    );
    assert.equal(
      (
        await cli(
          'drive',
          '+search',
          '--query',
          '客服工单',
          '--doc-types',
          'bitable',
        )
      ).data.total,
      1,
    );
    await assert.rejects(
      cli('drive', '+search', '--query', '客服', '--creator-ids', 'ou_unknown'),
    );
    assert.equal(backend.calls.at(-1)?.status, 501);
    assert.equal(backend.calls.at(-1)?.changed, false);
  } finally {
    await backend.close();
  }
});
