import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const scopes: Record<number, string[]> = {
  '1302': ['oc_CCHURN'],
  '1334': ['oc_CIA'],
  '1339': ['oc_phone_9', 'oc_email_23', 'oc_email_13'],
  '1346': ['oc_email_5', 'oc_phone_9'],
  '1351': ['oc_phone_1'],
  '1361': ['oc_CSI'],
};
for (const n of [1302, 1334, 1339, 1346, 1351, 1361])
  test(`operations ${n}: equivalent recipient grouping`, async () => {
    const root = `tasks/automationbench-operations-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'operations-group-')),
      backend = await startMock(seed);
    try {
      const transform = `const changed=[],seen=new Map(),scope=${JSON.stringify(scopes[n])};for(const a of commands){if(a[0]==='im'&&a[1]==='+messages-send'){const id=a[a.indexOf('--chat-id')+1],p=a.indexOf('--text')+1;if(scope.includes(id)){if(${n}===1334){for(const t of a[p].split('\\n')){const b=[...a];b[p]=t;changed.push(b);}continue;}if(seen.has(id)){const b=seen.get(id);b[b.indexOf('--text')+1]+='\\n\\n'+a[p];continue;}seen.set(id,a);}}changed.push(a);}`;
      const file = join(dir, 'solve.ts');
      await writeFile(
        file,
        source.replace(
          'for (const args of commands)',
          transform + '\nfor (const args of changed)',
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
      assert.deepEqual(result.semantic.original.message_count_chats, scopes[n]);
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const sent = backend.world.messages.filter((m) => !old.has(m.message_id));
      assert.notEqual(sent.length, result.semantic.original.messages.length);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
