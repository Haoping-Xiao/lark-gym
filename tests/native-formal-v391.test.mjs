import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('inbox reporting uses one mailbox scope for logs and metrics', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'inbox-scope-')),
    t = r + '/tasks/automationbench-support-1427',
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
    'reversed',
    'unknown_extra',
    'wrong_count',
    'wrong_unassigned',
    'changed_pending',
    'omitted_executive',
    'excluded_tag',
    'wrong_triage',
    'omit_overdue',
    'no_summary',
    'no_triage',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      cells = cs.filter((c) => c[1] === '+cells-set'),
      messages = cs.filter((c) => c[1] === '+messages-send'),
      metrics = messages.find((c) => val(c, '--chat-id') === 'oc_C_metrics'),
      triage = messages.find((c) => val(c, '--chat-id') === 'oc_C_triage');
    if (mode === 'reversed')
      for (const c of cells) {
        const x = val(c, '--range');
        set(c, '--range', x[0] + String(18 - Number(x.slice(1))));
      }
    if (['unknown_extra', 'excluded_tag'].includes(mode)) {
      const row =
        mode === 'unknown_extra'
          ? ['Vendor payment query', 'closed', 'Unassigned']
          : ['Quarterly compliance review draft', 'open', 'Unassigned'];
      for (let i = 0; i < 3; i++) {
        const c = structuredClone(cells[i]);
        set(c, '--range', 'ABC'[i] + '17');
        set(c, '--cells', JSON.stringify([[{ value: row[i] }]]));
        cs.splice(cs.indexOf(metrics), 0, c);
      }
    }
    if (mode === 'wrong_count')
      set(
        metrics,
        '--text',
        val(metrics, '--text')
          .replace('total=15', 'total=18')
          .replace('closed=2', 'closed=5'),
      );
    if (mode === 'wrong_unassigned')
      set(
        cells.find((c) => val(c, '--range') === 'C2'),
        '--cells',
        JSON.stringify([[{ value: 'Unassigned' }]]),
      );
    if (mode === 'changed_pending')
      set(
        cells.find((c) => val(c, '--range') === 'B3'),
        '--cells',
        JSON.stringify([[{ value: 'customer-blocked' }]]),
      );
    if (mode === 'omitted_executive')
      cs = cs.filter(
        (c) => !(c[1] === '+cells-set' && /^[ABC]16$/.test(val(c, '--range'))),
      );
    if (mode === 'wrong_triage')
      set(
        triage,
        '--text',
        val(triage, '--text') + '\nTravel expense approval | new',
      );
    if (mode === 'omit_overdue')
      set(
        triage,
        '--text',
        val(triage, '--text').replaceAll('triage-overdue', 'new'),
      );
    if (mode === 'no_summary') cs = cs.filter((c) => c !== metrics);
    if (mode === 'no_triage') cs = cs.filter((c) => c !== triage);
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
          'reversed',
          'wrong_count',
          'wrong_triage',
          'omit_overdue',
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
