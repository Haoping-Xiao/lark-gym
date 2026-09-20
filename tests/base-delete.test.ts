import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Record deletion is atomic, visible across interfaces, isolated and audited', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-support-1481/environment/seed.json',
      'utf8',
    ),
  );
  const a = await startMock(seed),
    b = await startMock(seed);
  const cli = (backend: typeof a, args: string[]) =>
    exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
      env: { ...process.env, FEISHU_MOCK_URL: backend.url },
    });
  const base = ['--base-token', 'base_crm', '--table-id', 'tbl_crm'];
  const id = 'rec_zendesk_usr_701';
  try {
    await assert.rejects(
      cli(a, [
        'base',
        '+record-delete',
        ...base,
        '--record-id',
        id,
        '--record-id',
        'missing',
        '--yes',
      ]),
    );
    assert.deepEqual(a.world, seed);
    await cli(a, [
      'base',
      '+record-delete',
      ...base,
      '--record-id',
      id,
      '--yes',
    ]);
    assert.doesNotMatch(
      (await cli(a, ['base', '+record-list', ...base])).stdout,
      /rec_zendesk_usr_701/,
    );
    const headers = { Authorization: 'Bearer local-evaluation-only' };
    // The v1 endpoint must read the same state as v3 CLI record operations.
    const response = await fetch(
      a.url +
        '/open-apis/bitable/v1/apps/base_crm/tables/tbl_crm/records/' +
        id,
      { headers },
    );
    assert.equal(response.status, 404);
    assert.match(
      (await cli(b, ['base', '+record-list', ...base])).stdout,
      /rec_zendesk_usr_701/,
    );
    assert.ok(
      a.calls.some((c: { mutations: { id: string; after: unknown }[] }) =>
        c.mutations.some((m) => m.id === id && m.after === null),
      ),
    );
    await assert.rejects(
      cli(a, ['base', '+record-delete', ...base, '--record-id', id, '--yes']),
    );
  } finally {
    await a.close();
    await b.close();
  }
});
