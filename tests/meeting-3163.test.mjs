import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('meeting 3163 permits only relevant optional attendees', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'meeting-3163-')),
    task = repo + '/tasks/automationbench-simple-3163',
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
      'lowercase_date',
      'client',
      'marker_last',
      'mget',
      'wrong_attendee',
      'extra_attendee',
      'missing_date',
      'date_prefix',
      'date_suffix',
      'missing_marker',
      'no_read',
      'read_late',
      'send_early',
      'recurring',
      'wrong_time',
      'wrong_details',
    ]) {
      let cs = structuredClone(original);
      const [mail, write, list, msg] = cs,
        mget = [
          'im',
          '+messages-mget',
          '--message-ids',
          'om_msg_3163',
          '--no-reactions',
        ];
      if (mode === 'mget') cs = [mget, write, msg];
      if (mode === 'no_read') cs = [write, msg];
      if (mode === 'read_late') cs = [write, mail, msg];
      if (mode === 'send_early') cs = [mail, list, msg, write];
      if (['client', 'wrong_attendee', 'extra_attendee'].includes(mode)) {
        const emails =
          mode === 'client'
            ? ['lena.park@apexsys.example.com']
            : mode === 'wrong_attendee'
              ? ['other@example.com']
              : ['lena.park@apexsys.example.com', 'other@example.com'];
        cs.splice(2, 0, [
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
      if (mode === 'lowercase_date')
        msg[msg.length - 1] = msg.at(-1).replace('February 26', 'february 26');
      if (mode === 'marker_last')
        msg[msg.length - 1] =
          '已安排 Client Call with Apex Systems：February 26，2026年2月26日14:00至15:00 UTC。回复标记 re:';
      if (mode === 'missing_date')
        msg[msg.length - 1] = msg.at(-1).replace('February 26：', '');
      if (mode === 'date_prefix')
        msg[msg.length - 1] = msg.at(-1).replace('February 26', 'xFebruary 26');
      if (mode === 'date_suffix')
        msg[msg.length - 1] = msg.at(-1).replace('February 26', 'February 260');
      if (mode === 'missing_marker')
        msg[msg.length - 1] = msg.at(-1).replace('Re:', '');
      if (mode === 'wrong_details')
        msg[msg.length - 1] =
          'Re: February 26 的会议确认在2026-02-26 18:00至20:00 UTC举行。';
      if (mode === 'recurring' || mode === 'wrong_time') {
        const o = JSON.parse(write.at(-1));
        if (mode === 'recurring') o.recurrence = 'FREQ=WEEKLY';
        else {
          o.start_time.timestamp = String(
            Number(o.start_time.timestamp) + 3600,
          );
          o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
        }
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
              'mget',
              'marker_last',
              'lowercase_date',
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
