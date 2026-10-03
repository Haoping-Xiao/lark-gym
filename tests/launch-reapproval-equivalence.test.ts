import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const scopes: Record<number, string[]> = { 1610: ['oc_email_4', 'oc_C_lnch'] };
for (const n of [1610])
  test(`launch ${n}: equivalent recipient grouping`, async () => {
    const root = `tasks/automationbench-marketing-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'support-group-')),
      backend = await startMock(seed);
    try {
      const transform = `const changed=commands.flatMap(a=>{if(a[0]!=='mail'||a[1]!=='+send'||a[a.indexOf('--to')+1]!=='content-team@company.example.com')return[a];const p=a.indexOf('--body')+1;return a[p].split('\\n').filter(l=>l.startsWith('LC-')).map(t=>{const b=[...a];b[p]='请重审以下过期内容：\\n'+t;return b;});});`;

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
      assert.deepEqual(
        result.semantic.original.message_count_chats,
        scopes[n].filter((x) => !x.startsWith('oc_email_')),
      );
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const sent = backend.world.messages.filter((m) => !old.has(m.message_id));
      const sentMail = backend.world.mail!.messages.filter(
        (m) =>
          m.message_state === 2 &&
          !seed.mail.messages.some((x: any) => x.message_id === m.message_id),
      );
      assert.equal(sent.length + sentMail.length, 6);
      assert.equal(
        sentMail.filter((m) =>
          m.to.some(
            (a: { mail_address: string }) =>
              a.mail_address === 'content-team@company.example.com',
          ),
        ).length,
        3,
      );
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
