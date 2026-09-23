import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Invoice memo: literal order number survives semantic review of surrounding prose', async () => {
  const root = 'tasks/automationbench-finance-4012',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'literal-memo-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    const original = structuredClone(backend.world),
      variants: [string, any, boolean][] = [
        ['context', '订单 ORD-4401，按政策开票', true],
        ['literal', 'ORD-4401', true],
        ['wrong', '订单 ORD-4402', false],
        ['case', '订单 ord-4401', false],
        ['empty', '', false],
        ['missing', null, false],
      ];
    for (const [name, value, success] of variants) {
      const world = structuredClone(original),
        record = world.base.records.find(
          (r: any) => r.fields.memo === 'ORD-4401',
        )!;
      record.fields.memo = value;
      const state = join(dir, name + '.json'),
        output = join(dir, name);
      await writeFile(
        state,
        JSON.stringify({ seed, world, calls: backend.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
      });
      const result = JSON.parse(
        await readFile(join(output, 'result.json'), 'utf8'),
      );
      assert.equal(result.business_success, success, name);
      assert.ok(result.semantic.deferred.includes('creates[0].memo'), name);
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
