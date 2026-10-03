import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Renewal reviews preserve account, amount notice and internal attendee constraints', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'renewal-review-')),
    task = repo + '/tasks/automationbench-sales-1181',
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
      'chinese_text',
      'formatted_amount',
      'no_description',
      'lower_title',
      'healthy_natural',
      'record_ids',
      'missing_account_title',
      'invite_customer',
      'risk_contract',
      'auto_contract',
      'wrong_priority',
      'wrong_date',
      'wrong_account',
      'missing_notice_amount',
      'missing_task_name',
    ]) {
      const cs = structuredClone(original),
        events = cs.filter((c) => c[0] === 'calendar' && c[1] === 'events'),
        creates = cs.filter((c) => c[1] === '+record-upsert'),
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o)),
        change = (c, f) => {
          const o = get(c);
          f(o);
          put(c, o);
        };
      if (mode === 'chinese_text')
        change(events[1], (o) => {
          o.summary = 'AtRiskCo 客户成功内部复核';
          o.description = 'AtRiskCo｜80,000｜内部讨论尚未解决的性能问题';
        });
      if (mode === 'formatted_amount')
        change(
          events[1],
          (o) =>
            (o.description =
              'AtRiskCo | 80,000 | internal | Performance issues'),
        );
      if (mode === 'no_description')
        for (const [i, e] of events.entries())
          change(e, (o) => {
            delete o.description;
            o.summary =
              i === 0 ? 'HealthyCo Renewal Discussion' : 'AtRiskCo 内部CSM复核';
          });
      if (mode === 'lower_title')
        change(events[1], (o) => (o.summary = 'atriskco CSM review'));
      if (mode === 'healthy_natural')
        change(events[0], (o) => (o.summary = 'HealthyCo 续约讨论'));
      if (mode === 'record_ids')
        for (const c of creates)
          change(c, (o) => {
            for (const k of ['account_id', 'related_to_id'])
              if (o[k]) o[k] = 'rec_' + o[k];
          });
      if (mode === 'missing_account_title')
        change(events[1], (o) => (o.summary = '内部CSM复核'));
      if (mode === 'wrong_amount')
        change(
          events[1],
          (o) =>
            (o.description =
              'AtRiskCo | 8,000 | internal | Performance issues'),
        );
      if (mode === 'invite_customer') {
        const c = structuredClone(cs.find((c) => c[1] === 'event.attendees'));
        c[c.indexOf('--event-id') + 1] = 'evt_2';
        change(
          c,
          (o) =>
            (o.attendees[0].third_party_email = 'contact@atriskco.example.com'),
        );
        cs.push(c);
      }
      if (['risk_contract', 'auto_contract'].includes(mode)) {
        const c = structuredClone(creates[0]);
        change(c, (o) => {
          o.account_id =
            mode === 'risk_contract' ? '001xx000003CRC2' : '001xx000003CRC3';
          o.recipient_email =
            mode === 'risk_contract'
              ? 'contact@atriskco.example.com'
              : 'contact@autorenewco.example.com';
          o.amount = mode === 'risk_contract' ? 80000 : 55000;
        });
        cs.push(c);
      }
      if (mode === 'wrong_priority')
        change(creates[1], (o) => (o.priority = 'Low'));
      if (mode === 'wrong_date')
        change(events[1], (o) => {
          o.start_time.timestamp = String(+o.start_time.timestamp + 86400);
          o.end_time.timestamp = String(+o.end_time.timestamp + 86400);
        });
      if (mode === 'wrong_account')
        change(creates[1], (o) => (o.related_to_id = 'rec_001xx000003CRC1'));
      if (mode === 'missing_notice_amount')
        cs.at(-1)[cs.at(-1).length - 1] = cs
          .at(-1)
          .at(-1)
          .replace('120000', '120,000');
      if (mode === 'missing_task_name')
        change(creates[1], (o) => (o.subject = '客户成功风险复核'));
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
            'chinese_text',
            'formatted_amount',
            'no_description',
            'lower_title',
            'healthy_natural',
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
