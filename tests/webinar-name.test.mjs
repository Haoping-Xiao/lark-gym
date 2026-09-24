import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Webinar opportunity name preserves company and event without fixed ordering', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'webinar-name-')),
    task = repo + '/tasks/automationbench-sales-1180',
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
      'lower_name',
      'upper_name',
      'reference',
      'reverse_name',
      'separator_name',
      'extra_context',
      'missing_company',
      'missing_webinar',
      'wrong_account',
      'wrong_stage',
      'wrong_source',
      'small_lead',
      'wrong_title',
      'wrong_company_case',
    ]) {
      const cs = structuredClone(original),
        c = cs[12],
        o = JSON.parse(c.at(-1));
      if (mode === 'lower_name')
        o.name = 'ai innovation summit — big enterprise corp';
      if (mode === 'upper_name')
        o.name = 'BIG ENTERPRISE CORP — AI INNOVATION SUMMIT';
      if (mode === 'wrong_company_case')
        o.name = 'SMALLCO — AI INNOVATION SUMMIT';
      if (mode === 'reverse_name')
        o.name = 'AI Innovation Summit - Big Enterprise Corp';
      if (mode === 'separator_name')
        o.name = 'Big Enterprise Corp | AI Innovation Summit';
      if (mode === 'extra_context')
        o.name = 'AI Innovation Summit：Big Enterprise Corp 后续商机';
      if (mode === 'missing_company') o.name = 'AI Innovation Summit';
      if (mode === 'missing_webinar') o.name = 'Big Enterprise Corp discovery';
      if (mode === 'wrong_account') o.account_external_id = 'account:SmallCo';
      if (mode === 'wrong_stage') o.stage = 'Closed Won';
      if (mode === 'wrong_source') o.source = 'Other Webinar';
      c[c.length - 1] = JSON.stringify(o);
      if (mode === 'small_lead') {
        let x = JSON.parse(cs[10].at(-1));
        x.email = 'ceo@smallco.example.com';
        cs[10][cs[10].length - 1] = JSON.stringify(x);
      }
      if (mode === 'wrong_title') {
        let x = JSON.parse(cs[10].at(-1));
        x.title = 'CEO';
        cs[10][cs[10].length - 1] = JSON.stringify(x);
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
            'lower_name',
            'upper_name',
            'reference',
            'reverse_name',
            'separator_name',
            'extra_context',
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
