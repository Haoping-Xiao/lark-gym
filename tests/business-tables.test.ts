import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('business tables scope reads, writes and deletes to the entity without duplicating state', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const backend = await startMock(seed);
  const tickets = seed.base.tables.find(
    (table: { collection: string }) => table.collection === 'tickets',
  );
  const lookup = seed.base.tables.find(
    (table: { collection: string }) => table.collection === 'lookup_users',
  );
  const request = async (
    table: string,
    suffix: string,
    method = 'GET',
    body?: unknown,
  ) => {
    const response = await fetch(
      `${backend.url}/open-apis/base/v3/bases/base_crm/tables/${table}${suffix}`,
      {
        method,
        headers: {
          authorization: 'Bearer local-evaluation-only',
          'content-type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal(
      (
        await request(lookup.table_id, '/records', 'POST', {
          name: 'Unauthorized member',
        })
      ).status,
      403,
    );
    assert.deepEqual(backend.world, seed);
    const empty = await request(tickets.table_id, '/records');
    assert.deepEqual(empty.body.data.record_id_list, []);
    assert.ok(!empty.body.data.fields.includes('collection'));
    const create = await request(tickets.table_id, '/records', 'POST', {
      subject: 'Invoice',
      description: 'Two charges',
    });
    assert.equal(create.status, 200);
    const id = create.body.data.record_id;
    assert.equal(
      backend.world.base.records.find((record) => record.record_id === id)
        ?.fields.collection,
      'tickets',
    );
    assert.equal(
      (
        await request(lookup.table_id, '/records/batch_get', 'POST', {
          record_id_list: [id],
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(tickets.table_id, '/records/batch_get', 'POST', {
          record_id_list: [id],
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(tickets.table_id, '/records/batch_delete', 'POST', {
          record_id_list: [id],
        })
      ).status,
      200,
    );
    assert.deepEqual(backend.world, seed);
  } finally {
    await backend.close();
  }
});
