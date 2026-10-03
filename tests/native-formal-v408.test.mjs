import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Sync progress follows successful complete contact updates, including retries', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-408-')),
    t = r + '/tasks/automationbench-support-1514',
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
    'per_customer',
    'reverse_customers',
    'split_fields',
    'failed_retry_log',
    'early_log',
    'count_only',
    'failed_log_retry',
    'rollback',
    'missing_log',
    'excluded_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      updates = cs.filter(
        (c) => c[1] === '+record-upsert' && c.includes('--record-id'),
      ),
      creates = cs.filter(
        (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
      ),
      logs = creates.filter(
        (c) => JSON.parse(val(c, '--json')).status === 'Synced',
      ),
      reads = cs.filter(
        (c) => !updates.includes(c) && !creates.includes(c) && c !== group,
      ),
      copy = (c, body) => {
        let d = structuredClone(c);
        set(d, '--json', JSON.stringify(body));
        return d;
      },
      u = updates[0],
      good = JSON.parse(val(u, '--json')),
      log = logs[0];
    if (['per_customer', 'reverse_customers'].includes(mode)) {
      const order = mode === 'per_customer' ? [0, 1, 2] : [2, 1, 0];
      cs = [
        ...reads,
        ...order.flatMap((i) => [
          updates[i],
          ...creates.filter((c) => {
            let d = JSON.parse(val(c, '--json'));
            return (d.contact_id || d.who_id) === 'sf_h' + (i + 1);
          }),
        ]),
        group,
      ];
    }
    if (mode === 'split_fields')
      cs.splice(
        cs.indexOf(u),
        1,
        copy(u, { support_ticket_count: good.support_ticket_count }),
        copy(u, { support_last_interaction: good.support_last_interaction }),
      );
    if (mode === 'early_log') {
      cs.splice(cs.indexOf(log), 1);
      cs.splice(cs.indexOf(u), 0, log);
    }
    if (mode === 'count_only') {
      set(
        u,
        '--json',
        JSON.stringify({ support_ticket_count: good.support_ticket_count }),
      );
      cs.splice(
        cs.indexOf(log) + 1,
        0,
        copy(u, { support_last_interaction: good.support_last_interaction }),
      );
    }
    let failCommand;
    if (mode === 'failed_retry_log' || mode === 'failed_log_retry') {
      failCommand = copy(u, { unsupported_field: 'fail' });
      cs.splice(cs.indexOf(u), 0, failCommand);
      if (mode === 'failed_log_retry') {
        cs.splice(cs.indexOf(log), 1);
        cs.splice(cs.indexOf(u), 0, log);
      }
    }
    if (mode === 'rollback') {
      cs.splice(cs.indexOf(log), 0, copy(u, { support_ticket_count: 0 }));
      cs.splice(cs.indexOf(log) + 1, 0, copy(u, good));
    }
    if (mode === 'missing_log') cs = cs.filter((c) => c !== log);
    if (mode === 'excluded_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') + '\nTwo unmatched customers were skipped.',
      );
    const b = await startMock(seed);
    try {
      for (const c of cs) {
        try {
          await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
          if (c === failCommand) throw Error('failure expected');
        } catch (e) {
          if (c !== failCommand || e.message === 'failure expected') throw e;
        }
      }
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
          'per_customer',
          'reverse_customers',
          'split_fields',
          'failed_retry_log',
          'excluded_disclosure',
        ].includes(mode),
        mode,
      );
      assert.equal(
        b.calls.filter((c) => c.status >= 400).length,
        mode.startsWith('failed_') ? 1 : 0,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
