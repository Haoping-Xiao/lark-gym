import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { openId } from '../gyms/lark-cli/src/mock/domains/contact.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('escalation requires actual manager mention in text and rich posts', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'escalation-')),
    task = repo + '/tasks/automationbench-simple-3187',
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
      'thread_metadata',
      'natural',
      'uppercase',
      'no_read',
      'read_late',
      'plain_text',
      'wrong_member',
      'invalid_id',
      'escaped_tag',
      'no_alert',
      'wrong_priority',
      'wrong_subject',
      'wrong_alert',
      'false_resolution',
      'post',
      'post_title_only',
      'post_natural',
      'post_wrong_member',
      'post_literal_only',
      'post_false_resolution',
      'post_no_keyword',
      'post_markdown',
      'post_valid',
      'post_title_only_valid',
      'post_natural_valid',
      'post_markdown_valid',
    ]) {
      let cs = structuredClone(original),
        read = cs.shift(),
        write = cs.find((c) => c[1] === '+record-upsert'),
        msg = cs.at(-1),
        fields = JSON.parse(write.at(-1));
      let text = msg.at(-1);
      if (mode === 'thread')
        read = [
          'mail',
          '+thread',
          '--mailbox',
          'escalations@company.example.com',
          '--thread-id',
          'thr_3187',
          '--as',
          'user',
        ];
      if (mode === 'thread_metadata')
        read = [
          'mail',
          'user_mailbox.threads',
          'get',
          '--user-mailbox-id',
          'escalations@company.example.com',
          '--thread-id',
          'thr_3187',
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'natural') {
        fields.subject = 'data sync 生产环境严重故障';
        fields.description =
          'Rachel Kim反馈生产数据同步已连续三天间歇失败，影响500多名用户；客户要求立即解决，否则考虑其他方案。';
        text = `<at user_id="${openId('support_manager')}">经理</at> MegaCorp的data sync故障持续第三天，影响500+用户，已建高优工单，请尽快处理。`;
      }
      if (mode === 'uppercase') {
        fields.subject = fields.subject.toUpperCase();
        text = text.replace('data sync', 'DATA SYNC');
      }
      if (mode === 'plain_text')
        text =
          '@Support Manager 客户发生 data sync 故障，影响500+用户，请尽快处理。';
      if (mode === 'wrong_member')
        text = text.replace(openId('support_manager'), openId('zd_user_1'));
      if (mode === 'invalid_id')
        text = text.replace(openId('support_manager'), 'ou_missing');
      if (mode === 'escaped_tag')
        text = text.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      if (mode === 'wrong_priority') fields.priority = 'normal';
      if (mode === 'wrong_subject') fields.subject = '升级投诉';
      if (mode === 'wrong_alert') text = text.replace('data sync', 'billing');
      if (mode === 'false_resolution') {
        fields.description =
          '数据同步问题已经修复，客户已确认恢复，不再影响用户。';
        text = `<at user_id="${openId('support_manager')}">Support Manager</at> data sync已完全修复，客户确认恢复。`;
      }
      if (mode.startsWith('post')) {
        const postMode = mode.replace('_valid', '');
        const id =
          postMode === 'post_wrong_member'
            ? openId('zd_user_1')
            : openId('support_manager');
        const at =
          postMode === 'post_literal_only'
            ? { tag: 'text', text: '@Support Manager' }
            : { tag: 'at', user_id: id, user_name: 'Support Manager' };
        const description =
          postMode === 'post_false_resolution'
            ? 'data sync故障已修复，客户确认恢复。'
            : postMode === 'post_no_keyword'
              ? '生产故障影响500多名用户，已经第三天，请尽快处理。'
              : 'MegaCorp 的 data sync 故障持续第三天，影响500+用户；客户要求立即解决，否则考虑其他方案。已建高优先级工单。';
        const title =
          postMode === 'post_title_only' ? 'data sync警报' : '升级警报';
        const payload = {
          zh_cn: {
            title,
            content: [
              [
                at,
                {
                  tag: 'text',
                  text:
                    postMode === 'post_title_only'
                      ? '生产数据同步故障影响500+用户，已持续第三天，需要立即处理。'
                      : description,
                },
              ],
              [
                {
                  tag: 'a',
                  text: '查看工单',
                  href: 'https://company.example.com/ticket/1',
                },
              ],
            ],
          },
        };
        if (postMode === 'post_markdown')
          payload.zh_cn.content[0][1].tag = 'md';
        if (postMode === 'post_natural')
          payload.zh_cn.content[0][1].text =
            '客户反馈data sync间歇失败已到第三天，500余人受影响，要求紧急处理，可能考虑替代产品。';
        if (mode.endsWith('_valid')) payload.zh_cn.content.pop();
        cs[cs.length - 1] = [
          'im',
          '+messages-send',
          '--chat-id',
          'oc_CESC01',
          '--msg-type',
          'post',
          '--content',
          JSON.stringify(payload),
        ];
      }
      if (mode === 'markdown')
        cs[cs.length - 1] = [
          'im',
          '+messages-send',
          '--chat-id',
          'oc_CESC01',
          '--markdown',
          `<at user_id="${openId('support_manager')}">Support Manager</at> **data sync** 生产故障已持续三天，影响500+用户，客户要求立即解决，已建高优工单。`,
        ];
      write[write.length - 1] = JSON.stringify(fields);
      msg[msg.length - 1] = text;
      if (mode === 'no_alert') cs.pop();
      if (mode === 'read_late') cs.push(read);
      else if (mode !== 'no_read') cs.unshift(read);
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
          [
            'reference',
            'thread',
            'natural',
            'uppercase',
            'false_resolution',
            'post',
            'post_title_only',
            'post_natural',
            'post_markdown',
            'post_false_resolution',
            'post_valid',
            'post_title_only_valid',
            'post_natural_valid',
            'post_markdown_valid',
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
