import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const name of [
  'marketing-1129',
  'marketing-1176',
  'operations-1289',
  'operations-1307',
  'operations-1315',
  'operations-1317',
  'sales-1126',
  'support-1405',
  'support-1415',
  'support-1419',
  'support-1425',
  'support-1427',
  'support-1432',
])
  test(`${name}: new row order does not change entity integrity`, async () => {
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
      for (const mode of [
        'reversed',
        'missing',
        'duplicate',
        'wrong-identity',
        ...(name === 'operations-1315' ? ['numeric', 'wrong-score'] : []),
      ]) {
        const world = structuredClone(backend.world),
          sheet =
            world.spreadsheets![cell.spreadsheet_token].sheets[cell.sheet_id],
          rows = sheet.values.slice(length).reverse();
        if (mode === 'missing') rows.pop();
        if (mode === 'duplicate')
          rows[rows.length - 1] = structuredClone(rows[0]);
        if (mode === 'wrong-identity') rows[0][0] = 'WRONG VALUE';
        sheet.values = [...sheet.values.slice(0, length), ...rows];
        if (mode === 'numeric' || mode === 'wrong-score') {
          for (const row of rows) row[1] = Number(row[1]);
          if (mode === 'wrong-score') rows[0][1] = Number(rows[0][1]) + 1;
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
        assert.equal(
          r.business_success,
          mode === 'reversed' || mode === 'numeric',
          mode,
        );
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
