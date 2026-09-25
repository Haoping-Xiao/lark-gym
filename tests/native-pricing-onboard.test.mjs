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
  [367, 3198],
  [368, 3199],
]) {
  test('pricing and customer onboarding real mail ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-pricing-')),
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
      'no_lookup',
      'no_write',
      'no_mail',
      'draft_only',
      'false_body',
      'duplicate_mail',
      'mail_first',
      ...(n === 3198
        ? [
            'thread',
            'metadata',
            'no_read',
            'read_after',
            'wrong_subject',
            'minimal_ticket',
            'paraphrase',
            'wrong_price',
            'missing_plan',
            'invented_features',
            'chinese_reply',
            'new_message',
          ]
        : [
            'wrong_stage',
            'wrong_amount',
            'wrong_recipient',
            'missing_keyword',
          ]),
    ]) {
      let cs = structuredClone(original),
        write = cs.find((c) => c[1] === '+record-upsert'),
        notice = cs.at(-1),
        bi = notice.indexOf('--body') + 1;
      if (mode === 'no_lookup') cs = cs.filter((c) => c[1] !== '+record-list');
      if (mode === 'no_write') cs = cs.filter((c) => c !== write);
      if (mode === 'no_mail') cs.pop();
      if (mode === 'draft_only')
        notice.splice(notice.indexOf('--confirm-send'), 1);
      if (mode === 'duplicate_mail') cs.push(structuredClone(notice));
      if (mode === 'false_body')
        notice[bi] =
          n === 3198
            ? 'Our pricing has been discontinued and we cannot offer any plans.'
            : 'Welcome! Your service has been canceled and your signed contract rejected.';
      if (mode === 'mail_first') {
        cs = cs.filter((c) => c !== notice);
        cs.splice(cs.indexOf(write), 0, notice);
      }
      let f = JSON.parse(write.at(-1));
      if (mode === 'wrong_stage') f.stage = 'Closed Lost';
      if (mode === 'wrong_amount') f.amount = 100;
      if (mode === 'wrong_subject') f.subject = '一般咨询';
      if (mode === 'minimal_ticket') delete f.description;
      if (mode === 'paraphrase')
        f.description = 'Jamie Park的30人团队咨询套餐差异及如何选择。';
      write[write.length - 1] = JSON.stringify(f);
      if (n === 3198) {
        const m = seed.mail.messages[0];
        if (mode === 'no_read') cs.shift();
        if (mode === 'read_after') cs.push(cs.shift());
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
        if (mode === 'wrong_price')
          notice[bi] =
            'Our pricing: Basic $79/month, Pro $29/month, Enterprise custom.';
        if (mode === 'missing_plan')
          notice[bi] =
            'Our pricing: Basic $29/month, Pro $79/month. Please share your requirements.';
        if (mode === 'invented_features')
          notice[bi] =
            'Our pricing: Basic $29/month includes 50 seats, Pro $79/month includes unlimited storage, Enterprise custom.';
        if (mode === 'chinese_reply')
          notice[bi] =
            'Basic每月29美元，Pro每月79美元，Enterprise采用定制报价。请告知贵团队所需功能与用量，以便进一步协助选择。';
        if (mode === 'new_message')
          cs[cs.length - 1] = [
            'mail',
            '+send',
            '--mailbox',
            m.mailbox_id,
            '--to',
            'buyer@startupxyz.example.com',
            '--subject',
            'Re: Question about pricing',
            '--body',
            notice[bi],
            '--confirm-send',
            '--as',
            'user',
          ];
      } else {
        if (mode === 'wrong_recipient')
          notice[notice.indexOf('--to') + 1] = 'other@example.com';
        if (mode === 'missing_keyword')
          notice[bi] = '欢迎Horizon Media成为我们的客户。';
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
            'no_lookup',
            'false_body',
            'mail_first',
            ...(n === 3198
              ? [
                  'thread',
                  'minimal_ticket',
                  'paraphrase',
                  'wrong_price',
                  'missing_plan',
                  'invented_features',
                  'chinese_reply',
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
