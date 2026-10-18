import {
  mkdtemp,
  readFile,
  writeFile,
  rm,
  readdir,
  cp,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
export const taskNames = (await readdir('tasks'))
  .filter((name) => name.startsWith('automationbench-'))
  .sort();

// One isolated backend and one reference execution per task, shared only by its subtests.
export async function createTaskFixture(task: string) {
  const dir = await mkdtemp(join(tmpdir(), 'lark-gym-task-contract-'));
  const seed = JSON.parse(
    await readFile(`tasks/${task}/environment/seed.json`, 'utf8'),
  );
  const expected = JSON.parse(
    await readFile(`tasks/${task}/tests/expected.json`, 'utf8'),
  );
  const backend = await startMock(seed);
  const state = join(dir, 'state.json');
  const env = {
    ...process.env,
    FEISHU_MOCK_URL: backend.url,
    LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
    MOCK_STATE: state,
    VERIFIER_OUTPUT: dir,
  };
  return {
    seed,
    expected,
    backend,
    dir,
    initialGrade: '',
    async grade() {
      await writeFile(
        state,
        JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
      );
      await exec(process.execPath, [`tasks/${task}/tests/verify.ts`], { env });
      return (await readFile(join(dir, 'reward.txt'), 'utf8')).trim();
    },
    async evaluate() {
      const bin = join(dir, 'stub-bin');
      await mkdir(bin, { recursive: true });
      await writeFile(
        join(bin, 'rewardkit'),
        `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const output = process.argv[process.argv.indexOf('--output')+1];
fs.writeFileSync(output, JSON.stringify({reward:1}));
fs.writeFileSync(path.join(path.dirname(output),'reward-details.json'), JSON.stringify({criteria:[{score:1}]}));
`,
        { mode: 0o755 },
      );
      const output = join(dir, 'pipeline');
      await exec(process.execPath, [`tasks/${task}/tests/evaluate.ts`], {
        env: {
          ...env,
          PATH: `${bin}:${process.env.PATH}`,
          VERIFIER_OUTPUT: output,
        },
      });
      return (await readFile(join(output, 'reward.txt'), 'utf8')).trim();
    },
    async solve() {
      try {
        await cp(`tasks/${task}/environment/input-files`, dir, {
          recursive: true,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      await exec(
        process.execPath,
        [resolve(`tasks/${task}/solution/solve.ts`)],
        { env, cwd: dir },
      );
    },
    async close() {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
export type TaskFixture = Awaited<ReturnType<typeof createTaskFixture>>;
