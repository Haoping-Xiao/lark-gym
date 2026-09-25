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
  [356, 3167],
  [357, 3168],
  [358, 3171],
]) {
  test('native outbound onboarding meeting or resolution ' + n, async () => {
    const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-outbound-')),
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
      'no_write',
      'no_mail',
      'draft_only',
      'wrong_recipient',
      'missing_subject',
      'false_body',
      'duplicate_mail',
      ...(n === 3167
        ? [
            'no_lookup',
            'discovery_recovery',
            'wrong_workspace',
            'wrong_name',
            'missing_name',
          ]
        : n === 3168
          ? [
              'client_attendee',
              'wrong_attendee',
              'wrong_duration',
              'bot',
              'mail_first',
              'missing_details',
            ]
          : [
              'no_lookup',
              'wrong_status',
              'wrong_priority',
              'missing_password',
            ]),
    ]) {
      let cs = structuredClone(original),
        notice = cs.at(-1),
        write = cs.find(
          (c) => c[1] === '+record-upsert' || c[0] === 'calendar',
        ),
        bi = notice.indexOf('--body') + 1;
      if (mode === 'no_write') cs = cs.filter((c) => c !== write);
      if (mode === 'no_mail') cs = cs.filter((c) => c !== notice);
      if (mode === 'draft_only')
        notice.splice(notice.indexOf('--confirm-send'), 1);
      if (mode === 'wrong_recipient')
        notice[notice.indexOf('--to') + 1] = 'other@example.com';
      if (mode === 'missing_subject')
        notice[notice.indexOf('--subject') + 1] = 'Notification';
      if (mode === 'false_body')
        notice[bi] =
          n === 3167
            ? 'Welcome Priya. Your start date is April 3, 2026, and your salary has been doubled.'
            : n === 3168
              ? 'The Quarterly Review is confirmed for March 27, 2026 at 10:00 UTC.'
              : 'Your password reset remains broken; the ticket is still open.';
      if (mode === 'duplicate_mail') cs.push(structuredClone(notice));
      if (mode === 'no_lookup') cs = cs.filter((c) => c[1] !== '+record-list');
      if (mode === 'missing_name') notice[bi] = 'Welcome to the team!';
      if (mode === 'missing_password')
        notice[bi] = 'The issue has been resolved.';
      if (n === 3168) {
        let e = JSON.parse(write.at(-1));
        if (mode === 'wrong_duration')
          e.end_time.timestamp = String(+e.start_time.timestamp + 1800);
        write[write.length - 1] = JSON.stringify(e);
        if (mode === 'bot') write.push('--as', 'bot');
        if (mode === 'mail_first') cs = [notice, write];
        if (mode === 'missing_details')
          notice[bi] =
            'You are invited to the Quarterly Review with Orion Corp.';
        if (mode === 'client_attendee' || mode === 'wrong_attendee')
          cs.splice(cs.indexOf(notice), 0, [
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
                  third_party_email:
                    mode === 'client_attendee'
                      ? 'marco.reeves@orioncorp.example.com'
                      : 'other@example.com',
                },
              ],
            }),
          ]);
      } else {
        let f = JSON.parse(write.at(-1));
        if (mode === 'wrong_workspace') f.workspace = 'ws_other';
        if (mode === 'wrong_name') f.name = 'Onboard another person';
        if (mode === 'wrong_status') f.status = 'open';
        if (mode === 'wrong_priority') f.priority = 'high';
        write[write.length - 1] = JSON.stringify(f);
      }
      const b = await startMock(seed);
      try {
        if (mode === 'discovery_recovery') {
          try {
            await exec(
              repo + '/gyms/lark-cli/bin/lark-cli',
              ['base', '+workspace-entity-list', '--workspace-token', 'ws_hr'],
              { env: { ...process.env, FEISHU_MOCK_URL: b.url } },
            );
          } catch {}
          if (b.calls.at(-1)?.status !== 404) throw Error('expected404');
        }
        for (const cmd of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
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
            'false_body',
            ...(n === 3167
              ? ['no_lookup', 'discovery_recovery']
              : n === 3168
                ? ['client_attendee', 'missing_details']
                : ['no_lookup']),
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
