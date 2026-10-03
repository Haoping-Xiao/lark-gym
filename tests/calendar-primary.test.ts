import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI primary calendar lookup is a read, shared with list/detail and isolated by run', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-hr-5059/environment/seed.json',
      'utf8',
    ),
  );
  const one = await startMock({
    ...seed,
    calendars: [
      { calendar_id: 'primary', summary: 'First', role: 'reader' },
      { calendar_id: 'other', summary: 'Other', role: 'owner' },
    ],
  });
  const two = await startMock({
    ...seed,
    calendars: [{ calendar_id: 'primary', summary: 'Second', role: 'owner' }],
  });
  try {
    for (const backend of [one, two]) {
      const before = structuredClone(backend.world);
      await exec(
        resolve('gyms/lark-cli/bin/lark-cli'),
        ['calendar', 'calendars', 'primary', '--format', 'json'],
        { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
      );
      const call = backend.calls.find(
        (c) =>
          c.method === 'POST' &&
          c.path === '/open-apis/calendar/v4/calendars/primary',
      );
      assert.ok(call);
      assert.equal(call.status, 200);
      assert.deepEqual(
        (call.response as { data: { calendars: unknown[] } }).data.calendars,
        [{ calendar: before.calendars[0] }],
      );
      assert.equal(call.changed, false);
      const headers = { Authorization: 'Bearer local-evaluation-only' };
      const detail = await (
        await fetch(backend.url + '/open-apis/calendar/v4/calendars/primary', {
          headers,
        })
      ).json();
      assert.deepEqual(detail.data.calendar, before.calendars[0]);
      const list = await (
        await fetch(backend.url + '/open-apis/calendar/v4/calendars', {
          headers,
        })
      ).json();
      assert.deepEqual(list.data.calendar_list, before.calendars);
      const unsupported = await fetch(
        backend.url +
          '/open-apis/calendar/v4/calendars/primary?op_user_id=someone_else',
        { method: 'POST', headers },
      );
      assert.equal(unsupported.status, 501);
      assert.deepEqual(backend.world, before);
    }
  } finally {
    await one.close();
    await two.close();
  }
});
