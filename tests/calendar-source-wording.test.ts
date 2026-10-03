import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [5010, 5075, 1206, 1219])
  test(`calendar ${id}: source identity remains strict without reference wording`, async () => {
    const root = `tasks/automationbench-${id >= 5000 ? 'hr' : 'operations'}-${id}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'event-wording-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of [
        'equivalent',
        'false-event',
        'wrong-time',
        'wrong-name',
        ...(id === 1206 ? ['missing-hvac'] : []),
      ]) {
        const world = structuredClone(backend.world),
          old = new Set(seed.events.map((e: any) => e.event_id));
        for (const e of world.events.filter((e: any) => !old.has(e.event_id))) {
          if (id >= 5000)
            e.summary =
              e.summary.split(' - ')[1] +
              (id === 5010 ? ' 终面' : ' Welcome back');
          delete e.description;
          if (mode === 'wrong-time') {
            e.start_time.timestamp = String(
              Number(e.start_time.timestamp) + 3600,
            );
            e.end_time.timestamp = String(Number(e.end_time.timestamp) + 3600);
          }
          if (mode === 'false-event') e.description = '本事项已执行完毕。';
          if (mode === 'wrong-name') e.summary = 'Other event';
        }
        if (id === 1206)
          for (const rec of world.base.records.filter(
            (r: any) => r.fields.collection === 'maintenance_comments',
          ))
            rec.fields.commentText =
              mode === 'missing-hvac'
                ? '已安排仓库暖通维护，2026-02-12 22:00–23:00 UTC。'
                : '已安排仓库主 HVAC 维护，2026-02-12 22:00–23:00 UTC。';
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
          ['equivalent', 'false-event'].includes(mode),
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
