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
for (const [v, num] of [[301, 3037]]) {
  test('lead rating requires source then record query ' + v, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-contact-')),
      task = repo + '/tasks/automationbench-simple-' + num,
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
        'contact_first',
        'no_mail',
        'mail_late',
        'no_contact',
        'metadata_only',
        'wrong_value',
        'unrelated_edit',
        'lookup_late',
        'empty_lookup',
      ]) {
        let cs = structuredClone(original),
          [read, lookup, write] = cs,
          fields = JSON.parse(write.at(-1));
        if (mode === 'thread')
          cs[0] = [
            'mail',
            '+thread',
            '--thread-id',
            'thr_' + num,
            '--as',
            'user',
          ];
        if (mode === 'search')
          cs[0] = [
            'mail',
            '+triage',
            '--query',
            seed.base.records[0].fields.first_name,
            '--as',
            'user',
          ];
        if (mode === 'contact_first') cs = [lookup, read, write];
        if (mode === 'no_mail') cs = [lookup, write];
        if (mode === 'mail_late') cs = [lookup, write, read];
        if (mode === 'no_contact') cs = [read, write];
        if (mode === 'metadata_only')
          cs[0] = [
            'mail',
            'user_mailbox.messages',
            'get',
            '--user-mailbox-id',
            'me',
            '--message-id',
            'msg_' + num,
            '--params',
            '{"format":"metadata"}',
            '--as',
            'user',
          ];
        if (mode === 'wrong_value')
          fields[Object.keys(fields)[0]] = 'incorrect';
        if (mode === 'unrelated_edit') fields.first_name = 'Unrelated';
        if (mode === 'url_prose')
          fields.description =
            'LinkedIn 主页：https://linkedin.example.com/in/sarahjohnson';
        if (mode === 'url_markdown')
          fields.description =
            '[主页](https://linkedin.example.com/in/sarahjohnson)';
        if (mode === 'spoof_host')
          fields.description =
            'https://not-linkedin.example.com/in/sarahjohnson';
        if (mode === 'spoof_path')
          fields.description =
            'https://linkedin.example.com/in/sarahjohnson-other';
        if (mode === 'spoof_markdown')
          fields.description =
            '[https://linkedin.example.com/in/sarahjohnson](https://wrong.example.com/)';
        write[write.length - 1] = JSON.stringify(fields);
        if (mode === 'lookup_late') cs = [read, write, lookup];
        if (mode === 'empty_lookup')
          cs[1] = [
            'base',
            '+record-list',
            '--base-token',
            'base_crm',
            '--table-id',
            'tbl_aef450dc78ea',
            '--filter-json',
            JSON.stringify({
              logic: 'and',
              conditions: [['email', '==', 'absent@example.com']],
            }),
          ];
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
          const d = JSON.parse(
            await fs.readFile(a + '/' + mode + '-program/result.json'),
          );
          assert.equal(
            d.business_success,
            ['reference', 'thread', 'search'].includes(mode),
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
