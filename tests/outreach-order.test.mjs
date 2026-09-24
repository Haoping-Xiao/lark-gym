import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('outreach logs follow their own contact notification across interleaved workflows', async () => {
  const repo = process.cwd(),
    task = path.resolve('tasks/automationbench-operations-1297'),
    dir = await fs.mkdtemp(path.join(tmpdir(), 'outreach-order-'));
  const seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    block = src
      .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
      .replace('commands: string[][]', 'commands'),
    original = JSON.parse(
      vm.runInNewContext(block + '\nJSON.stringify(commands)'),
    );
  const contacts = seed.base.records.filter(
    (r) => r.fields.collection === 'hubspot_contacts',
  );
  assert.equal(contacts.length, 12);
  for (const record of contacts)
    assert.equal(record.record_id, 'rec_hubspot_' + record.fields.id);
  assert.ok(
    seed.base.tables
      .find((t) => t.collection === 'hubspot_contacts')
      .fields.some((f) => f.name === 'id'),
  );
  try {
    for (const mode of [
      'reference',
      'interleaved',
      'james_first',
      'reverse_batch',
      'early_sandra',
      'early_james',
      'crossed',
      'missing_industry',
      'wrong_contact',
      'record_locator',
      'missing_send',
    ]) {
      let commands = structuredClone(original),
        reads = commands.filter(
          (c) => !['+record-upsert', '+messages-send'].includes(c[1]),
        ),
        messages = commands.filter((c) => c[1] === '+messages-send'),
        records = commands.filter((c) => c[1] === '+record-upsert');
      commands = [...reads, ...messages, ...records];
      if (mode === 'interleaved')
        commands = [...reads, messages[0], records[0], messages[1], records[1]];
      if (mode === 'james_first')
        commands = [...reads, messages[1], records[1], messages[0], records[0]];
      if (mode === 'reverse_batch')
        commands = [...reads, messages[1], messages[0], records[1], records[0]];
      if (mode === 'early_sandra')
        commands = [...reads, records[0], ...messages, records[1]];
      if (mode === 'early_james')
        commands = [...reads, messages[0], records[1], messages[1], records[0]];
      if (mode === 'crossed')
        commands = [...reads, messages[1], records[0], messages[0], records[1]];
      if (mode === 'missing_send')
        commands = commands.filter((c) => c !== messages[0]);
      for (const c of records) {
        const i = c.indexOf('--json') + 1,
          p = JSON.parse(c[i]);
        if (mode === 'missing_industry')
          p.body = p.body.replace('Technology', '').replace('Retail |', '');
        if (mode === 'wrong_contact' && p.contact_id === 'cont_hs_101')
          p.contact_id = 'cont_hs_103';
        if (mode === 'record_locator')
          p.contact_id = 'rec_hubspot_' + p.contact_id;
        c[i] = JSON.stringify(p);
      }

      const b = await startMock(seed);
      try {
        for (const x of commands)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', x, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        assert.equal(
          b.calls.some((c) => c.status >= 400),
          false,
          mode,
        );
        const state = path.join(dir, mode + '.json'),
          dest = path.join(dir, mode);
        await fs.writeFile(
          state,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec('node', [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: dest },
        });
        const result = JSON.parse(
          await fs.readFile(dest + '/result.json', 'utf8'),
        );
        assert.equal(
          result.business_success,
          ['reference', 'interleaved', 'james_first', 'reverse_batch'].includes(
            mode,
          ),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
