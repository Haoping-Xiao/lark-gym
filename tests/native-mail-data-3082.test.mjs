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
test('newsletter requires original email before subscription', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-data-')),
    t = repo + '/tasks/automationbench-simple-3082',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
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
      'no_separate_list_read',
      'no_read',
      'read_after',
      'metadata',
      'no_create',
      'wrong_email',
      'wrong_list',
      'duplicate',
      'extra_change',
    ]) {
      let cs = structuredClone(original),
        c = cs.at(-1),
        f = JSON.parse(c.at(-1));
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          'marketing@brightpath.example.com',
          '--thread-id',
          'thread_6001',
          '--as',
          'user',
        ];
      if (mode === 'no_separate_list_read') cs = [cs[0], c];
      if (mode === 'no_read') cs = cs.slice(1);
      if (mode === 'read_after') cs = [...cs.slice(1), cs[0]];
      if (mode === 'metadata')
        cs[0] = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          'marketing@brightpath.example.com',
          '--message-id',
          'msg_6001',
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'no_create') cs = cs.slice(0, -1);
      if (mode === 'wrong_email') f.email = 'other@example.com';
      if (mode === 'wrong_list') f.list_id = 'list_002';
      c[c.length - 1] = JSON.stringify(f);
      if (mode === 'duplicate') cs.push(structuredClone(c));
      if (mode === 'extra_change')
        cs.push([
          'base',
          '+record-upsert',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_4f0da948ae36',
          '--record-id',
          'rec_list_002',
          '--json',
          '{"name":"Changed"}',
        ]);
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
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          ['reference', 'thread', 'no_separate_list_read'].includes(mode),
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
