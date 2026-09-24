import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('HR release retains exact identity and protects historical fields', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'title-release-')),
    task = repo + '/tasks/automationbench-sales-511',
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
      'no_update',
      'wrong_title',
      'wrong_initials',
      'wrong_company',
      'wrong_phone',
      'newsletter_person',
      'change_description',
      'update_all',
    ]) {
      let cs = structuredClone(original),
        c = cs.at(-1);
      if (mode === 'no_update') cs.pop();
      if (mode === 'wrong_title')
        c[c.length - 1] = JSON.stringify({ title: 'SVP' });
      const targets = {
        wrong_initials: 'FMT3',
        wrong_company: 'FMT2',
        wrong_phone: 'FMT4',
        newsletter_person: 'FMT6',
      };
      if (targets[mode])
        c[c.indexOf('--record-id') + 1] = 'rec_003xx000004' + targets[mode];
      if (mode === 'change_description')
        c[c.length - 1] = JSON.stringify({
          title: 'Senior Vice President',
          description: 'HR review complete',
        });
      if (mode === 'update_all')
        for (const id of ['FMT4', 'FMT6']) {
          const x = structuredClone(c);
          x[x.indexOf('--record-id') + 1] = 'rec_003xx000004' + id;
          cs.push(x);
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
        assert.equal(d.business_success, mode === 'reference', mode);
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
