import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Read target mapping before every card move', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'lookup-update-')),
    task = repo + '/tasks/automationbench-simple-3125',
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
      'get',
      'no_read',
      'read_late',
      'wrong_record',
      'failed_read',
      'wrong_list',
      'wrong_board',
      'wrong_name',
      'correct_after_early_update',
    ].filter((x) => !process.env.ONLY_MODE || x === process.env.ONLY_MODE)) {
      let cs = structuredClone(original);
      const [cards, lookup, write] = cs,
        get = [
          'base',
          '+record-get',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_4ff873f55e54',
          '--record-id',
          'rec_tr_rec_10',
        ];
      if (mode === 'correct_after_early_update') {
        const early = structuredClone(write);
        early[early.length - 1] = JSON.stringify({ list: 'lst_prod_done' });
        cs = [early, lookup, write];
      }
      if (mode === 'get') cs = [get, write];
      if (mode === 'no_read') cs = [cards, write];
      if (mode === 'read_late') cs = [cards, write, lookup];
      if (mode === 'wrong_record' || mode === 'failed_read') {
        get[get.length - 1] =
          mode === 'wrong_record' ? 'rec_tr_rec_9' : 'rec_missing';
        cs = [get, write];
      }
      if (['wrong_list', 'wrong_board', 'wrong_name'].includes(mode)) {
        const o = JSON.parse(write.at(-1));
        o[mode.slice(6)] =
          mode === 'wrong_list'
            ? 'lst_done'
            : mode === 'wrong_board'
              ? 'brd_other'
              : 'Review Q2 marketing budget';
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
            if (mode !== 'failed_read') throw e;
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
            ['reference', 'get'].includes(mode),
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
