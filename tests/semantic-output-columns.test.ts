import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const columns: Record<string, number> = {
  'support-1574': 2,
  'support-1579': 2,
  'support-1562': 4,
  'support-1584': 3,
  'support-1580': 2,
  'support-1567': 4,
  'support-1577': 3,
  'marketing-1109': 2,
};
for (const name of Object.keys(columns))
  test(`${name}: reviewed explanation columns retain literal and entity constraints`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      expected = JSON.parse(
        await readFile(`${root}/tests/expected.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'new-row-order-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const cell = expected.cells.find(
          (c: any) =>
            c.row >=
            seed.spreadsheets[c.spreadsheet_token].sheets[c.sheet_id].values
              .length,
        ),
        length =
          seed.spreadsheets[cell.spreadsheet_token].sheets[cell.sheet_id].values
            .length;
      for (const mode of ['equivalent', 'wrong-identity', 'missing-literal']) {
        if (
          mode === 'missing-literal' &&
          !['support-1580', 'marketing-1109'].includes(name)
        )
          continue;
        const world = structuredClone(backend.world),
          sheet =
            world.spreadsheets![cell.spreadsheet_token].sheets[cell.sheet_id];
        const rows = sheet.values.slice(length).reverse();
        sheet.values = [...sheet.values.slice(0, length), ...rows];
        if (mode === 'wrong-identity') rows[0][0] = 'WRONG ID';
        if (mode === 'equivalent') rows[0][columns[name]] += '（说明）';
        if (mode === 'missing-literal')
          for (const row of rows)
            row[columns[name]] = '缺少明确要求的原名或票ID';
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
