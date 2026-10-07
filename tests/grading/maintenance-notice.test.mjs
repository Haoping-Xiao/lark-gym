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
test('real CLI reference trajectory passes and a fresh run cannot inherit state', async () => {
  const a = await startMock(seed),
    b = await startMock(seed);
  try {
    await oracle((args) => cli(a, args));
    assert.equal(verify(seed, a.world, a.calls).status, 'pass');
    assert.equal(verify(seed, b.world, b.calls).status, 'fail');
    assert.deepEqual(b.world, seed);
    assert.ok(a.calls.some((c) => c.path === path && c.method === 'POST'));
  } finally {
    await a.close();
    await b.close();
  }
});
test('verifier rejects wrong-window creation even if subsequently cancelled', async () => {
  const m = await startMock(seed);
  try {
    await oracle((args) => cli(m, args));
    const wrong = await api(m, 'POST', path, {
      ...event,
      start_time: {
        timestamp: String(Date.parse('2026-02-20T02:00:00Z') / 1000),
      },
      end_time: {
        timestamp: String(Date.parse('2026-02-20T04:00:00Z') / 1000),
      },
    });
    await api(m, 'DELETE', `${path}/${wrong.data.event.event_id}`);
    const v = verify(seed, m.world, m.calls);
    assert.equal(v.status, 'fail');
    assert.equal(v.checks.no_forbidden_window_ever_created, false);
  } finally {
    await m.close();
  }
});
test('verifier detects corrupt notification, collateral record mutation and missing policy read', async () => {
  const m = await startMock(seed);
  try {
    await oracle((args) => cli(m, args));
    m.world.messages[0].body.content = JSON.stringify({
      text: 'Data Closet tomorrow',
    });
    m.world.base.records.find(
      (r) => r.record_id === 'rec_other',
    ).fields.System = 'Changed';
    const calls = m.calls.filter(
      (c) => !JSON.stringify(c.body).includes('ws_maint_policy'),
    );
    const v = verify(seed, m.world, calls);
    assert.equal(v.checks.exactly_one_correct_notification, false);
    assert.equal(v.checks.unrelated_records_unchanged, false);
    assert.equal(v.checks.read_all_policy_before_write, false);
  } finally {
    await m.close();
  }
});
test('maintenance accepts a localized event title and target-only plan reads', async () => {
  const mock = await startMock(seed);
  try {
    await oracle(async (args) => {
      if (args.includes('ws_plan') && args.includes('--range')) {
        for (const range of ['A1:E4', 'A6:E7']) {
          const scoped = [...args];
          scoped[scoped.indexOf('--range') + 1] = range;
          await cli(mock, scoped);
        }
        return { stdout: '', stderr: '' };
      }
      if (args[0] === 'calendar' && args[2] === 'create') {
        const localized = [...args];
        const dataAt = localized.indexOf('--data') + 1;
        const event = JSON.parse(localized[dataAt]);
        event.summary = '机房断电维护';
        event.description = 'Data Closet';
        localized[dataAt] = JSON.stringify(event);
        return cli(mock, localized);
      }
      return cli(mock, args);
    });
    assert.equal(verify(seed, mock.world, mock.calls).status, 'pass');
    mock.world.events.find(
      (e) => !seed.events.some((s) => s.event_id === e.event_id),
    ).description = '';
    assert.equal(verify(seed, mock.world, mock.calls).status, 'fail');
  } finally {
    await mock.close();
  }
});
