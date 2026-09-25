import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const request = (url: string) =>
  fetch(url, { headers: { authorization: 'Bearer local-evaluation-only' } });
test('real CLI Wiki space discovery shares state, paginates and isolates trials', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-finance-4093/environment/seed.json',
      'utf8',
    ),
  );
  seed.wiki_spaces = [
    'team',
    'person',
    'team',
    'my_library',
    'my_library_resigned',
  ].map((space_type, i) => ({
    space_id: String(i + 1),
    name: 'Space ' + i,
    description: 'Description ' + i,
    space_type,
    visibility: 'private',
    open_sharing: 'closed',
  }));
  const first = await startMock(seed),
    second = await startMock(seed);
  const cli = async (backend: typeof first, ...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          ['wiki', ...args, '--format', 'json'],
          { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
        )
      ).stdout,
    ).data;
  try {
    const one = await cli(first, 'spaces', 'list', '--page-size', '2');
    assert.deepEqual(
      one.items.map((x: any) => x.space_id),
      ['1', '2'],
    );
    assert.equal(one.has_more, true);
    const two = await cli(
      first,
      'spaces',
      'list',
      '--page-size',
      '2',
      '--page-token',
      one.page_token,
    );
    assert.deepEqual(
      two.items.map((x: any) => x.space_id),
      ['3'],
    );
    assert.equal(two.has_more, false);
    assert.equal(two.page_token, undefined);
    const all = await cli(
      first,
      '+space-list',
      '--page-size',
      '1',
      '--page-all',
    );
    assert.deepEqual(
      all.spaces.map((x: any) => x.space_id),
      ['1', '2', '3'],
    );
    const retired = await cli(
      first,
      'spaces',
      'list',
      '--space-type',
      'my_library_resigned',
    );
    assert.deepEqual(
      retired.items.map((x: any) => x.space_id),
      ['5'],
    );
    const detail = await cli(first, 'spaces', 'get', '--space-id', '1');
    assert.deepEqual(detail.space, one.items[0]);
    const library = await cli(
      first,
      'spaces',
      'get',
      '--space-id',
      'my_library',
    );
    assert.equal(library.space.space_id, '4');
    first.world.wiki_spaces![0].name = 'Updated title';
    assert.equal(
      (await cli(first, 'spaces', 'get', '--space-id', '1')).space.name,
      'Updated title',
    );
    assert.equal(
      (await cli(first, '+space-list')).spaces[0].name,
      'Updated title',
    );
    assert.equal((await cli(second, '+space-list')).spaces[0].name, 'Space 0');
    await assert.rejects(
      cli(first, 'spaces', 'get', '--space-id', 'unknown'),
      /not found/,
    );
    for (const query of [
      'page_size=51',
      'page_size=0',
      'page_token=-1',
      'page_token=bad',
    ])
      assert.equal(
        (await request(first.url + '/open-apis/wiki/v2/spaces?' + query))
          .status,
        400,
      );
    assert.equal(
      (
        await request(
          first.url + '/open-apis/wiki/v2/spaces?space_type=unknown',
        )
      ).status,
      501,
    );
    assert.equal(
      (await request(first.url + '/open-apis/wiki/v2/spaces/1?lang=zh')).status,
      501,
    );
    assert.equal(
      (await request(first.url + '/open-apis/wiki/v2/spaces/1/nodes')).status,
      501,
    );
    assert.ok(first.calls.every((c) => !c.changed));
    const empty = await startMock({ ...seed, wiki_spaces: undefined });
    try {
      const list = await cli(empty, '+space-list');
      assert.deepEqual(list.spaces, []);
      assert.equal(empty.calls.filter((c) => c.status === 501).length, 0);
    } finally {
      await empty.close();
    }
  } finally {
    await first.close();
    await second.close();
  }
});
