import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [4048, 4054, 4081, 4098])
  test(`finance ${id}: equivalent derived USD values pass; cents, currency and source changes fail`, async () => {
    const root = `tasks/automationbench-finance-${id}`;
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const expected = JSON.parse(
      await readFile(`${root}/tests/expected.json`, 'utf8'),
    );
    const config = JSON.parse(
      await readFile(`${root}/tests/semantic-config.json`, 'utf8'),
    );
    const backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'derived-money-'));
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
      const cells = expected.cells.filter((c: any) =>
        config.usd_result_columns.some(
          (r: any) =>
            r.spreadsheet_token === c.spreadsheet_token &&
            r.sheet_id === c.sheet_id &&
            r.columns.includes(c.column),
        ),
      );
      assert.ok(cells.length > 0);
      const set = (c: any, value: any) => {
        world.spreadsheets![c.spreadsheet_token].sheets[c.sheet_id].values[
          c.row
        ][c.column] = value;
      };
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
      for (const mode of ['decimal', 'numeric', 'trailing-zero']) {
        world = structuredClone(original);
        for (const c of cells) {
          const value = Number(c.value.replace(/[$,]/g, ''));
          set(
            c,
            mode === 'decimal'
              ? `$${value}.00`
              : mode === 'trailing-zero'
                ? `$${value}.0000`
                : value,
          );
        }
        assert.equal((await verify(mode)).business_success, true);
      }
      for (const [name, value] of [
        ['one-cent', `$${Number(cells[0].value.replace(/[$,]/g, ''))}.01`],
        ['wrong-currency', cells[0].value.replace('$', '€')],
        ['malformed', '$9,16,7'],
        ['fraction-cent', '$0.001'],
        ['empty', ''],
        ['long-invalid', 'amount '.repeat(20)],
      ]) {
        world = structuredClone(original);
        set(cells[0], value);
        assert.equal((await verify(name)).business_success, false, name);
      }
      world = structuredClone(original);
      const c = cells[0],
        sourceColumn = id === 4081 ? 1 : id === 4098 ? 2 : 3;
      const row =
        world.spreadsheets![c.spreadsheet_token].sheets[c.sheet_id].values[
          c.row
        ];
      row[sourceColumn] = `${row[sourceColumn]}.00`;
      assert.equal((await verify('source-changed')).business_success, false);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
