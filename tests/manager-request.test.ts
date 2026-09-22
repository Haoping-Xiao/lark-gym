import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('intern manager approval requests are optional and semantic, while unrelated recipients remain forbidden', async () => {
  const root = 'tasks/automationbench-hr-5133';
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const dir = await mkdtemp(join(tmpdir(), 'manager-request-'));
  const variants = [
    { name: 'none', chat: null, pass: true },
    { name: 'manager', chat: 'oc_email_3', pass: true },
    { name: 'unrelated', chat: 'oc_email_7', pass: false },
  ];
  try {
    for (const variant of variants) {
      const backend = await startMock(seed);
      try {
        const env = {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        };
        await exec(process.execPath, [`${root}/solution/solve.ts`], { env });
        if (variant.chat)
          await exec(
            env.LARK_CLI,
            [
              'im',
              '+messages-send',
              '--chat-id',
              variant.chat,
              '--text',
              '请为 Amara Blake 的企业邮箱提供书面批准并提交 IT Service Desk，当前待审批。',
            ],
            { env },
          );
        const state = join(dir, variant.name + '.json'),
          output = join(dir, 'result-' + variant.name);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        const result = JSON.parse(
          await readFile(join(output, 'result.json'), 'utf8'),
        );
        assert.equal(result.business_success, variant.pass, variant.name);
        assert.equal(result.semantic.original.messages.length, 6);
        assert.equal(result.semantic.original.optional_requests.length, 3);
        assert.equal(
          result.semantic.deferred.includes(
            'messages.optional_requests.business_scope_and_no_redundancy',
          ),
          variant.name === 'manager',
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
