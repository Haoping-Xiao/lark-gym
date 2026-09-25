import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const n of [
  1041, 1043, 1047, 1075, 1045, 1078, 1082, 1096, 1023, 1049, 1054,
])
  test(`marketing ${n}: complete reports allow different message grouping`, async () => {
    const root = `tasks/automationbench-marketing-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'marketing-sections-')),
      backend = await startMock(seed);
    try {
      const transform =
        n === 1054
          ? `const changed=commands.filter(a=>a[0]!=='im'||a[1]!=='+messages-send');const notices=commands.filter(a=>a[0]==='im'&&a[1]==='+messages-send');const merged=[...notices[0]];merged[merged.indexOf('--text')+1]=notices.map(a=>a[a.indexOf('--text')+1]).join('\\n');changed.push(merged);`
          : `const changed=commands.flatMap(a=>{if(a[0]!=='im'||a[1]!=='+messages-send')return[a];const p=a.indexOf('--text')+1,lines=a[p].split('\\n'),k=Math.ceil(lines.length/2);return[lines.slice(0,k).join('\\n'),lines.slice(k).join('\\n')].map(t=>{const b=[...a];b[p]=${n === 1045 ? "'CGAP-2026-Q1\\\\n'+" : ''}t;return b;});});`;
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
      assert.ok(
        result.semantic.deferred.includes(
          'messages.per_recipient_completeness_and_no_redundancy',
        ),
      );
      assert.equal(
        result.semantic.original.messages.length,
        n === 1054 ? 3 : n === 1049 ? 2 : 1,
      );
      if (n === 1045) {
        const invalid = await startMock(seed);
        try {
          await writeFile(
            file,
            source.replace(
              'for (const args of commands)',
              transform
                .replace('.map(t=>', '.map((t,i)=>')
                .replace(
                  "b[p]='CGAP-2026-Q1\\\\n'+t",
                  "b[p]=i===0?'CGAP-2026-Q1\\\\n'+t:t.replaceAll('CGAP-2026-Q1','')",
                ) + '\nfor (const args of changed)',
            ),
          );
          await exec(process.execPath, [file], {
            env: { ...env, FEISHU_MOCK_URL: invalid.url },
          });
          await writeFile(
            state,
            JSON.stringify({
              seed,
              world: invalid.world,
              calls: invalid.calls,
            }),
          );
          await exec(process.execPath, [`${root}/tests/verify.ts`], {
            env: { ...env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
          });
          const rejected = JSON.parse(
            await readFile(join(output, 'result.json'), 'utf8'),
          );
          assert.equal(rejected.business_success, false);
          assert.equal(
            rejected.messageChecks.filter((c: any) => !c.passed).length,
            1,
          );
        } finally {
          await invalid.close();
        }
      }
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      assert.equal(
        backend.world.messages.filter((m) => !old.has(m.message_id)).length,
        n === 1054 ? 1 : n === 1049 ? 4 : 2,
      );
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
