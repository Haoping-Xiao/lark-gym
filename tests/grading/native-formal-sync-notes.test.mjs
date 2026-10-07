import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('existing sync status note permits paraphrase while preserving source values', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'sync-notes-')),
    t = r + '/tasks/automationbench-support-1600',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  await fs.mkdir(a + '/states', { recursive: true });
  for (const mode of [
    'reference',
    'chinese',
    'english',
    'explicit_platforms',
    'row_context',
    'reverse_direction',
    'wrong_id',
    'wrong_subject',
    'missing_status',
    'midword_id',
    'negated_change',
    'invented_refund',
    'empty_note',
    'new_row_note',
    'missing_peer_note',
    'wrong_current_status',
    'noop',
  ]) {
    let cs = structuredClone(original),
      note = cs.find((c) => c[1] === '+cells-set' && c.includes('F3')),
      j = note.indexOf('--cells') + 1;
    const texts = {
      chinese:
        'Billing dispute（ra_06 / ic_s06）：Last Synced Status 从 resolved 更新为 open；当前 Re:amaze=unresolved、Intercom=open。',
      english:
        'For Billing dispute, tracked pair ra_06 / ic_s06, the previously synced status was resolved and the new normalized status is open.',
      explicit_platforms:
        'ra_06 与 ic_s06 的 Billing dispute：旧跟踪状态 resolved，现为 open；两端已有 unresolved / open 的等价状态，现记录变化并补充内部备注。',
      reverse_direction:
        'Billing dispute | ra_06 | ic_s06: changed from open to resolved.',
      wrong_id:
        'Billing dispute | ra_06 | ic_s01: status changed from resolved to open.',
      wrong_subject: 'Billing problem | ra_06 | ic_s06: resolved to open.',
      missing_status: 'Billing dispute | ra_06 | ic_s06: synchronized.',
      midword_id: 'Billing dispute | xra_06 | ic_s06: resolved to open.',
      negated_change:
        'Billing dispute | ra_06 | ic_s06: no change from resolved to open was needed; the tracked status was already open.',
      invented_refund:
        'Billing dispute | ra_06 | ic_s06: resolved to open. A $5,000 refund has been paid to the customer.',
      empty_note: '',
    };
    if (Object.hasOwn(texts, mode))
      note[j] = JSON.stringify([[{ value: texts[mode] }]]);
    if (mode === 'new_row_note') {
      const c = cs.find((c) => c[1] === '+cells-set' && c.includes('F4'));
      c[c.indexOf('--cells') + 1] =
        '[[{"value":"Created a matching Intercom conversation"}]]';
    }
    if (mode === 'missing_peer_note')
      cs = cs.filter(
        (c) => !(c[1] === '+record-upsert' && c.includes('tbl_aab4246ab7fa')),
      );
    if (mode === 'wrong_current_status') {
      const c = cs.find((c) => c[1] === '+cells-set' && c.includes('D3'));
      c[c.indexOf('--cells') + 1] = '[[{"value":"resolved"}]]';
    }
    if (mode === 'noop') cs = [];
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const p = a + '/states/' + mode + '.json';
      await fs.writeFile(
        p,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: p, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'chinese',
          'english',
          'explicit_platforms',
          'row_context',
          'reverse_direction',
          'wrong_id',
          'wrong_subject',
          'midword_id',
          'negated_change',
          'invented_refund',
        ].includes(mode),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
