import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Meeting ledger preserves collection and equivalent instants', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'event-time-')),
    task = repo + '/tasks/automationbench-simple-3030',
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
      'utc_offset',
      'milliseconds',
      'local_offset',
      'start_shift',
      'end_shift',
      'invalid_date',
      'end_before',
      'wrong_contact',
      'wrong_subject',
      'wrong_table',
    ]) {
      const cs = structuredClone(original),
        note = cs.find((c) => c[1] === '+record-upsert'),
        o = JSON.parse(note.at(-1));
      if (mode === 'utc_offset') {
        o.start_time = '2026-02-20T14:00:00+00:00';
        o.end_time = '2026-02-20T15:00:00+00:00';
      }
      if (mode === 'milliseconds') {
        o.start_time = '2026-02-20T14:00:00.000Z';
        o.end_time = '2026-02-20T15:00:00.000Z';
      }
      if (mode === 'local_offset') {
        o.start_time = '2026-02-20T22:00:00+08:00';
        o.end_time = '2026-02-20T23:00:00+08:00';
      }
      if (mode === 'start_shift') o.start_time = '2026-02-20T14:00:01Z';
      if (mode === 'end_shift') o.end_time = '2026-02-20T15:00:01Z';
      if (mode === 'invalid_date') o.start_time = '2026-02-30T14:00:00Z';
      if (mode === 'end_before') o.end_time = '2026-02-20T13:00:00Z';
      if (mode === 'wrong_contact') o.who_id = '003999';
      if (mode === 'wrong_subject') o.subject = 'Annual business review';
      if (mode === 'wrong_table')
        note[note.indexOf('--table-id') + 1] = 'tbl_aa5af4084f37';
      note[note.length - 1] = JSON.stringify(o);
      const b = await startMock(seed);
      try {
        for (const c of cs) {
          try {
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          } catch (error) {
            if (mode !== 'wrong_table') throw error;
          }
        }
        if (mode === 'wrong_table') {
          if (!b.calls.some((c) => c.status === 400))
            throw Error('expected invalid field map');
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
          ['reference', 'utc_offset', 'milliseconds', 'local_offset'].includes(
            mode,
          ),
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
