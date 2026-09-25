import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('every required disciplinary notice must precede status updates, including second notice to same recipient', async () => {
  const root = 'tasks/automationbench-hr-5058',
    source = await readFile(`${root}/solution/solve.ts`, 'utf8');
  const seed = JSON.parse(
    await readFile(`${root}/environment/seed.json`, 'utf8'),
  );
  const dir = await mkdtemp(join(tmpdir(), 'notification-order-'));
  try {
    for (const late of [false, true]) {
      const backend = await startMock(seed);
      try {
        const insertion = late
          ? `const index=commands.findIndex(a=>a.includes('oc_email_4')&&a.some(v=>v.includes('Tom Bradford')));if(index<0)throw Error('missing notice');commands.push(...commands.splice(index,1));\n`
          : '';
        const solver = join(dir, `solve-${late}.ts`);
        await writeFile(
          solver,
          source.replace(
            'for (const args of commands)',
            insertion + 'for (const args of commands)',
          ),
        );
        await exec(process.execPath, [solver], {
          env: {
            ...process.env,
            FEISHU_MOCK_URL: backend.url,
            LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
          },
        });
        const state = join(dir, `state-${late}.json`),
          output = join(dir, `result-${late}`);
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
        assert.equal(result.business_success, !late);
        const old = new Set(seed.messages.map((m: any) => m.message_id));
        assert.equal(
          backend.world.messages.filter((m) => !old.has(m.message_id)).length,
          6,
        );
        assert.ok(result.orderChecks.some((c: any) => !c.passed) === late);
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
