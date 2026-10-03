import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Contract log requires its own successful send and current Sent request', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'contract-log-')),
    task = repo + '/tasks/automationbench-sales-1156',
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
      'per_customer',
      'government_first',
      'natural_log',
      'early_log',
      'before_record',
      'wrong_status_at_log',
      'failed_send',
      'government_agreement',
      'record_ids',
      'mixed_ids',
      'wrong_record_id',
      'wrong_id_at_log',
    ]) {
      const cs = structuredClone(original),
        reads = cs.slice(0, 7),
        records = cs.slice(7, 11),
        messages = cs.slice(11, 15),
        logs = cs.slice(15, 19),
        gov = cs[19],
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o));
      let commands = cs;
      if (
        [
          'record_ids',
          'mixed_ids',
          'wrong_record_id',
          'wrong_id_at_log',
        ].includes(mode)
      ) {
        for (let i = 0; i < 4; i++) {
          const o = get(records[i]);
          if (mode !== 'mixed_ids' || i % 2 === 0)
            o.opportunity_id = 'rec_' + o.opportunity_id;
          put(records[i], o);
        }
        if (mode === 'wrong_record_id') {
          const o = get(records[0]);
          o.opportunity_id = 'rec_opp_small';
          put(records[0], o);
        }
        if (mode === 'wrong_id_at_log') {
          const o = get(records[0]);
          o.opportunity_id = 'rec_opp_small';
          put(records[0], o);
          const fix = structuredClone(records[0]);
          fix.splice(fix.indexOf('--json'), 0, '--record-id', 'rec_created_1');
          put(fix, { opportunity_id: 'rec_opp_health' });
          commands = [...cs, fix];
        }
      }

      if (['per_customer', 'reverse_customer', 'natural_log'].includes(mode))
        commands = [
          ...reads,
          ...(mode === 'reverse_customer'
            ? [3, 2, 1, 0]
            : [0, 1, 2, 3]
          ).flatMap((i) => [records[i], messages[i], logs[i]]),
          gov,
        ];
      if (mode === 'natural_log')
        for (let i = 0; i < 4; i++)
          put(logs[i], {
            description: '已发送合同：' + get(records[i]).template_name,
          });
      if (mode === 'government_first')
        commands = [...reads, gov, ...cs.slice(7, 19)];
      if (mode === 'early_log')
        commands = [
          ...reads,
          ...records,
          logs[0],
          ...messages,
          ...logs.slice(1),
          gov,
        ];
      if (mode === 'before_record')
        commands = [
          ...reads,
          ...messages,
          logs[0],
          ...records,
          ...logs.slice(1),
          gov,
        ];
      if (mode === 'missing_record')
        commands = cs.filter((c) => c !== records[0]);
      if (mode === 'missing_message')
        commands = cs.filter((c) => c !== messages[0]);
      if (mode === 'wrong_status_at_log') {
        const o = get(records[0]);
        o.status = 'Draft';
        put(records[0], o);
        const fix = structuredClone(records[0]);
        fix.splice(fix.indexOf('--json'), 0, '--record-id', 'rec_created_1');
        put(fix, { status: 'Sent' });
        commands = [...cs, fix];
      }
      if (mode === 'wrong_template') {
        const o = get(records[0]);
        o.template_id = 'tmpl_enterprise';
        o.template_name = 'Enterprise Agreement';
        put(records[0], o);
      }
      if (['government_signature', 'hold_signature'].includes(mode)) {
        const extra = structuredClone(records[0]);
        put(extra, {
          opportunity_id:
            mode === 'government_signature' ? 'opp_gov' : 'opp_hold',
          template_id: 'tmpl_standard',
          template_name: 'Standard Agreement',
          signer_email:
            mode === 'government_signature'
              ? 'buyer@govcorp.example.com'
              : 'dreeves@meridian.example.com',
          status: 'Sent',
        });
        commands = [...cs, extra];
      }
      if (mode === 'government_agreement')
        put(gov, {
          description: 'Procurement review required; no Agreement sent',
        });
      if (mode === 'failed_send') {
        const bad = structuredClone(messages[0]);
        bad[bad.indexOf('--chat-id') + 1] = 'oc_missing';
        commands = [
          ...reads,
          ...records,
          bad,
          logs[0],
          ...messages,
          ...logs.slice(1),
          gov,
        ];
      }
      const b = await startMock(seed);
      try {
        for (const c of commands) {
          try {
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          } catch (e) {
            if (mode !== 'failed_send' || !c.includes('oc_missing')) throw e;
          }
        }
        const errors = b.calls.filter((c) => c.status >= 400);
        if (errors.length && mode !== 'failed_send') throw Error(mode);
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
        const result = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          result.business_success,
          [
            'reference',
            'per_customer',
            'government_first',
            'natural_log',
            'record_ids',
            'mixed_ids',
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
