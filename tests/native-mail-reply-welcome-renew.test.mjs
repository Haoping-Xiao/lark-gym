import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
const exec = promisify(execFile),
  repo = process.cwd();
for (const [v, n] of [
  [310, 3065],
  [311, 3068],
  [312, 3069],
  [313, 3070],
]) {
  test('native reply, welcome and renewal mail ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-flow-')),
      task = repo + '/tasks/automationbench-simple-' + n,
      seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
      src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
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
    const incoming = seed.mail.messages[0],
      reply = !!incoming;
    try {
      for (const mode of [
        'reference',
        'natural',
        'html',
        'draft_only',
        'no_send',
        'missing_keyword',
        'wrong_fact',
        'wrong_unit_or_time',
        'omit_requirement',
        ...(reply
          ? ['thread', 'reply_only', 'direct_send']
          : ['wrong_recipient', 'wrong_subject']),
        ...(n === 3068
          ? ['wrong_discount', 'already_fixed']
          : ['no_link', 'spoof_link']),
      ]) {
        let cs = structuredClone(original),
          c = cs.at(-1),
          body = c.indexOf('--body') + 1;
        if (mode === 'no_send') cs = [];
        if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
        if (mode === 'wrong_recipient')
          c[c.indexOf('--to') + 1] = 'other@example.com';
        if (mode === 'wrong_subject') c[c.indexOf('--subject') + 1] = 'Other';
        if (mode === 'thread')
          cs[0] = [
            'mail',
            '+thread',
            '--mailbox',
            incoming.mailbox_id,
            '--thread-id',
            incoming.thread_id,
            '--as',
            'user',
          ];
        if (mode === 'reply_only') cs = [c];
        if (mode === 'direct_send')
          cs[1] = [
            'mail',
            '+send',
            '--mailbox',
            incoming.mailbox_id,
            '--to',
            incoming.head_from.mail_address,
            '--subject',
            'Re: ' + incoming.subject,
            '--body',
            c[body],
            '--confirm-send',
            '--as',
            'user',
          ];
        if (mode === 'natural')
          c[body] = {
            3065: 'Luis，Starter 每位用户每月 $49.00，Professional 每位用户每月 $99.00；Enterprise 单独定制报价。如需企业方案，请预约：https://brightpath.example.com/pricing-call 。',
            3068: 'James，很抱歉仪表盘加载缓慢影响了日常工作。工程团队已定位原因，修复将在 48 hours 内部署。我们愿为你下次续约提供 15% 折扣以表歉意。',
            3069: 'Fatima，欢迎！账户已启用，登录地址：https://app.brightpath.example.com 。培训为 March 3，EST 上午十一点。你的专属客户成功经理是 Olivia Park。',
            3070: 'Ben，你的年度合同到期日是 March 31, 2026。若于 3 月 15 日前签署续约，可获 10% 提前续约优惠。请访问 https://renewals.brightpath.example.com 。',
          }[n];
        if (mode === 'missing_keyword')
          c[body] = c[body].replace(
            {
              3065: '$49',
              3068: '48 hours',
              3069: 'March 3',
              3070: 'March 31',
            }[n],
            {
              3065: 'forty-nine US dollars',
              3068: 'two days',
              3069: 'Mar 3',
              3070: 'Mar 31',
            }[n],
          );
        if (mode === 'wrong_fact')
          c[body] = c[body].replace(
            {
              3065: 'Enterprise has custom pricing',
              3068: 'has identified the cause',
              3069: 'Your account is active',
              3070: 'March 31, 2026',
            }[n],
            {
              3065: 'Enterprise is free forever',
              3068: 'has not identified the cause',
              3069: 'Your account is not active',
              3070: 'March 31, 2027',
            }[n],
          );
        if (mode === 'wrong_unit_or_time')
          c[body] = c[body].replaceAll(
            {
              3065: '/month per user',
              3068: 'within 48 hours',
              3069: '11 AM EST',
              3070: 'March 15',
            }[n],
            {
              3065: '/year per team',
              3068: 'after 48 hours',
              3069: '11 PM EST',
              3070: 'March 25',
            }[n],
          );
        if (mode === 'omit_requirement')
          c[body] = c[body].replace(
            {
              3065: 'For Enterprise inquiries, book a call at',
              3068: 'I apologize for the slow dashboard load times affecting your operations. ',
              3069: 'Your account is active and you can log in at https://app.brightpath.example.com . ',
              3070: 'Sign by March 15 to receive a 10% early renewal discount.',
            }[n],
            {
              3065: 'Additional information:',
              3068: '',
              3069: '',
              3070: 'We offer a 10% discount.',
            }[n],
          );
        if (n === 3065 && mode === 'omit_requirement')
          c[body] =
            'Luis, Starter is $49/month per user and Professional is $99/month per user. For Enterprise inquiries book a call at https://brightpath.example.com/pricing-call .';
        if (mode === 'wrong_discount') c[body] = c[body].replace('15%', '50%');
        if (mode === 'already_fixed')
          c[body] = c[body].replace(
            'will deploy a fix within 48 hours',
            'deployed the fix within 48 hours and the issue is fully resolved',
          );
        const url = {
          3065: 'https://brightpath.example.com/pricing-call',
          3069: 'https://app.brightpath.example.com',
          3070: 'https://renewals.brightpath.example.com',
        }[n];
        if (mode === 'no_link') c[body] = c[body].replace(url, '');
        if (mode === 'spoof_link')
          c[body] = c[body].replace(
            url,
            '[' + url + '](https://wrong.example.com/)',
          );
        if (mode === 'html') c[body] = '<p>' + c[body] + '</p>';
        const b = await startMock(seed);
        try {
          for (const cmd of cs)
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          const f = a + '/states/' + mode + '.json';
          await fs.writeFile(
            f,
            JSON.stringify({ seed, world: b.world, calls: b.calls }),
          );
          await exec(process.execPath, [task + '/tests/verify.ts'], {
            env: {
              ...process.env,
              MOCK_STATE: f,
              VERIFIER_OUTPUT: a + '/' + mode + '-program',
            },
            maxBuffer: 8e6,
          });
          assert.equal(
            JSON.parse(
              await fs.readFile(a + '/' + mode + '-program/result.json'),
            ).business_success,
            [
              'reference',
              'natural',
              'html',
              'thread',
              'reply_only',
              'wrong_fact',
              'wrong_unit_or_time',
              'omit_requirement',
              'no_link',
              'spoof_link',
              'already_fixed',
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
}
