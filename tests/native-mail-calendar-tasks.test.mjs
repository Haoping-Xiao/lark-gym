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
  [340, 3133],
  [341, 3139],
  [342, 3144],
]) {
  test('native mail calendar source and time ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-calendar-')),
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
      'self_attendee',
      'false_description',
      'thread',
      'metadata',
      'no_read',
      'read_after',
      'no_write',
      'wrong_time',
      'wrong_topic',
      'recurring',
      ...(n === 3144
        ? ['bot', 'no_video', 'wrong_duration']
        : [
            'half_hour',
            'ninety_minutes',
            'absurd_duration',
            'missing_attendee',
            'wrong_attendee',
          ]),
    ]) {
      const cs = structuredClone(original),
        mail = seed.mail.messages[0],
        write = cs[1],
        event = JSON.parse(write.at(-1));
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
      if (mode === 'no_write') cs.splice(1);
      if (mode === 'wrong_time') {
        event.start_time.timestamp = String(+event.start_time.timestamp + 3600);
        event.end_time.timestamp = String(+event.end_time.timestamp + 3600);
      }
      if (mode === 'false_description')
        event.description =
          'All requested work has already been completed and approved by the client.';
      if (mode === 'absurd_duration')
        event.end_time.timestamp = String(
          +event.start_time.timestamp + 31536000,
        );
      if (mode === 'wrong_topic') event.summary = 'Unrelated budget meeting';
      if (mode === 'recurring') event.recurrence = 'FREQ=DAILY;COUNT=3';
      if (mode === 'half_hour')
        event.end_time.timestamp = String(+event.start_time.timestamp + 1800);
      if (mode === 'ninety_minutes')
        event.end_time.timestamp = String(+event.start_time.timestamp + 5400);
      if (mode === 'wrong_duration')
        event.end_time.timestamp = String(+event.start_time.timestamp + 1800);
      if (mode === 'no_video') delete event.vc_data;
      write[write.length - 1] = JSON.stringify(event);
      if (mode === 'bot') write.push('--as', 'bot');
      if (mode === 'missing_attendee') {
        let at = JSON.parse(cs[2].at(-1));
        at.attendees.pop();
        cs[2][cs[2].length - 1] = JSON.stringify(at);
      }
      if (mode === 'wrong_attendee') {
        let at = JSON.parse(cs[2].at(-1));
        at.attendees[0].third_party_email = 'unrelated@example.com';
        cs[2][cs[2].length - 1] = JSON.stringify(at);
      }
      if (mode === 'self_attendee') {
        if (cs[2]) {
          const at = JSON.parse(cs[2].at(-1));
          at.attendees.push({
            type: 'third_party',
            third_party_email: 'agent@company.example.com',
          });
          cs[2][cs[2].length - 1] = JSON.stringify(at);
        } else
          cs.push([
            'calendar',
            'event.attendees',
            'create',
            '--calendar-id',
            'cal_primary',
            '--event-id',
            'evt_1',
            '--data',
            JSON.stringify({
              attendees: [
                {
                  type: 'third_party',
                  third_party_email: 'agent@company.example.com',
                },
              ],
            }),
          ]);
      }
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
        assert.equal(
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'thread',
            'self_attendee',
            'false_description',
            ...(n === 3144
              ? []
              : ['half_hour', 'ninety_minutes', 'absurd_duration']),
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
