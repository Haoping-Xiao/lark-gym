import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('intercompany transfers allow interleaving but require each record and notice before its status update', async () => {
  const root = 'tasks/automationbench-finance-4032',
    source = await readFile(`${root}/solution/solve.ts`, 'utf8');
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const dir = await mkdtemp(join(tmpdir(), 'transfer-order-'));
  const variants = [
    {
      name: 'batch',
      order: Array.from({ length: 16 }, (_, i) => i),
      pass: true,
    },
    {
      name: 'per_transfer',
      order: [0, 1, 2, 6, 10, 3, 7, 11, 12, 4, 8, 13, 5, 9, 14, 15],
      pass: true,
    },
    {
      name: 'early_status',
      order: [0, 1, 2, 10, 6, 3, 7, 11, 12, 4, 8, 13, 5, 9, 14, 15],
      pass: false,
    },
    {
      name: 'early_notice',
      order: [0, 1, 6, 2, 10, 3, 7, 11, 12, 4, 8, 13, 5, 9, 14, 15],
      pass: false,
    },
  ];
  try {
    for (const variant of variants) {
      const backend = await startMock(seed);
      try {
        assert.deepEqual(
          [...variant.order].sort((a, b) => a - b),
          Array.from({ length: 16 }, (_, i) => i),
        );
        const solver = join(dir, `${variant.name}.ts`);
        await writeFile(
          solver,
          source.replace(
            'for (const args of commands)',
            `const reordered=${JSON.stringify(variant.order)}.map(i=>commands[i]);\nfor (const args of reordered)`,
          ),
        );
        await exec(process.execPath, [solver], {
          env: {
            ...process.env,
            FEISHU_MOCK_URL: backend.url,
            LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
          },
        });
        const state = join(dir, `${variant.name}.json`),
          output = join(dir, `result-${variant.name}`);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        const result = JSON.parse(
          await readFile(join(output, 'result.json'), 'utf8'),
        );
        assert.equal(result.business_success, variant.pass, variant.name);
        assert.equal(result.entityOrderChecks.length, 4);
        assert.equal(
          result.entityOrderChecks.every((c: any) => c.passed),
          variant.pass,
        );
        assert.ok(result.cellChecks.every((c: any) => c.passed));
        assert.ok(result.creationChecks.every((c: any) => c.passed));
        assert.ok(result.messageChecks.every((c: any) => c.passed));
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
