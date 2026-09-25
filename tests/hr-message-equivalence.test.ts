import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const n of [5120, 5121, 5129, 5132])
  test(`HR ${n} accepts complete notices merged by recipient`, async () => {
    const root = `tasks/automationbench-hr-${n}`,
      source = await readFile(`${root}/solution/solve.ts`, 'utf8');
    const seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      dir = await mkdtemp(join(tmpdir(), 'hr-merge-')),
      backend = await startMock(seed);
    try {
      const file = join(dir, 'solve.ts');
      const transform = `const seen=new Map();const grouped=[];for(const a of commands){if(a[0]==='im'&&a[1]==='+messages-send'){const id=a[a.indexOf('--chat-id')+1],pos=a.indexOf('--text')+1;if(seen.has(id)){const previous=seen.get(id);previous[previous.indexOf('--text')+1]+='\\n\\n'+a[pos];continue;}seen.set(id,a);}grouped.push(a);}`;
      await writeFile(
        file,
        source.replace(
          'for (const args of commands)',
          transform + '\nfor (const args of grouped)',
        ),
      );
      const env = {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      };
      await exec(process.execPath, [file], { env });
      const state = join(dir, 'state.json'),
        output = join(dir, 'result');
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
      assert.equal(result.business_success, true);
      assert.ok(
        result.semantic.deferred.includes(
          'messages.per_recipient_completeness_and_no_redundancy',
        ),
      );
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const sent = backend.world.messages.filter((m) => !old.has(m.message_id));
      assert.ok(sent.length < result.semantic.original.messages.length);
      assert.equal(new Set(sent.map((m) => m.chat_id)).size, sent.length);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
