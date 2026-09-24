import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const name of ['finance-4031', 'marketing-1068'])
  test(`${name}: preserve explicit source notification literals`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'source-literals-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: b.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of name === 'finance-4031'
        ? ['reference', 'denied-cancel']
        : ['minimal', 'missing-example', 'missing-batch', 'wrong-count']) {
        const world = structuredClone(b.world),
          message = world.messages.at(-1)!;
        const text = JSON.parse(String(message.body.content)).text;
        message.body.content = JSON.stringify({
          text:
            name === 'finance-4031'
              ? text +
                (mode === 'denied-cancel'
                  ? '\nI did not cancel Metro Supply.'
                  : '')
              : mode === 'minimal'
                ? 'MOD-UGC-3847: 5 approved; includes UGC101.'
                : mode === 'missing-example'
                  ? 'MOD-UGC-3847: 5 approved.'
                  : mode === 'missing-batch'
                    ? '5 approved; includes UGC101.'
                    : 'MOD-UGC-3847: 4 approved; includes UGC101.',
        });
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(state, JSON.stringify({ seed, world, calls: b.calls }));
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          ['reference', 'minimal'].includes(mode),
          mode,
        );
      }
    } finally {
      await b.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
