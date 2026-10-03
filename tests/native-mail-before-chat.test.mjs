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
  [317, 3073],
  [318, 3077],
]) {
  test('native mail before group summary ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-chat-')),
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
        'natural',
        'post',
        'thread',
        'no_read',
        'read_after',
        'metadata',
        'no_send',
        'wrong_group',
        'missing_keyword',
        'wrong_fact',
        'invented_resolution',
      ]) {
        let cs = structuredClone(original),
          c = cs.at(-1),
          bi = c.indexOf('--text') + 1,
          mail = seed.mail.messages[0];
        if (mode === 'natural')
          c[bi] =
            n === 3073
              ? 'BrightPath 获得 $75 million C 轮融资，由 Sequoia Capital 领投。资金将用于加速产品研发、扩大市场拓展团队，以及进入欧洲与亚太市场。'
              : '紧急：Veronica Steele 反馈 data sync 从 2026-02-23 早上 6 点开始失败。集成流水线报错，客户记录没有更新，运营团队工作受阻，请升级处理。';
        if (mode === 'no_read') cs = cs.slice(1);
        if (mode === 'read_after') cs = [...cs.slice(1), cs[0]];
        if (mode === 'no_send') cs = cs.slice(0, -1);
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
            JSON.stringify({ format: 'metadata' }),
            '--as',
            'user',
          ];
        if (mode === 'wrong_group')
          c[c.indexOf('--chat-id') + 1] = seed.chats.find(
            (x) => x.chat_id !== c[c.indexOf('--chat-id') + 1],
          ).chat_id;
        if (mode === 'missing_keyword')
          c[bi] = c[bi].replace(
            n === 3073 ? '$75 million' : 'data sync',
            n === 3073 ? '75 million dollars' : '数据同步',
          );
        if (mode === 'wrong_fact')
          c[bi] = c[bi].replace(
            n === 3073 ? 'Sequoia Capital' : '早上6点',
            n === 3073 ? 'SoftBank' : '晚上6点',
          );
        if (mode === 'invented_resolution')
          c[bi] +=
            n === 3073
              ? ' 所有员工立即获得双倍工资。'
              : ' 故障已完全修复，客户记录已全部恢复。';
        if (mode === 'post') {
          const txt = c[bi];
          c.splice(
            bi - 1,
            2,
            '--msg-type',
            'post',
            '--content',
            JSON.stringify({
              zh_cn: { title: '公告', content: [[{ tag: 'text', text: txt }]] },
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
              'natural',
              'post',
              'thread',
              'wrong_fact',
              'invented_resolution',
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
