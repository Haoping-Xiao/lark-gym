import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Read customer sync report before creating Jira bug', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'jira-read-')),
    task = repo + '/tasks/automationbench-simple-3118',
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
      'no_read',
      'read_late',
      'wrong_message',
      'wrong_project',
      'wrong_name',
    ]) {
      let cs = structuredClone(original);
      const mail = cs[0],
        list = cs[1],
        write = cs.at(-1),
        mget = [
          'im',
          '+messages-mget',
          '--message-ids',
          'om_msg_4204',
          '--no-reactions',
        ];
      if (mode === 'mget') cs = [mget, write];
      if (mode === 'no_read') cs = [list, write];
      if (mode === 'read_late') cs = [list, write, mail];
      if (mode === 'wrong_message') {
        mget[mget.indexOf('--message-ids') + 1] = 'om_missing';
        cs = [mget, list, write];
      }
      if (mode === 'wrong_project' || mode === 'wrong_name') {
        const o = JSON.parse(write.at(-1));
        o[mode === 'wrong_project' ? 'project' : 'summary'] =
          mode === 'wrong_project' ? 'proj_other' : 'Add light mode feature';
        write[write.length - 1] = JSON.stringify(o);
      }
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
            ['reference', 'mget'].includes(mode),
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
