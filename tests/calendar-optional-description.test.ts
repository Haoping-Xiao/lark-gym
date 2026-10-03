import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const names = [
  'hr-5094',
  'hr-5108',
  'operations-1236',
  'operations-1249',
  'operations-1251',
  'operations-1255',
  'operations-1263',
  'operations-1270',
  'operations-1273',
  'operations-1277',
  'operations-1280',
  'sales-1148',
  'sales-601',
  'sales-604',
  'support-1412',
];
for (const name of names)
  test(`${name}: optional calendar descriptions retain scheduling and semantic checks`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'optional-event-description-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of [
        'no-description',
        'wrong-time',
        'wrong-attendee',
        'false-description',
      ]) {
        const world = structuredClone(backend.world),
          old = new Set(seed.events.map((e: any) => e.event_id));
        for (const e of world.events.filter((e: any) => !old.has(e.event_id))) {
          delete e.description;
          if (mode === 'wrong-time') {
            e.start_time.timestamp = String(
              Number(e.start_time.timestamp) + 3600,
            );
            e.end_time.timestamp = String(Number(e.end_time.timestamp) + 3600);
          }
          if (mode === 'wrong-attendee')
            e.attendees = [{ third_party_email: 'wrong@example.com' }];
          if (mode === 'false-description')
            e.description = '本次活动已全部完成。';
        }
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
          ['no-description', 'false-description'].includes(mode),
          mode,
        );
        assert.ok(
          result.semantic.deferred.includes(
            'events.business_purpose_and_optional_description',
          ),
        );
        assert.equal(result.semantic.required, true);
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
