import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('NDA Sent status requires each contacts own completed request and notification', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'nda-status-')),
    task = repo + '/tasks/automationbench-sales-1161',
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
      'per_contact',
      'reverse_contact',
      'record_ids',
      'early_status',
      'before_record',
      'other_person_first',
      'wrong_status_at_update',
      'failed_send',
    ]) {
      const cs = structuredClone(original),
        reads = cs.slice(0, 5),
        records = cs.slice(5, 7),
        messages = cs.slice(7, 9),
        updates = cs.slice(9, 11),
        summary = cs[11],
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o));
      let commands = cs;
      if (['per_contact', 'reverse_contact'].includes(mode))
        commands = [
          ...reads,
          ...(mode === 'reverse_contact' ? [1, 0] : [0, 1]).flatMap((i) => [
            records[i],
            messages[i],
            updates[i],
          ]),
          summary,
        ];
      if (mode === 'record_ids')
        for (const rec of records) {
          const o = get(rec);
          o.contact_id = 'rec_' + o.contact_id;
          put(rec, o);
        }
      if (mode === 'no_internal_id')
        for (const msg of messages)
          msg[msg.length - 1] = msg.at(-1).replace(' | tmpl_nda', '');
      if (mode === 'early_status')
        commands = [
          ...reads,
          ...records,
          updates[0],
          ...messages,
          updates[1],
          summary,
        ];
      if (mode === 'before_record')
        commands = [
          ...reads,
          ...messages,
          updates[0],
          ...records,
          updates[1],
          summary,
        ];
      if (mode === 'other_person_first')
        commands = [
          ...reads,
          ...records,
          messages[1],
          updates[0],
          messages[0],
          updates[1],
          summary,
        ];
      if (mode === 'wrong_status_at_update') {
        const o = get(records[0]);
        o.status = 'Draft';
        put(records[0], o);
        const fix = structuredClone(records[0]);
        fix.splice(fix.indexOf('--json'), 0, '--record-id', 'rec_created_1');
        put(fix, { status: 'Sent' });
        commands = [...cs, fix];
      }
      if (mode === 'wrong_contact') {
        const o = get(records[0]);
        o.contact_id = 'rec_003xx000004BNS9';
        put(records[0], o);
      }
      if (mode === 'wrong_template') {
        const o = get(records[0]);
        o.template_id = 'tmpl_unilateral_w8r4';
        o.template_name = 'Unilateral NDA';
        put(records[0], o);
      }
      if (mode === 'wrong_already')
        summary[summary.length - 1] = summary
          .at(-1)
          .replace('already=0', 'already=3');
      if (mode === 'missing_already')
        summary[summary.length - 1] = summary
          .at(-1)
          .replace('already=0', '已持有=0');
      if (mode === 'send_hold') {
        const extra = structuredClone(records[0]);
        put(extra, {
          contact_id: '003xx000004BNS5',
          template_id: 'tmpl_nda',
          template_name: 'Mutual NDA',
          signer_name: 'LegalHold Pending Corp',
          signer_email: 'legalpending@company7.example.com',
          status: 'Sent',
        });
        commands = [...cs, extra];
      }
      if (mode === 'failed_send') {
        const bad = structuredClone(messages[0]);
        bad[bad.indexOf('--chat-id') + 1] = 'oc_missing';
        commands = [
          ...reads,
          ...records,
          bad,
          updates[0],
          ...messages,
          updates[1],
          summary,
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
            'per_contact',
            'reverse_contact',
            'record_ids',
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
