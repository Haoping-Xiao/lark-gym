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
  'support-1574',
  'support-1579',
  'support-1573',
  'support-1572',
  'support-1562',
  'support-1584',
  'support-1580',
  'support-1489',
  'support-1567',
  'support-1577',
  'marketing-1109',
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
        assert.equal(r.business_success, mode === 'reversed', mode);
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
