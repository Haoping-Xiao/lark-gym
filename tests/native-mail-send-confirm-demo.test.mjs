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
  [309, 3061],
  [306, 3062],
]) {
  test('native email confirmation and demo followup ' + n, async () => {
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
        'wrong_recipient',
        'wrong_subject',
        'missing_keyword',
        'subject_only',
        'wrong_fact',
        'wrong_time_or_deadline',
        ...(n === 3062 ? ['no_thanks', 'no_dashboard'] : []),
      ]) {
        let cs = structuredClone(original),
          c = cs[0],
          body = c.indexOf('--body') + 1,
          sub = c.indexOf('--subject') + 1;
        if (mode === 'no_send') cs = [];
        if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
        if (mode === 'wrong_recipient')
          c[c.indexOf('--to') + 1] = 'other@example.com';
        if (mode === 'wrong_subject') c[sub] = 'Other';
        if (mode === 'natural')
          c[body] =
            n === 3061
              ? 'Maya，会议已确认：February 25，美东标准时间上午十点。'
              : 'Derek，感谢今天参加演示。我们展示了工作流自动化（workflow automation）和报表仪表盘，本周结束前会发方案（proposal）。';
        if (mode === 'missing_keyword')
          c[body] =
            n === 3061
              ? 'Maya, your meeting is confirmed for Feb 25 at 10 AM EST.'
              : 'Derek, thanks for your time today. We showed automated workflows and reporting dashboards and will send a proposal by the end of this week.';
        if (mode === 'subject_only') c[body] = 'Thank you.';
        if (mode === 'wrong_fact')
          c[body] =
            n === 3061
              ? 'Maya, your February 25 meeting at 10 AM EST is cancelled.'
              : 'Derek, thanks for your time today. We did not demonstrate workflow automation or reporting dashboards. We will not send a proposal.';
        if (mode === 'wrong_time_or_deadline')
          c[body] =
            n === 3061
              ? 'Maya, your meeting is confirmed for February 25 at 11 AM EST.'
              : 'Derek, thanks for your time today. We showed workflow automation and reporting dashboards. We will send the proposal next month.';
        if (mode === 'no_thanks')
          c[body] =
            'Derek, we showed workflow automation and reporting dashboards today. We will send a proposal by end of this week.';
        if (mode === 'no_dashboard')
          c[body] =
            'Derek, thank you for your time today. We showed workflow automation and will send a proposal by end of this week.';
        if (mode === 'html') {
          c[body] = '<p>' + c[body] + '</p>';
        }
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
              'wrong_time_or_deadline',
              'no_thanks',
              'no_dashboard',
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
