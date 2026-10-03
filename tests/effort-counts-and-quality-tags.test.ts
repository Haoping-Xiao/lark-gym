import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const name of ['support-1573', 'support-1489'])
  test(`${name}: result representation keeps exact counts and tag membership`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'typed-results-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const modes =
        name === 'support-1573'
          ? ['equivalent', 'wrong-count', 'fraction', 'malformed']
          : ['equivalent', 'missing-existing', 'duplicate', 'wrong-tag'];
      for (const mode of modes) {
        const world = structuredClone(backend.world);
        if (name === 'support-1573') {
          const rows = world.spreadsheets!.ss_effort.sheets.ws_scores.values;
          for (const row of rows.slice(1)) {
            row[1] = Number(row[1]);
            row[2] = Number(row[2]);
          }
          rows[1][1] =
            mode === 'wrong-count'
              ? 5
              : mode === 'fraction'
                ? 4.1
                : mode === 'malformed'
                  ? '4x'
                  : 4;
        } else {
          const record = world.base.records.find(
              (r) => r.record_id === 'rec_zendesk_tkt_q01',
            )!,
            tags = JSON.parse(String(record.fields.tags)).reverse();
          if (mode === 'missing-existing')
            tags.splice(tags.indexOf('server'), 1);
          if (mode === 'duplicate') tags.push(tags[0]);
          if (mode === 'wrong-tag') tags[0] = 'WRONG';
          record.fields.tags = JSON.stringify(tags, null, 2);
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
        const r = JSON.parse(
          await readFile(join(output, 'result.json'), 'utf8'),
        );
        assert.equal(r.business_success, mode === 'equivalent', mode);
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
