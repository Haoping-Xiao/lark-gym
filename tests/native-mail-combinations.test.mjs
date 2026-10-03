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
  [353, 3163],
  [354, 3164],
  [355, 3165],
]) {
  test('native mail combined event deal or project ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-combinations-')),
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
      'no_notice',
      'wrong_value',
      'false_notice',
      ...(n === 3163
        ? [
            'notice_before_event',
            'client_attendee',
            'wrong_duration',
            'missing_keyword',
          ]
        : n === 3164
          ? ['post', 'wrong_amount', 'missing_keyword']
          : [
              'source_date',
              'processing_date',
              'wrong_date',
              'chinese_reply',
              'missing_next_steps',
              'missing_status',
            ]),
    ]) {
      let cs = structuredClone(original),
        mail = seed.mail.messages[0],
        notice = cs.at(-1),
        write = n === 3163 ? cs[1] : cs.find((c) => c[1] === '+record-upsert');
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
        cs = cs.filter((c) => c !== write && c[1] !== '+cells-set');
      if (mode === 'no_notice') cs = cs.filter((c) => c !== notice);
      const k = notice.indexOf(n === 3164 ? '--text' : '--body') + 1;
      if (mode === 'false_notice')
        notice[k] =
          n === 3164
            ? 'Vertex Labs has signed and paid $750,000, and the partnership is already closed.'
            : n === 3163
              ? 'February 26 at 9am UTC is confirmed.'
              : 'The next Phase 3 is already complete and approved.';
      if (mode === 'missing_next_steps') notice[k] = '已收到，谢谢。';
      if (mode === 'missing_keyword' || mode === 'chinese_reply')
        notice[k] =
          n === 3164
            ? '已登记合作机会，预算75000美元。'
            : n === 3163
              ? 'The meeting is confirmed for Feb 26, 2026, 14:00–15:00 UTC.'
              : '已收到并记录二阶段完成，后续准备开展三阶段。';
      if (n === 3163) {
        let e = JSON.parse(write.at(-1));
        if (mode === 'wrong_value') {
          e.start_time.timestamp = String(+e.start_time.timestamp + 3600);
          e.end_time.timestamp = String(+e.end_time.timestamp + 3600);
        }
        if (mode === 'wrong_duration')
          e.end_time.timestamp = String(+e.start_time.timestamp + 1800);
        write[write.length - 1] = JSON.stringify(e);
        if (mode === 'notice_before_event') cs = [cs[0], notice, write];
        if (mode === 'client_attendee')
          cs.splice(cs.indexOf(notice), 0, [
            'calendar',
            'event.attendees',
            'create',
            '--calendar-id',
            'cal_primary',
            '--event-id',
            'evt_1',
            '--data',
            JSON.stringify({
              attendees: [
                {
                  type: 'third_party',
                  third_party_email: mail.head_from.mail_address,
                },
              ],
            }),
          ]);
      }
      if (n === 3164) {
        let f = JSON.parse(write.at(-1));
        if (mode === 'wrong_value') f.dealname = 'Other Partnership';
        if (mode === 'wrong_amount') f.amount = 750000;
        write[write.length - 1] = JSON.stringify(f);
        if (mode === 'post') {
          const i = notice.indexOf('--text');
          notice.splice(
            i,
            2,
            '--msg-type',
            'post',
            '--content',
            JSON.stringify({
              zh_cn: {
                title: 'Partnership opportunity',
                content: [
                  [
                    {
                      tag: 'text',
                      text: 'Vertex Labs is interested in co-marketing with an initial budget of $75,000. The opportunity has been recorded.',
                    },
                  ],
                ],
              },
            }),
          );
        }
      }
      if (n === 3165) {
        const status = cs.find(
          (c) => c[1] === '+cells-set' && c.includes('B2'),
        );
        if (mode === 'wrong_value')
          status[status.length - 1] = '[[{"value":"Phase 3 Complete"}]]';
        if (mode === 'missing_status') cs = cs.filter((c) => c !== status);
        if (['source_date', 'processing_date', 'wrong_date'].includes(mode))
          cs.splice(cs.indexOf(notice), 0, [
            'sheets',
            '+cells-set',
            '--spreadsheet-token',
            'ss_projects',
            '--sheet-id',
            'sheet1',
            '--range',
            'C2',
            '--cells',
            JSON.stringify([
              [
                {
                  value:
                    mode === 'source_date'
                      ? '2026-02-21'
                      : mode === 'processing_date'
                        ? '2026-02-24'
                        : '2027-12-01',
                },
              ],
            ]),
          ]);
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
            'false_notice',
            ...(n === 3163
              ? ['client_attendee']
              : n === 3164
                ? ['post']
                : [
                    'source_date',
                    'processing_date',
                    'wrong_date',
                    'chinese_reply',
                    'missing_next_steps',
                  ]),
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
