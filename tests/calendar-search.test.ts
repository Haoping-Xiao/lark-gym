import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const cli = (b: any, args: string[]) =>
  exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
    env: { ...process.env, FEISHU_MOCK_URL: b.url },
    maxBuffer: 8e6,
  });
test('calendar search sees shared create patch cancellation, explicit primary alias and independent state', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3196/environment/seed.json',
      'utf8',
    ),
  );
  seed.calendars = [
    {
      calendar_id: 'cal_primary',
      type: 'primary',
      summary: 'Work',
      role: 'owner',
    },
  ];
  seed.events = [];
  const a = await startMock(seed),
    b = await startMock(seed);
  const search = [
    'calendar',
    '+search-event',
    '--query',
    'demo',
    '--start',
    '2026-02-28T00:00:00Z',
    '--end',
    '2026-03-01T00:00:00Z',
    '--page-size',
    '1',
  ];
  const items = () => {
    const call = a.calls
      .filter((c: any) => c.path.includes('search_event'))
      .at(-1)!;
    assert.equal(call.changed, false);
    return (call.response as any).data;
  };
  try {
    for (const name of ['Product demo', 'Another demo'])
      await cli(a, [
        'calendar',
        'events',
        'create',
        '--calendar-id',
        'primary',
        '--data',
        JSON.stringify({
          summary: name,
          start_time: { timestamp: '1772290800' },
          end_time: { timestamp: '1772292600' },
        }),
      ]);
    assert.equal(a.world.events.length, 2);
    assert.equal(a.world.events[0].calendar_id, 'cal_primary');
    await cli(a, search);
    let d = items();
    assert.equal(d.items.length, 1);
    assert.equal(d.items[0].meta_data.event_id, 'evt_1');
    assert.equal(
      d.items[0].meta_data.start.date_time,
      '2026-02-28T15:00:00.000Z',
    );
    assert.equal(d.has_more, true);
    await cli(a, [...search, '--page-token', d.page_token]);
    assert.equal(items().items[0].meta_data.event_id, 'evt_2');
    await cli(b, search);
    assert.equal((b.calls.at(-1)!.response as any).data.items.length, 0);
    await cli(a, [
      'calendar',
      'events',
      'patch',
      '--calendar-id',
      'primary',
      '--event-id',
      'evt_1',
      '--data',
      '{"summary":"Changed meeting"}',
    ]);
    await cli(a, search);
    assert.equal(items().items[0].meta_data.event_id, 'evt_2');
    await cli(a, [
      'calendar',
      'events',
      'delete',
      '--calendar-id',
      'primary',
      '--event-id',
      'evt_2',
    ]);
    await cli(a, search);
    assert.equal(items().items.length, 0);
    await cli(a, [
      'calendar',
      '+search-event',
      '--query',
      'Changed',
      '--start',
      '2026-02-28T00:00:00Z',
      '--end',
      '2026-03-01T00:00:00Z',
    ]);
    assert.equal(items().items.length, 1);
    await cli(a, ['calendar', 'calendars', 'primary']);
    assert.equal(
      (a.calls.at(-1)!.response as any).data.calendars[0].calendar.calendar_id,
      'cal_primary',
    );
  } finally {
    await a.close();
    await b.close();
  }
});
test('calendar search is read-only for readers and rejects unsupported filters or recurrence without changes', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3196/environment/seed.json',
      'utf8',
    ),
  );
  seed.calendars = [
    { calendar_id: 'primary', role: 'reader', summary: 'Read' },
  ];
  seed.events = [];
  const a = await startMock(seed);
  try {
    const before = structuredClone(a.world);
    await cli(a, ['calendar', '+search-event', '--query', 'demo']);
    assert.equal(a.calls.at(-1)!.status, 200);
    assert.deepEqual(a.world, before);
    await assert.rejects(
      cli(a, [
        'calendar',
        '+search-event',
        '--query',
        'demo',
        '--attendee-ids',
        'ou_unknown',
      ]),
    );
    assert.equal(a.calls.at(-1)!.status, 501);
    assert.deepEqual(a.world, before);
    a.world.events.push({
      event_id: 'evt_seed',
      calendar_id: 'primary',
      summary: 'demo',
      start_time: { timestamp: '1772290800' },
      end_time: { timestamp: '1772292600' },
      recurrence: 'FREQ=DAILY',
    });
    const recurring = structuredClone(a.world);
    await assert.rejects(
      cli(a, ['calendar', '+search-event', '--query', 'demo']),
    );
    assert.equal(a.calls.at(-1)!.status, 501);
    assert.deepEqual(a.world, recurring);
  } finally {
    await a.close();
  }
});
