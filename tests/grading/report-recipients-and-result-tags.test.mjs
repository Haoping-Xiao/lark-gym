import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { createTaskFixture } from '../helpers/task-fixture.ts';
const exec = promisify(execFile);
for (const [name, modes] of [
  ['finance-4087', ['separate', 'combined', 'missing', 'extra', 'bcc']],
  [
    'hr-5086',
    ['reference', 'reordered', 'wrong-candidate', 'wrong-company', 'empty-tag'],
  ],
]) {
  for (const mode of modes)
    test(`${name}: ${mode}`, async () => {
      const task = 'automationbench-' + name;
      const f = await createTaskFixture(task);
      try {
        const source = await readFile(
          `tasks/${task}/solution/solve.ts`,
          'utf8',
        );
        let commands = vm.runInNewContext(
          source.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
        );
        if (name === 'finance-4087' && mode !== 'separate') {
          let sent = false;
          commands = commands.filter((c) => {
            if (c[0] !== 'mail' || c[1] !== '+send') return true;
            if (sent) return false;
            sent = true;
            c[c.indexOf('--to') + 1] =
              mode === 'missing'
                ? 'tax@company.example.com'
                : 'tax@company.example.com,controller@company.example.com';
            if (mode === 'extra')
              c[c.indexOf('--to') + 1] += ',outsider@example.com';
            if (mode === 'bcc') c.push('--bcc', 'outsider@example.com');
            return true;
          });
        }
        if (name === 'hr-5086')
          for (const c of commands) {
            const i = c.indexOf('--json') + 1;
            if (!i || !c[i].includes('Salary Review Pending; Final Deadline'))
              continue;
            const fields = JSON.parse(c[i]);
            if (mode === 'reordered')
              fields.tag = 'Final Deadline; Salary Review Pending';
            if (mode === 'wrong-candidate')
              fields.candidate_id = 'cand_omar_hassan_staff';
            if (mode === 'wrong-company') fields.company_id = 'wrong-company';
            if (mode === 'empty-tag') fields.tag = '';
            c[i] = JSON.stringify(fields);
          }
        for (const c of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), c, {
            env: { ...process.env, FEISHU_MOCK_URL: f.backend.url },
            maxBuffer: 16e6,
          });
        const good = [
          'separate',
          'combined',
          'reference',
          'reordered',
        ].includes(mode);
        assert.equal(await f.grade(), good ? '1' : '0');
        const result = JSON.parse(
          await readFile(f.dir + '/result.json', 'utf8'),
        );
        assert.equal(result.semantic.required, true);
        if (mode === 'reordered') {
          // Passing structural rules must still defer the business meaning to the judge.
          assert.match(JSON.stringify(result.semantic), /tag/);
        }
      } finally {
        await f.close();
      }
    });
}
