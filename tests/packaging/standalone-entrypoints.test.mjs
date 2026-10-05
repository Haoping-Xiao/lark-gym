import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { promisify } from 'node:util';
const exec = promisify(execFile);
test(
  'Standalone task entrypoints use backend artifacts without repository runtime dependencies',
  { timeout: 30000 },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'feishu-harbor-test-'));
    const state = join(dir, 'state.json'),
      ready = join(dir, 'endpoint');
    const child = spawn(
      process.execPath,
      [
        'gyms/lark-cli/src/serve.ts',
        '--seed',
        'tasks/maintenance-notice/environment/seed.json',
        '--state',
        state,
        '--ready',
        ready,
      ],
      { stdio: 'pipe' },
    );
    const stopped = once(child, 'exit');
    await cp('tasks/maintenance-notice/tests', join(dir, 'tests'), {
      recursive: true,
    });
    await cp('tasks/maintenance-notice/solution', join(dir, 'solution'), {
      recursive: true,
    });
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
        exec(process.execPath, [join(dir, 'tests/entry.ts')], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: dir },
        });
      await verifier();
      assert.equal(
        (await readFile(join(dir, 'reward.txt'), 'utf8')).trim(),
        '0',
      );
      await exec(process.execPath, [join(dir, 'solution/entry.ts')], {
        cwd: dir,
        env: {
          PATH: resolve('gyms/lark-cli/bin') + ':' + process.env.PATH,
          HOME: dir,
          FEISHU_MOCK_URL: endpoint,
        },
      });
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
