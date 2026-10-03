import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Meeting and every attendee must be arranged before creating preparation task', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'meeting-ready-')),
    task = repo + '/tasks' + '/automationbench-sales-1144',
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
  for (const mode of [
    'reference',
    'natural_title',
    'no_description',
    'split_attendees',
    'task_first',
    'before_attendees',
    'before_last_attendee',
    'failed_attendees',
  ]) {
    const cs = structuredClone(original),
      reads = cs.slice(0, 8),
      event = cs[8],
      att = cs[9],
      prep = cs[10],
      get = (c) => JSON.parse(c.at(-1)),
      put = (c, o) => (c[c.length - 1] = JSON.stringify(o)),
      o = get(event);
    let commands = cs;
    if (mode === 'natural_title') o.summary = 'ClientCo Deal Review';
    if (mode === 'chinese_title') o.summary = 'ClientCo 交易评审会议';
    if (mode === 'no_description') delete o.description;
    if (mode === 'wrong_purpose') o.summary = 'Cancel ClientCo Deal Review';
    if (mode === 'wrong_customer') {
      o.summary = 'OtherCo Deal Review';
      o.description = 'OtherCo deal review';
    }
    if (mode === 'wrong_duration')
      o.end_time.timestamp = String(Number(o.start_time.timestamp) + 1800);
    put(event, o);
    if (mode === 'invite_dave') {
      const v = get(att);
      v.attendees[2].third_party_email = 'dave@clientco.example.com';
      put(att, v);
    }
    if (mode === 'wrong_opportunity') {
      const v = get(prep);
      v.what_id = '006xx000099NO020';
      put(prep, v);
    }
    if (mode === 'task_first') commands = [...reads, prep, event, att];
    if (mode === 'before_attendees') commands = [...reads, event, prep, att];
    if (['split_attendees', 'before_last_attendee'].includes(mode)) {
      const list = get(att).attendees,
        first = structuredClone(att),
        last = structuredClone(att);
      put(first, { attendees: list.slice(0, 2) });
      put(last, { attendees: list.slice(2) });
      commands = [
        ...reads,
        event,
        first,
        ...(mode === 'split_attendees' ? [last, prep] : [prep, last]),
      ];
    }
    if (mode === 'failed_attendees') {
      const bad = structuredClone(att);
      bad[bad.indexOf('--event-id') + 1] = 'evt_missing';
      commands = [...reads, event, bad, prep, att];
    }
    const b = await startMock(seed);
    try {
      for (const c of commands) {
        try {
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        } catch (e) {
          if (mode !== 'failed_attendees' || !c.includes('evt_missing'))
            throw e;
        }
      }
      const errors = b.calls.filter((c) => c.status >= 400);
      if (errors.length && mode !== 'failed_attendees') throw Error(mode);
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
          'natural_title',
          'no_description',
          'split_attendees',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
