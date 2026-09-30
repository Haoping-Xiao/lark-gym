import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Onboarding logs follow their actions without cross-customer barriers', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-411-')),
    t = r + '/tasks/automationbench-support-1450',
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
    'default_mapping',
    'wrong_default_mapping',
    'optional_csm_cc',
    'wrong_csm_cc',
    'reference',
    'per_customer',
    'reverse_customers',
    'title_chinese',
    'log_before_event',
    'log_before_attendees',
    'ticket_log_early',
    'intro_log_early',
    'premature_completed_notice',
    'early_summary',
    'wrong_company',
    'wrong_purpose',
    'missing_attendee',
    'wrong_time',
    'excluded_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      event = cs.find((c) => c[0] === 'calendar' && c[1] === 'events'),
      attendees = cs.find(
        (c) => c[0] === 'calendar' && c[1] === 'event.attendees',
      ),
      mails = cs.filter((c) => c[0] === 'mail' && c[1] === '+send'),
      records = cs.filter((c) => c[0] === 'base' && c[1] === '+record-upsert'),
      logs = cs.filter((c) => c[0] === 'sheets' && c[1] === '+cells-set'),
      reads = cs.filter(
        (c) =>
          !mails.includes(c) &&
          !records.includes(c) &&
          !logs.includes(c) &&
          ![event, attendees, group].includes(c),
      ),
      logrow = (n) =>
        logs.filter((c) => Number(val(c, '--range').match(/\d+/)[0]) === n),
      moveBefore = (items, before) => {
        cs = cs.filter((c) => !items.includes(c));
        cs.splice(cs.indexOf(before), 0, ...items);
      };
    if (mode === 'default_mapping' || mode === 'wrong_default_mapping') {
      const values = [
        'dan@mysteryinc.com',
        'default',
        mode === 'default_mapping'
          ? 'onboarding@company.example.com'
          : 'unrelated@company.example.com',
      ];
      cs.splice(
        cs.indexOf(group),
        0,
        ...values.map((v, i) => [
          'sheets',
          '+cells-set',
          '--spreadsheet-token',
          'ss_playbook',
          '--sheet-id',
          'ws_customer_tiers',
          '--range',
          String.fromCharCode(65 + i) + '5',
          '--values',
          JSON.stringify([[v]]),
        ]),
      );
    }
    if (mode === 'optional_csm_cc' || mode === 'wrong_csm_cc') {
      for (const c of mails) {
        const to = val(c, '--to'),
          cc = {
            'bob@startupco.io': 'csm2@company.example.com',
            'carol@smallbiz.com': 'csm3@company.example.com',
            'dan@mysteryinc.com': 'onboarding@company.example.com',
          }[to];
        if (cc)
          c.push(
            '--cc',
            mode === 'wrong_csm_cc' ? 'unrelated@company.example.com' : cc,
          );
      }
    }
    if (mode === 'per_customer' || mode === 'reverse_customers') {
      const ids = [
        ['ob_t1', ['csm1@company.example.com'], [2, 3, 4, 5]],
        ['ob_t2', ['bob@startupco.io', 'csm2@company.example.com'], [6, 7]],
        ['ob_t3', ['carol@smallbiz.com', 'csm3@company.example.com'], [8]],
        [
          'ob_t4',
          ['dan@mysteryinc.com', 'onboarding@company.example.com'],
          [9],
        ],
      ];
      if (mode === 'reverse_customers') ids.reverse();
      cs = [
        ...reads,
        ...ids.flatMap(([id, to, rows]) => [
          ...(id === 'ob_t1' ? [event, attendees] : []),
          ...records.filter((c) => {
            let d = JSON.parse(val(c, '--json'));
            return (d.ticket_id || d.parent_ticket_id) === id;
          }),
          ...mails.filter((c) => to.includes(val(c, '--to'))),
          ...rows.flatMap(logrow),
        ]),
        group,
      ];
    }
    if (
      [
        'title_chinese',
        'wrong_company',
        'wrong_purpose',
        'wrong_time',
      ].includes(mode)
    ) {
      let d = JSON.parse(val(event, '--data'));
      if (mode === 'wrong_time')
        d.start_time.timestamp = String(Number(d.start_time.timestamp) + 1800);
      else
        d.summary = {
          title_chinese: 'Acme Corp 客户启用启动会',
          wrong_company: 'Other Corp 入职启动会',
          wrong_purpose: 'Acme Corp 续约谈判',
        }[mode];
      set(event, '--data', JSON.stringify(d));
    }
    if (mode === 'log_before_event') moveBefore(logrow(2), event);
    if (mode === 'log_before_attendees') moveBefore(logrow(2), attendees);
    if (mode === 'ticket_log_early') moveBefore(logrow(3), records[0]);
    if (mode === 'intro_log_early')
      moveBefore(
        logrow(8),
        mails.find((c) => val(c, '--to') === 'carol@smallbiz.com'),
      );
    if (mode === 'premature_completed_notice') {
      let c = mails.find((c) => val(c, '--to') === 'csm1@company.example.com');
      set(
        c,
        '--body',
        val(c, '--body') + ' | 此邮件发出前已成功创建会议并完成客户及CSM邀请。',
      );
      moveBefore([c], event);
    }
    if (mode === 'early_summary') moveBefore([group], event);
    if (mode === 'missing_attendee') {
      let d = JSON.parse(val(attendees, '--data'));
      d.attendees = d.attendees.filter(
        (x) => x.third_party_email !== 'csm1@company.example.com',
      );
      set(attendees, '--data', JSON.stringify(d));
    }
    if (mode === 'excluded_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') + ' | OldCo was skipped because already resolved.',
      );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const state = a + '/states/' + mode + '.json';
      await fs.writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'per_customer',
          'reverse_customers',
          'title_chinese',
          'premature_completed_notice',
          'wrong_purpose',
          'excluded_disclosure',
          'optional_csm_cc',
          'default_mapping',
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
