import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const n of [1042, 1079]) {
  test(`marketing ${n}: each report part retains its tracking code`, async () => {
    const root = `tasks/automationbench-marketing-${n}`;
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const source = await readFile(`${root}/solution/solve.ts`, 'utf8');
    const code = n === 1042 ? 'NL-BATCH-2026-0127' : 'CREAT-227-Q1';
    const header = n === 1042 ? 'Weekly Digest' : 'overdue';
    const dir = await mkdtemp(join(tmpdir(), 'marketing-tracking-'));
    try {
      for (const missing of [false, true]) {
        const backend = await startMock(seed);
        try {
          const transform = `const changed=commands.flatMap(a=>{if(a[0]!=='im'||a[1]!=='+messages-send')return[a];const p=a.indexOf('--text')+1;const lines=a[p].split('\\n').filter(l=>!l.includes('${code}'));const k=Math.ceil(lines.length/2);return[lines.slice(0,k).join('\\n'),lines.slice(k).join('\\n')].map((t,i)=>{const b=[...a];b[p]='${header}\\n'+(${missing}&&i===1?'':'${code}\\n')+t;return b;});});`;
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
            JSON.stringify({
              seed,
              world: backend.world,
              calls: backend.calls,
            }),
          );
          await exec(process.execPath, [`${root}/tests/verify.ts`], {
            env: { ...env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
          });
          const result = JSON.parse(
            await readFile(join(output, 'result.json'), 'utf8'),
          );
          assert.equal(result.business_success, !missing);
          assert.equal(
            result.messageChecks.filter((c: any) => !c.passed).length,
            missing ? 1 : 0,
          );
          const old = new Set(seed.messages.map((m: any) => m.message_id));
          assert.equal(
            backend.world.messages.filter((m) => !old.has(m.message_id)).length,
            2,
          );
        } finally {
          await backend.close();
        }
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
