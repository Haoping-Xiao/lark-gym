import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('native documents share live state across create, fetch, update, discovery and isolated runs', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  seed.docs = {
    folders: [
      { token: 'fldOps', name: 'Operations' },
      { token: 'fldLocked', name: 'Locked', writable: false },
    ],
    documents: [],
  };
  seed.drive_files = [
    {
      token: 'fileSource',
      name: 'Archived material',
      type: 'file',
      parent_token: 'fldOps',
    },
  ];
  const a = await startMock(seed),
    b = await startMock(seed);
  const cli = async (backend: typeof a, ...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [...args, '--format', 'json'],
          { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
        )
      ).stdout,
    );
  try {
    const created = await cli(
      a,
      'docs',
      '+create',
      '--doc-format',
      'markdown',
      '--title',
      'Plan & review',
      '--content',
      'Check policy v1',
      '--parent-token',
      'fldOps',
    );
    const id = created.data.document.document_id;
    assert.equal(a.world.docs!.documents[0].title, 'Plan & review');
    const fetched = await cli(
      a,
      'docs',
      '+fetch',
      '--doc',
      id,
      '--doc-format',
      'markdown',
    );
    assert.equal(fetched.data.document.content, 'Check policy v1');
    await cli(
      a,
      'docs',
      '+update',
      '--doc',
      id,
      '--doc-format',
      'markdown',
      '--command',
      'append',
      '--content',
      'Approved today',
    );
    await cli(
      a,
      'docs',
      '+update',
      '--doc',
      id,
      '--doc-format',
      'markdown',
      '--command',
      'str_replace',
      '--pattern',
      'v1',
      '--content',
      'v2',
    );
    const search = await cli(a, 'docs', '+search', '--query', 'v2');
    assert.ok(search.data.results.some((r: any) => r.result_meta.token === id));
    const list = await cli(
      a,
      'drive',
      'files',
      'list',
      '--params',
      '{"folder_token":"fldOps"}',
    );
    assert.ok(list.data.files.some((f: any) => f.token === id));
    assert.equal(
      (await cli(b, 'docs', '+search', '--query', 'v2')).data.total,
      0,
    );
    const folder = await cli(
      a,
      'drive',
      'files',
      'create_folder',
      '--data',
      JSON.stringify({ name: 'Alicia', folder_token: 'fldOps' }),
    );
    await cli(
      a,
      'drive',
      '+move',
      '--file-token',
      'fileSource',
      '--type',
      'file',
      '--folder-token',
      folder.data.token,
    );
    const moved = await cli(
      a,
      'drive',
      'files',
      'list',
      '--params',
      JSON.stringify({ folder_token: folder.data.token }),
    );
    assert.ok(moved.data.files.some((f: any) => f.token === 'fileSource'));
    assert.equal(b.world.drive_files![0].parent_token, 'fldOps');
    const before = structuredClone(a.world);
    await assert.rejects(
      cli(
        a,
        'docs',
        '+update',
        '--doc',
        id,
        '--doc-format',
        'markdown',
        '--command',
        'overwrite',
        '--revision-id',
        '1',
        '--content',
        'stale',
      ),
    );
    await assert.rejects(
      cli(
        a,
        'docs',
        '+create',
        '--doc-format',
        'markdown',
        '--title',
        'No',
        '--content',
        'No',
        '--parent-token',
        'fldLocked',
      ),
    );
    await assert.rejects(
      cli(
        a,
        'docs',
        '+create',
        '--doc-format',
        'markdown',
        '--title',
        'No',
        '--content',
        'No',
        '--parent-token',
        'missing',
      ),
    );
    await assert.rejects(
      cli(
        a,
        'drive',
        '+move',
        '--file-token',
        'fileSource',
        '--type',
        'file',
        '--folder-token',
        'fldLocked',
      ),
    );
    assert.deepEqual(a.world, before);
    assert.equal(a.calls.filter((c) => c.status === 501).length, 0);
    assert.equal(
      a.calls.flatMap((c) => c.mutations).filter((m) => m.kind === 'document')
        .length,
      3,
    );
    assert.deepEqual(b.world, seed);
  } finally {
    await a.close();
    await b.close();
  }
});
