import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('categorization supports complete split reports and native lead delivery', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'categorization-')),
    t = r + '/tasks/automationbench-support-1447',
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
    'split_report',
    'split_mail',
    'split_both',
    'missing_details',
    'wrong_count',
    'duplicate_report',
    'no_report',
    'missing_literal',
    'missing_mail',
    'wrong_lead',
    'empty_mail',
    'closed_changed',
    'wrong_classification',
    'public_comment',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      mails = cs.filter((c) => c[0] === 'mail'),
      report = cs.at(-1),
      tech = mails.find((c) => val(c, '--to').startsWith('tech-'));
    if (['split_report', 'split_both'].includes(mode)) {
      const lines = val(report, '--text').split('\n'),
        second = structuredClone(report);
      set(report, '--text', lines[0]);
      set(second, '--text', lines.slice(1).join('\n'));
      cs.push(second);
    }
    if (['split_mail', 'split_both'].includes(mode)) {
      const parts = val(tech, '--body')
        .split('\n')
        .map((line, i) => {
          const c = structuredClone(tech);
          set(c, '--body', (i ? 'technical | ' : '') + line);
          return c;
        });
      cs.splice(cs.indexOf(tech), 1, ...parts);
    }
    if (mode === 'missing_details')
      set(
        report,
        '--text',
        val(report, '--text').replace('\nInstall wizard broken', ''),
      );
    if (mode === 'wrong_count')
      set(
        report,
        '--text',
        val(report, '--text').replace('technical=4', 'technical=3'),
      );
    if (mode === 'duplicate_report') cs.push(structuredClone(report));
    if (mode === 'no_report') cs = cs.filter((c) => c !== report);
    if (mode === 'missing_literal')
      set(
        report,
        '--text',
        val(report, '--text').replace('categorization', '分类'),
      );
    if (mode === 'missing_mail') cs = cs.filter((c) => c !== tech);
    if (mode === 'wrong_lead') {
      const bill = mails.find((c) => val(c, '--to').startsWith('billing-'));
      const to = val(bill, '--to');
      set(bill, '--to', val(tech, '--to'));
      set(tech, '--to', to);
    }
    if (mode === 'empty_mail')
      set(tech, '--body', 'Tickets have been processed.');
    if (mode === 'closed_changed') {
      const c = structuredClone(cs.find((c) => c.includes('--record-id')));
      set(c, '--record-id', 'rec_zoho_desk_tickets_cat_t8');
      set(c, '--json', JSON.stringify({ classification: 'billing' }));
      cs.push(c);
    }
    if (mode === 'wrong_classification') {
      const c = cs.find((c) => c.includes('rec_zoho_desk_tickets_cat_t4'));
      set(
        c,
        '--json',
        JSON.stringify({
          classification: 'billing',
          priority: 'Medium',
          department: 'billing',
        }),
      );
    }
    if (mode === 'public_comment') {
      const c = cs.find(
        (c) =>
          c.includes('--json') &&
          val(c, '--json').includes('"ticket_id": "cat_t5"'),
      );
      const d = JSON.parse(val(c, '--json'));
      d.is_public = 'true';
      set(c, '--json', JSON.stringify(d));
    }
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
          'split_report',
          'split_mail',
          'split_both',
          'missing_details',
          'wrong_count',
          'duplicate_report',
          'wrong_lead',
          'empty_mail',
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
