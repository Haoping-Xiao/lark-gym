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
test('meeting reply uses consistent fixture date and source thread', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-flow-')),
    task = repo + '/tasks/automationbench-simple-3066',
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
      'natural',
      'html',
      'thread',
      'reply_only',
      'draft_only',
      'no_send',
      'direct_send',
      'missing_keyword',
      'wrong_time',
      'wrong_date',
      'no_slides',
      'no_attendance',
      'after_meeting',
    ]) {
      let cs = structuredClone(original),
        c = cs.at(-1),
        body = c.indexOf('--body') + 1;
      if (mode === 'no_send') cs = [];
      if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          'me@brightpath.example.com',
          '--thread-id',
          'thread_4003',
          '--as',
          'user',
        ];
      if (mode === 'reply_only') cs = [c];
      if (mode === 'direct_send')
        cs[1] = [
          'mail',
          '+send',
          '--mailbox',
          'me@brightpath.example.com',
          '--to',
          'anika.patel@brightpath.example.com',
          '--subject',
          'Re: Quarterly Review Meeting - Feb 27',
          '--body',
          c[body],
          '--confirm-send',
          '--as',
          'user',
        ];
      if (mode === 'natural')
        c[body] =
          'Anika，我可以参加 February 27 周四 EST 下午三点的会议，届时会事先备好季度回顾（quarterly review）幻灯片。';
      if (mode === 'html') c[body] = '<p>' + c[body] + '</p>';
      if (mode === 'missing_keyword')
        c[body] = c[body].replace('February 27', 'Feb 27');
      if (mode === 'wrong_time')
        c[body] = c[body].replace('3 PM EST', '3 AM EST');
      if (mode === 'wrong_date')
        c[body] = c[body].replace('February 27', 'February 28');
      if (mode === 'no_slides')
        c[body] =
          'Hi Anika, I can attend the quarterly review meeting on Thursday February 27 at 3 PM EST.';
      if (mode === 'no_attendance')
        c[body] =
          'Hi Anika, I cannot attend the meeting on Thursday February 27 at 3 PM EST, but will prepare the quarterly review slides beforehand.';
      if (mode === 'after_meeting')
        c[body] = c[body].replace('beforehand', 'after the meeting');
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
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: f,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        assert.equal(
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'natural',
            'html',
            'thread',
            'reply_only',
            'wrong_time',
            'no_slides',
            'no_attendance',
            'after_meeting',
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
