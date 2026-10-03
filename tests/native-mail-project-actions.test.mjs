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
  [330, 3098],
  [331, 3102],
]) {
  test('source mail before project action ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-project-')),
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
          : ['wrong_workspace', 'duplicate']),
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
          if (mode === 'wrong_value') f.name = 'Add light mode feature';
          if (mode === 'wrong_target') f.project = 'proj_other';
          if (mode === 'wrong_workspace') f.workspace = 'ws_other';
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
            [
              'reference',
              'thread',
              'no_separate_lookup',
              ...(n === 3098 ? ['full_row'] : []),
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

test('invalid workspace discovery can recover into the task business write', async () => {
  const task = repo + '/tasks/automationbench-simple-3102',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
  const b = await startMock(seed),
    a = await fs.mkdtemp(path.join(tmpdir(), 'workspace-recovery-'));
  try {
    await assert.rejects(
      exec(
        repo + '/gyms/lark-cli/bin/lark-cli',
        [
          'base',
          '+workspace-entity-list',
          '--workspace-token',
          'ws_prod',
          '--as',
          'user',
        ],
        { env: { ...process.env, FEISHU_MOCK_URL: b.url } },
      ),
    );
    assert.equal(b.calls.at(-1).status, 404);
    await exec(process.execPath, [task + '/solution/solve.ts'], {
      env: {
        ...process.env,
        LARK_CLI: repo + '/gyms/lark-cli/bin/lark-cli',
        FEISHU_MOCK_URL: b.url,
      },
    });
    const f = a + '/state.json';
    await fs.writeFile(
      f,
      JSON.stringify({ seed, world: b.world, calls: b.calls }),
    );
    await exec(process.execPath, [task + '/tests/verify.ts'], {
      env: { ...process.env, MOCK_STATE: f, VERIFIER_OUTPUT: a },
    });
    const d = JSON.parse(await fs.readFile(a + '/result.json'));
    assert.equal(d.business_success, true);
    assert.equal(d.coverage.valid_sample, true);
  } finally {
    await b.close();
    await fs.rm(a, { recursive: true, force: true });
  }
});
