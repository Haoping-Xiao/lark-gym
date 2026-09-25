import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('ticket 3153 preserves literal and source-read requirements', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'ticket-3153-')),
    task = repo + '/tasks/automationbench-simple-3153',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
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
      'natural',
      'uppercase',
      'mget',
      'no_read',
      'read_late',
      'wrong_message',
      'no_tag',
      'wrong_prefix',
      'missing_term',
      'wrong_order',
      'swapped_items',
      'invented_refund',
    ]) {
      let cs = structuredClone(original);
      const mail = cs[0],
        write = cs.at(-1),
        mget = [
          'mail',
          '+messages',
          '--mailbox',
          'support@company.example.com',
          '--message-ids',
          'msg_3153',
          '--as',
          'user',
        ];
      if (mode === 'mget') cs = [mget, write];
      if (mode === 'no_read') cs = [write];
      if (mode === 'read_late') cs = [write, mail];
      if (mode === 'wrong_message') {
        mget[mget.indexOf('--message-ids') + 1] = 'om_missing';
        cs = [mget, write];
      }
      const o = JSON.parse(write.at(-1));
      if (
        [
          'natural',
          'uppercase',
          'wrong_prefix',
          'missing_term',
          'wrong_order',
          'swapped_items',
          'invented_refund',
        ].includes(mode)
      ) {
        o.subject = 'wrong item for order ORD-8847';
        o.description =
          'Maria 反馈订单 ORD-8847：订购的是蓝色无线键盘，实际收到黑色鼠标，请协助解决。';
      }
      if (mode === 'uppercase') o.subject = 'WRONG item received — ORD-8847';
      if (mode === 'wrong_prefix') o.subject = 'xwrong item ORD-8847';
      if (mode === 'missing_term') o.subject = '商品错发 ORD-8847';
      if (mode === 'wrong_order')
        o.description = o.description.replace('ORD-8847', 'ORD-9999');
      if (mode === 'swapped_items')
        o.description =
          'Maria 反馈订单 ORD-8847：订购黑色鼠标，实际收到蓝色无线键盘，请协助解决。';
      if (mode === 'invented_refund')
        o.description += '客服已完成全额退款并发出免费替换商品。';
      if (mode === 'no_tag') delete o.tags;
      write[write.length - 1] = JSON.stringify(o);
      const b = await startMock(seed);
      try {
        for (const c of cs) {
          try {
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          } catch (e) {
            if (mode !== 'wrong_message') throw e;
          }
        }
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        for (const before of [false]) {
          const tests = before ? a + '/before-tests' : task + '/tests',
            dest = a + '/' + mode + (before ? '-before' : '-program');
          await exec(process.execPath, [tests + '/verify.ts'], {
            env: {
              ...process.env,
              MOCK_STATE: a + '/states/' + mode + '.json',
              VERIFIER_OUTPUT: dest,
            },
            maxBuffer: 8e6,
          });
          const d = JSON.parse(
            await fs.readFile(dest + '/result.json', 'utf8'),
          );
          assert.equal(
            d.business_success,
            [
              'reference',
              'natural',
              'mget',
              'uppercase',
              'wrong_order',
              'swapped_items',
              'invented_refund',
            ].includes(mode),
            mode,
          );
          if (d.business_success)
            assert.equal(d.semantic.required, true, mode + ' semantic handoff');
        }
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
