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
  '1446': ['oc_C_MIG'],
  '1447': ['oc_email_9'],
  '1463': ['oc_C_WAR'],
  '1468': ['oc_C_SS'],
  '1475': ['oc_C_REV'],
  '1488': ['oc_email_4', 'oc_email_3'],
  '1495': ['oc_email_15', 'oc_email_16'],
};
for (const n of [1446, 1447, 1463, 1468, 1475, 1488, 1495])
  test(`support ${n}: equivalent recipient grouping`, async () => {
    const root = `tasks/automationbench-support-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'support-group-')),
      backend = await startMock(seed);
    try {
      const transform = `const changed=commands.flatMap(a=>{if(a[0]!=='im'||a[1]!=='+messages-send')return[a];const id=a[a.indexOf('--chat-id')+1],p=a.indexOf('--text')+1;if(!${JSON.stringify(scopes[n])}.includes(id))return[a];const lines=a[p].split('\\n'),k=Math.ceil(lines.length/2);return[lines.slice(0,k).join('\\n'),lines.slice(k).join('\\n')].map(t=>{const b=[...a];b[p]=t;return b;});});`;
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
