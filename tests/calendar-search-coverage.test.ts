import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);

test('real CLI calendar search reports coverage before resource or write authorization checks', async () => {
  const original = JSON.parse(
    await readFile(
      'tasks/automationbench-sales-1172/environment/seed.json',
      'utf8',
    ),
  );
  for (const role of ['owner', 'reader', 'absent']) {
    const seed = structuredClone(original);
    seed.calendars =
      role === 'absent'
        ? []
        : [{ calendar_id: 'primary', summary: 'Calendar', role }];
    const backend = await startMock(seed);
    try {
      const before = structuredClone(backend.world);
      await assert.rejects(
        exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [
            'calendar',
            '+search-event',
            '--calendar-id',
            'primary',
            '--query',
            'Weekly',
            '--format',
            'json',
          ],
          { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
        ),
      );
      const search = backend.calls.find((call) =>
        call.path.includes('/events/search_event'),
      );
      assert.ok(search);
      assert.equal(search.status, 501);
      assert.equal(search.changed, false);
      assert.deepEqual(backend.world, before);
      const missing = await fetch(
        backend.url +
          '/open-apis/calendar/v4/calendars/primary/events/nonexistent',
        { headers: { Authorization: 'Bearer local-evaluation-only' } },
      );
      assert.equal(missing.status, 404);
      assert.deepEqual(backend.world, before);
    } finally {
      await backend.close();
    }
  }
});
