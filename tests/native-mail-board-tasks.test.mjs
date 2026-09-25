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
  [336, 3118],
  [344, 3122],
  [345, 3128],
]) {
  test(
    'native mail and mapped target before business creation ' + n,
    async () => {
      const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-board-')),
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
        ...(n === 3118 ? [] : ['discovery_recovery']),
        'thread',
        'no_separate_lookup',
        'no_read',
        'read_after',
        'metadata',
        'no_write',
        'wrong_value',
        ...(n === 3118
          ? ['equivalent_summary', 'extra_title_text']
          : [
              'lookup_after',
              'wrong_list',
              'missing_list',
              ...(n === 3128
                ? [
                    'english',
                    'paraphrase',
                    'missing_action',
                    'wrong_month',
                    'claimed_done',
                  ]
                : []),
            ]),
        'wrong_target',
        ...(n === 3098
          ? ['full_row', 'changed_due_date']
          : [
              'wrong_workspace',
              'duplicate',
              ...(n === 3118 ? ['missing_type'] : []),
            ]),
      ]) {
        let cs = structuredClone(original),
          c = cs.at(-1),
          mail = seed.mail.messages[0];
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
        if (mode === 'no_separate_lookup') cs = [cs[0], c];
        if (mode === 'no_read') cs = cs.slice(1);
        if (mode === 'read_after') cs = [...cs.slice(1), cs[0]];
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
        if (mode === 'no_write') cs = cs.slice(0, -1);
        if (n === 3098) {
          if (mode === 'wrong_value')
            c[c.length - 1] = '[[{"value":"In Progress"}]]';
          if (mode === 'wrong_target') c[c.indexOf('--range') + 1] = 'C3';
          if (mode === 'full_row') {
            c[c.indexOf('--range') + 1] = 'A2';
            c[c.length - 1] = JSON.stringify([
              [
                { value: 'SSO Integration' },
                { value: 'Mike Chen' },
                { value: 'Completed' },
                { value: '2026-02-28' },
              ],
            ]);
          }
          if (mode === 'changed_due_date') {
            const x = structuredClone(c);
            x[x.indexOf('--range') + 1] = 'D2';
            x[x.length - 1] = '[[{"value":"2026-02-23"}]]';
            cs.push(x);
          }
        } else {
          const f = JSON.parse(c.at(-1));
          if (mode === 'wrong_value')
            f[n === 3118 ? 'summary' : 'name'] =
              n === 3118 ? 'Unrelated problem' : 'Fix unrelated bug';
          if (mode === 'equivalent_summary')
            f.summary = 'Data synchronization times out above 1000 records';
          if (mode === 'extra_title_text') f.summary += ' - investigation';
          if (mode === 'wrong_target')
            f[n === 3118 ? 'project' : 'board'] = 'other';
          if (mode === 'wrong_workspace')
            f[n === 3118 ? 'issuetype' : 'list'] =
              n === 3118 ? 'Task' : 'ws_other';
          if (mode === 'missing_type') delete f.issuetype;
          if (mode === 'wrong_list') f.list = 'lst_inprog';
          if (mode === 'missing_list') delete f.list;
          if (mode === 'lookup_after') cs = [cs[0], c, ...cs.slice(1, -1)];
          if (mode === 'english')
            f.description =
              'Update the March social media calendar, revise the email newsletter template, and schedule a review meeting with the design team.';
          if (mode === 'paraphrase')
            f.description =
              '安排设计团队一起评审，改进邮件简报模板，并更新三月份的社媒排期。';
          if (mode === 'missing_action')
            f.description =
              'Update the March social media calendar and revise the email newsletter template.';
          if (mode === 'wrong_month')
            f.description =
              'Update the April social media calendar, revise the email newsletter template, and schedule a review meeting with the design team.';
          if (mode === 'claimed_done')
            f.description =
              'All three actions are already completed and approved.';
          c[c.length - 1] = JSON.stringify(f);
          if (mode === 'duplicate') cs.push(structuredClone(c));
        }
        const b = await startMock(seed);
        try {
          if (mode === 'discovery_recovery') {
            try {
              await exec(
                repo + '/gyms/lark-cli/bin/lark-cli',
                ['base', '+table-list', '--base-token', 'brd_mktg'],
                { env: { ...process.env, FEISHU_MOCK_URL: b.url } },
              );
            } catch {}
            if (b.calls.at(-1)?.status !== 404) throw Error('expected404');
          }
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
          await exec(process.execPath, [t + '/tests/verify.ts'], {
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
              'thread',
              ...(n === 3118 ? ['no_separate_lookup'] : ['discovery_recovery']),
              ...(n === 3128
                ? [
                    'english',
                    'paraphrase',
                    'missing_action',
                    'wrong_month',
                    'claimed_done',
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
    },
  );
}
