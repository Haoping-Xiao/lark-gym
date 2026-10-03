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
  [360, 3180],
  [361, 3188],
  [362, 3190],
]) {
  test('native project subscriber CSAT ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-project-')),
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
      'no_read',
      'metadata',
      'read_after',
      'thread',
      'no_write',
      ...(n === 3180
        ? ['no_lookup', 'wrong_name', 'wrong_status', 'duplicate']
        : n === 3188
          ? [
              'minimal_contact',
              'no_mail',
              'draft_only',
              'wrong_recipient',
              'missing_keyword',
              'false_welcome',
              'wrong_contact',
            ]
          : [
              'no_notice',
              'wrong_score',
              'missing_name',
              'false_notice',
              'source_date',
              'processing_date',
              'wrong_date',
              'faithful_comment',
              'false_comment',
              'date_before_read',
            ]),
    ]) {
      let cs = structuredClone(original),
        read = cs[0],
        write = cs.find(
          (c) => c[1] === '+record-upsert' || c[1] === '+cells-set',
        ),
        notice = cs.at(-1);
      if (mode === 'no_read') cs.shift();
      if (mode === 'metadata')
        cs[0] = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          seed.mail.messages[0].mailbox_id,
          '--message-id',
          'msg_' + n,
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'read_after') cs.push(cs.shift());
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          read[read.indexOf('--mailbox') + 1],
          '--thread-id',
          'thr_' + n,
          '--as',
          'user',
        ];
      if (mode === 'no_write')
        cs = cs.filter(
          (c) => c[1] !== '+record-upsert' && c[1] !== '+cells-set',
        );
      if (mode === 'no_lookup') cs = cs.filter((c) => c[1] !== '+record-list');
      if (mode === 'duplicate') cs.push(structuredClone(write));
      if (n !== 3190) {
        let f = JSON.parse(write.at(-1));
        if (mode === 'wrong_name') f.Name = 'Another Project';
        if (mode === 'wrong_status') f.Status = 'Complete';
        if (mode === 'minimal_contact') {
          delete f.firstname;
          delete f.lastname;
        }
        if (mode === 'wrong_contact') f.email = 'other@example.com';
        write[write.length - 1] = JSON.stringify(f);
      }
      if (n === 3188) {
        if (mode === 'no_mail') cs.pop();
        if (mode === 'draft_only')
          notice.splice(notice.indexOf('--confirm-send'), 1);
        if (mode === 'wrong_recipient')
          notice[notice.indexOf('--to') + 1] =
            'notifications@company.example.com';
        if (mode === 'missing_keyword')
          notice[notice.indexOf('--body') + 1] = '欢迎加入我们的邮件通讯！';
        if (mode === 'false_welcome')
          notice[notice.indexOf('--body') + 1] =
            'Welcome subscriber! Your paid subscription has been approved and your account charged $100.';
      }
      if (n === 3190) {
        if (mode === 'no_notice') cs.pop();
        if (mode === 'wrong_score')
          cs.find((c) => c.includes('B2')).splice(-1, 1, '[[{"value":8}]]');
        if (mode === 'missing_name') cs = cs.filter((c) => !c.includes('A2'));
        if (mode === 'false_notice')
          notice[notice.indexOf('--text') + 1] =
            'Ben Ortiz gave 9/10 and is fully satisfied; no follow-up is needed.';
        if (
          [
            'source_date',
            'processing_date',
            'wrong_date',
            'faithful_comment',
            'false_comment',
            'date_before_read',
          ].includes(mode)
        ) {
          const comment = mode.includes('comment'),
            val = comment
              ? mode === 'faithful_comment'
                ? '最近客服响应过慢。'
                : '客户赞扬客服回复迅速。'
              : mode === 'processing_date'
                ? '2026-02-24'
                : mode === 'wrong_date'
                  ? '2026-04-01'
                  : '2026-02-22',
            cmd = [
              'sheets',
              '+cells-set',
              '--spreadsheet-token',
              'ss_csat',
              '--sheet-id',
              'sheet1',
              '--range',
              comment ? 'D2' : 'C2',
              '--cells',
              JSON.stringify([[{ value: val }]]),
            ];
          if (mode === 'date_before_read') cs.unshift(cmd);
          else cs.splice(cs.indexOf(notice), 0, cmd);
        }
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
            ...(n === 3180
              ? ['no_lookup']
              : n === 3188
                ? ['minimal_contact', 'false_welcome']
                : [
                    'false_notice',
                    'source_date',
                    'processing_date',
                    'wrong_date',
                    'faithful_comment',
                    'false_comment',
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
