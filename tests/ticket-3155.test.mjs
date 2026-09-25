import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('ticket 3155 preserves literal and source-read requirements', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'ticket-3155-')),
    task = repo + '/tasks/automationbench-simple-3155',
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
      'marker_last',
      'mget',
      'no_read',
      'read_late',
      'missing_marker',
      'wrong_recipient',
      'wrong_priority',
      'wrong_prefix',
      'missing_term',
      'wrong_impact',
      'false_resolution',
    ]) {
      let cs = structuredClone(original);
      const mail = cs[0],
        write = cs[4],
        msg = cs.at(-1),
        mget = [
          'im',
          '+messages-mget',
          '--message-ids',
          'om_msg_3155',
          '--no-reactions',
        ];
      if (mode === 'mget') cs = [mget, write, msg];
      if (mode === 'no_read') cs = [write, msg];
      if (mode === 'read_late') cs = [write, mail, msg];
      const o = JSON.parse(write.at(-1));
      if (
        [
          'natural',
          'marker_last',
          'wrong_prefix',
          'missing_term',
          'wrong_impact',
        ].includes(mode)
      ) {
        o.subject = 'service outage — urgent';
        o.description =
          'David Chen（CTO）反馈整个团队均无法访问平台，全部工作受阻，请立即升级处理。';
        msg[msg.length - 1] =
          'Re: 已收到您反馈的平台无法访问及工作受阻问题，将跟进处理。';
      }
      if (mode === 'marker_last')
        msg[msg.length - 1] =
          '已收到您反馈的平台中断和全员工作受阻问题。\n回复标记：re:';
      if (mode === 'missing_marker')
        msg[msg.length - 1] = '已收到服务中断问题，已建立高优先级工单处理。';
      if (mode === 'wrong_recipient')
        msg[msg.indexOf('--chat-id') + 1] = 'oc_updates';
      if (mode === 'wrong_priority') o.priority = 'low';
      if (mode === 'wrong_prefix') o.subject = 'xservice outage';
      if (mode === 'missing_term') o.subject = '平台无法访问';
      if (mode === 'wrong_impact')
        o.description = '只有少数用户偶尔遇到轻微延迟，工作没有受到影响。';
      if (mode === 'false_resolution')
        msg[msg.length - 1] =
          'Re: 服务中断已彻底修复，所有用户现在均可正常访问。';
      write[write.length - 1] = JSON.stringify(o);
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
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
              'marker_last',
              'wrong_impact',
              'false_resolution',
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
