import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('SLA source-hour text stays exact while computed hours compare numerically', async () => {
  const root = 'tasks/automationbench-support-1594',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    b = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'sla-hours-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: b.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    for (const mode of [
      'numbers',
      'computed-decimal',
      'wrong-target',
      'wrong-actual',
      'source-decimal',
      'source-leading-zero',
    ]) {
      const world = structuredClone(b.world),
        rows = world.spreadsheets!.ss_sla.sheets.ws_breaches.values;
      for (const row of rows.slice(1)) {
        row[3] = Number(row[3]);
        row[4] = Number(row[4]);
      }
      if (mode === 'computed-decimal') rows[1][4] = '6.00';
      if (mode === 'wrong-target') rows[1][3] = 5;
      if (mode === 'wrong-actual') rows[1][4] = 6.1;
      if (mode === 'source-decimal') rows[1][3] = '4.0';
      if (mode === 'source-leading-zero') rows[1][3] = '04';
      const state = join(dir, mode + '.json'),
        output = join(dir, mode);
      await writeFile(state, JSON.stringify({ seed, world, calls: b.calls }));
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
      });
      assert.equal(
        JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
          .business_success,
        ['numbers', 'computed-decimal'].includes(mode),
        mode,
      );
    }
  } finally {
    await b.close();
    await rm(dir, { recursive: true, force: true });
  }
});
