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
  [302, 3040],
  [303, 3042],
  [304, 3047],
]) {
  test('create contacts from native source mail ' + v, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-contact-')),
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
        'thread',
        'search',
        'no_lookup',
        'natural_title',
        'no_mail',
        'mail_late',
        'metadata_only',
        'wrong_email',
        'wrong_phone',
        'wrong_company',
        'false_title',
        'missing_phone',
        'duplicate',
      ]) {
        let cs = structuredClone(original),
          read = cs[0],
          write = cs.at(-1),
          fields = JSON.parse(write.at(-1));
        if (mode === 'thread')
          cs[0] = [
            'mail',
            '+thread',
            '--thread-id',
            'thr_' + n,
            '--as',
            'user',
          ];
        if (mode === 'search')
          cs[0] = [
            'mail',
            '+triage',
            '--query',
            { 3040: 'Sophie', 3042: 'Nathan', 3047: 'Liam' }[n],
            '--as',
            'user',
          ];
        if (mode === 'no_lookup') cs = [read, write];
        if (mode === 'no_mail') cs = cs.slice(1);
        if (mode === 'mail_late') cs = [...cs.slice(1), read];
        if (mode === 'metadata_only')
          cs[0] = [
            'mail',
            'user_mailbox.messages',
            'get',
            '--user-mailbox-id',
            'me',
            '--message-id',
            'msg_' + n,
            '--params',
            '{"format":"metadata"}',
            '--as',
            'user',
          ];
        const title = n === 3040 ? 'title' : 'jobtitle';
        if (mode === 'natural_title')
          fields[title] = {
            3040: 'Vice President of Operations',
            3042: 'IT负责人',
            3047: '运营经理',
          }[n];
        if (mode === 'false_title') fields[title] = 'Chief Executive Officer';
        if (mode === 'wrong_email') fields.email = 'wrong@example.com';
        if (mode === 'wrong_phone') fields.phone = '+1-555-0000';
        if (mode === 'wrong_company')
          fields[n === 3040 ? 'account_name' : 'company'] = 'Wrong Company';
        if (mode === 'missing_phone') delete fields.phone;
        write[write.length - 1] = JSON.stringify(fields);
        if (mode === 'duplicate') cs.push(structuredClone(write));
        const b = await startMock(seed);
        try {
          for (const c of cs)
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
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
              'thread',
              'search',
              'no_lookup',
              'natural_title',
              'false_title',
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
