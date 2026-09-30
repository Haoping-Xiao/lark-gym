import test from 'node:test';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Deletion inspects every linked source conversation, including a second one', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'transfer-multiple-')),
    base = r + '/tasks/automationbench-support-1511',
    src = await fs.readFile(base + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  for (const mode of ['all_linked_ready', 'second_linked_late']) {
    const t = a + '/multi-' + mode;
    await fs.cp(base + '/tests', t, { recursive: true });
    const seed = JSON.parse(await fs.readFile(base + '/environment/seed.json')),
      extra = structuredClone(
        seed.base.records.find((x) => x.record_id === 'rec_helpscout_hs_mg01'),
      );
    extra.record_id = 'rec_helpscout_hs_extra_m2';
    extra.fields.subject = 'Second login request';
    seed.base.records.push(extra);
    const expected = JSON.parse(await fs.readFile(t + '/expected.json'));
    expected.updates.push(
      {
        record_id: extra.record_id,
        field: 'customer_id',
        value: 'hc_m1',
        mode: 'equals',
      },
      {
        record_id: extra.record_id,
        field: 'customer_email',
        value: 'j.smith@company.example.com',
        mode: 'equals',
      },
    );
    const note = {
      collection: 'help_notes',
      conversation_id: 'hs_extra_m2',
      body: 'merge: j.smith.old@company.example.com merged into j.smith@company.example.com',
      public: 'false',
    };
    expected.creates.push(note);
    expected.messages[0].contains = expected.messages[0].contains.map((x) =>
      x.replace('4 conversations', '5 conversations'),
    );
    await fs.writeFile(t + '/expected.json', JSON.stringify(expected));
    const cs = structuredClone(original),
      val = (c, k) => c[c.indexOf(k) + 1],
      del = cs.find(
        (c) => c[1] === '+record-delete' && c.includes('rec_helpscout_hc_m2'),
      ),
      update = [
        'base',
        '+record-upsert',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_77b186294697',
        '--record-id',
        extra.record_id,
        '--json',
        JSON.stringify({
          customer_id: 'hc_m1',
          customer_email: 'j.smith@company.example.com',
        }),
      ],
      create = [
        'base',
        '+record-upsert',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_bb9ef273955e',
        '--json',
        JSON.stringify({
          conversation_id: note.conversation_id,
          body: note.body,
          public: 'false',
        }),
      ];
    const group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send');
    group[group.indexOf('--text') + 1] = val(group, '--text').replace(
      '4 conversations',
      '5 conversations',
    );
    cs.splice(cs.indexOf(del), 0, create);
    cs.splice(
      cs.indexOf(del) + (mode === 'second_linked_late' ? 1 : 0),
      0,
      update,
    );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const state = a + '/multi-' + mode + '-state.json';
      await fs.writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/multi-' + mode + '-result';
      await exec(process.execPath, [t + '/verify.ts'], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      const d = JSON.parse(await fs.readFile(out + '/result.json'));
      if (d.business_success !== (mode === 'all_linked_ready'))
        throw Error(mode + ' unexpected ' + d.business_success);
      if (d.transferBeforeDeleteChecks[0].sources.length !== 2)
        throw Error('did not inspect both source conversations');
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
