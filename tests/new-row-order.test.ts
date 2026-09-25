import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const task of [
  'automationbench-sales-1104',
  'automationbench-support-1571',
  'automationbench-finance-4017',
  'automationbench-finance-4023',
])
  test(`${task}: new row permutations pass and duplicate/missing identity fails`, async () => {
    const root = `tasks/${task}`;
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const expected = JSON.parse(
      await readFile(`${root}/tests/expected.json`, 'utf8'),
    );
    const backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'row-order-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const world = structuredClone(backend.world),
        first = expected.cells[0];
      const rows = [
        ...new Set<number>(
          expected.cells
            .filter(
              (c: any) =>
                c.spreadsheet_token === first.spreadsheet_token &&
                c.sheet_id === first.sheet_id,
            )
            .map((c: any) => c.row),
        ),
      ];
      const sheet =
        world.spreadsheets![first.spreadsheet_token].sheets[first.sheet_id];
      const before =
        seed.spreadsheets[first.spreadsheet_token].sheets[first.sheet_id]
          .values;
      assert.ok(
        rows.every(
          (i) =>
            !before[i] || before[i].every((v: any) => v === '' || v === null),
        ),
      );
      const originals = rows.map((i) => structuredClone(sheet.values[i]));
      rows.forEach(
        (row, i) => (sheet.values[row] = originals[originals.length - 1 - i]),
      );
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
      assert.equal((await verify('permuted')).business_success, true);
      sheet.values[rows[0]] = structuredClone(sheet.values[rows[1]]);
      assert.equal(
        (await verify('duplicate-and-missing')).business_success,
        false,
      );
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
