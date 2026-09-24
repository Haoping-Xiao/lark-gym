import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('SLA workflows accept per-account ordering and check state before alerts', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'sla-order-')),
    task = repo + '/tasks/automationbench-sales-831',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  await fs.mkdir(a + '/states', { recursive: true });
  try {
    for (const mode of [
      'reference',
      'per_account',
      'reverse_accounts',
      'interleaved',
      'combined',
      'combined_interleaved',
      'early_note',
      'early_alert',
      'early_combined',
      'placeholder_note',
      'wrong_owner',
      'wrong_parent',
      'wrong_hours',
      'missing_account',
      'duplicate_alert',
      'no_description',
      'short_description',
      'wrong_description',
      'skipped_report',
    ]) {
      let cs = structuredClone(original);
      const reads = cs.slice(0, 7),
        [t0, t1, n0, n1, m0, m1] = cs.slice(7),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        },
        combined = structuredClone(m0);
      combined[combined.length - 1] += '\n' + m1.at(-1);
      if (mode === 'per_account') cs = [...reads, t0, n0, m0, t1, n1, m1];
      if (mode === 'reverse_accounts') cs = [...reads, t1, n1, m1, t0, n0, m0];
      if (mode === 'interleaved') cs = [...reads, t1, t0, n0, m0, n1, m1];
      if (mode === 'combined') cs = [...reads, t0, t1, n0, n1, combined];
      if (mode === 'combined_interleaved')
        cs = [...reads, t0, n0, t1, n1, combined];
      if (mode === 'early_note') cs = [...reads, n0, t0, t1, n1, m0, m1];
      if (mode === 'early_alert') cs = [...reads, t0, t1, m0, n0, n1, m1];
      if (mode === 'early_combined') cs = [...reads, t0, t1, n0, combined, n1];
      if (mode === 'placeholder_note') {
        const bad = structuredClone(n0);
        change(
          bad,
          (o) =>
            (o.description =
              'SLA breach | EnterpriseCo | 1 hour | target 24 hours'),
        );
        cs = [...reads, t0, t1, bad, m0, n0, n1, m1];
      }
      if (mode === 'wrong_owner')
        change(t0, (o) => (o.owner_id = 'cal_user_rep'));
      if (mode === 'wrong_parent')
        change(t0, (o) => (o.related_to_id = '001xx000003ST01'));
      if (mode === 'wrong_hours')
        m0[m0.length - 1] = m0.at(-1).replace('26 hours', '102 hours');
      if (mode === 'missing_account') cs = [...reads, t0, t1, n0, n1, m0];
      if (mode === 'duplicate_alert') cs.push(structuredClone(m0));
      if (mode === 'no_description')
        for (const c of [t0, t1]) change(c, (o) => delete o.description);
      if (mode === 'short_description')
        for (const c of [t0, t1])
          change(
            c,
            (o) => (o.description = 'Follow up on this account’s SLA breach.'),
          );
      if (mode === 'wrong_description')
        change(
          t0,
          (o) =>
            (o.description =
              'EnterpriseCo is fully within its SLA, no follow-up required.'),
        );
      if (mode === 'skipped_report')
        m1[m1.length - 1] += ' | ProCo 25 hours <=48 hours, skipped.';
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'per_account',
            'reverse_accounts',
            'interleaved',
            'combined',
            'combined_interleaved',
            'placeholder_note',
            'wrong_hours',
            'duplicate_alert',
            'no_description',
            'short_description',
            'wrong_description',
            'skipped_report',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
