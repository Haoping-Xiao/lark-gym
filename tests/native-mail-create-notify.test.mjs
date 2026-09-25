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
  [346, 3157],
  [349, 3158],
  [348, 3159],
]) {
  test('native mail creation and notification ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-create-notice-')),
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
      'thread',
      'optional_omitted',
      'paraphrase',
      'no_read',
      'metadata',
      'read_after',
      'no_create',
      'no_notice',
      'duplicate',
      'wrong_business',
      'false_description',
      'false_notice',
      ...(n === 3158
        ? ['missing_keyword', 'post']
        : ['draft_only', 'new_thread']),
    ]) {
      let cs = structuredClone(original),
        mail = seed.mail.messages[0],
        write = cs[2],
        notice = cs.at(-1),
        f = JSON.parse(write.at(-1));
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
      if (mode === 'no_read') cs.shift();
      if (mode === 'read_after') cs.push(cs.shift());
      if (mode === 'no_create') cs = cs.filter((x) => x !== write);
      if (mode === 'no_notice') cs = cs.filter((x) => x !== notice);
      if (mode === 'duplicate') cs.push(structuredClone(write));
      if (mode === 'optional_omitted') {
        for (const k of n === 3159
          ? ['firstname', 'lastname', 'company', 'jobtitle']
          : ['description'])
          delete f[k];
      }
      if (mode === 'paraphrase') {
        if (n === 3157) {
          f.name = 'Review PDF export feature request';
          f.description =
            'Nina would like dashboard reports exported directly to PDF to save time.';
        }
        if (n === 3158) {
          f.summary = 'CSV upload times out above 50MB';
          f.description =
            'CSV files over 50 MB hang before timing out on Chrome 120/macOS.';
        }
        if (n === 3159) f.jobtitle = 'IT负责人';
      }
      if (mode === 'wrong_business') {
        if (n === 3157) f.name = 'PDF deletion request';
        if (n === 3158) f.project = 'OTHER';
        if (n === 3159) f.email = 'other@example.com';
      }
      if (mode === 'false_description')
        f[n === 3159 ? 'jobtitle' : 'description'] =
          n === 3159
            ? 'Chief Executive Officer'
            : 'The customer says this issue is resolved and approved for closure.';
      write[write.length - 1] = JSON.stringify(f);
      const field = n === 3158 ? '--text' : '--body';
      if (mode === 'false_notice')
        notice[notice.indexOf(field) + 1] =
          n === 3158
            ? 'CSV upload has been fixed and deployed.'
            : 'Your interest has been approved with a guaranteed 90% discount and the issue is fully resolved.';
      if (mode === 'missing_keyword')
        notice[notice.indexOf(field) + 1] =
          '文件上传故障已登记，超过50MB时超时。';
      if (mode === 'draft_only')
        notice.splice(notice.indexOf('--confirm-send'), 1);
      if (mode === 'new_thread') {
        const body = notice[notice.indexOf('--body') + 1];
        cs[cs.indexOf(notice)] = [
          'mail',
          '+send',
          '--mailbox',
          mail.mailbox_id,
          '--to',
          mail.head_from.mail_address,
          '--subject',
          'Re: ' + mail.subject,
          '--body',
          body,
          '--confirm-send',
          '--as',
          'user',
        ];
      }
      if (mode === 'post') {
        const i = notice.indexOf('--text');
        notice.splice(
          i,
          2,
          '--msg-type',
          'post',
          '--content',
          JSON.stringify({
            zh_cn: {
              title: 'Bug report',
              content: [
                [
                  {
                    tag: 'text',
                    text: 'CSV upload over 50MB hangs and times out on Chrome 120/macOS. A PLAT Bug has been created.',
                  },
                ],
              ],
            },
          }),
        );
      }
      const b = await startMock(seed);
      try {
        for (const cmd of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const state = a + '/states/' + mode + '.json';
        await fs.writeFile(
          state,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [t + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: state,
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
            'optional_omitted',
            'paraphrase',
            'false_description',
            'false_notice',
            ...(n === 3157 ? ['wrong_business'] : []),
            ...(n === 3158 ? ['post'] : []),
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
