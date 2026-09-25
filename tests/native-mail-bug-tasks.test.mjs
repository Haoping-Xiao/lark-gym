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
  [334, 3108],
  [339, 3112],
]) {
  test('native bug email before task creation ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-bugs-')),
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
    try {
      for (const mode of [
        'reference',
        'thread',
        'no_separate_lookup',
        'no_read',
        'read_after',
        'metadata',
        'no_write',
        'wrong_value',
        'wrong_target',
        ...(n === 3098
          ? ['full_row', 'changed_due_date']
          : [
              'wrong_workspace',
              'duplicate',
              ...(n === 3112
                ? ['missing_type', 'equivalent_summary', 'extra_title_text']
                : []),
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
            f[n === 3112 ? 'summary' : 'name'] =
              n === 3112 ? 'Password reset request' : 'Fix unrelated bug';
          if (mode === 'wrong_target') f.project = 'proj_other';
          if (mode === 'wrong_workspace')
            f[n === 3112 ? 'issuetype' : 'workspace'] =
              n === 3112 ? 'Task' : 'ws_other';
          if (mode === 'equivalent_summary')
            f.summary = 'Passwords containing special characters prevent login';
          if (mode === 'extra_title_text') f.summary += ' - investigation';
          if (mode === 'missing_type') delete f.issuetype;
          c[c.length - 1] = JSON.stringify(f);
          if (mode === 'duplicate') cs.push(structuredClone(c));
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
            ['reference', 'thread', 'no_separate_lookup'].includes(mode),
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
