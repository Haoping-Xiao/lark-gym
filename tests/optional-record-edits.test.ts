import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('reviewed optional lead edits require independent source review without promoting actual values to reference facts', async () => {
  const root = 'tasks/automationbench-sales-1107',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8'));
  for (const [fields, passed] of [
    [{ title: 'VP of Sales' }, true],
    [{ email: 'wrong@example.com' }, true],
    [{ company: 'Unrelated Company' }, false],
  ] as [Record<string, string>, boolean][]) {
    const b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'optional-edits-'));
    const env = {
      ...process.env,
      FEISHU_MOCK_URL: b.url,
      LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
    };
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], { env });
      await exec(
        env.LARK_CLI,
        [
          'base',
          '+record-upsert',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_aef450dc78ea',
          '--record-id',
          'rec_00Q_COLD_001',
          '--json',
          JSON.stringify(fields),
        ],
        { env },
      );
      const state = join(dir, 'state.json');
      await writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...env, MOCK_STATE: state, VERIFIER_OUTPUT: dir },
      });
      const result = JSON.parse(
        await readFile(join(dir, 'result.json'), 'utf8'),
      );
      assert.equal(result.business_success, passed);
      if (passed) {
        assert.equal(result.semantic.required, true);
        assert.ok(
          result.semantic.deferred.some((x: string) =>
            x.startsWith('optional_record_edits.'),
          ),
        );
        assert.deepEqual(
          result.semantic.original.updates.map(
            (x: { field: string }) => x.field,
          ),
          ['status'],
        );
        assert.ok(
          !JSON.stringify(result.semantic.original).includes(
            'wrong@example.com',
          ),
        );
      }
    } finally {
      await b.close();
      await rm(dir, { recursive: true, force: true });
    }
  }
});
