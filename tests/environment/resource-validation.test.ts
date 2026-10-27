import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startMock } from '../../gyms/lark-cli/src/server.ts';

test('unsupported operations and missing resources are distinct, including single-table fixtures', async () => {
  const seed = JSON.parse(
    readFileSync(
      'tasks/automationbench-finance-4001/environment/seed.json',
      'utf8',
    ),
  );
  seed.docs = { documents: [], folders: [] };
  const backend = await startMock(seed);
  const headers = {
    authorization: 'Bearer local-evaluation-only',
    'content-type': 'application/json',
  };
  try {
    for (const [method, path, status] of [
      ['GET', '/open-apis/docs_ai/v1/documents', 501],
      ['DELETE', '/open-apis/docs_ai/v1/documents/missing', 501],
      ['GET', '/open-apis/base/v3/bases/WRONG/tables', 404],
      ['POST', '/open-apis/base/v3/bases/WRONG/blocks/list', 404],
      ['POST', '/open-apis/docs_ai/v1/documents/missing/fetch', 404],
      [
        'GET',
        `/open-apis/base/v3/bases/WRONG/tables/${seed.base.table_id}/records`,
        404,
      ],
      [
        'GET',
        `/open-apis/bitable/v1/apps/WRONG/tables/${seed.base.table_id}/records`,
        404,
      ],
      [
        'GET',
        `/open-apis/base/v3/bases/${seed.base.app_token}/tables/WRONG/records`,
        404,
      ],
      [
        'POST',
        `/open-apis/base/v3/bases/${seed.base.app_token}/tables/WRONG/records`,
        404,
      ],
      [
        'GET',
        `/open-apis/base/v3/bases/${seed.base.app_token}/tables/${seed.base.table_id}/records`,
        200,
      ],
      ['DELETE', '/open-apis/base/v3/bases/WRONG/tables/WRONG/unknown', 501],
    ] as const) {
      const response = await fetch(backend.url + path, { method, headers });
      assert.equal(response.status, status, `${method} ${path}`);
      if (status === 501)
        assert.match((await response.json()).msg, /ENV_UNSUPPORTED/);
    }
    assert.deepEqual(backend.world, seed);
    assert.ok(backend.calls.every((call) => !call.changed));
  } finally {
    await backend.close();
  }
});

test('document search matches business content, excludes folders and internal field names', async () => {
  const seed = JSON.parse(
    readFileSync(
      'tasks/automationbench-finance-4001/environment/seed.json',
      'utf8',
    ),
  );
  seed.docs = {
    documents: [],
    folders: [{ token: 'folder1', name: 'folder-only-query' }],
  };
  const backend = await startMock(seed);
  try {
    for (const query of ['record_id', 'folder-only-query']) {
      const response = await fetch(
        backend.url + '/open-apis/search/v2/doc_wiki/search',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer local-evaluation-only',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ query }),
        },
      );
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.total, 0, query);
    }
  } finally {
    await backend.close();
  }
});
