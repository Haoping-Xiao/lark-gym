import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Read source then identify lead before updating rating, allowing alternative queries', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'read-update-')),
    task = repo + '/tasks/automationbench-simple-3037',
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
      'get_alternative',
      'mget_then_list',
      'no_reads',
      'only_message',
      'only_record',
      'reads_late',
      'reverse_reads',
      'wrong_message',
      'wrong_record',
      'wrong_rating',
    ]) {
      let cs = structuredClone(original);
      const [mail, lead, write] = cs,
        mget = [
          'im',
          '+messages-mget',
          '--message-ids',
          'om_msg_3037',
          '--no-reactions',
        ],
        get = [
          'base',
          '+record-get',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_aef450dc78ea',
          '--record-id',
          'rec_00Q007',
        ];
      if (mode === 'get_alternative') cs = [mget, get, write];
      if (mode === 'mget_then_list') cs = [mget, lead, write];
      if (mode === 'no_reads') cs = [write];
      if (mode === 'only_message') cs = [mail, write];
      if (mode === 'only_record') cs = [lead, write];
      if (mode === 'reads_late') cs = [write, mail, lead];
      if (mode === 'reverse_reads') cs = [lead, mail, write];
      if (mode === 'wrong_message') {
        mget[mget.indexOf('--message-ids') + 1] = 'om_missing';
        cs = [mget, lead, write];
      }
      if (mode === 'wrong_record') {
        get[get.indexOf('--record-id') + 1] = 'rec_missing';
        cs = [mail, get, write];
      }
      if (mode === 'wrong_rating') {
        const o = JSON.parse(write.at(-1));
        o.rating = 'Cold';
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
          } catch (error) {
            if (!['wrong_message', 'wrong_record'].includes(mode)) throw error;
          }
        }
        if (['wrong_message', 'wrong_record'].includes(mode)) {
        } else if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          ['reference', 'get_alternative', 'mget_then_list'].includes(mode),
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
