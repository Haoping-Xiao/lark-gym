import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [4023, 4041])
  test(`finance ${id}: exact business alternatives preserve formatting and identity constraints`, async () => {
    const root = `tasks/automationbench-finance-${id}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'finance-alternatives-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const original = structuredClone(backend.world);
      const modes =
        id === 4023
          ? [
              'cents',
              'dollar',
              'fraction',
              'trailing-zero',
              'no-group',
              'numeric',
              'wrong-cent',
              'wrong-contract',
            ]
          : ['source', 'master', 'invented', 'wrong-id', 'wrong-case'];
      for (const mode of modes) {
        const world = structuredClone(original);
        let success = false;
        if (id === 4023) {
          const rows = world.spreadsheets!.ss_revrec.sheets.ws_schedule.values;
          rows[1][2] =
            mode === 'dollar'
              ? '$10,000.00'
              : mode === 'fraction'
                ? '10,000.0'
                : mode === 'trailing-zero'
                  ? '10,000.0000'
                  : mode === 'no-group'
                    ? '10000.00'
                    : mode === 'numeric'
                      ? 10000
                      : mode === 'wrong-cent'
                        ? '10,000.01'
                        : '10,000.00';
          rows[2][2] = '6,000.00';
          if (mode === 'wrong-contract') rows[1][0] = 'CTR-002';
          [rows[1], rows[2]] = [rows[2], rows[1]];
          success = ['cents', 'dollar', 'fraction', 'trailing-zero'].includes(
            mode,
          );
        } else {
          const record = world.base.records.find(
            (r: any) => r.fields.case === 'REF-101',
          )!;
          record.fields.customer_name =
            mode === 'source'
              ? 'NovaTech'
              : mode === 'invented'
                ? 'NovaTech Ltd'
                : 'NovaTech Solutions';
          if (mode === 'wrong-id') record.fields.customer_id = 'qc_302';
          if (mode === 'wrong-case') record.fields.case = 'REF-102';
          success = ['source', 'master'].includes(mode);
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
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          success,
          mode,
        );
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
