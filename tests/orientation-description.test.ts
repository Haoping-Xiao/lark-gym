import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('orientation: description semantics defer without relaxing title/time/attendees', async () => {
  const root = 'tasks/automationbench-hr-5059';
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'orientation-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    for (const mode of [
      'decimal',
      'unit-first',
      'missing',
      'wrong-duration',
      'wrong-time',
      'wrong-title',
      'wrong-attendees',
    ]) {
      const world = structuredClone(backend.world),
        event = world.events[0];
      event.description =
        mode === 'unit-first'
          ? '2026-03-24 | 10:00 UTC | Duration (hour): 1'
          : '2026-03-24 | 10:00 UTC | 1.0 hours';
      if (mode === 'missing') delete event.description;
      if (mode === 'wrong-duration')
        event.description = '2026-03-24 | 10:00 UTC | 3 hours';
      if (mode === 'wrong-time')
        event.end_time.timestamp = String(+event.end_time.timestamp! + 3600);
      if (mode === 'wrong-title') event.summary = 'Other';
      if (mode === 'wrong-attendees') event.attendees = [];
      const state = join(dir, mode + '.json'),
        output = join(dir, mode);
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
      assert.equal(
        result.business_success,
        !['wrong-time', 'wrong-title', 'wrong-attendees'].includes(mode),
        mode,
      );
      assert.ok(
        result.semantic.deferred.includes(
          'events.required_description_business_facts',
        ),
      );
      assert.equal(result.semantic.required, true);
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
