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
  'marketing-1132',
  'marketing-1145',
  'support-1472',
  'support-1488',
  'support-1493',
  'support-1503',
  'support-1554',
  'support-1557',
  'support-1558',
  'support-1585',
  'support-1587',
  'support-1594',
  'support-1596',
  'support-1597',
  'support-1598',
  'support-1600',
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
