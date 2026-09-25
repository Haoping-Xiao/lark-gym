import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('native mail contract 3151 preserves workflow and semantic review', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-mail-3151-')),
    t = repo + '/tasks/automationbench-simple-3151',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
    commands = JSON.parse(
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
      'search',
      'paraphrase',
      'no_read',
      'read_late',
      'metadata_only',
      'other_mailbox',
      'wrong_facts',
      'wrong_keyword',
    ]) {
      let cs = structuredClone(commands),
        read = cs.shift(),
        write = cs.at(-1);
      const obj = JSON.parse(write.at(-1));
      if (mode === 'search')
        read = [
          'mail',
          '+triage',
          '--mailbox',
          'support@company.example.com',
          '--query',
          'invoice',
          '--as',
          'user',
        ];
      if (mode === 'metadata_only')
        read = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          'support@company.example.com',
          '--message-id',
          'msg_3151',
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'other_mailbox') read = ['mail', '+triage', '--as', 'user'];
      if (mode === 'paraphrase') {
        obj.subject = 'invoice 重复扣费';
        obj.description =
          'Alex 反馈三月订阅账单 INV-2026-031 被扣款两次，请求协助修正。';
      }
      if (mode === 'wrong_facts')
        obj.description = 'Alex 的三月订阅只收了一次费用，已完成退款。';
      if (mode === 'wrong_keyword') obj.subject = '账单问题 INV-2026-031';
      if (mode === 'missing_tag') delete obj.tags;
      write[write.length - 1] = JSON.stringify(obj);
      if (mode === 'read_late') cs.push(read);
      else if (mode !== 'no_read') cs.unshift(read);
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
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
        const result = JSON.parse(
          await fs.readFile(a + '/' + mode + '-program/result.json'),
        );
        assert.equal(
          result.business_success,
          ['reference', 'search', 'paraphrase', 'wrong_facts'].includes(mode),
          mode,
        );
        if (result.business_success)
          assert.equal(result.semantic.required, true);
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
