import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import { once } from 'node:events';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import type { ApiCall, World } from '../gyms/lark-cli/src/types.ts';
import { createState } from '../gyms/lark-cli/src/mock/state.ts';
import type { ResponseData } from '../gyms/lark-cli/src/mock/types.ts';

const seed: World = JSON.parse(
  await readFile('tasks/maintenance-notice/environment/seed.json', 'utf8'),
);
const headers = {
  authorization: 'Bearer local-evaluation-only',
  'content-type': 'application/json',
};

test('Async operations and invalid response data are rejected, rolled back and audited', async () => {
  const snapshots: ApiCall[][] = [];
  const state = createState(seed, (_world, calls) =>
    snapshots.push(structuredClone(calls)),
  );
  const request = { method: 'POST', path: '/test-operation', body: {} };
  let asyncInvoked = false;
  let thenInvoked = false;
  const invalidOperations: (() => unknown)[] = [
    async () => {
      asyncInvoked = true;
      return {};
    },
    () => {
      state.world.now = 'changed';
      return Promise.resolve({ ok: true });
    },
    () => {
      state.world.now = 'changed';
      return Promise.reject(new Error('Async failure'));
    },
    () => {
      state.world.now = 'changed';
      return {
        then() {
          thenInvoked = true;
        },
      };
    },
    () => {
      state.world.now = 'changed';
      return { uncloneable() {} };
    },
  ];
  for (const operation of invalidOperations) {
    // Deliberately bypass the compile-time contract to verify runtime defense.
    const result = state.execute(request, operation as () => ResponseData);
    assert.equal(result.status, 500);
    assert.equal(result.response.code, 990002);
    assert.deepEqual(state.world, seed);
    const call = state.calls.at(-1)!;
    assert.equal(call.changed, false);
    assert.deepEqual(call.mutations, []);
    assert.deepEqual(call.response, result.response);
  }
  assert.equal(asyncInvoked, false);
  assert.equal(thenInvoked, false);
  assert.equal(state.calls.length, invalidOperations.length);
  assert.equal(snapshots.length, invalidOperations.length);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.world, seed);
  assert.equal(state.execute(request, () => ({ ok: true })).status, 200);
});

test('A partially invalid batch rolls back, is audited, and leaves all routes using the live world', async (t) => {
  const snapshots: { world: World; calls: ApiCall[] }[] = [];
  const backend = await startMock(seed, {
    onSnapshot: (world, calls) =>
      snapshots.push(structuredClone({ world, calls })),
  });
  t.after(() => backend.close());
  const originalWorld = backend.world;
  const base = '/open-apis/base/v3/bases/base_ops/tables/tbl_maintenance';
  const failed = await fetch(backend.url + base + '/records/batch_update', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      update_records: {
        rec_200: { System: 'Temporary change' },
        rec_other: { nonexistent_field: 'Invalid' },
      },
    }),
  });
  assert.equal(failed.status, 400);
  await failed.json();
  assert.equal(backend.world, originalWorld);
  assert.deepEqual(backend.world, seed);
  assert.equal(backend.calls[0].changed, false);
  assert.deepEqual(backend.calls[0].mutations, []);
  assert.deepEqual(snapshots[0].world, seed);

  const write = await fetch(backend.url + base + '/records/rec_200', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ System: 'Committed change' }),
  });
  assert.equal(write.status, 200);
  await write.json();
  const read = await fetch(
    backend.url +
      '/open-apis/bitable/v1/apps/base_ops/tables/tbl_maintenance/records/rec_200',
    { headers },
  );
  const body = await read.json();
  assert.equal(body.data.record.fields.System, 'Committed change');
  assert.deepEqual(
    backend.calls.map((call) => call.changed),
    [false, true, false],
  );
  assert.equal(backend.calls[1].mutations[0].id, 'rec_200');
  assert.equal(snapshots.length, 3);
  assert.deepEqual(snapshots[0].world, seed, 'Older snapshots must not change');
});

test(
  'An unfinished malformed request cannot undo or take credit for another request',
  { timeout: 15000 },
  async (t) => {
    const backend = await startMock(seed);
    const path = '/open-apis/calendar/v4/calendars/cal_ops/events';
    const pending = request(backend.url + path, {
      method: 'POST',
      headers: { ...headers, expect: '100-continue' },
    });
    t.after(async () => {
      pending.destroy();
      await backend.close();
    });
    const continued = once(pending, 'continue');
    const pendingResponse = once(pending, 'response');
    pending.flushHeaders();
    await continued;
    pending.write('{');

    const created = await fetch(backend.url + path, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        summary: 'Concurrent write',
        start_time: { timestamp: '1771725600' },
        end_time: { timestamp: '1771732800' },
      }),
    });
    assert.equal(created.status, 200);
    const { data } = await created.json();

    pending.end('invalid');
    const [response] = await pendingResponse;
    assert.equal(response.statusCode, 400);
    for await (const _ of response) {
      /* drain the response */
    }

    assert.ok(
      backend.world.events.some(
        (event) => event.event_id === data.event.event_id,
      ),
    );
    assert.equal(backend.calls.length, 2);
    assert.deepEqual(
      backend.calls.map((call) => call.changed),
      [true, false],
    );
    assert.deepEqual(backend.calls[1].mutations, []);
  },
);
