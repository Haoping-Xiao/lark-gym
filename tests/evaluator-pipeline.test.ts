import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('verifier composes judge results and fails closed on judge errors (stubbed judge, no model call)', async () => {
  const task = 'tasks/automationbench-simple-3151';
  const seed = JSON.parse(
    await readFile(`${task}/environment/seed.json`, 'utf8'),
  );
  const backend = await startMock(seed);
  const dir = await mkdtemp(join(tmpdir(), 'judge-pipeline-'));
  try {
    await exec(process.execPath, [`${task}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    await writeFile(
      join(dir, 'state.json'),
      JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
    );
    const bin = join(dir, 'bin');
    await mkdir(bin);
    await writeFile(
      join(bin, 'rewardkit'),
      `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const output = process.argv[process.argv.indexOf('--output') + 1];
fs.writeFileSync(output, JSON.stringify({reward:Number(process.env.STUB_SCORE)}));
fs.writeFileSync(path.join(path.dirname(output), 'reward-details.json'), JSON.stringify(process.env.STUB_ERROR ? {error:'provider unavailable'} : {criteria:[{score:Number(process.env.STUB_SCORE)}]}));
`,
      { mode: 0o755 },
    );
    for (const score of [1, 0]) {
      const output = join(dir, `score-${score}`);
      await exec(process.execPath, [`${task}/tests/evaluate.ts`], {
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          STUB_SCORE: String(score),
          MOCK_STATE: join(dir, 'state.json'),
          VERIFIER_OUTPUT: output,
        },
      });
      assert.equal(
        (await readFile(join(output, 'reward.txt'), 'utf8')).trim(),
        String(score),
      );
      const input = JSON.parse(
        await readFile(join(output, 'semantic/input.json'), 'utf8'),
      );
      assert.ok(input.deferred_checks.length > 0);
      assert.deepEqual(input.world, backend.world);
    }
    const errorOutput = join(dir, 'error');
    await assert.rejects(
      exec(process.execPath, [`${task}/tests/evaluate.ts`], {
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          STUB_SCORE: '0',
          STUB_ERROR: 'yes',
          MOCK_STATE: join(dir, 'state.json'),
          VERIFIER_OUTPUT: errorOutput,
        },
      }),
    );
    await assert.rejects(access(join(errorOutput, 'reward.txt')));
    assert.match(
      await readFile(join(errorOutput, 'verification-error.txt'), 'utf8'),
      /Judge failure/,
    );
    const textOnly = 'tasks/automationbench-sales-703';
    const unchanged = JSON.parse(
      await readFile(`${textOnly}/environment/seed.json`, 'utf8'),
    );
    await writeFile(
      join(dir, 'state.json'),
      JSON.stringify({ seed: unchanged, world: unchanged, calls: [] }),
    );
    const noopOutput = join(dir, 'text-only-noop');
    await exec(process.execPath, [`${textOnly}/tests/evaluate.ts`], {
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        STUB_SCORE: '0',
        MOCK_STATE: join(dir, 'state.json'),
        VERIFIER_OUTPUT: noopOutput,
      },
    });
    const noop = JSON.parse(
      await readFile(join(noopOutput, 'result.json'), 'utf8'),
    );
    assert.equal(noop.programmatic_reward, 1);
    assert.equal(noop.semantic_status, 'failed');
    assert.equal(noop.status, 'fail');
    assert.equal(noop.business_success, false);
    assert.equal(
      (await readFile(join(noopOutput, 'reward.txt'), 'utf8')).trim(),
      '0',
    );
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
