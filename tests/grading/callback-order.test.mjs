import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('Callbacks follow per-ticket completed invitation before notes', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-406-')),
    t = r + '/tasks/automationbench-support-1426',
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
  for (const mode of [
    'reference',
    'interleaved',
    'reverse_comments',
    'comment_before_event',
    'comment_before_attendee',
    'summary_before_last_comment',
    'summary_before_last_event',
    'missing_attendee',
    'wrong_title',
    'missing_comment',
    'excluded_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      comments = cs.filter((c) => c[0] === 'base' && c[1] === '+record-upsert'),
      events = cs.filter(
        (c) => c[0] === 'calendar' && c[1] === 'events' && c[2] === 'create',
      ),
      attendees = cs.filter(
        (c) => c[0] === 'calendar' && c[1] === 'event.attendees',
      ),
      reads = cs.filter(
        (c) =>
          !comments.includes(c) &&
          !events.includes(c) &&
          !attendees.includes(c) &&
          c !== group,
      );
    if (
      [
        'interleaved',
        'comment_before_event',
        'comment_before_attendee',
        'summary_before_last_event',
      ].includes(mode)
    ) {
      cs = [...reads];
      for (let i = 0; i < 4; i++) {
        if (mode === 'summary_before_last_event' && i === 3) cs.push(group);
        if (mode === 'comment_before_event' && i === 0) cs.push(comments[i]);
        cs.push(events[i]);
        if (mode === 'comment_before_attendee' && i === 0) cs.push(comments[i]);
        cs.push(attendees[i]);
        if (!(
          ['comment_before_event', 'comment_before_attendee'].includes(mode) &&
          i === 0
        ))
          cs.push(comments[i]);
      }
      if (mode !== 'summary_before_last_event') cs.push(group);
    }
    if (mode === 'reverse_comments')
      cs = [
        ...reads,
        ...events.flatMap((e, i) => [e, attendees[i]]),
        ...comments.toReversed(),
        group,
      ];
    if (mode === 'summary_before_last_comment') {
      cs.splice(cs.indexOf(group), 1);
      cs.splice(cs.indexOf(comments[3]), 0, group);
    }
    if (mode === 'missing_attendee') cs = cs.filter((c) => c !== attendees[0]);
    if (mode === 'wrong_title') {
      const d = JSON.parse(val(events[0], '--data'));
      d.summary = 'Callback: George Nakamura - Unrelated login problem';
      set(events[0], '--data', JSON.stringify(d));
    }
    if (mode === 'missing_comment') cs = cs.filter((c) => c !== comments[3]);
    if (mode === 'excluded_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nRachel Thornton and David Pearson were excluded per scheduling notes.',
      );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const p = a + '/states/' + mode + '.json';
      await fs.writeFile(
        p,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: p, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'interleaved',
          'reverse_comments',
          'excluded_disclosure',
        ].includes(mode),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
