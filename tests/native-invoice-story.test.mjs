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
  r = process.cwd();
for (const [v, n] of [
  [364, 3192],
  [365, 3194],
]) {
  test('invoice and feedback real mail ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-invoice-')),
      t = r + '/tasks/automationbench-simple-' + n,
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
      'missing_keyword',
      'false_notice',
      ...(n === 3192
        ? ['wrong_amount', 'post', 'no_lookup']
        : [
            'paraphrase',
            'summary_only',
            'missing_feedback',
            'wrong_project',
            'wrong_type',
            'draft_only',
            'new_message',
          ]),
    ]) {
      let cs = structuredClone(original),
        m = seed.mail.messages[0],
        write = cs.find((c) => c[1] === '+record-upsert'),
        notice = cs.at(-1),
        ki = notice.indexOf(n === 3192 ? '--text' : '--body') + 1;
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          m.mailbox_id,
          '--thread-id',
          m.thread_id,
          '--as',
          'user',
        ];
      if (mode === 'metadata')
        cs[0] = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          m.mailbox_id,
          '--message-id',
          m.message_id,
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'no_read') cs.shift();
      if (mode === 'read_after') cs.push(cs.shift());
      if (mode === 'no_write') cs = cs.filter((c) => c !== write);
      if (mode === 'no_notice') cs.pop();
      if (mode === 'missing_keyword')
        notice[ki] =
          n === 3192
            ? '已登记CloudHost账单，金额4500美元。'
            : '感谢您的建议，已记录供评审。';
      if (mode === 'false_notice')
        notice[ki] =
          n === 3192
            ? 'CloudHost invoice was paid in full, $4,500 transferred.'
            : 'Thank you! Bulk export is already released and available to all users.';
      let f = JSON.parse(write.at(-1));
      if (mode === 'wrong_value')
        f[n === 3192 ? 'Vendor' : 'summary'] = 'Another item';
      if (mode === 'wrong_amount') f.Amount = 45000;
      if (mode === 'wrong_project') f.project = 'OTHER';
      if (mode === 'wrong_type') f.issue_type = 'Bug';
      if (mode === 'paraphrase')
        f.description =
          '客户希望一次性将全部记录批量导出为CSV，并自选列；当前只能逐页导出。';
      if (mode === 'summary_only') {
        f.summary =
          'bulk export: export all records as CSV with custom column selection instead of one page at a time';
        delete f.description;
      }
      if (mode === 'missing_feedback') {
        f.summary = 'bulk export';
        delete f.description;
      }
      write[write.length - 1] = JSON.stringify(f);
      if (mode === 'no_lookup') cs = cs.filter((c) => c[1] !== '+record-list');
      if (mode === 'draft_only')
        notice.splice(notice.indexOf('--confirm-send'), 1);
      if (mode === 'new_message')
        cs[cs.length - 1] = [
          'mail',
          '+send',
          '--mailbox',
          m.mailbox_id,
          '--to',
          'power.user@datadrive.example.com',
          '--subject',
          'Re: Suggestion: Bulk export feature',
          '--body',
          notice[ki],
          '--confirm-send',
          '--as',
          'user',
        ];
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
              title: 'Invoice',
              content: [
                [
                  {
                    tag: 'text',
                    text: '已登记CloudHost invoice CH-2026-0089，金额4500美元。',
                  },
                ],
              ],
            },
          }),
        );
      }
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
        await exec(process.execPath, [t + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: p,
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
            ...(n === 3192
              ? ['post', 'no_lookup']
              : [
                  'paraphrase',
                  'summary_only',
                  'missing_feedback',
                  'missing_keyword',
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
