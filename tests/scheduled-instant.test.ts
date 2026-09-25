import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('marketing 1061: same scheduled instant passes; different or invalid times fail', async () => {
  const root = 'tasks/automationbench-marketing-1061';
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'scheduled-instant-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    const original = structuredClone(backend.world);
    let world = structuredClone(original);
    const rows = () =>
      world.base.records.filter(
        (r) =>
          r.fields.collection === 'buffer_posts' &&
          !seed.base.records.some((old: any) => old.record_id === r.record_id),
      );
    assert.equal(rows().length, 5);
    const verify = async (name: string) => {
      const file = join(dir, `${name}.json`),
        output = join(dir, name);
      await writeFile(
        file,
        JSON.stringify({ seed, world, calls: backend.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: file, VERIFIER_OUTPUT: output },
      });
      return JSON.parse(await readFile(join(output, 'result.json'), 'utf8'));
    };
    for (const mode of ['milliseconds', 'offset', 'microseconds']) {
      world = structuredClone(original);
      for (const row of rows())
        row.fields.scheduled_at = String(row.fields.scheduled_at).replace(
          'T09:00:00Z',
          mode === 'milliseconds'
            ? 'T09:00:00.000+00:00'
            : mode === 'microseconds'
              ? 'T09:00:00.000000Z'
              : 'T11:00:00+02:00',
        );
      assert.equal((await verify(mode)).business_success, true);
    }
    for (const [name, value] of [
      ['hour', '2026-01-28T10:00:00Z'],
      ['fraction', '2026-01-28T09:00:00.001Z'],
      ['submillisecond', '2026-01-28T09:00:00.0000001Z'],
      ['floating', '2026-01-28T09:00:00'],
      ['overflow-day', '2025-12-59T09:00:00Z'],
      ['overflow-hour', '2026-01-27T33:00:00Z'],
      ['invalid-zone', '2026-01-28T09:00:00+24:00'],
      ['wrong-type', 1769590800],
    ]) {
      world = structuredClone(original);
      rows()[0].fields.scheduled_at = value;
      assert.equal(
        (await verify(String(name))).business_success,
        false,
        String(name),
      );
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
