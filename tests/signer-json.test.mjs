import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Signer JSON serialization preserves signer identity and routing order', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'signer-json-')),
    task = repo + '/tasks/automationbench-sales-837',
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
      'pretty_json',
      'reordered_keys',
      'swapped_array',
      'wrong_email',
      'wrong_order',
      'missing_signer',
      'duplicate_signer',
      'internal_ceo',
      'invalid_json',
      'missing_sign',
      'notify_queued',
    ]) {
      const cs = structuredClone(original),
        writes = cs.filter((c) => c[1] === '+record-upsert'),
        note = writes[0],
        msgs = cs.filter((c) => c[1] === '+messages-send'),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      change(note, (o) => {
        let a = JSON.parse(o.signers);
        if (mode === 'pretty_json') o.signers = JSON.stringify(a, null, 2);
        if (mode === 'reordered_keys')
          o.signers = JSON.stringify(
            a.map((x) => ({
              routing_order: x.routing_order,
              name: x.name,
              email: x.email,
            })),
          );
        if (mode === 'swapped_array') {
          [a[0], a[1]] = [a[1], a[0]];
          o.signers = JSON.stringify(a);
        }
        if (mode === 'wrong_email') {
          a[0].email = 'ceo@other.example.com';
          o.signers = JSON.stringify(a);
        }
        if (mode === 'wrong_order') {
          a[0].routing_order = 2;
          o.signers = JSON.stringify(a);
        }
        if (mode === 'missing_signer') {
          a.splice(2, 1);
          o.signers = JSON.stringify(a);
        }
        if (mode === 'duplicate_signer') {
          a.push(a[0]);
          o.signers = JSON.stringify(a);
        }
        if (mode === 'internal_ceo') {
          a[3] = {
            name: 'Our CEO',
            email: 'ceo@company.example.com',
            routing_order: 4,
          };
          o.signers = JSON.stringify(a);
        }
        if (mode === 'invalid_json') o.signers = '[{invalid]';
      });
      if (mode === 'missing_sign')
        change(
          writes[1],
          (o) =>
            (o.description = o.description.replace(
              'signing order',
              '签署顺序',
            )),
        );
      if (mode === 'notify_queued') {
        const c = structuredClone(msgs[0]);
        c[c.indexOf('--chat-id') + 1] = 'oc_email_119';
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
          ['reference', 'pretty_json', 'reordered_keys'].includes(mode),
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
