import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Contract special terms accept paraphrases and preserve structured agreement facts', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'contract-terms-')),
    task = repo + '/tasks/automationbench-sales-821',
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
      'natural_terms',
      'chinese_terms',
      'omitted_terms',
      'standard_terms',
      'invented_terms',
      'wrong_amount',
      'wrong_term',
      'wrong_template',
      'wrong_signer',
      'wrong_parent',
      'beta_void',
    ]) {
      const cs = structuredClone(original),
        writes = cs.filter((c) => c[1] === '+record-upsert'),
        note = writes[1],
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'natural_terms')
        change(
          note,
          (o) => (o.special_terms = 'Includes the premium support package.'),
        );
      if (mode === 'chinese_terms')
        change(
          note,
          (o) =>
            (o.special_terms =
              '已协商加入高级支持服务包（premium support package）。'),
        );
      if (mode === 'omitted_terms') change(note, (o) => delete o.special_terms);
      if (mode === 'standard_terms')
        change(
          note,
          (o) =>
            (o.special_terms =
              'Standard support only; premium support is not included.'),
        );
      if (mode === 'invented_terms')
        change(
          note,
          (o) =>
            (o.special_terms =
              'Premium support package with guaranteed 24/7 dedicated engineers and a five-minute SLA.'),
        );
      if (mode === 'wrong_amount') change(note, (o) => (o.amount = 120000));
      if (mode === 'wrong_term') change(note, (o) => (o.term_months = 12));
      if (mode === 'wrong_template')
        change(note, (o) => {
          o.template_id = 'tmpl_std_001';
          o.template_name = 'Standard Agreement';
        });
      if (mode === 'wrong_signer')
        change(note, (o) => (o.signer_email = 'm.cfo@beta-sol.example.com'));
      if (mode === 'wrong_parent')
        change(note, (o) => (o.opportunity_id = '006xx000099NO011'));
      if (mode === 'beta_void')
        writes[0][writes[0].indexOf('--record-id') + 1] =
          'rec_docusign_envelopes_env_beta_001';
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
            'natural_terms',
            'chinese_terms',
            'omitted_terms',
            'standard_terms',
            'invented_terms',
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
