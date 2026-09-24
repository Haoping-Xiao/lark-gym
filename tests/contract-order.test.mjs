import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Contracts preserve signer structure and per-opportunity notification order', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'contract-order-')),
    task = repo + '/tasks/automationbench-sales-813',
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
      'key_order',
      'per_entity',
      'reverse_entities',
      'interleaved',
      'combined',
      'missing_legal',
      'wrong_email',
      'reversed_signers',
      'invalid_json',
      'wrong_template',
      'log_before_legal',
      'send_before_ledger',
      'wrong_recipient',
    ]) {
      let cs = structuredClone(original);
      const creates = cs.filter(
          (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
        ),
        updates = cs.filter((c) => c.includes('--record-id')),
        msgs = cs.filter((c) => c[1] === '+messages-send'),
        reads = cs.filter(
          (c) => c[1] === '+record-list' || c[1] === '+chat-messages-list',
        ),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (['pretty_json', 'combined'].includes(mode))
        creates.forEach((c) =>
          change(
            c,
            (o) => (o.signers = JSON.stringify(JSON.parse(o.signers), null, 2)),
          ),
        );
      if (mode === 'key_order')
        creates.forEach((c) =>
          change(
            c,
            (o) =>
              (o.signers = JSON.stringify(
                JSON.parse(o.signers).map((x) => ({
                  email: x.email,
                  name: x.name,
                })),
              )),
          ),
        );
      if (mode === 'missing_legal')
        change(
          creates[0],
          (o) =>
            (o.signers = JSON.stringify(JSON.parse(o.signers).slice(0, 1))),
        );
      if (mode === 'wrong_email')
        change(creates[0], (o) => {
          let x = JSON.parse(o.signers);
          x[1].email = 'wrong@germantech.example.com';
          o.signers = JSON.stringify(x);
        });
      if (mode === 'reversed_signers')
        change(
          creates[0],
          (o) => (o.signers = JSON.stringify(JSON.parse(o.signers).reverse())),
        );
      if (mode === 'invalid_json')
        change(creates[0], (o) => (o.signers = '[not json]'));
      if (mode === 'wrong_template')
        change(creates[0], (o) => {
          o.template_id = 'tmpl_standard_001';
          o.template_name = 'Standard Agreement';
        });
      const groups = creates.map((c, i) => [
        c,
        ...msgs.slice([0, 2, 4, 6, 7][i], [2, 4, 6, 7, 8][i]),
        updates[i],
      ]);
      if (['per_entity', 'combined'].includes(mode))
        cs = [...reads, ...groups.flat()];
      if (mode === 'reverse_entities')
        cs = [...reads, ...groups.reverse().flat()];
      if (mode === 'interleaved')
        cs = [
          ...reads,
          ...creates,
          ...msgs.slice(2),
          ...updates.slice(1),
          ...msgs.slice(0, 2),
          updates[0],
        ];
      if (mode === 'log_before_legal') {
        cs.splice(cs.indexOf(updates[0]), 1);
        cs.splice(cs.indexOf(msgs[1]), 0, updates[0]);
      }
      if (mode === 'send_before_ledger') {
        cs.splice(cs.indexOf(msgs[0]), 1);
        cs.splice(cs.indexOf(creates[0]), 0, msgs[0]);
      }
      if (mode === 'wrong_recipient')
        msgs[1][msgs[1].indexOf('--chat-id') + 1] = 'oc_email_32';
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
            'pretty_json',
            'key_order',
            'per_entity',
            'reverse_entities',
            'interleaved',
            'combined',
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
