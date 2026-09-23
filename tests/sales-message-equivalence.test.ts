import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
function regroup(commands: string[][], n: number, mode: string) {
  const result = [],
    seen = new Map();
  for (const a of commands) {
    if (a[0] !== 'im' || a[1] !== '+messages-send') {
      result.push(a);
      continue;
    }
    const p = a.indexOf('--text') + 1,
      id = a[a.indexOf('--chat-id') + 1],
      t = a[p];
    if (n === 831) {
      if (seen.has(id)) {
        const b = seen.get(id);
        b[b.indexOf('--text') + 1] += '\n\n' + t;
        continue;
      }
      seen.set(id, a);
      result.push(a);
      continue;
    }
    let parts;
    if (n === 840) {
      const s = t.split(' | ');
      parts = s.slice(2).map((x) => s.slice(0, 2).join(' | ') + ' | ' + x);
    } else if (n === 1178)
      parts = t
        .split('；')
        .map((x) => (x.startsWith('milestone') ? x : 'milestone：' + x));
    else {
      const s = t.split('\n');
      parts = s
        .slice(1)
        .filter((x) => mode !== 'omitted' || !x.startsWith('Initech'))
        .map((x) => s[0] + '\n' + x);
    }
    for (const text of parts) {
      const b = [...a];
      b[p] = text;
      result.push(b);
    }
  }
  return result;
}
for (const n of [831, 840, 1178, 1200])
  test(`sales ${n}: equivalent recipient grouping`, async () => {
    const root = `tasks/automationbench-sales-${n}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      source = await readFile(`${root}/solution/solve.ts`, 'utf8'),
      dir = await mkdtemp(join(tmpdir(), 'sales-group-')),
      backend = await startMock(seed);
    try {
      const transform =
        regroup.toString() + `\nconst changed=regroup(commands,${n},'split');`;
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

      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const sent = backend.world.messages.filter((m) => !old.has(m.message_id));
      assert.notEqual(sent.length, result.semantic.original.messages.length);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
