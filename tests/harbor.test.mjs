import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { promisify } from 'node:util';
import { oracle } from '../cases/maintenance-notice/solution/oracle.mjs';
const exec = promisify(execFile);
test(
  'Harbor service persists CLI mutations for the standalone verifier',
  { timeout: 30000 },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'feishu-harbor-test-'));
    const state = join(dir, 'state.json'),
      ready = join(dir, 'endpoint');
    const child = spawn(
      process.execPath,
      [
        'lark-cli-mock/src/harbor/serve.mjs',
        '--seed',
        'cases/maintenance-notice/environment/seed.json',
        '--state',
        state,
        '--ready',
        ready,
      ],
      { stdio: 'pipe' },
    );
    const stopped = once(child, 'exit');
    try {
      let endpoint;
      for (let n = 0; n < 100; n++) {
        try {
          endpoint = await readFile(ready, 'utf8');
          break;
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        if (child.exitCode !== null)
          throw Error('Mock service exited before readiness');
        await new Promise((r) => setTimeout(r, 50));
      }
      assert.ok(endpoint, 'Mock service readiness timed out');
      const verifier = () =>
        exec(process.execPath, ['cases/maintenance-notice/tests/entry.mjs'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: dir },
        });
      await verifier();
      assert.equal(
        (await readFile(join(dir, 'reward.txt'), 'utf8')).trim(),
        '0',
      );
      await oracle((args) =>
        exec(resolve('lark-cli-mock/bin/lark-cli'), args, {
          env: { PATH: process.env.PATH, HOME: dir, FEISHU_MOCK_URL: endpoint },
        }),
      );
      await verifier();
      assert.equal(
        (await readFile(join(dir, 'reward.txt'), 'utf8')).trim(),
        '1',
      );
      assert.equal(
        JSON.parse(await readFile(join(dir, 'result.json'), 'utf8')).status,
        'pass',
      );
    } finally {
      child.kill('SIGTERM');
      await stopped;
      await rm(dir, { recursive: true, force: true });
    }
  },
);
