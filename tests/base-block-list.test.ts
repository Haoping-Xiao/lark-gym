import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Base block discovery and URL resolution use the same live table catalog', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-finance-4033/environment/seed.json',
      'utf8',
    ),
  );
  const backend = await startMock(seed);
  const cli = async (args: string[]) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: backend.url },
        })
      ).stdout,
    ).data;
  try {
    const list = await cli([
      'base',
      '+base-block-list',
      '--base-token',
      seed.base.app_token,
      '--type',
      'table',
    ]);
    assert.deepEqual(
      list.blocks,
      seed.base.tables.map((t: any) => ({
        id: t.table_id,
        type: 'table',
        name: t.name,
      })),
    );
    const selected = seed.base.tables.find(
      (t: any) => t.collection === 'quickbooks_estimates',
    );
    const resolved = await cli([
      'base',
      '+url-resolve',
      '--url',
      `https://example.feishu.cn/base/${seed.base.app_token}?table=${selected.table_id}`,
    ]);
    assert.equal(resolved.table_id, selected.table_id);
    assert.equal(resolved.block_type, 'table');
    const docOnly = await cli([
      'base',
      '+base-block-list',
      '--base-token',
      seed.base.app_token,
      '--type',
      'docx',
    ]);
    assert.deepEqual(docOnly.blocks, []);
    await assert.rejects(
      cli([
        'base',
        '+base-block-list',
        '--base-token',
        seed.base.app_token,
        '--parent-id',
        'unsupported-folder',
      ]),
    );
    assert.equal(backend.calls.at(-1)!.status, 501);
    assert.deepEqual(backend.world, seed);
  } finally {
    await backend.close();
  }
});
