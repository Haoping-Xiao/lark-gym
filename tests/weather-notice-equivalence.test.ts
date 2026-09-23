import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const n of [5080])
  test(`weather ${n}: equivalent recipient grouping`, async () => {
    const root = `tasks/automationbench-hr-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'support-group-')),
      backend = await startMock(seed);
    try {
      const transform = `const changed=commands.flatMap(a=>{if(a[0]!=='im'||a[1]!=='+messages-send')return[a];const p=a.indexOf('--text')+1,parts=a[p].split(' | ');return[parts.slice(0,2).join(' | '),parts.slice(2).join(' | ')].map(t=>{const b=[...a];b[p]=t;return b;});});`;

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
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const sent = backend.world.messages.filter((m) => !old.has(m.message_id));
      assert.equal(sent.length, 8);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
