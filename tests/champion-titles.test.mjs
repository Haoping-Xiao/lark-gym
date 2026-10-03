import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Champion note titles are semantic without weakening the source lead job title', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'champion-titles-')),
    task = repo + '/tasks/automationbench-sales-808',
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
      'chinese_title',
      'natural_title',
      'wrong_parent',
      'wrong_company',
      'wrong_lead_title',
      'wrong_email',
      'wrong_followup',
      'change_amanda',
      'wrong_status',
      'wrong_title',
    ]) {
      const cs = structuredClone(original),
        rs = cs.filter((c) => c[1] === '+record-upsert'),
        notes = [rs[2], rs[4]],
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'chinese_title')
        notes.forEach((c) =>
          change(c, (o) => (o.title = '关键联系人任职变动')),
        );
      if (mode === 'natural_title')
        notes.forEach((c) =>
          change(c, (o) => (o.title = 'Champion moved to a new company')),
        );
      if (mode === 'wrong_parent')
        change(notes[0], (o) => {
          o.title = '关键联系人任职变动';
          o.parent_id = '003xx000004MC01';
        });
      if (mode === 'wrong_company')
        change(
          notes[0],
          (o) => (o.body = 'Jennifer Walsh | TechCorp -> Quantum Systems'),
        );
      if (mode === 'wrong_lead_title') change(rs[7], (o) => (o.title = 'CTO'));
      if (mode === 'wrong_email')
        change(rs[7], (o) => (o.email = 'm.chen@dataflow.example.com'));
      if (mode === 'wrong_followup')
        change(rs[6], (o) => (o.related_to_id = '001xx000003TC01'));
      if (mode === 'wrong_status') change(rs[0], (o) => (o.status = 'Active'));
      if (mode === 'wrong_title')
        notes.forEach((c) =>
          change(c, (o) => (o.title = '联系人仍在原公司任职，未发生变动')),
        );
      if (mode === 'change_amanda') {
        const c = structuredClone(rs[0]);
        c[c.indexOf('--record-id') + 1] = 'rec_003xx000004AT01';
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
          [
            'reference',
            'chinese_title',
            'natural_title',
            'wrong_company',
            'wrong_title',
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
