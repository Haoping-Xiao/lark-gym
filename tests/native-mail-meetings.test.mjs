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
for (const [v, num, email] of [
  [281, 3196, 'ops@cascadesol.example.com'],
  [282, 3200, 'partnerships@quantumleap.example.com'],
]) {
  test('native meeting mail workflow ' + num, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'meeting-mail-')),
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
        'requester',
        'unrelated',
        'both',
        'no_read',
        'read_late',
        'metadata_only',
        'wrong_time',
        'no_video',
        'recurring',
        ...(v === 281
          ? [
              'requester_no_reply',
              'draft',
              'mail_early',
              'wrong_details',
              'natural',
            ]
          : ['wrong_amount', 'no_deal', 'deal_before_read']),
      ]) {
        let cs = structuredClone(original),
          read = cs.shift(),
          event = cs.find((c) => c[0] === 'calendar'),
          o = JSON.parse(event.at(-1));
        if (mode === 'wrong_time') {
          o.start_time.timestamp = String(+o.start_time.timestamp + 3600);
          o.end_time.timestamp = String(+o.end_time.timestamp + 3600);
        }
        if (mode === 'no_video') delete o.vc_data;
        if (mode === 'recurring') o.recurrence = 'FREQ=DAILY';
        event[event.length - 1] = JSON.stringify(o);
        if (
          ['requester', 'unrelated', 'both', 'requester_no_reply'].includes(
            mode,
          )
        ) {
          const add = [
            'calendar',
            'event.attendees',
            'create',
            '--calendar-id',
            'cal_primary',
            '--event-id',
            'evt_1',
            '--data',
            JSON.stringify({
              attendees: (mode === 'both'
                ? [email, 'other@example.com']
                : [mode === 'unrelated' ? 'other@example.com' : email]
              ).map((x) => ({ type: 'third_party', third_party_email: x })),
            }),
          ];
          cs.splice(cs.indexOf(event) + 1, 0, add);
        }
        if (mode === 'metadata_only')
          read = [
            'mail',
            'user_mailbox.messages',
            'get',
            '--user-mailbox-id',
            v === 281
              ? 'demos@company.example.com'
              : 'partnerships@company.example.com',
            '--message-id',
            'msg_' + num,
            '--params',
            '{"format":"metadata"}',
            '--as',
            'user',
          ];
        if (v === 281) {
          const mail = cs.at(-1);
          if (mode === 'requester_no_reply') cs.pop();
          if (mode === 'draft') mail.splice(mail.indexOf('--confirm-send'), 1);
          if (mode === 'mail_early') {
            cs.pop();
            cs.unshift(mail);
          }
          if (mode === 'wrong_details')
            mail[mail.indexOf('--body') + 1] =
              'Product demo 已安排在2026年3月8日晚上，持续两小时。';
          if (mode === 'natural')
            mail[mail.indexOf('--body') + 1] =
              'Andre，已安排 Product Demo - Cascade Solutions 演示：2月28日（2026年）UTC下午3点开始、3点半结束，欢迎参加这次demo。';
        } else {
          const write = cs.find((c) => c[1] === '+record-upsert');
          if (mode === 'wrong_amount')
            write[write.length - 1] = JSON.stringify({
              dealname: 'QuantumLeap AI Partnership',
              amount: 5000,
            });
          if (mode === 'no_deal') cs = cs.filter((c) => c !== write);
          if (mode === 'deal_before_read') {
            cs = cs.filter((c) => c !== write);
            cs.unshift(write, read);
          }
        }
        if (mode === 'read_late') cs.push(read);
        else if (!['no_read', 'deal_before_read'].includes(mode))
          cs.unshift(read);
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
            (v === 281
              ? ['reference', 'requester', 'natural', 'wrong_details']
              : ['reference', 'requester']
            ).includes(mode),
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
