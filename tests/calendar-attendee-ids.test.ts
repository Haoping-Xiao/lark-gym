import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI attendee IDs remain distinct after deletion; create returns complete list; failures roll back', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-hr-5059/environment/seed.json',
      'utf8',
    ),
  );
  const b = await startMock(seed);
  try {
    const cli = async (args: string[]) =>
      exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
        env: { ...process.env, FEISHU_MOCK_URL: b.url },
      });
    await cli([
      'calendar',
      'events',
      'create',
      '--calendar-id',
      'primary',
      '--data',
      JSON.stringify({
        summary: 'Attendee consistency',
        start_time: { timestamp: '1774346400' },
        end_time: { timestamp: '1774350000' },
      }),
    ]);
    const call = async (action: string, data: object) =>
      cli([
        'calendar',
        'event.attendees',
        action,
        '--calendar-id',
        'primary',
        '--event-id',
        'evt_1',
        '--data',
        JSON.stringify(data),
      ]);
    const person = (email: string) => ({
      type: 'third_party',
      third_party_email: email,
    });
    await call('create', {
      attendees: [person('a@example.com'), person('b@example.com')],
    });
    const first = structuredClone(b.world.events[0].attendees!);
    await call('batch_delete', { attendee_ids: [first[0].attendee_id] });
    await call('create', { attendees: [person('c@example.com')] });
    const current = b.world.events[0].attendees as {
      attendee_id: string;
      third_party_email: string;
    }[];
    assert.equal(new Set(current.map((a) => a.attendee_id)).size, 2);
    const response = b.calls.at(-1)!.response as {
      data: { attendees: unknown[] };
    };
    assert.deepEqual(response.data.attendees, current);
    const added = current.find((a) => a.third_party_email === 'c@example.com')!;
    await call('batch_delete', { attendee_ids: [added.attendee_id] });
    assert.deepEqual(b.world.events[0].attendees, [first[1]]);
    await call('create', { attendees: [person('b@example.com')] });
    assert.deepEqual(b.world.events[0].attendees, [first[1]]);
    for (const bad of [
      { type: 'user', user_id: 'unsupported' },
      person('invalid'),
    ]) {
      const before = structuredClone(b.world);
      await assert.rejects(
        call('create', { attendees: [person('d@example.com'), bad] }),
      );
      assert.deepEqual(b.world, before);
      assert.equal(b.calls.at(-1)!.changed, false);
    }
  } finally {
    await b.close();
  }
});
