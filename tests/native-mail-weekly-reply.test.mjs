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
  [307, 3063],
  [308, 3064],
]) {
  test('native email weekly facts and source-linked reply ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-send-')),
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
    try {
      for (const mode of [
        'reference',
        'natural',
        'html',
        'draft_only',
        'no_send',
        'missing_keyword',
        'wrong_fact',
        ...(n === 3063
          ? [
              'wrong_recipient',
              'wrong_subject',
              'no_dashboard',
              'wrong_progress',
              'wrong_deadline',
            ]
          : [
              'thread',
              'reply_only',
              'direct_send',
              'no_link',
              'spoof_link',
              'wrong_plan',
              'wrong_unit',
            ]),
      ]) {
        let cs = structuredClone(original),
          c = cs.at(-1),
          body = c.indexOf('--body') + 1;
        if (mode === 'no_send') cs = [];
        if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
        if (mode === 'wrong_recipient')
          c[c.indexOf('--to') + 1] = 'other@example.com';
        if (mode === 'wrong_subject') c[c.indexOf('--subject') + 1] = 'Other';
        if (mode === 'natural')
          c[body] =
            n === 3063
              ? 'Salesforce API 集成已经完成；客户入职仪表盘（onboarding dashboard）完成了百分之八十。下周重点是 QA 测试与修复缺陷。'
              : 'Tomoko，标准套餐每分钟 1000 次 API 调用，企业套餐每分钟 10000 次。文档：[限流说明](https://docs.brightpath.example.com/rate-limits)';
        if (mode === 'missing_keyword')
          c[body] =
            n === 3063
              ? 'The API integration is complete. The customer onboarding dashboard is 80% done. Next week we focus on QA testing and bug fixes.'
              : 'The standard plan allows one thousand calls per minute and enterprise ten thousand. https://docs.brightpath.example.com/rate-limits';
        if (mode === 'wrong_fact')
          c[body] =
            n === 3063
              ? 'The Salesforce API integration has not started. The onboarding dashboard is 80% complete. Next week is QA testing and bug fixes.'
              : 'We do not support the standard 1,000 or enterprise 10,000 API limits. https://docs.brightpath.example.com/rate-limits';
        if (mode === 'no_dashboard')
          c[body] =
            'The Salesforce API integration is complete. Next week we focus on QA testing and bug fixes.';
        if (mode === 'wrong_progress') c[body] = c[body].replace('80%', '100%');
        if (mode === 'wrong_deadline')
          c[body] = c[body].replace('Next week', 'Next month');
        if (mode === 'thread')
          cs[0] = [
            'mail',
            '+thread',
            '--mailbox',
            'support@brightpath.example.com',
            '--thread-id',
            'thread_4001',
            '--as',
            'user',
          ];
        if (mode === 'reply_only') cs = [c];
        if (mode === 'direct_send')
          cs[1] = [
            'mail',
            '+send',
            '--mailbox',
            'support@brightpath.example.com',
            '--to',
            'tomoko.ishida@sakuratech.example.com',
            '--subject',
            'Re: Question about API rate limits',
            '--body',
            c[body],
            '--confirm-send',
            '--as',
            'user',
          ];
        if (mode === 'no_link') c[body] = c[body].split(' Documentation:')[0];
        if (mode === 'spoof_link')
          c[body] = c[body].replace(
            'https://docs.brightpath.example.com/rate-limits',
            '[https://docs.brightpath.example.com/rate-limits](https://wrong.example.com/)',
          );
        if (mode === 'wrong_plan')
          c[body] =
            'Standard: 10,000 API calls per minute. Enterprise: 1,000 API calls per minute. https://docs.brightpath.example.com/rate-limits';
        if (mode === 'wrong_unit')
          c[body] = c[body].replaceAll('per minute', 'per hour');
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
              'wrong_fact',
              'wrong_progress',
              'wrong_deadline',
              'thread',
              'reply_only',
              'no_link',
              'spoof_link',
              'wrong_plan',
              'wrong_unit',
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
