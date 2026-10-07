import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
import { verify } from '../../tasks/maintenance-notice/tests/verify.ts';
import { oracle } from '../../tasks/maintenance-notice/solution/oracle.ts';
const seed = JSON.parse(
  await readFile(
    new URL(
      '../../tasks/maintenance-notice/environment/seed.json',
      import.meta.url,
    ),
  ),
);
const binary = new URL('../../gyms/lark-cli/bin/lark-cli', import.meta.url)
  .pathname;
const event = {
  summary: 'Data Closet',
  start_time: { timestamp: String(Date.parse('2026-02-22T02:00:00Z') / 1000) },
  end_time: { timestamp: String(Date.parse('2026-02-22T04:00:00Z') / 1000) },
};
const path = '/open-apis/calendar/v4/calendars/cal_ops/events';
async function api(mock, method, path, body) {
  const r = await fetch(mock.url + path, {
    method,
    headers: {
      authorization: 'Bearer local-evaluation-only',
      'content-type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, ...(await r.json()) };
}
async function cli(mock, args) {
  return promisify(execFile)(binary, args, {
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      FEISHU_MOCK_URL: mock.url,
    },
    timeout: 30000,
  });
}
test('shared state survives alternate typed/raw query paths and supports pagination', async () => {
  const m = await startMock(seed);
  try {
    await cli(m, [
      'calendar',
      'events',
      'create',
      '--calendar-id',
      'cal_ops',
      '--data',
      JSON.stringify(event),
    ]);
    const first = await api(m, 'GET', path + '?page_size=1');
    assert.equal(first.data.items.length, 1);
    assert.equal(first.data.has_more, true);
    const second = await api(
      m,
      'GET',
      path + '?page_size=1&page_token=' + first.data.page_token,
    );
    assert.equal(second.data.items[0].summary, 'Data Closet');
    const id = second.data.items[0].event_id;
    await cli(m, [
      'calendar',
      'events',
      'patch',
      '--calendar-id',
      'cal_ops',
      '--event-id',
      id,
      '--data',
      '{"summary":"Updated"}',
    ]);
    const { stdout } = await cli(m, [
      'calendar',
      'events',
      'get',
      '--calendar-id',
      'cal_ops',
      '--event-id',
      id,
    ]);
    assert.match(stdout, /Updated/);
    await api(m, 'DELETE', `${path}/${id}`);
    assert.equal((await api(m, 'GET', path)).data.items.length, 1);
    assert.equal(
      (await api(m, 'GET', `${path}/${id}`)).data.event.status,
      'cancelled',
    );
  } finally {
    await m.close();
  }
});
test('denied and invalid writes are atomic; unknown endpoints are coverage gaps', async () => {
  const m = await startMock(seed);
  try {
    assert.equal(
      (await api(m, 'POST', path.replace('cal_ops', 'cal_readonly'), event))
        .status,
      403,
    );
    assert.equal(
      (await api(m, 'POST', path, { ...event, end_time: { timestamp: '0' } }))
        .status,
      400,
    );
    assert.deepEqual(m.world, seed);
    assert.equal(
      (await api(m, 'GET', '/open-apis/not-implemented')).status,
      501,
    );
    assert.equal(verify(seed, m.world, m.calls).status, 'fail');
  } finally {
    await m.close();
  }
});
test('CLI dry-run never changes business state; missing mock URL fails closed', async () => {
  const m = await startMock(seed);
  try {
    await cli(m, [
      'calendar',
      'events',
      'create',
      '--calendar-id',
      'cal_ops',
      '--data',
      JSON.stringify(event),
      '--dry-run',
    ]);
    assert.deepEqual(m.world, seed);
    await assert.rejects(
      promisify(execFile)(binary, ['--help'], {
        env: { PATH: process.env.PATH },
      }),
      /FEISHU_MOCK_URL/,
    );
  } finally {
    await m.close();
  }
});
test('domain shortcuts read back the same backend state and raw api is denied', async () => {
  const m = await startMock(seed);
  try {
    await oracle((args) => cli(m, args));
    const { stdout } = await cli(m, [
      'base',
      '+record-get',
      '--base-token',
      'base_ops',
      '--table-id',
      'tbl_maintenance',
      '--record-id',
      'rec_200',
    ]);
    assert.match(stdout, /2026-02-22T02:00:00Z/);
    await assert.rejects(cli(m, ['api', 'GET', path]), /raw api disabled/);
  } finally {
    await m.close();
  }
});

test('agenda reads shared events and reserved endpoints cannot masquerade as missing IDs', async () => {
  const m = await startMock(seed);
  try {
    await cli(m, [
      'calendar',
      'events',
      'create',
      '--calendar-id',
      'cal_ops',
      '--data',
      JSON.stringify(event),
    ]);
    const result = await cli(m, [
      'calendar',
      '+agenda',
      '--calendar-id',
      'cal_ops',
      '--start',
      '2026-02-22T00:00:00Z',
      '--end',
      '2026-02-23T00:00:00Z',
    ]);
    assert.match(result.stdout, /Data Closet/);
    assert.ok(
      m.calls.some(
        (c) => c.path.includes('/events/instance_view?') && c.status === 200,
      ),
    );
    const unsupported = await api(m, 'POST', path + '/search', {});
    assert.equal(unsupported.status, 501);
    assert.equal(verify(seed, m.world, m.calls).status, 'fail');
  } finally {
    await m.close();
  }
});
