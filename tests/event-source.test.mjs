import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('event-source verifies actual CLI effects', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'event-source-')),
    task = repo + '/tasks/automationbench-simple-3144',
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
      'mget',
      'uppercase',
      'no_read',
      'read_late',
      'wrong_message',
      'bot',
      'wrong_time',
      'wrong_duration',
      'wrong_topic',
      'no_video',
    ]) {
      let cs = structuredClone(original);
      const [mail, write] = cs,
        mget = [
          'mail',
          '+messages',
          '--mailbox',
          'agent@company.example.com',
          '--message-ids',
          'msg_4209',
          '--as',
          'user',
        ];
      if (mode === 'mget') cs = [mget, write];
      if (mode === 'no_read') cs = [write];
      if (mode === 'read_late') cs = [write, mail];
      if (mode === 'wrong_message') {
        mget[mget.indexOf('--message-ids') + 1] = 'om_missing';
        cs = [mget, write];
      }
      const o = JSON.parse(write.at(-1));
      if (mode === 'uppercase') o.summary = 'API INTEGRATION discussion';
      if (mode === 'wrong_topic') o.summary = 'Product marketing';
      if (mode === 'wrong_time') {
        o.start_time.timestamp = String(Number(o.start_time.timestamp) + 3600);
        o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
      }
      if (mode === 'wrong_duration')
        o.end_time.timestamp = String(Number(o.end_time.timestamp) + 900);
      if (mode === 'no_video') delete o.vc_data;
      write[write.length - 1] = JSON.stringify(o);
      if (mode === 'bot') write.push('--as', 'bot');
      const b = await startMock(seed);
      try {
        for (const c of cs) {
          try {
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          } catch (e) {
            if (mode !== 'wrong_message') throw e;
          }
        }
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
            ['reference', 'mget', 'uppercase'].includes(mode),
            mode,
          );
        }
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
