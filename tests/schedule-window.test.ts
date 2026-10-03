import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Scheduling windows: validate timestamps before handing date and period meaning to the judge', async () => {
  const root = 'tasks/automationbench-simple-3051',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'schedule-window-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    const original = structuredClone(backend.world);
    const variants: [string, any, boolean][] = [
      ['alternative', '2026-02-25T10:30:00.000+00:00', true],
      ['offset', '2026-02-25T12:30:00+02:00', true],
      ['wrong-day-needs-judge', '2026-03-04T10:30:00Z', true],
      ['wrong-period-needs-judge', '2026-02-25T21:00:00Z', true],
      ['bad-date', '2026-02-30T09:00:00Z', false],
      ['bad-clock', '2026-02-25T25:00:00Z', false],
      ['bad-zone', '2026-02-25T09:00:00+25:00', false],
      ['floating', '2026-02-25T09:00:00', false],
      ['empty', '', false],
      ['number', 1772010000, false],
      ['missing', null, false],
    ];
    for (const [name, value, valid] of variants) {
      const world = structuredClone(original),
        record = world.base.records.find(
          (r: any) => r.fields.collection === 'posts',
        )!;
      record.fields.scheduled_at = value;
      const state = join(dir, name + '.json'),
        output = join(dir, name);
      await writeFile(
        state,
        JSON.stringify({ seed, world, calls: backend.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
      });
      const result = JSON.parse(
        await readFile(join(output, 'result.json'), 'utf8'),
      );
      assert.equal(result.business_success, valid, name);
      assert.equal(result.semantic.required, true, name);
      assert.ok(
        result.semantic.deferred.includes('creates.schedule_window'),
        name,
      );
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
