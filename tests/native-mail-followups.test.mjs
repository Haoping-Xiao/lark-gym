import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile),
  repo = process.cwd();
for (const [v, n] of [
  [350, 3160],
  [351, 3161],
  [352, 3162],
]) {
  test('native mail source for contact ticket or feedback ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-followup-')),
      t = repo + '/tasks/automationbench-simple-' + n,
      seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
      src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
      original = JSON.parse(
        vm.runInNewContext(
          src
            .slice(
              src.indexOf('const commands'),
              src.indexOf('for (const args'),
            )
            .replace('commands: string[][]', 'commands') +
            '\nJSON.stringify(commands)',
        ),
      );
    await fs.mkdir(a + '/states', { recursive: true });
    for (const mode of [
      'reference',
      'thread',
      'no_read',
      'metadata',
      'read_after',
      'no_write',
      'wrong_value',
      'paraphrase',
      ...(n === 3160
        ? ['wrong_company', 'missing_title', 'duplicate']
        : [
            'no_reply',
            'draft_only',
            'false_reply',
            ...(n === 3161
              ? [
                  'optional_description',
                  'wrong_group',
                  'no_lookup',
                  'false_description',
                ]
              : [
                  'source_date',
                  'processing_date',
                  'wrong_date',
                  'date_before_mail',
                  'missing_feedback',
                  'false_feedback',
                ]),
          ]),
    ]) {
      let cs = structuredClone(original),
        mail = seed.mail.messages[0],
        write = cs.find((c) => c[1] === '+record-upsert'),
        notice = cs.at(-1);
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          mail.mailbox_id,
          '--thread-id',
          mail.thread_id,
          '--as',
          'user',
        ];
      if (mode === 'metadata')
        cs[0] = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          mail.mailbox_id,
          '--message-id',
          mail.message_id,
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'no_read') cs.shift();
      if (mode === 'read_after') cs.push(cs.shift());
      if (mode === 'no_write')
        cs = cs.filter((c) => !['+record-upsert', '+cells-set'].includes(c[1]));
      if (mode === 'no_reply') cs = cs.filter((c) => c !== notice);
      if (mode === 'draft_only')
        notice.splice(notice.indexOf('--confirm-send'), 1);
      if (mode === 'false_reply')
        notice[notice.indexOf('--body') + 1] =
          'We received your inquiry, thank you. Your contract changes have already been approved with a guaranteed refund.';
      if (write) {
        const f = JSON.parse(write.at(-1));
        if (mode === 'wrong_value')
          f[n === 3160 ? 'email' : 'subject'] =
            n === 3160 ? 'hr@company.example.com' : 'Contract already resolved';
        if (mode === 'paraphrase') {
          if (n === 3160) f.title = '高级开发工程师';
          else {
            f.subject = 'Contract SLA renewal inquiry';
            f.description =
              'Patricia asks Legal to discuss changing SLA terms before next month’s renewal.';
          }
        }
        if (mode === 'wrong_company') f.company = 'Other Corp';
        if (mode === 'missing_title') delete f.title;
        if (mode === 'optional_description') delete f.description;
        if (mode === 'wrong_group') f.group_id = 'grp_support';
        if (mode === 'false_description')
          f.description =
            'The legal team has already approved a full refund and cancelled the contract.';
        write[write.length - 1] = JSON.stringify(f);
        if (mode === 'duplicate') cs.push(structuredClone(write));
        if (mode === 'no_lookup')
          cs = cs.filter((c) => c[1] !== '+record-list');
      } else {
        const writes = cs.filter((c) => c[1] === '+cells-set'),
          name = writes.find((c) => c.includes('A2')),
          feedback = writes.find((c) => c.includes('C2'));
        if (mode === 'wrong_value')
          name[name.length - 1] = '[[{"value":"Other Person"}]]';
        if (mode === 'paraphrase')
          feedback[feedback.length - 1] = JSON.stringify([
            [
              {
                value:
                  'Tom praises the new reporting feature for saving the team hours each week.',
              },
            ],
          ]);
        if (mode === 'missing_feedback') cs = cs.filter((c) => c !== feedback);
        if (mode === 'false_feedback')
          feedback[feedback.length - 1] =
            '[[{"value":"Customer requests cancellation because reporting is broken."}]]';
        if (
          [
            'source_date',
            'processing_date',
            'wrong_date',
            'date_before_mail',
          ].includes(mode)
        ) {
          const date = [
            'sheets',
            '+cells-set',
            '--spreadsheet-token',
            'ss_feedback',
            '--sheet-id',
            'sheet1',
            '--range',
            'B2',
            '--cells',
            JSON.stringify([
              [
                {
                  value:
                    mode === 'processing_date'
                      ? '2026-02-24'
                      : mode === 'wrong_date'
                        ? '2027-12-01'
                        : '2026-02-20',
                },
              ],
            ]),
          ];
          if (mode === 'date_before_mail') cs.unshift(date);
          else cs.splice(cs.indexOf(notice), 0, date);
        }
      }
      const b = await startMock(seed);
      try {
        for (const cmd of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const state = a + '/states/' + mode + '.json';
        await fs.writeFile(
          state,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [t + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: state,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        assert.equal(
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'thread',
            'paraphrase',
            ...(n === 3160 ? ['missing_title'] : ['false_reply']),
            ...(n === 3161
              ? [
                  'optional_description',
                  'no_lookup',
                  'false_description',
                  'wrong_value',
                ]
              : []),
            ...(n === 3162
              ? [
                  'source_date',
                  'processing_date',
                  'wrong_date',
                  'false_feedback',
                ]
              : []),
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
    await fs.rm(a, { recursive: true, force: true });
  });
}
