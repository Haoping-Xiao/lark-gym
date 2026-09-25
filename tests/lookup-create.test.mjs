import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Board creation requires mapping and requested source reads across seven cases', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'lookup-create-'));
  try {
    for (const num of [3121, 3122, 3123, 3124, 3126, 3127, 3129]) {
      const task = repo + '/tasks/automationbench-simple-' + num,
        seed = JSON.parse(
          await fs.readFile(task + '/environment/seed.json', 'utf8'),
        ),
        config = JSON.parse(
          await fs.readFile(task + '/tests/semantic-config.json', 'utf8'),
        ),
        rid = config.read_records_before_creates[0].record_id,
        src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
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
      await fs.mkdir(a + '/states-' + num, { recursive: true });
      const modes = [
        'reference',
        'get',
        'no_read',
        'read_late',
        'wrong_record',
        'failed_read',
        'wrong_list',
        'wrong_board',
        'wrong_name',
        ...(num === 3122
          ? [
              'no_lookup',
              'no_message',
              'lookup_late',
              'message_late',
              'wrong_message',
            ]
          : []),
        ...(num === 3123 ? ['wrong_due'] : []),
        ...(num === 3126
          ? ['wrong_label', 'missing_label', 'label_after_create']
          : []),
      ];
      for (const mode of modes) {
        let cs = structuredClone(original);
        const mail = cs.find((c) => c[0] === 'im'),
          lookup = cs.find(
            (c) => c[1] === '+record-list' && c.includes('tbl_4ff873f55e54'),
          ),
          cards = cs.find(
            (c) => c[1] === '+record-list' && c.includes('tbl_6ac9a32c0ca8'),
          ),
          write = cs.at(-1),
          get = [
            'base',
            '+record-get',
            '--base-token',
            'base_crm',
            '--table-id',
            'tbl_4ff873f55e54',
            '--record-id',
            rid,
          ],
          mget = [
            'im',
            '+messages-mget',
            '--message-ids',
            'om_msg_4205',
            '--no-reactions',
          ];
        if (mode === 'wrong_label' || mode === 'missing_label') {
          const o = JSON.parse(write.at(-1));
          if (mode === 'wrong_label') o.label = 'label_nonurgent';
          else delete o.label;
          write[write.length - 1] = JSON.stringify(o);
        }
        if (mode === 'label_after_create') {
          const first = structuredClone(write),
            o = JSON.parse(first.at(-1));
          delete o.label;
          first[first.length - 1] = JSON.stringify(o);
          const patch = structuredClone(write);
          patch.splice(
            patch.indexOf('--json'),
            0,
            '--record-id',
            'rec_created_1',
          );
          patch[patch.length - 1] = JSON.stringify({ label: 'label_urgent' });
          cs = [lookup, first, patch];
        }
        if (mode === 'get') cs = [...(mail ? [mget] : []), get, write];
        if (mode === 'no_read') cs = [cards, write];
        if (mode === 'read_late')
          cs = [cards, write, ...(mail ? [mail] : []), lookup];
        if (mode === 'no_lookup') cs = [mail, write];
        if (mode === 'no_message') cs = [lookup, write];
        if (mode === 'lookup_late') cs = [mail, write, lookup];
        if (mode === 'message_late') cs = [lookup, write, mail];
        if (mode === 'wrong_message') {
          mget[mget.indexOf('--message-ids') + 1] = 'om_missing';
          cs = [mget, lookup, write];
        }
        if (mode === 'wrong_record' || mode === 'failed_read') {
          get[get.length - 1] =
            mode === 'wrong_record'
              ? seed.base.records.find((r) => r.record_id !== rid).record_id
              : 'rec_missing';
          cs = [...(mail ? [mail] : []), get, write];
        }
        if (
          ['wrong_list', 'wrong_board', 'wrong_name', 'wrong_due'].includes(
            mode,
          )
        ) {
          const o = JSON.parse(write.at(-1));
          o[mode.slice(6)] =
            mode === 'wrong_list'
              ? 'lst_other'
              : mode === 'wrong_board'
                ? 'brd_other'
                : mode === 'wrong_due'
                  ? '2026-03-06'
                  : 'Unrelated task';
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
              if (!['failed_read', 'wrong_message'].includes(mode)) throw e;
            }
          }
          await fs.writeFile(
            a + '/states-' + num + '/' + mode + '.json',
            JSON.stringify({ seed, world: b.world, calls: b.calls }),
          );
          for (const before of [false]) {
            const tests = before ? a + '/before-tests-' + num : task + '/tests',
              dest =
                a + '/' + num + '-' + mode + (before ? '-before' : '-program');
            await exec(process.execPath, [tests + '/verify.ts'], {
              env: {
                ...process.env,
                MOCK_STATE: a + '/states-' + num + '/' + mode + '.json',
                VERIFIER_OUTPUT: dest,
              },
              maxBuffer: 8e6,
            });
            const d = JSON.parse(
              await fs.readFile(dest + '/result.json', 'utf8'),
            );
            assert.equal(
              d.business_success,
              ['reference', 'get', 'label_after_create'].includes(mode),
              num + ':' + mode,
            );
          }
        } finally {
          await b.close();
        }
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
