import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('Migration closes each source only after its full target and private note exist', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-412-')),
    t = r + '/tasks/automationbench-support-1476',
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
    'per_conversation',
    'reverse_conversations',
    'split',
    'staged',
    'json_format',
    'close_before_target',
    'close_before_note',
    'note_before_target',
    'incomplete_history_then_fix',
    'wrong_note_then_fix',
    'missing_contact',
    'wrong_count',
    'excluded_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      data = (c) => JSON.parse(val(c, '--json')),
      targets = writes.filter((c) => data(c).source_id),
      notes = writes.filter((c) => data(c).conversation_id),
      closes = writes.filter((c) => c.includes('--record-id')),
      contacts = writes.filter((c) => data(c).email),
      reads = cs.filter((c) => !writes.includes(c) && c !== group),
      copy = (c, d) => {
        let n = structuredClone(c);
        set(n, '--json', JSON.stringify(d));
        return n;
      },
      moveBefore = (item, anchor) => {
        cs.splice(cs.indexOf(item), 1);
        cs.splice(cs.indexOf(anchor), 0, item);
      };
    if (
      ['per_conversation', 'reverse_conversations', 'staged'].includes(mode)
    ) {
      let ids = targets.map((c) => data(c).source_id);
      if (mode === 'reverse_conversations') ids.reverse();
      cs = [
        ...reads,
        ...contacts,
        ...ids.flatMap((id) => [
          targets.find((c) => data(c).source_id === id),
          notes.find((c) => data(c).conversation_id === id),
          closes.find((c) => val(c, '--record-id') === 'rec_helpscout_' + id),
        ]),
        group,
      ];
      if (mode === 'staged') {
        let part = structuredClone(group);
        set(
          part,
          '--text',
          'migration progress: 1 conversation migrated; 4 new contacts created.\nYuki Tanaka | Invoice correction needed',
        );
        cs.splice(cs.indexOf(closes[0]) + 1, 0, part);
        set(
          group,
          '--text',
          val(group, '--text')
            .split('\n')
            .filter((s) => !s.includes('Yuki Tanaka'))
            .join('\n')
            .replace(/\s*(?:and|;|,|\|)\s*4 new contacts(?: created)?/i, ''),
        );
      }
    }
    if (mode === 'split') {
      let lines = val(group, '--text').split('\n'),
        one = structuredClone(group),
        two = structuredClone(group);
      set(one, '--text', lines.slice(0, 4).join('\n'));
      set(two, '--text', lines.slice(4).join('\n'));
      cs.splice(cs.indexOf(group), 1, one, two);
    }
    if (mode === 'json_format')
      for (const c of targets) {
        let d = data(c);
        d.source_threads = JSON.stringify(
          JSON.parse(d.source_threads),
          null,
          2,
        );
        d.source_tags = JSON.stringify(JSON.parse(d.source_tags), null, 2);
        set(c, '--json', JSON.stringify(d));
      }
    if (mode === 'close_before_target') moveBefore(closes[0], targets[0]);
    if (mode === 'close_before_note') moveBefore(closes[0], notes[0]);
    if (mode === 'note_before_target') moveBefore(notes[0], targets[0]);
    if (mode === 'incomplete_history_then_fix') {
      let good = data(targets[0]);
      set(
        targets[0],
        '--json',
        JSON.stringify({ ...good, source_threads: '[]' }),
      );
      let fix = copy(targets[0], good);
      fix.push('--record-id', 'rec_created_2');
      cs.splice(cs.indexOf(closes[0]) + 1, 0, fix);
    }
    if (mode === 'wrong_note_then_fix') {
      let good = data(notes[0]);
      set(
        notes[0],
        '--json',
        JSON.stringify({ ...good, body: 'Migration pending, not yet copied.' }),
      );
      let fix = copy(notes[0], good);
      fix.push('--record-id', 'rec_created_3');
      cs.splice(cs.indexOf(closes[0]) + 1, 0, fix);
    }
    if (mode === 'missing_contact') cs = cs.filter((c) => c !== contacts[0]);
    if (mode === 'wrong_count')
      set(
        group,
        '--text',
        val(group, '--text').replace('6 conversations', '7 conversations'),
      );
    if (mode === 'excluded_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') + '\nBuy cheap watches was excluded.',
      );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const state = a + '/states/' + mode + '.json';
      await fs.writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'per_conversation',
          'reverse_conversations',
          'split',
          'staged',
          'json_format',
          'wrong_count',
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
