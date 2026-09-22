import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
function partition(n: number, mode: string, id: string, t: string) {
  if (mode === 'candidate' && id === 'oc_email_3' && n === 5010)
    return t.split('\n');
  if (mode === 'channel' && id === 'oc_C_BEN_5102' && n === 5102) {
    const p = t.split(' | Andre Williams');
    return [p[0], 'Lapsed: Andre Williams' + p[1]];
  }
  if (mode === 'candidate' || mode === 'channel') return [t];
  if (n === 5004 && id === 'oc_email_6') return t.split('；');
  if (n === 5004 && id === 'oc_email_8')
    return [
      t.replace('Greg Foster 和 Diana Reese', 'Greg Foster'),
      t.replace('Greg Foster 和 Diana Reese', 'Diana Reese'),
    ];
  if (n === 5010 && id === 'oc_email_9') {
    const p = t.split('\n');
    return [p[0] + '\n' + p[1], p[0] + '\n' + p[2]];
  }
  if (n === 5069 && ['oc_email_3', 'oc_email_4'].includes(id)) {
    const p = t.split(' | Priya Kapoor');
    return mode === 'omitted' && id === 'oc_email_3'
      ? [p[0] + ' | 请合并']
      : [p[0] + ' | 请合并', 'Priya Kapoor' + p[1]];
  }
  if (n === 5102 && id === 'oc_email_5') {
    const p = t.split(' | Ingrid Larsson');
    return [p[0], 'Lapsed: Ingrid Larsson' + p[1]];
  }
  return [t];
}
for (const n of [5004, 5010, 5069, 5102])
  for (const mode of [
    'split',
    ...(n === 5010 ? ['candidate'] : n === 5102 ? ['channel'] : []),
  ])
    test(`HR ${n} recipient-scoped split ${mode}`, async () => {
      const root = `tasks/automationbench-hr-${n}`,
        seed = JSON.parse(
          await readFile(`${root}/environment/seed.json`, 'utf8'),
        ),
        source = await readFile(`${root}/solution/solve.ts`, 'utf8');
      const dir = await mkdtemp(join(tmpdir(), 'scoped-split-')),
        backend = await startMock(seed);
      try {
        const transform = `const partition=${partition.toString()}; const changed=commands.flatMap(a=>{if(a[0]!=='im'||a[1]!=='+messages-send')return[a];const p=a.indexOf('--text')+1,id=a[a.indexOf('--chat-id')+1];return partition(${n},${JSON.stringify(mode)},id,a[p]).map(t=>{const b=[...a];b[p]=t;return b;});});`;
        const solver = join(dir, 'solve.ts');
        await writeFile(
          solver,
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
        await exec(process.execPath, [solver], { env });
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
        assert.equal(result.business_success, mode === 'split');
        assert.ok(result.semantic.original.message_count_chats.length > 0);
        assert.ok(
          result.semantic.deferred.includes(
            'messages.per_recipient_completeness_and_no_redundancy',
          ),
        );
      } finally {
        await backend.close();
        await rm(dir, { recursive: true, force: true });
      }
    });
