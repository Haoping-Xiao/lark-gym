import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('escalation preserves business constraints and reviewed output equivalence', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'escalation-')),
    t = r + '/tasks/automationbench-support-1495',
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
    'split_group',
    'split_both',
    'missing_ticket',
    'duplicate',
    'wrong_count',
    'wrong_manager',
    'wrong_priority',
    'held_changed',
    'skipped_disclosure',
    'no_group',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      mails = cs.filter((c) => c[0] === 'mail'),
      lines = val(group, '--text').split('\n'),
      copy = (c, k, text) => {
        const d = structuredClone(c);
        set(d, k, text);
        return d;
      };
    if (
      [
        'split_group',
        'split_both',
        'missing_ticket',
        'duplicate',
        'wrong_count',
      ].includes(mode)
    ) {
      const parts = [lines.slice(0, 5).join('\n'), lines.slice(5).join('\n')];
      if (mode === 'missing_ticket') parts[1] = lines[5];
      if (mode === 'duplicate') parts.push(lines[1]);
      if (mode === 'wrong_count')
        parts[0] = parts[0].replace('6 tickets', '7 tickets');
      cs.splice(
        cs.indexOf(group),
        1,
        ...parts.map((x) => copy(group, '--text', x)),
      );
    }
    if (mode === 'split_both')
      for (const m of mails) {
        const parts = val(m, '--body').split('\n').slice(1);
        cs.splice(cs.indexOf(m), 1, ...parts.map((x) => copy(m, '--body', x)));
      }
    if (mode === 'wrong_manager')
      set(mails[0], '--to', 't3-manager@company.example.com');
    if (mode === 'wrong_priority') {
      const c = cs.find((c) => c.includes('rec_freshdesk_tickets_fd_e01'));
      const d = JSON.parse(val(c, '--json'));
      d.priority = 4;
      set(c, '--json', JSON.stringify(d));
    }
    if (mode === 'held_changed')
      cs.push([
        'base',
        '+record-upsert',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_1984cace9e49',
        '--record-id',
        'rec_freshdesk_tickets_fd_e11',
        '--json',
        JSON.stringify({ group_id: 'grp_t2', priority: 3 }),
      ]);
    if (mode === 'skipped_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nSkipped fd_e11 Payment processing timeout T1 because it is SUSPENDED.',
      );
    if (mode === 'no_group') cs = cs.filter((c) => c !== group);
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
          'split_group',
          'split_both',
          'missing_ticket',
          'duplicate',
          'wrong_count',
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
