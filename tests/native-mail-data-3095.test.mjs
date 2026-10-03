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
test('support log preserves source email date and required priority', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-data-')),
    t = repo + '/tasks/automationbench-simple-3095',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
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
      'one_write',
      'iso_date',
      'month_name_date',
      'no_read',
      'read_after',
      'first_write_before_read',
      'metadata',
      'no_write',
      'wrong_email',
      'wrong_date',
      'missing_subject',
      'extra_change',
      'wrong_priority',
      'missing_priority',
    ]) {
      let cs = structuredClone(original),
        last = cs[5];
      if (mode === 'thread')
        cs[0] = [
          'mail',
          '+thread',
          '--mailbox',
          'support@brightpath.example.com',
          '--thread-id',
          'thread_8001',
          '--as',
          'user',
        ];
      if (mode === 'one_write') {
        const c = structuredClone(cs[2]);
        c[c.indexOf('--cells') + 1] = JSON.stringify([
          cs.slice(2).map((x) => JSON.parse(x.at(-1))[0][0]),
        ]);
        cs = [...cs.slice(0, 2), c];
      }
      if (
        mode === 'iso_date' ||
        mode === 'month_name_date' ||
        mode === 'wrong_date'
      )
        last[last.length - 1] = JSON.stringify([
          [
            {
              value:
                mode === 'iso_date'
                  ? '2026-02-23T07:45:00Z'
                  : mode === 'month_name_date'
                    ? 'February 23, 2026'
                    : '2026-02-24',
            },
          ],
        ]);
      if (mode === 'no_read') cs = cs.slice(1);
      if (mode === 'read_after') cs = [...cs.slice(1), cs[0]];
      if (mode === 'first_write_before_read')
        cs = [cs[2], cs[0], cs[1], ...cs.slice(3)];
      if (mode === 'metadata')
        cs[0] = [
          'mail',
          'user_mailbox.messages',
          'get',
          '--user-mailbox-id',
          'support@brightpath.example.com',
          '--message-id',
          'msg_8001',
          '--params',
          '{"format":"metadata"}',
          '--as',
          'user',
        ];
      if (mode === 'no_write') cs = cs.slice(0, 2);
      if (mode === 'wrong_email')
        cs[3][cs[3].length - 1] = '[[{"value":"other@example.com"}]]';
      if (mode === 'missing_subject') cs.splice(4, 1);
      if (mode === 'wrong_priority')
        cs[6][cs[6].length - 1] = '[[{"value":"High"}]]';
      if (mode === 'missing_priority') cs.pop();
      if (mode === 'extra_change') {
        const c = structuredClone(last);
        c[c.indexOf('--range') + 1] = 'F2';
        c[c.length - 1] = '[[{"value":"unrelated"}]]';
        cs.push(c);
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
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'thread',
            'one_write',
            'iso_date',
            'month_name_date',
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
