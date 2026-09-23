import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('ROAS logs: row order and exact decimal notation vary, business facts remain strict', async () => {
  const root = 'tasks/automationbench-operations-1313';
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'ratio-log-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    const original = structuredClone(backend.world);
    const variants: [string, any, any, boolean][] = [
      ['numbers', 0.4, 5, true],
      ['decimal shorthand', '.4', '5.', true],
      ['zeros', '0.4000', '5.000', true],
      ['exponent', '4e-1', '5e0', true],
      ['wrong', '0.5', 5, false],
      ['precision', '0.40000000000000001', 5, false],
      ['currency', '$0.4', 5, false],
      ['empty', '', 5, false],
      ['nonfinite', 'Infinity', 5, false],
      ['boolean', true, 5, false],
    ];
    for (const [name, a, b, success] of variants) {
      const world = structuredClone(original),
        rows = world.spreadsheets!.ss_ad_anomalies.sheets.ws_roas.values;
      rows[1][3] = a;
      rows[2][3] = b;
      [rows[1], rows[2]] = [rows[2], rows[1]];
      const state = join(dir, `${name}.json`),
        output = join(dir, name);
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
        name,
      );
    }
    for (const mode of ['duplicate', 'source-change', 'missing']) {
      const world = structuredClone(original),
        rows = world.spreadsheets!.ss_ad_anomalies.sheets.ws_roas.values;
      if (mode === 'duplicate') rows[2] = structuredClone(rows[1]);
      if (mode === 'source-change') rows[1][1] = '$500';
      if (mode === 'missing') rows[2] = [];
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
        false,
        mode,
      );
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
