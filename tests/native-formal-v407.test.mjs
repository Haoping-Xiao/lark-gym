import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Customer deletion follows complete transfer and private audit notes', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-407-')),
    t = r + '/tasks/automationbench-support-1511',
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
    'per_customer',
    'split_fields',
    'delete_first',
    'id_only_at_delete',
    'note_late',
    'wrong_note_then_fix',
    'rollback_transfer',
    'early_summary',
    'missing_note',
    'excluded_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      updates = cs.filter(
        (c) => c[1] === '+record-upsert' && c.includes('--record-id'),
      ),
      notes = cs.filter(
        (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
      ),
      deletes = cs.filter((c) => c[1] === '+record-delete'),
      reads = cs.filter(
        (c) =>
          !updates.includes(c) &&
          !notes.includes(c) &&
          !deletes.includes(c) &&
          c !== group,
      ),
      copy = (c, body) => {
        const d = structuredClone(c);
        set(d, '--json', JSON.stringify(body));
        return d;
      };
    if (mode === 'per_customer')
      cs = [
        ...reads,
        ...updates.flatMap((u, i) => [u, notes[i], deletes[i]]),
        group,
      ];
    if (mode === 'split_fields') {
      const u = updates[0],
        d = JSON.parse(val(u, '--json'));
      cs.splice(
        cs.indexOf(u),
        1,
        copy(u, { customer_id: d.customer_id }),
        copy(u, { customer_email: d.customer_email }),
      );
    }
    if (mode === 'delete_first') {
      cs.splice(cs.indexOf(deletes[0]), 1);
      cs.splice(cs.indexOf(updates[0]), 0, deletes[0]);
    }
    if (mode === 'id_only_at_delete') {
      const u = updates[0],
        d = JSON.parse(val(u, '--json'));
      set(u, '--json', JSON.stringify({ customer_id: d.customer_id }));
      cs.splice(
        cs.indexOf(deletes[0]) + 1,
        0,
        copy(u, { customer_email: d.customer_email }),
      );
    }
    if (mode === 'note_late') {
      cs.splice(cs.indexOf(notes[0]), 1);
      cs.splice(cs.indexOf(deletes[0]) + 1, 0, notes[0]);
    }
    if (mode === 'wrong_note_then_fix') {
      const n = notes[0],
        d = JSON.parse(val(n, '--json')),
        bad = {
          ...d,
          body: 'merge: j.smith.old@company.example.com transferred to wrong@company.example.com',
        };
      set(n, '--json', JSON.stringify(bad));
      const fix = copy(n, d);
      fix.push('--record-id', 'rec_created_1');
      cs.splice(cs.indexOf(deletes[0]) + 1, 0, fix);
    }
    if (mode === 'rollback_transfer') {
      const u = updates[0],
        good = JSON.parse(val(u, '--json'));
      cs.splice(
        cs.indexOf(deletes[0]),
        0,
        copy(u, {
          customer_id: 'hc_m2',
          customer_email: 'j.smith.old@company.example.com',
        }),
      );
      cs.splice(cs.indexOf(deletes[0]) + 1, 0, copy(u, good));
    }
    if (mode === 'early_summary') {
      cs.splice(cs.indexOf(group), 1);
      cs.splice(cs.indexOf(deletes[0]), 0, group);
    }
    if (mode === 'missing_note') cs = cs.filter((c) => c !== notes[0]);
    if (mode === 'excluded_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nKevin Chen and Karen Chang were skipped because their names differ.',
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
          'per_customer',
          'split_fields',
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
