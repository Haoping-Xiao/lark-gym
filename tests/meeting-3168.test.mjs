import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('meeting 3168 permits only relevant optional attendees', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'meeting-3168-')),
    task = repo + '/tasks/automationbench-simple-3168',
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
      'client',
      'natural',
      'uppercase',
      'wrong_attendee',
      'extra_attendee',
      'no_invite',
      'client_no_invite',
      'bot',
      'send_early',
      'wrong_details',
      'wrong_time',
      'no_video',
      'wrong_prefix',
      'missing_term',
    ]) {
      let cs = structuredClone(original);
      const [write, list, msg] = cs;
      if (
        [
          'client',
          'client_no_invite',
          'wrong_attendee',
          'extra_attendee',
        ].includes(mode)
      ) {
        const emails = ['client', 'client_no_invite'].includes(mode)
          ? ['marco.reeves@orioncorp.example.com']
          : mode === 'wrong_attendee'
            ? ['other@example.com']
            : ['marco.reeves@orioncorp.example.com', 'other@example.com'];
        cs.splice(1, 0, [
          'calendar',
          'event.attendees',
          'create',
          '--calendar-id',
          'cal_primary',
          '--event-id',
          'evt_1',
          '--data',
          JSON.stringify({
            attendees: emails.map((third_party_email) => ({
              type: 'third_party',
              third_party_email,
            })),
          }),
        ]);
      }
      if (mode === 'natural')
        msg[msg.length - 1] =
          'Marco，邀请您参加 Quarterly Review with Orion Corp，2026年2月27日 UTC 10点至11点，共一小时。';
      if (mode === 'uppercase')
        msg[msg.length - 1] = msg
          .at(-1)
          .replace('Quarterly Review', 'QUARTERLY REVIEW');
      if (mode === 'no_invite') cs = [write];
      if (mode === 'client_no_invite') cs = cs.filter((c) => c[0] !== 'im');
      if (mode === 'bot') write.push('--as', 'bot');
      if (mode === 'send_early') cs = [list, msg, write];
      if (mode === 'wrong_details')
        msg[msg.length - 1] =
          'Quarterly Review with Orion Corp 将于2026-02-27 16:00 UTC举行，时长3小时。';
      if (mode === 'wrong_prefix')
        msg[msg.length - 1] = msg
          .at(-1)
          .replace('Quarterly Review', 'xQuarterly Review');
      if (mode === 'missing_term')
        msg[msg.length - 1] = msg
          .at(-1)
          .replace('Quarterly Review', '季度回顾');
      if (mode === 'wrong_time' || mode === 'no_video') {
        const o = JSON.parse(write.at(-1));
        if (mode === 'wrong_time') {
          o.start_time.timestamp = String(
            Number(o.start_time.timestamp) + 3600,
          );
          o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
        } else delete o.vc_data;
        write[write.length - 1] = JSON.stringify(o);
      }
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
              'client',
              'natural',
              'uppercase',
              'wrong_details',
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
