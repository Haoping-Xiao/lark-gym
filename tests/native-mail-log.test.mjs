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
test('source mail log allows optional faithful description', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-log-')),
    task = repo + '/tasks/automationbench-simple-3023',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
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
      'paraphrase',
      'no_description',
      'no_contact_query',
      'no_mail',
      'mail_late',
      'metadata_only',
      'wrong_who',
      'wrong_title',
      'false_description',
      'unrelated_edit',
    ]) {
      let cs = structuredClone(original),
        read = cs[0],
        write = cs.at(-1),
        fields = JSON.parse(write.at(-1));
      if (mode === 'thread')
        cs[0] = ['mail', '+thread', '--thread-id', 'thr_3023', '--as', 'user'];
      if (mode === 'search')
        cs[0] = ['mail', '+triage', '--query', 'Natalie', '--as', 'user'];
      if (mode === 'no_contact_query') cs = [read, write];
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
          'msg_3023',
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'paraphrase')
        fields.description =
          'Natalie 对调整后的项目时间安排有些担忧，希望本周讨论。';
      if (mode === 'no_description') delete fields.description;
      if (mode === 'wrong_who') fields.who_id = '003999';
      if (mode === 'wrong_title') fields.subject = 'Follow up';
      if (mode === 'false_description')
        fields.description = 'Natalie 已确认新的项目时间安排且没有任何担忧。';
      write[write.length - 1] = JSON.stringify(fields);
      if (mode === 'unrelated_edit')
        cs.push([
          'base',
          '+record-upsert',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_aa5af4084f37',
          '--record-id',
          'rec_003002',
          '--json',
          '{"first_name":"Wrong"}',
        ]);
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
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'thread',
            'search',
            'paraphrase',
            'no_description',
            'no_contact_query',
            'false_description',
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
